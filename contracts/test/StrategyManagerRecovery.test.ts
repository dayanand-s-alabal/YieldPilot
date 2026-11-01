import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { network } from "hardhat";

describe("StrategyManager Recovery Security Tests - Batch 05", () => {
    let viem: any;

    let owner: any;
    let vault: any;
    let user: any;

    let token: any;
    let manager: any;
    let strategy: any;

    const USDC = 10n ** 6n;
    const INITIAL_AMOUNT = 1000n * USDC;
    const BPS = 10000n;

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

        // Deploy StrategyManager with a 10% liquid reserve.
        manager = await viem.deployContract("StrategyManager", [
            token.address,
            owner.account.address,
            1000n,
        ]);

        // Initialize the vault.
        await manager.write.initializeVault(
            [vault.account.address],
            { account: owner.account }
        );

        // Deploy and register a healthy strategy.
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

        // Fund the vault.
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

    async function fundAndAllocate(amount: bigint) {
        await fundManager(INITIAL_AMOUNT);

        await manager.write.allocate(
            [strategy.address, amount],
            { account: vault.account }
        );
    }

    // --------------------------------------------------
    // TEST 1: PAUSE AUTHORIZATION
    // --------------------------------------------------

    it("1. Should prevent non-owners from pausing or unpausing a strategy", async () => {
        await assert.rejects(async () => {
            await manager.write.setStrategyPaused(
                [strategy.address, true],
                { account: user.account }
            );
        });

        assert.equal(
            await manager.read.isStrategyPaused([strategy.address]),
            false
        );

        // Owner can pause the strategy.
        await manager.write.setStrategyPaused(
            [strategy.address, true],
            { account: owner.account }
        );

        assert.equal(
            await manager.read.isStrategyPaused([strategy.address]),
            true
        );

        // Non-owner cannot unpause it.
        await assert.rejects(async () => {
            await manager.write.setStrategyPaused(
                [strategy.address, false],
                { account: user.account }
            );
        });

        assert.equal(
            await manager.read.isStrategyPaused([strategy.address]),
            true
        );
    });

    // --------------------------------------------------
    // TEST 2: EMERGENCY WITHDRAWAL REQUIRES PAUSED STATE
    // --------------------------------------------------

    it("2. Should reject emergency withdrawal from an unpaused strategy", async () => {
        await fundAndAllocate(200n * USDC);

        const vaultBalanceBefore = await token.read.balanceOf([
            vault.account.address,
        ]);

        await assert.rejects(async () => {
            await manager.write.emergencyWithdrawFromStrategy(
                [strategy.address, 100n * USDC],
                { account: owner.account }
            );
        });

        assert.equal(
            await token.read.balanceOf([vault.account.address]),
            vaultBalanceBefore
        );

        assert.equal(
            await manager.read.isStrategyPaused([strategy.address]),
            false
        );
    });

    // --------------------------------------------------
    // TEST 3: RECOVERY WHEN totalAssets() REVERTS
    // --------------------------------------------------

    it("3. Should recover funds even when strategy valuation is unavailable", async () => {
        const faultyStrategy = await viem.deployContract(
            "FaultyStrategy",
            [token.address]
        );

        await faultyStrategy.write.setManager(
            [manager.address],
            { account: owner.account }
        );

        await manager.write.registerStrategy(
            [faultyStrategy.address, 5000n],
            { account: owner.account }
        );

        await fundManager(INITIAL_AMOUNT);

        // Allocate funds before making valuation unavailable.
        await manager.write.allocate(
            [faultyStrategy.address, 200n * USDC],
            { account: vault.account }
        );

        // Make totalAssets() revert.
        await faultyStrategy.write.setTotalAssetsFailure(
            [true],
            { account: owner.account }
        );

        // Pause the faulty strategy.
        await manager.write.setStrategyPaused(
            [faultyStrategy.address, true],
            { account: owner.account }
        );

        const vaultBalanceBefore = await token.read.balanceOf([
            vault.account.address,
        ]);

        // Emergency withdrawal should bypass totalAssets().
        await manager.write.emergencyWithdrawFromStrategy(
            [faultyStrategy.address, 100n * USDC],
            { account: owner.account }
        );

        const vaultBalanceAfter = await token.read.balanceOf([
            vault.account.address,
        ]);

        assert.equal(
            vaultBalanceAfter - vaultBalanceBefore,
            100n * USDC
        );

        assert.equal(
            await token.read.balanceOf([faultyStrategy.address]),
            100n * USDC
        );

        assert.equal(
            await manager.read.isStrategyPaused([
                faultyStrategy.address,
            ]),
            true
        );
    });

    // --------------------------------------------------
    // TEST 4: EMERGENCY WITHDRAWAL AUTHORIZATION
    // --------------------------------------------------

    it("4. Should prevent non-owners from executing emergency withdrawals", async () => {
        await fundAndAllocate(200n * USDC);

        await manager.write.setStrategyPaused(
            [strategy.address, true],
            { account: owner.account }
        );

        const vaultBalanceBefore = await token.read.balanceOf([
            vault.account.address,
        ]);

        await assert.rejects(async () => {
            await manager.write.emergencyWithdrawFromStrategy(
                [strategy.address, 100n * USDC],
                { account: user.account }
            );
        });

        assert.equal(
            await token.read.balanceOf([vault.account.address]),
            vaultBalanceBefore
        );

        assert.equal(
            await strategy.read.totalAssets(),
            200n * USDC
        );
    });

    // --------------------------------------------------
    // TEST 5: EMERGENCY REMOVAL REQUIRES PAUSED STATE
    // --------------------------------------------------

    it("5. Should reject emergency removal of an unpaused strategy", async () => {
        const countBefore = await manager.read.strategyCount();

        await assert.rejects(async () => {
            await manager.write.emergencyRemoveStrategy(
                [strategy.address],
                { account: owner.account }
            );
        });

        assert.equal(
            await manager.read.isRegistered([strategy.address]),
            true
        );

        assert.equal(
            await manager.read.strategyCount(),
            countBefore
        );
    });

    // --------------------------------------------------
    // TEST 6: PREVENT REMOVAL WHILE CACHED ASSETS REMAIN
    // --------------------------------------------------

    it("6. Should reject emergency removal while cached strategy assets remain", async () => {
        await fundAndAllocate(200n * USDC);

        await manager.write.setStrategyPaused(
            [strategy.address, true],
            { account: owner.account }
        );

        assert.equal(
            await manager.read.lastKnownStrategyAssets([
                strategy.address,
            ]),
            200n * USDC
        );

        await assert.rejects(async () => {
            await manager.write.emergencyRemoveStrategy(
                [strategy.address],
                { account: owner.account }
            );
        });

        assert.equal(
            await manager.read.isRegistered([strategy.address]),
            true
        );
    });

    // --------------------------------------------------
    // TEST 7: REMOVE STRATEGY AND CLEAR CONFIGURATION
    // --------------------------------------------------

    it("7. Should clear strategy configuration after emergency removal", async () => {
        await manager.write.setStrategyPaused(
            [strategy.address, true],
            { account: owner.account }
        );

        assert.equal(
            await manager.read.isRegistered([strategy.address]),
            true
        );

        await manager.write.emergencyRemoveStrategy(
            [strategy.address],
            { account: owner.account }
        );

        assert.equal(
            await manager.read.isRegistered([strategy.address]),
            false
        );

        assert.equal(
            await manager.read.isStrategyPaused([strategy.address]),
            false
        );

        assert.equal(
            await manager.read.allocationCapBps([strategy.address]),
            0n
        );

        assert.equal(
            await manager.read.lastKnownStrategyAssets([
                strategy.address,
            ]),
            0n
        );

        assert.equal(
            await manager.read.strategyCount(),
            0n
        );
    });

    // --------------------------------------------------
    // TEST 8: PAUSED STRATEGY CANNOT RECEIVE ALLOCATIONS
    // --------------------------------------------------

    it("8. Should prevent new allocations to a paused strategy", async () => {
        await fundManager(INITIAL_AMOUNT);

        await manager.write.setStrategyPaused(
            [strategy.address, true],
            { account: owner.account }
        );

        const strategyBalanceBefore = await strategy.read.totalAssets();

        await assert.rejects(async () => {
            await manager.write.allocate(
                [strategy.address, 100n * USDC],
                { account: vault.account }
            );
        });

        assert.equal(
            await strategy.read.totalAssets(),
            strategyBalanceBefore
        );

        assert.equal(
            await manager.read.isStrategyPaused([strategy.address]),
            true
        );
    });

    // --------------------------------------------------
    // TEST 9: ACCOUNT FOR ACTUAL EMERGENCY WITHDRAWAL
    // --------------------------------------------------

// --------------------------------------------------
// TEST 9: ACCOUNT FOR ACTUAL EMERGENCY WITHDRAWAL
// --------------------------------------------------

it("9. Should transfer only the actual amount received during emergency withdrawal", async () => {
    await fundAndAllocate(200n * USDC);

    // Configure the strategy to pay only 50% of the requested amount.
    await strategy.write.setWithdrawalPayoutBps(
        [5000n],
        { account: owner.account }
    );

    await manager.write.setStrategyPaused(
        [strategy.address, true],
        { account: owner.account }
    );

    const vaultBalanceBefore = await token.read.balanceOf([
        vault.account.address,
    ]);

    const managerBalanceBefore = await token.read.balanceOf([
        manager.address,
    ]);

    // Manager has 800 USDC in reserve.
    assert.equal(managerBalanceBefore, 800n * USDC);

    // Request 100 USDC; strategy will pay only 50 USDC.
    await manager.write.emergencyWithdrawFromStrategy(
        [strategy.address, 100n * USDC],
        { account: owner.account }
    );

    const vaultBalanceAfter = await token.read.balanceOf([
        vault.account.address,
    ]);

    const managerBalanceAfter = await token.read.balanceOf([
        manager.address,
    ]);

    // Vault receives only the actual 50 USDC payout.
    assert.equal(
        vaultBalanceAfter - vaultBalanceBefore,
        50n * USDC
    );

    // Existing manager reserves remain untouched.
    assert.equal(
        managerBalanceAfter,
        managerBalanceBefore
    );

    // Strategy balance decreases by only 50 USDC.
    assert.equal(
        await strategy.read.totalAssets(),
        150n * USDC
    );
});

    // --------------------------------------------------
    // TEST 10: RECOVER AND REMOVE STRATEGY
    // --------------------------------------------------

    it("10. Should allow strategy removal after emergency recovery of all assets", async () => {
        await fundAndAllocate(200n * USDC);

        await manager.write.setStrategyPaused(
            [strategy.address, true],
            { account: owner.account }
        );

        // Recover all assets from the paused strategy.
        await manager.write.emergencyWithdrawFromStrategy(
            [strategy.address, 200n * USDC],
            { account: owner.account }
        );

        assert.equal(
            await strategy.read.totalAssets(),
            0n
        );

        assert.equal(
            await manager.read.lastKnownStrategyAssets([
                strategy.address,
            ]),
            0n
        );

        // Remove the strategy after its cached assets reach zero.
        await manager.write.emergencyRemoveStrategy(
            [strategy.address],
            { account: owner.account }
        );

        assert.equal(
            await manager.read.isRegistered([strategy.address]),
            false
        );

        assert.equal(
            await manager.read.strategyCount(),
            0n
        );

        // Recovered funds should now be held by the vault.
        assert.equal(
            await token.read.balanceOf([vault.account.address]),
            200n * USDC
        );
    });
});