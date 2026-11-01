
import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { network } from "hardhat";

describe("StrategyManager", () => {
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

        token = await viem.deployContract("MockUSDC", [
            owner.account.address,
        ]);

        manager = await viem.deployContract("StrategyManager", [
            token.address,
            owner.account.address,
            1000n,
        ]);

        await manager.write.initializeVault(
            [vault.account.address],
            { account: owner.account }
        );

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

    // --------------------------------------------------
    // VALUATION FAILURE TEST
    // --------------------------------------------------

    it("Should reject portfolio valuation when a strategy valuation fails", async () => {
        // 1. Fund the manager.
        await fundManager(INITIAL_AMOUNT);

        // 2. Allocate assets to the existing healthy strategy.
        await manager.write.allocate(
            [strategy.address, 300n * USDC],
            { account: vault.account }
        );

        // 3. Deploy the faulty strategy.
        const faultyStrategy = await viem.deployContract(
            "FaultyStrategy",
            [token.address]
        );

        await faultyStrategy.write.setManager(
            [manager.address],
            { account: owner.account }
        );

        // 4. Register the faulty strategy.
        await manager.write.registerStrategy(
            [faultyStrategy.address, 5000n],
            { account: owner.account }
        );

        // 5. Allocate assets to the faulty strategy.
        await manager.write.allocate(
            [faultyStrategy.address, 300n * USDC],
            { account: vault.account }
        );

        // 6. Verify its cached asset value.
        assert.equal(
            await manager.read.lastKnownStrategyAssets([
                faultyStrategy.address,
            ]),
            300n * USDC
        );

        // 7. Activate the valuation failure.
        await faultyStrategy.write.setTotalAssetsFailure(
            [true],
            { account: owner.account }
        );

        // 8. Verify that the faulty strategy reverts.
        await assert.rejects(async () => {
            await faultyStrategy.read.totalAssets();
        });

        // 9. Verify that portfolio valuation fails closed.
        await assert.rejects(async () => {
            await manager.read.totalManagedAssets();
        });

        // 10. Verify that the cached recovery reference remains.
        assert.equal(
            await manager.read.lastKnownStrategyAssets([
                faultyStrategy.address,
            ]),
            300n * USDC
        );
    });

    // --------------------------------------------------
    // REGISTRATION TESTS
    // --------------------------------------------------

    it("Should register a strategy correctly", async () => {
        assert.equal(
            await manager.read.isRegistered([strategy.address]),
            true
        );

        assert.equal(
            await manager.read.allocationCapBps([strategy.address]),
            5000n
        );

        assert.equal(await manager.read.strategyCount(), 1n);
    });

    it("Should initialize the vault correctly", async () => {
        assert.equal(
            (await manager.read.vault()).toLowerCase(),
            vault.account.address.toLowerCase()
        );
    });

    it("Should prevent changing the vault after initialization", async () => {
        await assert.rejects(async () => {
            await manager.write.initializeVault(
                [user.account.address],
                { account: owner.account }
            );
        });
    });

    it("Should prevent unauthorized vault initialization", async () => {
        const uninitializedManager = await viem.deployContract(
            "StrategyManager",
            [
                token.address,
                owner.account.address,
                1000n,
            ]
        );

        await assert.rejects(async () => {
            await uninitializedManager.write.initializeVault(
                [user.account.address],
                { account: user.account }
            );
        });
    });

    it("Should reject duplicate strategy registration", async () => {
        await assert.rejects(async () => {
            await manager.write.registerStrategy(
                [strategy.address, 4000n],
                { account: owner.account }
            );
        });
    });

    it("Should reject unauthorized strategy registration", async () => {
        await assert.rejects(async () => {
            await manager.write.registerStrategy(
                [user.account.address, 4000n],
                { account: owner.account }
            );
        });
    });

    // --------------------------------------------------
    // FUNDING TESTS
    // --------------------------------------------------

    it("Should allow the vault to fund the manager", async () => {
        await fundManager(INITIAL_AMOUNT);

        assert.equal(
            await token.read.balanceOf([manager.address]),
            INITIAL_AMOUNT
        );

        assert.equal(
            await manager.read.totalManagedAssets(),
            INITIAL_AMOUNT
        );
    });

    it("Should reject funding from unauthorized accounts", async () => {
        await assert.rejects(async () => {
            await manager.write.fund(
                [100n * USDC],
                { account: user.account }
            );
        });
    });

    // --------------------------------------------------
    // ALLOCATION TESTS
    // --------------------------------------------------

    it("Should allocate assets to a registered strategy", async () => {
        await fundManager(INITIAL_AMOUNT);

        const allocation = 500n * USDC;

        await manager.write.allocate(
            [strategy.address, allocation],
            { account: vault.account }
        );

        assert.equal(
            await strategy.read.totalAssets(),
            allocation
        );

        assert.equal(
            await token.read.balanceOf([manager.address]),
            INITIAL_AMOUNT - allocation
        );

        assert.equal(
            await manager.read.totalManagedAssets(),
            INITIAL_AMOUNT
        );
    });

    it("Should enforce the minimum liquid reserve", async () => {
        await fundManager(INITIAL_AMOUNT);

        await assert.rejects(async () => {
            await manager.write.allocate(
                [strategy.address, 901n * USDC],
                { account: vault.account }
            );
        });
    });

    it("Should enforce the strategy allocation cap", async () => {
        await fundManager(INITIAL_AMOUNT);

        await assert.rejects(async () => {
            await manager.write.allocate(
                [strategy.address, 501n * USDC],
                { account: vault.account }
            );
        });
    });

    it("Should reject allocations by unauthorized accounts", async () => {
        await fundManager(INITIAL_AMOUNT);

        await assert.rejects(async () => {
            await manager.write.allocate(
                [strategy.address, 100n * USDC],
                { account: user.account }
            );
        });
    });

    // --------------------------------------------------
    // WITHDRAWAL TESTS
    // --------------------------------------------------

    it("Should withdraw assets from a strategy to the vault", async () => {
        await fundManager(INITIAL_AMOUNT);

        await manager.write.allocate(
            [strategy.address, 500n * USDC],
            { account: vault.account }
        );

        await manager.write.withdrawFromStrategy(
            [strategy.address, 200n * USDC],
            { account: vault.account }
        );

        assert.equal(
            await token.read.balanceOf([vault.account.address]),
            200n * USDC
        );

        assert.equal(
            await strategy.read.totalAssets(),
            300n * USDC
        );

        assert.equal(
            await manager.read.totalManagedAssets(),
            800n * USDC
        );
    });

    it("Should withdraw liquid assets to the vault", async () => {
        await fundManager(INITIAL_AMOUNT);

        await manager.write.withdrawLiquid(
            [100n * USDC],
            { account: vault.account }
        );

        assert.equal(
            await token.read.balanceOf([vault.account.address]),
            100n * USDC
        );

        assert.equal(
            await manager.read.totalManagedAssets(),
            900n * USDC
        );
    });

    // --------------------------------------------------
    // STRATEGY REMOVAL TESTS
    // --------------------------------------------------

    it("Should reject removal of a strategy holding assets", async () => {
        await fundManager(INITIAL_AMOUNT);

        await manager.write.allocate(
            [strategy.address, 500n * USDC],
            { account: vault.account }
        );

        await assert.rejects(async () => {
            await manager.write.removeStrategy(
                [strategy.address],
                { account: owner.account }
            );
        });
    });

    it("Should remove a strategy after all assets are withdrawn", async () => {
        await fundManager(INITIAL_AMOUNT);

        await manager.write.allocate(
            [strategy.address, 500n * USDC],
            { account: vault.account }
        );

        await manager.write.withdrawFromStrategy(
            [strategy.address, 500n * USDC],
            { account: vault.account }
        );

        await manager.write.removeStrategy(
            [strategy.address],
            { account: owner.account }
        );

        assert.equal(
            await manager.read.isRegistered([strategy.address]),
            false
        );

        assert.equal(await manager.read.strategyCount(), 0n);
    });

    // --------------------------------------------------
    // RESERVE TESTS
    // --------------------------------------------------

    it("Should allow the owner to update the reserve", async () => {
        await manager.write.setReserveBps(
            [1500n],
            { account: owner.account }
        );

        assert.equal(await manager.read.reserveBps(), 1500n);
    });

    // --------------------------------------------------
    // LIQUIDITY RECOVERY TESTS
    // --------------------------------------------------

    it("Should retrieve liquidity from strategies when manager liquidity is insufficient", async () => {
        await fundManager(INITIAL_AMOUNT);

        await manager.write.allocate(
            [strategy.address, 500n * USDC],
            { account: vault.account }
        );

        await manager.write.withdrawToVault(
            [700n * USDC],
            { account: vault.account }
        );

        assert.equal(
            await token.read.balanceOf([vault.account.address]),
            700n * USDC
        );

        assert.equal(
            await strategy.read.totalAssets(),
            300n * USDC
        );

        assert.equal(
            await manager.read.totalManagedAssets(),
            300n * USDC
        );
    });

    it("Should revert when the portfolio cannot provide sufficient liquidity", async () => {
        await fundManager(INITIAL_AMOUNT);

        await manager.write.allocate(
            [strategy.address, 500n * USDC],
            { account: vault.account }
        );

        await strategy.write.setWithdrawalsEnabled(
            [false],
            { account: owner.account }
        );

        await assert.rejects(async () => {
            await manager.write.withdrawToVault(
                [700n * USDC],
                { account: vault.account }
            );
        });

        assert.equal(
            await token.read.balanceOf([vault.account.address]),
            0n
        );
    });
    it("Should reject withdrawals when a strategy transfers less than requested", async function () {
    await fundManager(1000n * USDC);

    await manager.write.allocate(
        [strategy.address, 500n * USDC],
        { account: vault.account }
    );

    // Strategy pays only 50% of the requested withdrawal.
    await strategy.write.setWithdrawalPayoutBps([5000n]);

    const managerBalanceBefore = await token.read.balanceOf([
        manager.address
    ]);

    const strategyBalanceBefore = await token.read.balanceOf([
        strategy.address
    ]);

    await assert.rejects(
        manager.write.withdrawFromStrategy(
            [strategy.address, 200n * USDC],
            { account: vault.account }
        ),
        /Insufficient strategy withdrawal/
    );

    // Transaction should revert atomically.
    const managerBalanceAfter = await token.read.balanceOf([
        manager.address
    ]);

    const strategyBalanceAfter = await token.read.balanceOf([
        strategy.address
    ]);

    assert.equal(managerBalanceAfter, managerBalanceBefore);
    assert.equal(strategyBalanceAfter, strategyBalanceBefore);
});
it("Should prevent non-owners from pausing or recovering strategies", async function () {
    await fundManager(1000n * USDC);

    const faultyStrategy = await viem.deployContract(
        "FaultyStrategy",
        [token.address]
    );

    await faultyStrategy.write.setManager([manager.address]);

    await manager.write.registerStrategy(
        [faultyStrategy.address, 5000n],
        { account: owner.account }
    );

    await manager.write.allocate(
        [faultyStrategy.address, 300n * USDC],
        { account: vault.account }
    );

    // A non-owner cannot pause the strategy.
    await assert.rejects(
        manager.write.setStrategyPaused(
            [faultyStrategy.address, true],
            { account: user.account }
        )
    );

    // Owner pauses it so that emergency recovery is available.
    await manager.write.setStrategyPaused(
        [faultyStrategy.address, true],
        { account: owner.account }
    );

    // A non-owner cannot execute emergency recovery.
    await assert.rejects(
        manager.write.emergencyWithdrawFromStrategy(
            [faultyStrategy.address, 100n * USDC],
            { account: user.account }
        )
    );

    // A non-owner cannot remove the strategy either.
    await assert.rejects(
        manager.write.emergencyRemoveStrategy(
            [faultyStrategy.address],
            { account: user.account }
        )
    );
});
it("Should reject allocations to paused strategies", async function () {
    await fundManager(1000n * USDC);

    await manager.write.setStrategyPaused(
        [strategy.address, true],
        { account: owner.account }
    );

    assert.equal(
        await manager.read.isStrategyPaused([strategy.address]),
        true
    );

    const managerBalanceBefore = await token.read.balanceOf([
        manager.address
    ]);

    await assert.rejects(
        manager.write.allocate(
            [strategy.address, 100n * USDC],
            { account: vault.account }
        ),
        /Strategy is paused/
    );

    const managerBalanceAfter = await token.read.balanceOf([
        manager.address
    ]);

    assert.equal(managerBalanceAfter, managerBalanceBefore);
});
it("Should reject emergency removal when recovery balance is nonzero", async function () {
    await fundManager(1000n * USDC);

    const faultyStrategy = await viem.deployContract(
        "FaultyStrategy",
        [token.address]
    );

    await faultyStrategy.write.setManager([manager.address]);

    await manager.write.registerStrategy(
        [faultyStrategy.address, 5000n],
        { account: owner.account }
    );

    await manager.write.allocate(
        [faultyStrategy.address, 300n * USDC],
        { account: vault.account }
    );

    // Confirm that the recovery reference contains 300 USDC.
    assert.equal(
        await manager.read.lastKnownStrategyAssets([
            faultyStrategy.address
        ]),
        300n * USDC
    );

    // Pause the strategy and simulate a broken valuation function.
    await manager.write.setStrategyPaused(
        [faultyStrategy.address, true],
        { account: owner.account }
    );

    await faultyStrategy.write.setTotalAssetsFailure([true]);

    // Removal must fail while the recovery reference is nonzero.
    await assert.rejects(
        manager.write.emergencyRemoveStrategy(
            [faultyStrategy.address],
            { account: owner.account }
        ),
        /Strategy recovery balance not cleared/
    );

    // Confirm the strategy is still registered.
    assert.equal(
        await manager.read.isRegistered([faultyStrategy.address]),
        true
    );
});
it("Should allow a healthy strategy to be unpaused and used again", async function () {
    await fundManager(1000n * USDC);

    // Pause the strategy.
    await manager.write.setStrategyPaused(
        [strategy.address, true],
        { account: owner.account }
    );

    assert.equal(
        await manager.read.isStrategyPaused([strategy.address]),
        true
    );

    // Unpause the strategy.
    await manager.write.setStrategyPaused(
        [strategy.address, false],
        { account: owner.account }
    );

    assert.equal(
        await manager.read.isStrategyPaused([strategy.address]),
        false
    );

    // Allocation should work again.
    await manager.write.allocate(
        [strategy.address, 100n * USDC],
        { account: vault.account }
    );

    assert.equal(
        await token.read.balanceOf([strategy.address]),
        100n * USDC
    );
});
});
