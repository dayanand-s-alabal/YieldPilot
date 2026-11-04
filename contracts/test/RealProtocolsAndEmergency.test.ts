import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { network } from "hardhat";

describe("YieldPilot - Real Aave/Compound Protocol & Emergency Risk Management", () => {
    let viem: any;
    let owner: any;
    let user: any;
    let managerAccount: any;
    let token: any;
    let aaveStrategy: any;
    let compStrategy: any;
    let mockAToken: any;
    let mockAavePool: any;
    let mockComet: any;
    let strategyManager: any;
    let yieldVault: any;
    let riskManager: any;
    let priceOracle: any;
    let emergencyManager: any;

    const USDC = 10n ** 6n;

    beforeEach(async () => {
        const connection = await network.create();
        viem = connection.viem;

        const wallets = await viem.getWalletClients();
        owner = wallets[0];
        user = wallets[1];
        managerAccount = wallets[2];

        // 1. Deploy base USDC token
        token = await viem.deployContract("MockUSDC", [owner.account.address]);

        // 2. Deploy Aave Mock Infrastructure
        mockAToken = await viem.deployContract("MockAToken", [
            token.address,
            "Aave USDC",
            "aUSDC",
        ]);
        mockAavePool = await viem.deployContract("MockAavePool", [
            token.address,
            mockAToken.address,
        ]);
        await mockAToken.write.setPool([mockAavePool.address], { account: owner.account });

        // 3. Deploy Compound Mock Infrastructure
        mockComet = await viem.deployContract("MockCompoundComet", [
            token.address,
            "Compound USDC",
            "cUSDCv3",
        ]);

        // 4. Deploy Core Contracts
        strategyManager = await viem.deployContract("StrategyManager", [
            token.address,
            owner.account.address,
            2000n, // 20% reserve
        ]);

        yieldVault = await viem.deployContract("YieldVault", [
            token.address,
            strategyManager.address,
            owner.account.address,
        ]);
        await strategyManager.write.initializeVault([yieldVault.address], { account: owner.account });

        riskManager = await viem.deployContract("RiskManager", [
            owner.account.address,
            70n, // max risk threshold 70
        ]);
        await riskManager.write.setStrategyManager([strategyManager.address], { account: owner.account });

        priceOracle = await viem.deployContract("PriceOracle", [owner.account.address]);

        // 5. Deploy Real Protocol Strategy Adapters
        aaveStrategy = await viem.deployContract("AaveStrategy", [
            token.address,
            owner.account.address,
        ]);
        await aaveStrategy.write.setPool([mockAavePool.address, mockAToken.address], { account: owner.account });
        await aaveStrategy.write.setManager([strategyManager.address], { account: owner.account });

        compStrategy = await viem.deployContract("CompoundStrategy", [
            token.address,
            owner.account.address,
        ]);
        await compStrategy.write.setComet([mockComet.address], { account: owner.account });
        await compStrategy.write.setManager([strategyManager.address], { account: owner.account });

        // Register strategies in StrategyManager (50% cap each)
        await strategyManager.write.registerStrategy([aaveStrategy.address, 5000n], { account: owner.account });
        await strategyManager.write.registerStrategy([compStrategy.address, 5000n], { account: owner.account });

        // 6. Deploy Unified EmergencyManager
        emergencyManager = await viem.deployContract("EmergencyManager", [
            owner.account.address,
            yieldVault.address,
            strategyManager.address,
            riskManager.address,
            priceOracle.address,
        ]);

        // Authorize EmergencyManager on Vault & StrategyManager
        await yieldVault.write.setEmergencyManager([emergencyManager.address], { account: owner.account });
        await strategyManager.write.setEmergencyManager([emergencyManager.address], { account: owner.account });
    });

    describe("1. Real Aave V3 Integration", () => {
        it("Should execute real deposit into Aave Pool and mint aTokens", async () => {
            // Mint 1,000 USDC to user and deposit into vault
            await token.write.mint([user.account.address, 1000n * USDC], { account: owner.account });
            await token.write.approve([yieldVault.address, 1000n * USDC], { account: user.account });
            await yieldVault.write.deposit([1000n * USDC, user.account.address], { account: user.account });

            // Allocate 500 USDC to Aave Strategy
            await yieldVault.write.allocateToStrategy([aaveStrategy.address, 500n * USDC], { account: owner.account });

            // Verify aToken balance of strategy
            const aaveBalance = await aaveStrategy.read.totalAssets();
            assert.equal(aaveBalance, 500n * USDC);

            const aTokenBal = await mockAToken.read.balanceOf([aaveStrategy.address]);
            assert.equal(aTokenBal, 500n * USDC);

            assert.equal(await aaveStrategy.read.totalDeposited(), 500n * USDC);
            assert.equal(await aaveStrategy.read.availableLiquidity(), 500n * USDC);
        });

        it("Should track actual accrued interest and yield earned from Aave", async () => {
            await token.write.mint([user.account.address, 1000n * USDC], { account: owner.account });
            await token.write.approve([yieldVault.address, 1000n * USDC], { account: user.account });
            await yieldVault.write.deposit([1000n * USDC, user.account.address], { account: user.account });

            await yieldVault.write.allocateToStrategy([aaveStrategy.address, 500n * USDC], { account: owner.account });

            // Aave pool generates 25 USDC interest
            await token.write.mint([mockAToken.address, 25n * USDC], { account: owner.account });
            await mockAavePool.write.accrueInterest([aaveStrategy.address, 25n * USDC], { account: owner.account });

            const assetsAfterInterest = await aaveStrategy.read.totalAssets();
            assert.equal(assetsAfterInterest, 525n * USDC);

            const yieldEarned = await aaveStrategy.read.yieldEarned();
            assert.equal(yieldEarned, 25n * USDC);
        });

        it("Should enforce protocol liquidity availability checks and prevent illiquid withdrawals", async () => {
            await token.write.mint([user.account.address, 1000n * USDC], { account: owner.account });
            await token.write.approve([yieldVault.address, 1000n * USDC], { account: user.account });
            await yieldVault.write.deposit([1000n * USDC, user.account.address], { account: user.account });

            await yieldVault.write.allocateToStrategy([aaveStrategy.address, 500n * USDC], { account: owner.account });

            // Drain underlying liquidity from aToken to simulate high utilization / illiquid lending pool
            await mockAavePool.write.drainPoolCash([owner.account.address, 400n * USDC], { account: owner.account });

            // Only 100 USDC liquidity remains in pool
            const avail = await aaveStrategy.read.availableLiquidity();
            assert.equal(avail, 100n * USDC);

            // Temporarily set manager to managerAccount to test direct strategy call
            await aaveStrategy.write.setManager([managerAccount.account.address], { account: owner.account });

            // Attempting to withdraw 200 USDC from strategy should revert due to insufficient liquidity
            await assert.rejects(
                async () => {
                    await aaveStrategy.write.withdraw([200n * USDC], {
                        account: managerAccount.account,
                    });
                },
                /Insufficient Aave protocol liquidity/
            );
        });
    });

    describe("2. Real Compound V3 Integration", () => {
        it("Should execute real supply and withdraw with Compound Comet", async () => {
            await token.write.mint([user.account.address, 1000n * USDC], { account: owner.account });
            await token.write.approve([yieldVault.address, 1000n * USDC], { account: user.account });
            await yieldVault.write.deposit([1000n * USDC, user.account.address], { account: user.account });

            // Allocate 400 USDC to Compound Strategy
            await yieldVault.write.allocateToStrategy([compStrategy.address, 400n * USDC], { account: owner.account });

            assert.equal(await compStrategy.read.totalAssets(), 400n * USDC);
            assert.equal(await compStrategy.read.totalDeposited(), 400n * USDC);

            // Accrue 20 USDC interest in Compound
            await token.write.mint([mockComet.address, 20n * USDC], { account: owner.account });
            await mockComet.write.accrueInterest([compStrategy.address, 20n * USDC], { account: owner.account });

            assert.equal(await compStrategy.read.totalAssets(), 420n * USDC);
            assert.equal(await compStrategy.read.yieldEarned(), 20n * USDC);
        });

        it("Should detect Compound protocol illiquidity and protect withdrawal execution", async () => {
            await token.write.mint([user.account.address, 1000n * USDC], { account: owner.account });
            await token.write.approve([yieldVault.address, 1000n * USDC], { account: user.account });
            await yieldVault.write.deposit([1000n * USDC, user.account.address], { account: user.account });

            await yieldVault.write.allocateToStrategy([compStrategy.address, 400n * USDC], { account: owner.account });

            // Drain Comet cash so only 50 USDC remains
            await mockComet.write.drainCometCash([owner.account.address, 350n * USDC], { account: owner.account });

            const avail = await compStrategy.read.availableLiquidity();
            assert.equal(avail, 50n * USDC);

            // Temporarily set manager to managerAccount to test direct strategy call
            await compStrategy.write.setManager([managerAccount.account.address], { account: owner.account });

            // Attempting to withdraw 100 USDC should revert safely
            await assert.rejects(
                async () => {
                    await compStrategy.write.withdraw([100n * USDC], {
                        account: managerAccount.account,
                    });
                },
                /Insufficient Compound protocol liquidity/
            );
        });
    });

    describe("3. Unified Emergency Risk Management", () => {
        it("Should allow emergency vault pause and stop deposits", async () => {
            // Emergency pause vault
            await emergencyManager.write.pauseVault(["Circuit breaker: Market anomaly detected"], {
                account: owner.account,
            });

            assert.equal(await emergencyManager.read.isVaultEmergencyPaused(), true);
            assert.equal(await yieldVault.read.paused(), true);

            // New deposit should revert
            await token.write.mint([user.account.address, 100n * USDC], { account: owner.account });
            await token.write.approve([yieldVault.address, 100n * USDC], { account: user.account });

            await assert.rejects(
                async () => {
                    await yieldVault.write.deposit([100n * USDC, user.account.address], { account: user.account });
                },
                /EnforcedPause/
            );

            // Unpause vault restores functionality
            await emergencyManager.write.unpauseVault({ account: owner.account });
            assert.equal(await emergencyManager.read.isVaultEmergencyPaused(), false);
            assert.equal(await yieldVault.read.paused(), false);

            await yieldVault.write.deposit([100n * USDC, user.account.address], { account: user.account });
            assert.equal(await yieldVault.read.totalAssets(), 100n * USDC);
        });

        it("Should automatically exclude and liquidate strategy when risk score crosses threshold (70/100)", async () => {
            await token.write.mint([user.account.address, 1000n * USDC], { account: owner.account });
            await token.write.approve([yieldVault.address, 1000n * USDC], { account: user.account });
            await yieldVault.write.deposit([1000n * USDC, user.account.address], { account: user.account });

            await yieldVault.write.allocateToStrategy([aaveStrategy.address, 400n * USDC], { account: owner.account });
            assert.equal(await aaveStrategy.read.totalAssets(), 400n * USDC);

            // Risk score spikes to 78/100 (exceeds threshold of 70)
            await riskManager.write.updateRiskScore([aaveStrategy.address, 78n], { account: owner.account });

            // Trigger emergency evaluation
            await emergencyManager.write.evaluateStrategyRisk([aaveStrategy.address], { account: owner.account });

            // Verify strategy is excluded and paused
            assert.equal(await emergencyManager.read.isStrategyExcluded([aaveStrategy.address]), true);
            assert.equal(await strategyManager.read.isStrategyPaused([aaveStrategy.address]), true);

            // Funds were automatically recovered into the vault/manager!
            assert.equal(await aaveStrategy.read.totalAssets(), 0n);

            // Recovery log was recorded
            const count = await emergencyManager.read.getRecoveryLogsCount();
            assert.equal(count, 1n);

            const log = await emergencyManager.read.getRecoveryLog([0n]);
            assert.equal(log.strategy.toLowerCase(), aaveStrategy.address.toLowerCase());
            assert.equal(log.recoveredAmount, 400n * USDC);
            assert.equal(log.lockedAmount, 0n);
            assert.equal(log.fullyRecovered, true);
        });

        it("Should handle partially illiquid strategy during emergency liquidation and log locked balance", async () => {
            await token.write.mint([user.account.address, 1000n * USDC], { account: owner.account });
            await token.write.approve([yieldVault.address, 1000n * USDC], { account: user.account });
            await yieldVault.write.deposit([1000n * USDC, user.account.address], { account: user.account });

            await yieldVault.write.allocateToStrategy([compStrategy.address, 500n * USDC], { account: owner.account });

            // Drain Comet cash to 200 USDC (so 300 USDC of strategy's 500 USDC is illiquid)
            await mockComet.write.drainCometCash([owner.account.address, 300n * USDC], { account: owner.account });

            // Execute emergency liquidation
            await emergencyManager.write.emergencyLiquidate([compStrategy.address, "High risk protocol insolvency"], {
                account: owner.account,
            });

            // Check recovery log
            const log = await emergencyManager.read.getRecoveryLog([0n]);
            assert.equal(log.requestedAmount, 500n * USDC);
            assert.equal(log.recoveredAmount, 200n * USDC);
            assert.equal(log.lockedAmount, 300n * USDC);
            assert.equal(log.fullyRecovered, false);
        });

        it("Should detect stale APY and trigger safety alert", async () => {
            // Strategy has never reported APY
            const isStale = await emergencyManager.read.isApyStale([aaveStrategy.address]);
            assert.equal(isStale, true);

            // Report APY (e.g. 520 BPS = 5.2%)
            await emergencyManager.write.reportApy([aaveStrategy.address, 520n], { account: owner.account });
            assert.equal(await emergencyManager.read.isApyStale([aaveStrategy.address]), false);
            assert.equal(await emergencyManager.read.lastReportedApy([aaveStrategy.address]), 520n);
        });
    });
});
