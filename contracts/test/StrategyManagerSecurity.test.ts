
import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { network } from "hardhat";

describe("StrategyManager Security Tests - Batch 03", () => {
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

        // Deploy the mock USDC token.
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

        // Deploy and register the first strategy.
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

    async function deployAndRegisterSecondStrategy(
        allocationCap: bigint = 5000n
    ) {
        const secondStrategy = await viem.deployContract(
            "MockStrategy",
            [token.address]
        );

        await secondStrategy.write.setManager(
            [manager.address],
            { account: owner.account }
        );

        await manager.write.registerStrategy(
            [secondStrategy.address, allocationCap],
            { account: owner.account }
        );

        return secondStrategy;
    }

    // --------------------------------------------------
    // TEST 1: RESERVE BOUNDARY VALIDATION
    // --------------------------------------------------

    it("1. Should reject a reserve ratio greater than 10000 BPS", async () => {
        const reserveBefore = await manager.read.reserveBps();

        await assert.rejects(async () => {
            await manager.write.setReserveBps(
                [BPS + 1n],
                { account: owner.account }
            );
        });

        assert.equal(
            await manager.read.reserveBps(),
            reserveBefore
        );
    });

    // --------------------------------------------------
    // TEST 2: RESERVE AUTHORIZATION
    // --------------------------------------------------

    it("2. Should prevent non-owners from changing the reserve", async () => {
        const reserveBefore = await manager.read.reserveBps();

        await assert.rejects(async () => {
            await manager.write.setReserveBps(
                [1500n],
                { account: user.account }
            );
        });

        assert.equal(
            await manager.read.reserveBps(),
            reserveBefore
        );
    });

    // --------------------------------------------------
    // TEST 3: ALLOCATION CAP BOUNDARY
    // --------------------------------------------------

    it("3. Should reject an allocation cap greater than 10000 BPS", async () => {
        const capBefore = await manager.read.allocationCapBps([
            strategy.address,
        ]);

        await assert.rejects(async () => {
            await manager.write.setAllocationCap(
                [strategy.address, BPS + 1n],
                { account: owner.account }
            );
        });

        assert.equal(
            await manager.read.allocationCapBps([
                strategy.address,
            ]),
            capBefore
        );
    });

    // --------------------------------------------------
    // TEST 4: ALLOCATION CAP AUTHORIZATION
    // --------------------------------------------------

    it("4. Should prevent non-owners from changing allocation caps", async () => {
        const capBefore = await manager.read.allocationCapBps([
            strategy.address,
        ]);

        await assert.rejects(async () => {
            await manager.write.setAllocationCap(
                [strategy.address, 2000n],
                { account: user.account }
            );
        });

        assert.equal(
            await manager.read.allocationCapBps([
                strategy.address,
            ]),
            capBefore
        );
    });

    // --------------------------------------------------
    // TEST 5: UPDATED ALLOCATION CAP ENFORCEMENT
    // --------------------------------------------------

    it("5. Should enforce an updated allocation cap", async () => {
        await fundManager(INITIAL_AMOUNT);

        // Reduce the strategy allocation cap to 20%.
        await manager.write.setAllocationCap(
            [strategy.address, 2000n],
            { account: owner.account }
        );

        // 20.1% of 1000 USDC must be rejected.
        await assert.rejects(async () => {
            await manager.write.allocate(
                [strategy.address, 201n * USDC],
                { account: vault.account }
            );
        });

        // Exactly 20% should be accepted.
        await manager.write.allocate(
            [strategy.address, 200n * USDC],
            { account: vault.account }
        );

        assert.equal(
            await strategy.read.totalAssets(),
            200n * USDC
        );

        assert.equal(
            await manager.read.totalManagedAssets(),
            INITIAL_AMOUNT
        );
    });

    // --------------------------------------------------
    // TEST 6: ZERO ADDRESS REGISTRATION
    // --------------------------------------------------

    it("6. Should reject registration of the zero address", async () => {
        const zeroAddress =
            "0x0000000000000000000000000000000000000000";

        const countBefore = await manager.read.strategyCount();

        await assert.rejects(async () => {
            await manager.write.registerStrategy(
                [zeroAddress, 5000n],
                { account: owner.account }
            );
        });

        assert.equal(
            await manager.read.strategyCount(),
            countBefore
        );

        assert.equal(
            await manager.read.isRegistered([zeroAddress]),
            false
        );
    });

    // --------------------------------------------------
    // TEST 7: WRONG ASSET REGISTRATION
    // --------------------------------------------------

    it("7. Should reject a strategy using a different asset token", async () => {
        const differentToken = await viem.deployContract(
            "MockUSDC",
            [owner.account.address]
        );

        const wrongAssetStrategy = await viem.deployContract(
            "MockStrategy",
            [differentToken.address]
        );

        await wrongAssetStrategy.write.setManager(
            [manager.address],
            { account: owner.account }
        );

        const countBefore = await manager.read.strategyCount();

        await assert.rejects(async () => {
            await manager.write.registerStrategy(
                [wrongAssetStrategy.address, 5000n],
                { account: owner.account }
            );
        });

        assert.equal(
            await manager.read.strategyCount(),
            countBefore
        );

        assert.equal(
            await manager.read.isRegistered([
                wrongAssetStrategy.address,
            ]),
            false
        );
    });

    // --------------------------------------------------
    // TEST 8: STRATEGY REMOVAL AUTHORIZATION
    // --------------------------------------------------

    it("8. Should prevent non-owners from removing a strategy", async () => {
        const registeredBefore = await manager.read.isRegistered([
            strategy.address,
        ]);

        await assert.rejects(async () => {
            await manager.write.removeStrategy(
                [strategy.address],
                { account: user.account }
            );
        });

        assert.equal(
            await manager.read.isRegistered([
                strategy.address,
            ]),
            registeredBefore
        );

        assert.equal(
            await manager.read.strategyCount(),
            1n
        );
    });

    // --------------------------------------------------
    // TEST 9: VAULT-ONLY WITHDRAWAL AUTHORIZATION
    // --------------------------------------------------

    it("9. Should prevent non-vault accounts from calling withdrawToVault", async () => {
        await fundManager(INITIAL_AMOUNT);

        const managerBalanceBefore = await token.read.balanceOf([
            manager.address,
        ]);

        await assert.rejects(async () => {
            await manager.write.withdrawToVault(
                [100n * USDC],
                { account: user.account }
            );
        });

        assert.equal(
            await token.read.balanceOf([manager.address]),
            managerBalanceBefore
        );

        assert.equal(
            await token.read.balanceOf([user.account.address]),
            0n
        );
    });

    // --------------------------------------------------
    // TEST 10: MULTI-STRATEGY LIQUIDITY RECOVERY
    // --------------------------------------------------

    it("10. Should retrieve liquidity from multiple strategies when necessary", async () => {
        await fundManager(INITIAL_AMOUNT);

        // Deploy and register a second strategy.
        const secondStrategy =
            await deployAndRegisterSecondStrategy();

        // Allocate 300 USDC to the first strategy.
        await manager.write.allocate(
            [strategy.address, 300n * USDC],
            { account: vault.account }
        );

        // Allocate 300 USDC to the second strategy.
        await manager.write.allocate(
            [secondStrategy.address, 300n * USDC],
            { account: vault.account }
        );

        // Manager now holds 400 USDC in liquid assets.
        assert.equal(
            await token.read.balanceOf([manager.address]),
            400n * USDC
        );

        // Request 900 USDC.
        // The manager must retrieve another 500 USDC from strategies.
        await manager.write.withdrawToVault(
            [900n * USDC],
            { account: vault.account }
        );

        // Vault receives the requested amount.
        assert.equal(
            await token.read.balanceOf([vault.account.address]),
            900n * USDC
        );

        // Both strategies have supplied liquidity.
        assert.equal(
            await strategy.read.totalAssets(),
            0n
        );

        assert.equal(
            await secondStrategy.read.totalAssets(),
            100n * USDC
        );

        // The remaining portfolio value must be 100 USDC.
        assert.equal(
            await manager.read.totalManagedAssets(),
            100n * USDC
        );
    });
});
