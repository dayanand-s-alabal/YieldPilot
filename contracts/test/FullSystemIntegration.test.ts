import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { network } from "hardhat";

describe("YieldPilot - 6-Stage System Integration", () => {
    let viem: any;
    let owner: any;
    let keeper: any;
    let user: any;

    let token: any;
    let vault: any;
    let manager: any;
    let strategyA: any; // Aave mock
    let strategyB: any; // Compound mock
    let oracle: any;
    let riskManager: any;
    let rebalanceManager: any;
    let priceFeedUSDC: any;

    const USDC = 10n ** 6n;
    const INITIAL_DEPOSIT = 1000n * USDC;

    beforeEach(async () => {
        const connection = await network.create();
        viem = connection.viem;

        const wallets = await viem.getWalletClients();
        owner = wallets[0];
        keeper = wallets[1];
        user = wallets[2];

        // 1. Deploy Mock USDC
        token = await viem.deployContract("MockUSDC", [
            owner.account.address,
        ]);

        // 2. Deploy StrategyManager (10% minimum reserve = 1000 BPS)
        manager = await viem.deployContract("StrategyManager", [
            token.address,
            owner.account.address,
            1000n,
        ]);

        // 3. Deploy YieldVault (ERC-4626)
        vault = await viem.deployContract("YieldVault", [
            token.address,
            manager.address,
            owner.account.address,
        ]);

        // 4. Initialize Vault on StrategyManager
        await manager.write.initializeVault([vault.address], {
            account: owner.account,
        });

        // 5. Deploy Strategies
        strategyA = await viem.deployContract("MockStrategy", [token.address]);
        strategyB = await viem.deployContract("MockStrategy", [token.address]);

        await strategyA.write.setManager([manager.address], {
            account: owner.account,
        });
        await strategyB.write.setManager([manager.address], {
            account: owner.account,
        });

        // Register with 80% allocation caps
        await manager.write.registerStrategy([strategyA.address, 8000n], {
            account: owner.account,
        });
        await manager.write.registerStrategy([strategyB.address, 8000n], {
            account: owner.account,
        });

        // 6. Stage 2: PriceOracle with Chainlink Feed
        priceFeedUSDC = await viem.deployContract("MockAggregatorV3", [
            8,
            100_000_000n, // $1.00
            "USDC / USD",
        ]);

        oracle = await viem.deployContract("PriceOracle", [
            owner.account.address,
        ]);
        await oracle.write.setPriceFeed(
            [token.address, priceFeedUSDC.address, 3600n],
            { account: owner.account }
        );

        // 7. Stage 4: RiskManager
        riskManager = await viem.deployContract("RiskManager", [
            owner.account.address,
            70n, // max threshold 70
        ]);
        await riskManager.write.setStrategyManager([manager.address], {
            account: owner.account,
        });

        // 8. Stage 1 & 6: RebalanceManager
        rebalanceManager = await viem.deployContract("RebalanceManager", [
            manager.address,
            riskManager.address,
            owner.account.address,
        ]);

        await manager.write.setRebalanceManager(
            [rebalanceManager.address],
            { account: owner.account }
        );

        // Mint USDC to user and deposit into vault
        await token.write.mint([user.account.address, INITIAL_DEPOSIT], {
            account: owner.account,
        });
        await token.write.approve([vault.address, INITIAL_DEPOSIT], {
            account: user.account,
        });
        await vault.write.deposit([INITIAL_DEPOSIT, user.account.address], {
            account: user.account,
        });
    });

    it("Should execute end-to-end multi-stage rebalancing cycle", async () => {
        // Step 1: Verify Stage 2 Oracle reports correct portfolio valuation
        const totalAssets = await vault.read.totalAssets();
        assert.equal(totalAssets, INITIAL_DEPOSIT);

        const usdValue = await oracle.read.getAssetValueInUSD([
            token.address,
            totalAssets,
        ]);
        // 1000 USDC = $1000 with 8 decimals => 1000 * 10^8 = 100_000_000_000
        assert.equal(usdValue, 100_000_000_000n);

        // Step 2: Configure Risk Scores (Stage 4)
        // Strategy A: Low risk (score 25)
        // Strategy B: Medium risk (score 45)
        await riskManager.write.updateRiskScore([strategyA.address, 25n], {
            account: owner.account,
        });
        await riskManager.write.updateRiskScore([strategyB.address, 45n], {
            account: owner.account,
        });

        assert.equal(
            await riskManager.read.isStrategyEligible([strategyA.address]),
            true
        );
        assert.equal(
            await riskManager.read.isStrategyEligible([strategyB.address]),
            true
        );

        // Step 3: Configure Target Allocations (Stage 1)
        // Target: Reserve 20% (2000), Strategy A 50% (5000), Strategy B 30% (3000)
        await rebalanceManager.write.setTargetAllocation(
            [
                [strategyA.address, strategyB.address],
                [5000n, 3000n],
                2000n,
            ],
            { account: owner.account }
        );

        // Step 4: Upkeep check via Chainlink Automation Keeper (Stage 6)
        // Initially, 100% is in reserve (0% in strategies), so deviation is large (> 5% threshold)
        const [upkeepNeeded] = await rebalanceManager.read.checkUpkeep(["0x"]);
        assert.equal(upkeepNeeded, true);

        // Keeper executes rebalance
        await rebalanceManager.write.performUpkeep(["0x"], {
            account: keeper.account,
        });

        // Verify allocations:
        // Strategy A = 50% ($500)
        // Strategy B = 30% ($300)
        // Liquid Reserve in StrategyManager = 20% ($200)
        const assetsA = await strategyA.read.totalAssets();
        const assetsB = await strategyB.read.totalAssets();
        const liquidReserve = await token.read.balanceOf([manager.address]);

        assert.equal(assetsA, 500n * USDC);
        assert.equal(assetsB, 300n * USDC);
        assert.equal(liquidReserve, 200n * USDC);

        // Step 5: Simulate Market Event - Strategy B Risk jumps to 85 (Stage 4 & 5)
        await riskManager.write.updateRiskScore([strategyB.address, 85n], {
            account: owner.account,
        });
        assert.equal(
            await riskManager.read.isStrategyEligible([strategyB.address]),
            false
        );

        // Rebalance check should flag urgent rebalancing needed to exit Strategy B
        await rebalanceManager.write.setMinRebalanceInterval([0n], {
            account: owner.account,
        });
        const [riskUpkeep] = await rebalanceManager.read.checkUpkeep(["0x"]);
        assert.equal(riskUpkeep, true);

        // Keeper executes derisking rebalance
        await rebalanceManager.write.performUpkeep(["0x"], {
            account: keeper.account,
        });

        // Assets from Strategy B are safely recovered into the manager liquid reserve
        const postRiskB = await strategyB.read.totalAssets();
        const postRiskReserve = await token.read.balanceOf([manager.address]);

        assert.equal(postRiskB, 0n);
        assert.equal(postRiskReserve, 500n * USDC); // 200 + 300 recovered = 500 USDC
        assert.equal(await strategyA.read.totalAssets(), 500n * USDC);

        // Total portfolio NAV preserved
        assert.equal(await vault.read.totalAssets(), INITIAL_DEPOSIT);
    });
});
