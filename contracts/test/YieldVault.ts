
import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { network } from "hardhat";

describe("YieldVault", () => {
    let viem: any;

    let owner: any;
    let user: any;
    let recipient: any;

    let token: any;
    let manager: any;
    let strategy: any;
    let vault: any;

    const USDC = 10n ** 6n;
    const DEPOSIT_AMOUNT = 1000n * USDC;

    beforeEach(async () => {
        const connection = await network.create();
        viem = connection.viem;

        const wallets = await viem.getWalletClients();

        owner = wallets[0];
        user = wallets[1];
        recipient = wallets[2];

        // 1. Deploy MockUSDC.
        token = await viem.deployContract("MockUSDC", [
            owner.account.address,
        ]);

        // 2. Deploy StrategyManager.
        manager = await viem.deployContract("StrategyManager", [
            token.address,
            owner.account.address,
            1000n, // 10% minimum reserve
        ]);

        // 3. Deploy YieldVault.
        vault = await viem.deployContract("YieldVault", [
            token.address,
            manager.address,
            owner.account.address,
        ]);

        // 4. Initialize manager with the vault contract address.
        await manager.write.initializeVault(
            [vault.address],
            { account: owner.account }
        );

        // 5. Deploy MockStrategy.
        strategy = await viem.deployContract("MockStrategy", [
            token.address,
        ]);

        // 6. Authorize StrategyManager in MockStrategy.
        await strategy.write.setManager(
            [manager.address],
            { account: owner.account }
        );

        // 7. Register strategy with an 80% allocation cap.
        await manager.write.registerStrategy(
            [strategy.address, 8000n],
            { account: owner.account }
        );

        // Mint test tokens to user and owner.
        await token.write.mint(
            [user.account.address, 2000n * USDC],
            { account: owner.account }
        );

        await token.write.mint(
            [owner.account.address, 1000n * USDC],
            { account: owner.account }
        );
    });

    async function depositForUser(amount: bigint) {
        await token.write.approve(
            [vault.address, amount],
            { account: user.account }
        );

        await vault.write.deposit(
            [amount, user.account.address],
            { account: user.account }
        );
    }

    async function allocateToStrategy(amount: bigint) {
        await vault.write.allocateToStrategy(
            [strategy.address, amount],
            { account: owner.account }
        );
    }

    it("Should initialize with correct asset and share metadata", async () => {
        assert.equal(
            (await vault.read.asset()).toLowerCase(),
            token.address.toLowerCase()
        );

        assert.equal(
            await vault.read.name(),
            "YieldPilot Vault Share"
        );

        assert.equal(
            await vault.read.symbol(),
            "ypSHARE"
        );

        assert.equal(
            (await manager.read.vault()).toLowerCase(),
            vault.address.toLowerCase()
        );
    });

    it("Should allow users to deposit and receive shares", async () => {
        await depositForUser(DEPOSIT_AMOUNT);

        assert.equal(
            await vault.read.balanceOf([user.account.address]),
            DEPOSIT_AMOUNT
        );

        assert.equal(
            await vault.read.totalAssets(),
            DEPOSIT_AMOUNT
        );
    });

    it("Should transfer deposited assets to StrategyManager", async () => {
        await depositForUser(DEPOSIT_AMOUNT);

        assert.equal(
            await token.read.balanceOf([manager.address]),
            DEPOSIT_AMOUNT
        );

        assert.equal(
            await token.read.balanceOf([vault.address]),
            0n
        );
    });

    it("Should reject deposits without sufficient token allowance", async () => {
        await assert.rejects(async () => {
            await vault.write.deposit(
                [DEPOSIT_AMOUNT, user.account.address],
                { account: user.account }
            );
        });
    });

    it("Should allow the owner to allocate assets to a strategy", async () => {
        await depositForUser(DEPOSIT_AMOUNT);

        await allocateToStrategy(800n * USDC);

        assert.equal(
            await strategy.read.totalAssets(),
            800n * USDC
        );

        assert.equal(
            await manager.read.totalManagedAssets(),
            DEPOSIT_AMOUNT
        );

        assert.equal(
            await vault.read.totalAssets(),
            DEPOSIT_AMOUNT
        );
    });

    it("Should reject allocation by non-owner accounts", async () => {
        await depositForUser(DEPOSIT_AMOUNT);

        await assert.rejects(async () => {
            await vault.write.allocateToStrategy(
                [strategy.address, 100n * USDC],
                { account: user.account }
            );
        });
    });

    it("Should reflect strategy yield in vault share value", async () => {
        await depositForUser(DEPOSIT_AMOUNT);

        await allocateToStrategy(800n * USDC);

        const yieldAmount = 100n * USDC;

        await token.write.approve(
            [strategy.address, yieldAmount],
            { account: owner.account }
        );

        await strategy.write.simulateYield(
            [yieldAmount],
            { account: owner.account }
        );

        assert.equal(
            await vault.read.totalAssets(),
            1100n * USDC
        );

        const convertedAssets = await vault.read.convertToAssets([
            DEPOSIT_AMOUNT,
        ]);

        const expectedAssets = 1100n * USDC;

        // ERC-4626 conversions round down.
        // Allow a difference of at most one smallest token unit.
        assert.ok(
            expectedAssets - convertedAssets <= 1n,
            `Expected ${expectedAssets}, received ${convertedAssets}`
        );
    });

    it("Should reflect strategy losses in vault share value", async () => {
        await depositForUser(DEPOSIT_AMOUNT);

        await allocateToStrategy(800n * USDC);

        await strategy.write.simulateLoss(
            [100n * USDC],
            { account: owner.account }
        );

        assert.equal(
            await vault.read.totalAssets(),
            900n * USDC
        );

        assert.equal(
            await vault.read.convertToAssets([DEPOSIT_AMOUNT]),
            900n * USDC
        );
    });

    it("Should redeem shares and return underlying assets", async () => {
        await depositForUser(DEPOSIT_AMOUNT);

        const shares = await vault.read.balanceOf([
            user.account.address,
        ]);

        await vault.write.redeem(
            [shares, user.account.address, user.account.address],
            { account: user.account }
        );

        assert.equal(
            await token.read.balanceOf([user.account.address]),
            2000n * USDC
        );

        assert.equal(
            await vault.read.balanceOf([user.account.address]),
            0n
        );

        assert.equal(
            await vault.read.totalAssets(),
            0n
        );
    });

    it("Should retrieve strategy liquidity when redeeming shares", async () => {
        await depositForUser(DEPOSIT_AMOUNT);

        await allocateToStrategy(800n * USDC);

        // Manager has 200 USDC liquid and strategy has 800.
        // Redeeming 500 shares requires 500 USDC.
        const sharesToRedeem = 500n * USDC;

        await vault.write.redeem(
            [
                sharesToRedeem,
                user.account.address,
                user.account.address,
            ],
            { account: user.account }
        );

        assert.equal(
            await token.read.balanceOf([user.account.address]),
            1500n * USDC
        );

        assert.equal(
            await strategy.read.totalAssets(),
            500n * USDC
        );

        assert.equal(
            await vault.read.totalAssets(),
            500n * USDC
        );
    });

    it("Should reject redemption when strategy liquidity is unavailable", async () => {
        await depositForUser(DEPOSIT_AMOUNT);

        await allocateToStrategy(800n * USDC);

        await strategy.write.setWithdrawalsEnabled(
            [false],
            { account: owner.account }
        );

        const shares = await vault.read.balanceOf([
            user.account.address,
        ]);

        await assert.rejects(async () => {
            await vault.write.redeem(
                [
                    shares,
                    user.account.address,
                    user.account.address,
                ],
                { account: user.account }
            );
        });

        // Failed redemption must leave user shares intact.
        assert.equal(
            await vault.read.balanceOf([user.account.address]),
            shares
        );

        assert.equal(
            await token.read.balanceOf([user.account.address]),
            1000n * USDC
        );
    });

    it("Should allow users to withdraw assets directly", async () => {
        await depositForUser(DEPOSIT_AMOUNT);

        await vault.write.withdraw(
            [
                200n * USDC,
                user.account.address,
                user.account.address,
            ],
            { account: user.account }
        );

        assert.equal(
            await token.read.balanceOf([user.account.address]),
            1200n * USDC
        );

        assert.equal(
            await vault.read.totalAssets(),
            800n * USDC
        );
    });
});
