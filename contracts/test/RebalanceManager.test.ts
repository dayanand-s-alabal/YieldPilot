import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { network } from "hardhat";

describe("RebalanceManager", () => {
    let viem: any;
    let owner: any;
    let keeper: any;
    let user: any;
    let vault: any;

    let token: any;
    let strategyManager: any;
    let strategyA: any;
    let strategyB: any;
    let riskManager: any;
    let rebalanceManager: any;

    const USDC = 10n ** 6n;
    const TOTAL_VAULT_ASSETS = 100n * USDC; // $100 total

    beforeEach(async () => {
        const connection = await network.create();
        viem = connection.viem;

        const wallets = await viem.getWalletClients();
        owner = wallets[0];
        keeper = wallets[1];
        user = wallets[2];
        vault = wallets[3];

        token = await viem.deployContract("MockUSDC", [
            owner.account.address,
        ]);

        // Minimum 10% reserve (1000 BPS)
        strategyManager = await viem.deployContract("StrategyManager", [
            token.address,
            owner.account.address,
            1000n,
        ]);

        // Initialize vault address
        await strategyManager.write.initializeVault(
            [vault.account.address],
            { account: owner.account }
        );

        // Strategies A and B with 80% allocation caps
        strategyA = await viem.deployContract("MockStrategy", [token.address]);
        strategyB = await viem.deployContract("MockStrategy", [token.address]);

        await strategyA.write.setManager([strategyManager.address], {
            account: owner.account,
        });
        await strategyB.write.setManager([strategyManager.address], {
            account: owner.account,
        });

        await strategyManager.write.registerStrategy([strategyA.address, 8000n], {
            account: owner.account,
        });
        await strategyManager.write.registerStrategy([strategyB.address, 8000n], {
            account: owner.account,
        });

        riskManager = await viem.deployContract("RiskManager", [
            owner.account.address,
            70n,
        ]);
        await riskManager.write.setStrategyManager([strategyManager.address], {
            account: owner.account,
        });

        rebalanceManager = await viem.deployContract("RebalanceManager", [
            strategyManager.address,
            riskManager.address,
            owner.account.address,
        ]);

        // Authorize RebalanceManager on StrategyManager
        await strategyManager.write.setRebalanceManager(
            [rebalanceManager.address],
            { account: owner.account }
        );

        // Fund StrategyManager with $100 USDC directly for testing portfolio distributions
        await token.write.mint(
            [strategyManager.address, TOTAL_VAULT_ASSETS],
            { account: owner.account }
        );
    });

    it("Should reject target allocation if total weights do not sum to 10000 BPS", async () => {
        // Reserve 20% (2000), Strategy A 50% (5000), Strategy B 20% (2000) = 9000 BPS != 10000
        await assert.rejects(async () => {
            await rebalanceManager.write.setTargetAllocation(
                [
                    [strategyA.address, strategyB.address],
                    [5000n, 2000n],
                    2000n,
                ],
                { account: owner.account }
            );
        });
    });

    it("Should reject target allocation if reserve is below StrategyManager minimum reserve", async () => {
        // Minimum reserve is 10% (1000 BPS). Setting target reserve to 5% (500 BPS) must revert.
        await assert.rejects(async () => {
            await rebalanceManager.write.setTargetAllocation(
                [
                    [strategyA.address, strategyB.address],
                    [5000n, 4500n],
                    500n,
                ],
                { account: owner.account }
            );
        });
    });

    it("Should set target allocation correctly", async () => {
        // Target: Reserve 20% (2000), Strategy A 50% (5000), Strategy B 30% (3000)
        await rebalanceManager.write.setTargetAllocation(
            [
                [strategyA.address, strategyB.address],
                [5000n, 3000n],
                2000n,
            ],
            { account: owner.account }
        );

        const targetA = await rebalanceManager.read.targetStrategyBps([
            strategyA.address,
        ]);
        const targetB = await rebalanceManager.read.targetStrategyBps([
            strategyB.address,
        ]);
        const targetRes = await rebalanceManager.read.targetReserveBps();

        assert.equal(targetA, 5000n);
        assert.equal(targetB, 3000n);
        assert.equal(targetRes, 2000n);
    });

    it("Should calculate rebalance differences accurately", async () => {
        // Setup initial actual state:
        // Reserve: 10% ($10), Strategy A: 70% ($70), Strategy B: 20% ($20)
        await strategyManager.write.allocate([strategyA.address, 70n * USDC], {
            account: vault.account,
        });
        await strategyManager.write.allocate([strategyB.address, 20n * USDC], {
            account: vault.account,
        });

        // Target: Reserve 20% ($20), Strategy A 50% ($50), Strategy B 30% ($30)
        await rebalanceManager.write.setTargetAllocation(
            [
                [strategyA.address, strategyB.address],
                [5000n, 3000n],
                2000n,
            ],
            { account: owner.account }
        );

        // calculateRebalance returns [differenceA, differenceB]
        // Strategy A current = $70, target = $50 => diff = +$20 (excess)
        // Strategy B current = $20, target = $30 => diff = -$10 (deficit)
        const diffs = await rebalanceManager.read.calculateRebalance();
        assert.equal(diffs[0], 20n * USDC);
        assert.equal(diffs[1], -10n * USDC);
    });

    it("Should not require rebalance when deviation is below threshold", async () => {
        // Set threshold to 5% (500 BPS)
        await rebalanceManager.write.setRebalanceThresholdBps([500n], {
            account: owner.account,
        });

        // Set cooldown interval to 0 for instant testing
        await rebalanceManager.write.setMinRebalanceInterval([0n], {
            account: owner.account,
        });

        // Allocate close to target: Strategy A 51% ($51), Strategy B 29% ($29), Reserve 20% ($20)
        await strategyManager.write.allocate([strategyA.address, 51n * USDC], {
            account: vault.account,
        });
        await strategyManager.write.allocate([strategyB.address, 29n * USDC], {
            account: vault.account,
        });

        // Target: A 50% (5000), B 30% (3000), Reserve 20% (2000)
        // Deviations: A = 1% (< 5%), B = 1% (< 5%)
        await rebalanceManager.write.setTargetAllocation(
            [
                [strategyA.address, strategyB.address],
                [5000n, 3000n],
                2000n,
            ],
            { account: owner.account }
        );

        const needed = await rebalanceManager.read.checkRebalance();
        assert.equal(needed, false);
    });

    it("Should require rebalance when deviation reaches or exceeds threshold", async () => {
        await rebalanceManager.write.setRebalanceThresholdBps([500n], {
            account: owner.account,
        });
        await rebalanceManager.write.setMinRebalanceInterval([0n], {
            account: owner.account,
        });

        // Current: Strategy A 70% ($70), Strategy B 20% ($20), Reserve 10% ($10)
        await strategyManager.write.allocate([strategyA.address, 70n * USDC], {
            account: vault.account,
        });
        await strategyManager.write.allocate([strategyB.address, 20n * USDC], {
            account: vault.account,
        });

        // Target: A 50%, B 30%, Reserve 20%
        // Deviations: A = 20% (> 5%), B = 10% (> 5%)
        await rebalanceManager.write.setTargetAllocation(
            [
                [strategyA.address, strategyB.address],
                [5000n, 3000n],
                2000n,
            ],
            { account: owner.account }
        );

        const needed = await rebalanceManager.read.checkRebalance();
        assert.equal(needed, true);
    });

    it("Should execute rebalancing to reach target allocation", async () => {
        await rebalanceManager.write.setRebalanceThresholdBps([500n], {
            account: owner.account,
        });
        await rebalanceManager.write.setMinRebalanceInterval([0n], {
            account: owner.account,
        });

        // Initial allocation: A = $70, B = $20, Reserve = $10
        await strategyManager.write.allocate([strategyA.address, 70n * USDC], {
            account: vault.account,
        });
        await strategyManager.write.allocate([strategyB.address, 20n * USDC], {
            account: vault.account,
        });

        // Target: A = 50% ($50), B = 30% ($30), Reserve = 20% ($20)
        await rebalanceManager.write.setTargetAllocation(
            [
                [strategyA.address, strategyB.address],
                [5000n, 3000n],
                2000n,
            ],
            { account: owner.account }
        );

        // Execute rebalance
        await rebalanceManager.write.executeRebalance({
            account: owner.account,
        });

        // Verify end state:
        const finalA = await strategyA.read.totalAssets();
        const finalB = await strategyB.read.totalAssets();
        const liquidReserve = await token.read.balanceOf([
            strategyManager.address,
        ]);

        assert.equal(finalA, 50n * USDC); // 50%
        assert.equal(finalB, 30n * USDC); // 30%
        assert.equal(liquidReserve, 20n * USDC); // 20%

        // Further rebalance should not be needed
        const neededAfter = await rebalanceManager.read.checkRebalance();
        assert.equal(neededAfter, false);
    });

    it("Should skip allocating to ineligible high-risk strategy during rebalance", async () => {
        await rebalanceManager.write.setMinRebalanceInterval([0n], {
            account: owner.account,
        });

        // Initial: A = $70, B = $20, Reserve = $10
        await strategyManager.write.allocate([strategyA.address, 70n * USDC], {
            account: vault.account,
        });
        await strategyManager.write.allocate([strategyB.address, 20n * USDC], {
            account: vault.account,
        });

        // Mark Strategy B as high risk (score 85 > threshold 70)
        await riskManager.write.updateRiskScore([strategyB.address, 85n], {
            account: owner.account,
        });

        // Target: A 50%, B 0%, Reserve 50%
        await rebalanceManager.write.setTargetAllocation(
            [
                [strategyA.address, strategyB.address],
                [5000n, 0n],
                5000n,
            ],
            { account: owner.account }
        );

        await rebalanceManager.write.executeRebalance({
            account: owner.account,
        });

        // Strategy A should be $50, B should be drained or not receive additional funds, excess in reserve
        const finalA = await strategyA.read.totalAssets();
        const finalB = await strategyB.read.totalAssets();
        assert.equal(finalA, 50n * USDC);
        assert.equal(finalB, 0n); // Ineligible strategy funds returned to reserve
    });

    it("Should integrate with Chainlink Automation Keeper checkUpkeep and performUpkeep", async () => {
        await rebalanceManager.write.setRebalanceThresholdBps([500n], {
            account: owner.account,
        });
        await rebalanceManager.write.setMinRebalanceInterval([0n], {
            account: owner.account,
        });

        // Setup 70% A / 20% B / 10% Reserve
        await strategyManager.write.allocate([strategyA.address, 70n * USDC], {
            account: vault.account,
        });
        await strategyManager.write.allocate([strategyB.address, 20n * USDC], {
            account: vault.account,
        });

        await rebalanceManager.write.setTargetAllocation(
            [
                [strategyA.address, strategyB.address],
                [5000n, 3000n],
                2000n,
            ],
            { account: owner.account }
        );

        // Chainlink Keeper checkUpkeep
        const [upkeepNeeded] = await rebalanceManager.read.checkUpkeep(["0x"]);
        assert.equal(upkeepNeeded, true);

        // Chainlink Keeper performUpkeep called by keeper account
        await rebalanceManager.write.performUpkeep(["0x"], {
            account: keeper.account,
        });

        // Verify rebalance completed
        const finalA = await strategyA.read.totalAssets();
        const finalB = await strategyB.read.totalAssets();
        assert.equal(finalA, 50n * USDC);
        assert.equal(finalB, 30n * USDC);

        // Upkeep no longer needed
        const [upkeepAfter] = await rebalanceManager.read.checkUpkeep(["0x"]);
        assert.equal(upkeepAfter, false);
    });
});
