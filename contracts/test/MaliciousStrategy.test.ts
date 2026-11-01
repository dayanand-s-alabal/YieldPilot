
import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { network } from "hardhat";

describe("MaliciousStrategy Security Tests - Batch 01", () => {
    let viem: any;

    let owner: any;
    let vault: any;
    let user: any;

    let token: any;
    let manager: any;
    let strategy: any;

    const USDC = 10n ** 6n;
    const INITIAL_AMOUNT = 1000n * USDC;

    beforeEach(async () => {
        const connection = await network.create();
        viem = connection.viem;

        const wallets = await viem.getWalletClients();

        owner = wallets[0];
        vault = wallets[1];
        user = wallets[2];

        // Deploy MockUSDC.
        token = await viem.deployContract("MockUSDC", [
            owner.account.address,
        ]);

        // Deploy StrategyManager.
        manager = await viem.deployContract("StrategyManager", [
            token.address,
            owner.account.address,
            1000n,
        ]);

        // Initialize vault.
        await manager.write.initializeVault(
            [vault.account.address],
            { account: owner.account }
        );

        // Deploy original healthy strategy.
        strategy = await viem.deployContract("MockStrategy", [
            token.address,
        ]);

        await strategy.write.setManager(
            [manager.address],
            { account: owner.account }
        );

        await manager.write.registerStrategy(
            [strategy.address, 5000n],
            { account: owner.account }
        );

        // Mint tokens to vault.
        await token.write.mint(
            [vault.account.address, INITIAL_AMOUNT],
            { account: owner.account }
        );
    });

    async function fundManager(amount: bigint) {
        await token.write.approve(
            [manager.address, amount],
            { account: vault.account }
        );

        await manager.write.fund(
            [amount],
            { account: vault.account }
        );
    }

    async function deployMaliciousStrategy() {
        const malicious = await viem.deployContract(
            "MaliciousStrategy",
            [token.address],
            { account: owner.account }
        );

        await malicious.write.setManager(
            [manager.address],
            { account: owner.account }
        );

        await manager.write.registerStrategy(
            [malicious.address, 5000n],
            { account: owner.account }
        );

        return malicious;
    }

    // --------------------------------------------------
    // TEST 1: DEPOSIT FAILURE
    // --------------------------------------------------

    it("1. Should preserve manager funds when malicious strategy reverts during deposit", async () => {
        await fundManager(INITIAL_AMOUNT);

        const malicious = await deployMaliciousStrategy();

        await malicious.write.configureFailures(
            [true, false, false],
            { account: owner.account }
        );

        const managerBalanceBefore =
            await token.read.balanceOf([manager.address]);

        await assert.rejects(async () => {
            await manager.write.allocate(
                [malicious.address, 300n * USDC],
                { account: vault.account }
            );
        });

        const managerBalanceAfter =
            await token.read.balanceOf([manager.address]);

        const maliciousBalance =
            await token.read.balanceOf([malicious.address]);

        assert.equal(
            managerBalanceAfter,
            managerBalanceBefore
        );

        assert.equal(maliciousBalance, 0n);
    });

    // --------------------------------------------------
    // TEST 2: WITHDRAWAL FAILURE
    // --------------------------------------------------

    it("2. Should preserve funds when malicious strategy reverts during withdrawal", async () => {
        await fundManager(INITIAL_AMOUNT);

        const malicious = await deployMaliciousStrategy();

        await manager.write.allocate(
            [malicious.address, 300n * USDC],
            { account: vault.account }
        );

        await malicious.write.configureFailures(
            [false, true, false],
            { account: owner.account }
        );

        const managerBalanceBefore =
            await token.read.balanceOf([manager.address]);

        const strategyBalanceBefore =
            await token.read.balanceOf([malicious.address]);

        await assert.rejects(async () => {
            await manager.write.withdrawFromStrategy(
                [malicious.address, 100n * USDC],
                { account: vault.account }
            );
        });

        assert.equal(
            await token.read.balanceOf([manager.address]),
            managerBalanceBefore
        );

        assert.equal(
            await token.read.balanceOf([malicious.address]),
            strategyBalanceBefore
        );
    });

    // --------------------------------------------------
    // TEST 3: FALSE HIGH VALUATION
    // --------------------------------------------------

    it("3. Should demonstrate inflated portfolio valuation from a dishonest strategy", async () => {
        await fundManager(INITIAL_AMOUNT);

        const malicious = await deployMaliciousStrategy();

        await manager.write.allocate(
            [malicious.address, 300n * USDC],
            { account: vault.account }
        );

        // Actual strategy balance = 300 USDC.
        assert.equal(
            await token.read.balanceOf([malicious.address]),
            300n * USDC
        );

        // Malicious strategy claims to hold 900 USDC.
        await malicious.write.setReportedAssets(
            [true, 900n * USDC],
            { account: owner.account }
        );

        const reportedTotal =
            await manager.read.totalManagedAssets();

        // Manager holds 700 USDC and trusts the reported 900 USDC.
        assert.equal(
            reportedTotal,
            1600n * USDC
        );

        // This test demonstrates a valuation vulnerability.
        assert.notEqual(
            reportedTotal,
            INITIAL_AMOUNT
        );
    });

    // --------------------------------------------------
    // TEST 4: EXTREMELY LARGE VALUATION
    // --------------------------------------------------

    it("4. Should demonstrate the impact of an extremely large reported balance", async () => {
        await fundManager(INITIAL_AMOUNT);

        const malicious = await deployMaliciousStrategy();

        await manager.write.allocate(
            [malicious.address, 300n * USDC],
            { account: vault.account }
        );

        const hugeReportedBalance = 1n << 200n;

        await malicious.write.setReportedAssets(
            [true, hugeReportedBalance],
            { account: owner.account }
        );

        const reportedTotal =
            await manager.read.totalManagedAssets();

        assert.equal(
            reportedTotal,
            700n * USDC + hugeReportedBalance
        );

        assert.ok(
            reportedTotal > INITIAL_AMOUNT
        );
    });

    // --------------------------------------------------
    // TEST 5: FALSE ZERO VALUATION
    // --------------------------------------------------

    it("5. Should demonstrate understated valuation when strategy reports zero", async () => {
        await fundManager(INITIAL_AMOUNT);

        const malicious = await deployMaliciousStrategy();

        await manager.write.allocate(
            [malicious.address, 300n * USDC],
            { account: vault.account }
        );

        // Strategy still physically holds 300 USDC.
        assert.equal(
            await token.read.balanceOf([malicious.address]),
            300n * USDC
        );

        // It dishonestly reports zero assets.
        await malicious.write.setReportedAssets(
            [true, 0n],
            { account: owner.account }
        );

        const reportedTotal =
            await manager.read.totalManagedAssets();

        assert.equal(
            reportedTotal,
            700n * USDC
        );

        // Actual portfolio assets remain 1000 USDC.
        assert.notEqual(
            reportedTotal,
            INITIAL_AMOUNT
        );
    });

    // --------------------------------------------------
    // TEST 6: EXCESSIVE WITHDRAWAL
    // --------------------------------------------------

    it("6. Should reject a malicious strategy attempting to transfer more tokens than it owns", async () => {
        await fundManager(INITIAL_AMOUNT);

        const malicious = await deployMaliciousStrategy();

        await manager.write.allocate(
            [malicious.address, 300n * USDC],
            { account: vault.account }
        );

        // Strategy owns 300 USDC but attempts to transfer 400.
        await malicious.write.setWithdrawalAmountOverride(
            [400n * USDC],
            { account: owner.account }
        );

        const managerBalanceBefore =
            await token.read.balanceOf([manager.address]);

        const strategyBalanceBefore =
            await token.read.balanceOf([malicious.address]);

        await assert.rejects(async () => {
            await manager.write.withdrawFromStrategy(
                [malicious.address, 200n * USDC],
                { account: vault.account }
            );
        });

        // The failed transfer must not change balances.
        assert.equal(
            await token.read.balanceOf([manager.address]),
            managerBalanceBefore
        );

        assert.equal(
            await token.read.balanceOf([malicious.address]),
            strategyBalanceBefore
        );
    });

    // --------------------------------------------------
    // TEST 7: UNAUTHORIZED STRATEGY OPERATIONS
    // --------------------------------------------------

    it("7. Should reject unauthorized direct strategy deposit and withdrawal calls", async () => {
        const malicious = await deployMaliciousStrategy();

        await token.write.mint(
            [user.account.address, 100n * USDC],
            { account: owner.account }
        );

        await token.write.approve(
            [malicious.address, 100n * USDC],
            { account: user.account }
        );

        // Unauthorized user cannot deposit directly.
        await assert.rejects(async () => {
            await malicious.write.deposit(
                [100n * USDC],
                { account: user.account }
            );
        });

        // Unauthorized user cannot withdraw directly.
        await assert.rejects(async () => {
            await malicious.write.withdraw(
                [100n * USDC],
                { account: user.account }
            );
        });

        assert.equal(
            await token.read.balanceOf([malicious.address]),
            0n
        );
    });

    // --------------------------------------------------
    // TEST 8: CHANGING VALUATION
    // --------------------------------------------------

    it("8. Should demonstrate unexpected changes in reported portfolio valuation", async () => {
        await fundManager(INITIAL_AMOUNT);

        const malicious = await deployMaliciousStrategy();

        await manager.write.allocate(
            [malicious.address, 300n * USDC],
            { account: vault.account }
        );

        await malicious.write.setReportedAssets(
            [true, 100n * USDC],
            { account: owner.account }
        );

        const firstValuation =
            await manager.read.totalManagedAssets();

        await malicious.write.setReportedAssets(
            [true, 250n * USDC],
            { account: owner.account }
        );

        const secondValuation =
            await manager.read.totalManagedAssets();

        assert.equal(
            firstValuation,
            800n * USDC
        );

        assert.equal(
            secondValuation,
            950n * USDC
        );

        assert.equal(
            secondValuation - firstValuation,
            150n * USDC
        );
    });

    // --------------------------------------------------
    // TEST 9: STRATEGY BECOMES UNAVAILABLE
    // --------------------------------------------------

    it("9. Should fail closed when a registered strategy becomes unavailable", async () => {
        await fundManager(INITIAL_AMOUNT);

        const malicious = await deployMaliciousStrategy();

        await manager.write.allocate(
            [malicious.address, 300n * USDC],
            { account: vault.account }
        );

        // Strategy works before the failure.
        assert.equal(
            await malicious.read.totalAssets(),
            300n * USDC
        );

        assert.equal(
            await manager.read.totalManagedAssets(),
            INITIAL_AMOUNT
        );

        // Simulate the strategy becoming unavailable.
        await malicious.write.configureFailures(
            [false, false, true],
            { account: owner.account }
        );

        await assert.rejects(async () => {
            await malicious.read.totalAssets();
        });

        // Manager must not silently trust an old cached value.
        await assert.rejects(async () => {
            await manager.read.totalManagedAssets();
        });
    });

    // --------------------------------------------------
    // TEST 10: HEALTHY STRATEGY LIQUIDITY RECOVERY
    // --------------------------------------------------

    it("10. Should recover liquidity from a healthy strategy when another strategy is malicious", async () => {
        await fundManager(INITIAL_AMOUNT);

        // Strategy 1: existing healthy strategy, but withdrawals disabled.
        await manager.write.allocate(
            [strategy.address, 200n * USDC],
            { account: vault.account }
        );

        await strategy.write.setWithdrawalsEnabled(
            [false],
            { account: owner.account }
        );

        // Strategy 2: malicious strategy that reverts on withdrawal.
        const malicious = await deployMaliciousStrategy();

        await manager.write.allocate(
            [malicious.address, 300n * USDC],
            { account: vault.account }
        );

        await malicious.write.configureFailures(
            [false, true, false],
            { account: owner.account }
        );

        // Strategy 3: another healthy strategy.
        const healthy = await viem.deployContract(
            "MockStrategy",
            [token.address],
            { account: owner.account }
        );

        await healthy.write.setManager(
            [manager.address],
            { account: owner.account }
        );

        await manager.write.registerStrategy(
            [healthy.address, 5000n],
            { account: owner.account }
        );

        await manager.write.allocate(
            [healthy.address, 300n * USDC],
            { account: vault.account }
        );

        // Manager has 200 USDC liquid.
        // It needs another 300 USDC to satisfy this withdrawal.
        await manager.write.withdrawToVault(
            [500n * USDC],
            { account: vault.account }
        );

        // User/vault receives the requested amount.
        assert.equal(
            await token.read.balanceOf([vault.account.address]),
            500n * USDC
        );

        // The unavailable strategy still holds its assets.
        assert.equal(
            await token.read.balanceOf([strategy.address]),
            200n * USDC
        );

        assert.equal(
            await token.read.balanceOf([malicious.address]),
            300n * USDC
        );

        // Healthy strategy supplied the missing liquidity.
        assert.equal(
            await token.read.balanceOf([healthy.address]),
            0n
        );

        assert.equal(
            await manager.read.totalManagedAssets(),
            500n * USDC
        );
    });
});
