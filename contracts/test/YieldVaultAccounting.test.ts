
import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { network } from "hardhat";

describe("YieldVault Accounting Security Tests - Batch 04", () => {
    let viem: any;

    let owner: any;
    let user: any;
    let secondUser: any;
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
        secondUser = wallets[2];
        recipient = wallets[3];

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

        // Deploy YieldVault.
        vault = await viem.deployContract("YieldVault", [
            token.address,
            manager.address,
            owner.account.address,
        ]);

        // Initialize StrategyManager.
        await manager.write.initializeVault(
            [vault.address],
            { account: owner.account }
        );

        // Deploy and register healthy strategy.
        strategy = await viem.deployContract("MockStrategy", [
            token.address,
        ]);

        await strategy.write.setManager(
            [manager.address],
            { account: owner.account }
        );

        await manager.write.registerStrategy(
            [strategy.address, 8000n],
            { account: owner.account }
        );

        // Give users and owner tokens.
        await token.write.mint(
            [user.account.address, 3000n * USDC],
            { account: owner.account }
        );

        await token.write.mint(
            [secondUser.account.address, 3000n * USDC],
            { account: owner.account }
        );

        await token.write.mint(
            [owner.account.address, 3000n * USDC],
            { account: owner.account }
        );
    });

    async function depositFor(
    wallet: any,
    amount: bigint
) {
    const walletAddress = wallet.account.address;

    if (!walletAddress) {
        throw new Error("Wallet address is undefined");
    }

    await token.write.approve(
        [vault.address, amount],
        { account: wallet.account }
    );

    await vault.write.deposit(
        [amount, walletAddress],
        { account: wallet.account }
    );
}

    async function allocateToStrategy(amount: bigint) {
        await vault.write.allocateToStrategy(
            [strategy.address, amount],
            { account: owner.account }
        );
    }

    async function generateYield(amount: bigint) {
        await token.write.approve(
            [strategy.address, amount],
            { account: owner.account }
        );

        await strategy.write.simulateYield(
            [amount],
            { account: owner.account }
        );
    }

    async function assertPortfolioAccounting() {
        const vaultBalance = await token.read.balanceOf([
            vault.address,
        ]);

        const managerBalance = await token.read.balanceOf([
            manager.address,
        ]);

        const strategyAssets = await strategy.read.totalAssets();

        const expectedTotalAssets =
            vaultBalance + managerBalance + strategyAssets;

        const actualTotalAssets = await vault.read.totalAssets();

        assert.equal(
            actualTotalAssets,
            expectedTotalAssets,
            "Vault totalAssets must equal the sum of all actual asset balances"
        );
    }

    // --------------------------------------------------
    // TEST 1: DEPOSIT AFTER YIELD
    // --------------------------------------------------

    it("1. Should calculate fair shares for a new depositor after yield generation", async () => {
        await depositFor(user, DEPOSIT_AMOUNT);

        await allocateToStrategy(800n * USDC);

        await generateYield(100n * USDC);

        const assetsBefore = await vault.read.totalAssets();

        const expectedShares = await vault.read.previewDeposit([
            DEPOSIT_AMOUNT,
        ]);

        await depositFor(secondUser, DEPOSIT_AMOUNT);

        const actualShares = await vault.read.balanceOf([
            secondUser.account.address,
        ]);

        assert.equal(actualShares, expectedShares);

        // The second user must not receive the same number
        // of shares as the first user when yield has increased NAV.
        assert.ok(
            actualShares < DEPOSIT_AMOUNT,
            "New depositor should receive fewer shares after yield"
        );

        assert.equal(
            await vault.read.totalAssets(),
            assetsBefore + DEPOSIT_AMOUNT
        );
    });

    // --------------------------------------------------
    // TEST 2: DEPOSIT AFTER LOSS
    // --------------------------------------------------

    it("2. Should calculate fair shares for a new depositor after strategy losses", async () => {
        await depositFor(user, DEPOSIT_AMOUNT);

        await allocateToStrategy(800n * USDC);

        // Simulate a 200 USDC strategy loss.
        await strategy.write.simulateLoss(
            [200n * USDC],
            { account: owner.account }
        );

        const expectedShares = await vault.read.previewDeposit([
            DEPOSIT_AMOUNT,
        ]);

        await depositFor(secondUser, DEPOSIT_AMOUNT);

        const actualShares = await vault.read.balanceOf([
            secondUser.account.address,
        ]);

        assert.equal(actualShares, expectedShares);

        // A new depositor should receive more shares
        // because the existing portfolio has lost value.
        assert.ok(
            actualShares > DEPOSIT_AMOUNT,
            "New depositor should receive more shares after a loss"
        );
    });

    // --------------------------------------------------
    // TEST 3: REDEMPTION AFTER YIELD
    // --------------------------------------------------

    it("3. Should redeem shares at the updated value after yield generation", async () => {
        await depositFor(user, DEPOSIT_AMOUNT);

        await allocateToStrategy(800n * USDC);

        await generateYield(100n * USDC);

        const sharesToRedeem = 500n * USDC;

        const expectedAssets = await vault.read.previewRedeem([
            sharesToRedeem,
        ]);

        const balanceBefore = await token.read.balanceOf([
            user.account.address,
        ]);

        await vault.write.redeem(
            [
                sharesToRedeem,
                user.account.address,
                user.account.address,
            ],
            { account: user.account }
        );

        const balanceAfter = await token.read.balanceOf([
            user.account.address,
        ]);

        assert.equal(
            balanceAfter - balanceBefore,
            expectedAssets
        );

        assert.equal(
            await vault.read.balanceOf([
                user.account.address,
            ]),
            500n * USDC
        );
    });

    // --------------------------------------------------
    // TEST 4: REPEATED SHARE TRANSFERS
    // --------------------------------------------------

    it("4. Should preserve total supply and portfolio assets after repeated share transfers", async () => {
        await depositFor(user, DEPOSIT_AMOUNT);

        const totalSupplyBefore = await vault.read.totalSupply();
        const assetsBefore = await vault.read.totalAssets();

        // Transfer 200 shares from user to secondUser.
        await vault.write.transfer(
            [secondUser.account.address, 200n * USDC],
            { account: user.account }
        );

        // Transfer 100 shares from secondUser to recipient.
        await vault.write.transfer(
            [recipient.account.address, 100n * USDC],
            { account: secondUser.account }
        );

        // Transfer 50 shares from recipient back to user.
        await vault.write.transfer(
            [user.account.address, 50n * USDC],
            { account: recipient.account }
        );

        assert.equal(
            await vault.read.totalSupply(),
            totalSupplyBefore
        );

        assert.equal(
            await vault.read.totalAssets(),
            assetsBefore
        );

        assert.equal(
            await vault.read.balanceOf([user.account.address]),
            850n * USDC
        );

        assert.equal(
            await vault.read.balanceOf([secondUser.account.address]),
            100n * USDC
        );

        assert.equal(
            await vault.read.balanceOf([recipient.account.address]),
            50n * USDC
        );
    });

    // --------------------------------------------------
    // TEST 5: ZERO-ASSET DEPOSIT
    // --------------------------------------------------

    it("5. Should reject a zero-asset deposit without changing accounting", async () => {
    await depositFor(user, DEPOSIT_AMOUNT);

    const sharesBefore = await vault.read.balanceOf([
        user.account.address,
    ]);

    const assetsBefore = await vault.read.totalAssets();
    const supplyBefore = await vault.read.totalSupply();
    const userBalanceBefore = await token.read.balanceOf([
        user.account.address,
    ]);

    await assert.rejects(async () => {
        await vault.write.deposit(
            [0n, user.account.address],
            { account: user.account }
        );
    });

    assert.equal(
        await vault.read.balanceOf([user.account.address]),
        sharesBefore
    );

    assert.equal(
        await vault.read.totalSupply(),
        supplyBefore
    );

    assert.equal(
        await vault.read.totalAssets(),
        assetsBefore
    );

    assert.equal(
        await token.read.balanceOf([user.account.address]),
        userBalanceBefore
    );
});

    // --------------------------------------------------
    // TEST 6: ZERO-SHARE MINT
    // --------------------------------------------------

    it("6. Should reject a zero-share mint without changing accounting", async () => {
    await depositFor(user, DEPOSIT_AMOUNT);

    const sharesBefore = await vault.read.balanceOf([
        user.account.address,
    ]);

    const assetsBefore = await vault.read.totalAssets();
    const supplyBefore = await vault.read.totalSupply();
    const userBalanceBefore = await token.read.balanceOf([
        user.account.address,
    ]);

    await assert.rejects(async () => {
        await vault.write.mint(
            [0n, user.account.address],
            { account: user.account }
        );
    });

    assert.equal(
        await vault.read.balanceOf([user.account.address]),
        sharesBefore
    );

    assert.equal(
        await vault.read.totalSupply(),
        supplyBefore
    );

    assert.equal(
        await vault.read.totalAssets(),
        assetsBefore
    );

    assert.equal(
        await token.read.balanceOf([user.account.address]),
        userBalanceBefore
    );
});

    // --------------------------------------------------
    // TEST 7: ZERO-ASSET WITHDRAWAL
    // --------------------------------------------------

    it("7. Should handle a zero-asset withdrawal without burning shares", async () => {
        await depositFor(user, DEPOSIT_AMOUNT);

        const sharesBefore = await vault.read.balanceOf([
            user.account.address,
        ]);

        const assetsBefore = await vault.read.totalAssets();

        await vault.write.withdraw(
            [
                0n,
                user.account.address,
                user.account.address,
            ],
            { account: user.account }
        );

        assert.equal(
            await vault.read.balanceOf([user.account.address]),
            sharesBefore
        );

        assert.equal(
            await vault.read.totalAssets(),
            assetsBefore
        );
    });

    // --------------------------------------------------
    // TEST 8: ZERO-SHARE REDEMPTION
    // --------------------------------------------------

    it("8. Should handle zero-share redemption without transferring assets", async () => {
        await depositFor(user, DEPOSIT_AMOUNT);

        const sharesBefore = await vault.read.balanceOf([
            user.account.address,
        ]);

        const userAssetsBefore = await token.read.balanceOf([
            user.account.address,
        ]);

        await vault.write.redeem(
            [
                0n,
                user.account.address,
                user.account.address,
            ],
            { account: user.account }
        );

        assert.equal(
            await vault.read.balanceOf([user.account.address]),
            sharesBefore
        );

        assert.equal(
            await token.read.balanceOf([user.account.address]),
            userAssetsBefore
        );
    });

    // --------------------------------------------------
    // TEST 9: DIRECT DONATION TO VAULT
    // --------------------------------------------------

    it("9. Should account for tokens donated directly to the vault", async () => {
        await depositFor(user, DEPOSIT_AMOUNT);

        const assetsBefore = await vault.read.totalAssets();

        const donation = 100n * USDC;

        await token.write.transfer(
            [vault.address, donation],
            { account: owner.account }
        );

        const assetsAfter = await vault.read.totalAssets();

        assert.equal(
            assetsAfter,
            assetsBefore + donation
        );

        // Existing shares should reflect the donation.
        const expectedRedeemValue = await vault.read.previewRedeem([
            DEPOSIT_AMOUNT,
        ]);

        assert.ok(
            expectedRedeemValue > DEPOSIT_AMOUNT,
            "Existing shares should reflect the direct vault donation"
        );

        await assertPortfolioAccounting();
    });

    // --------------------------------------------------
    // TEST 10: SEQUENTIAL ACCOUNTING CONSISTENCY
    // --------------------------------------------------

    it("10. Should maintain accounting consistency after multiple operations", async () => {
        // Initial deposit.
        await depositFor(user, DEPOSIT_AMOUNT);

        await assertPortfolioAccounting();

        // Allocate assets.
        await allocateToStrategy(800n * USDC);

        await assertPortfolioAccounting();

        // Generate yield.
        await generateYield(100n * USDC);

        await assertPortfolioAccounting();

        // Second user deposits at the updated share price.
        await depositFor(secondUser, 500n * USDC);

        await assertPortfolioAccounting();

        // First user redeems some shares.
        await vault.write.redeem(
            [
                200n * USDC,
                user.account.address,
                user.account.address,
            ],
            { account: user.account }
        );

        await assertPortfolioAccounting();

        // Simulate a strategy loss.
        await strategy.write.simulateLoss(
            [50n * USDC],
            { account: owner.account }
        );

        await assertPortfolioAccounting();

        // Second user withdraws a portion of their assets.
        await vault.write.withdraw(
            [
                100n * USDC,
                secondUser.account.address,
                secondUser.account.address,
            ],
            { account: secondUser.account }
        );

        await assertPortfolioAccounting();

        // Final portfolio must remain consistent.
        const finalAssets = await vault.read.totalAssets();

        assert.ok(
            finalAssets > 0n,
            "Portfolio should retain positive assets"
        );

        assert.ok(
            (await vault.read.totalSupply()) > 0n,
            "Vault should retain outstanding shares"
        );
    });
});
