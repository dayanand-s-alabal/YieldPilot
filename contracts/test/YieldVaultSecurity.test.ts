
import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { network } from "hardhat";

describe("YieldVault Security Tests - Batch 02", () => {
    let viem: any;

    let owner: any;
    let user: any;
    let spender: any;
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
        spender = wallets[2];
        recipient = wallets[3];

        // 1. Deploy MockUSDC.
        token = await viem.deployContract("MockUSDC", [
            owner.account.address,
        ]);

        // 2. Deploy StrategyManager.
        manager = await viem.deployContract("StrategyManager", [
            token.address,
            owner.account.address,
            1000n,
        ]);

        // 3. Deploy YieldVault.
        vault = await viem.deployContract("YieldVault", [
            token.address,
            manager.address,
            owner.account.address,
        ]);

        // 4. Initialize StrategyManager.
        await manager.write.initializeVault(
            [vault.address],
            { account: owner.account }
        );

        // 5. Deploy healthy strategy.
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

        // 6. Mint tokens to user.
        await token.write.mint(
            [user.account.address, 2000n * USDC],
            { account: owner.account }
        );

        // Mint tokens to owner for donation-related operations.
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

    // --------------------------------------------------
    // TEST 1: MAXIMUM DEPOSIT LIMIT
    // --------------------------------------------------

    it("1. Should expose the expected maximum deposit limit", async () => {
        const maxDeposit = await vault.read.maxDeposit([
            user.account.address,
        ]);

        assert.equal(
            maxDeposit,
            (1n << 256n) - 1n
        );
    });

    // --------------------------------------------------
    // TEST 2: MAXIMUM MINT LIMIT
    // --------------------------------------------------

    it("2. Should expose the expected maximum mint limit", async () => {
        const maxMint = await vault.read.maxMint([
            user.account.address,
        ]);

        assert.equal(
            maxMint,
            (1n << 256n) - 1n
        );
    });

    // --------------------------------------------------
    // TEST 3: PREVIEW DEPOSIT
    // --------------------------------------------------

    it("3. Should calculate deposit shares accurately before depositing", async () => {
        const expectedShares = await vault.read.previewDeposit([
            DEPOSIT_AMOUNT,
        ]);

        await depositForUser(DEPOSIT_AMOUNT);

        const actualShares = await vault.read.balanceOf([
            user.account.address,
        ]);

        // Allow one smallest unit for ERC-4626 rounding.
        const difference =
            expectedShares > actualShares
                ? expectedShares - actualShares
                : actualShares - expectedShares;

        assert.ok(
            difference <= 1n,
            `Previewed ${expectedShares}, received ${actualShares}`
        );
    });

    // --------------------------------------------------
    // TEST 4: PREVIEW MINT
    // --------------------------------------------------

    it("4. Should calculate the required assets for minting shares", async () => {
        const requestedShares = 250n * USDC;

        const expectedAssets = await vault.read.previewMint([
            requestedShares,
        ]);

        assert.ok(expectedAssets > 0n);

        await token.write.approve(
            [vault.address, expectedAssets],
            { account: user.account }
        );

        await vault.write.mint(
            [requestedShares, user.account.address],
            { account: user.account }
        );

        assert.equal(
            await vault.read.balanceOf([
                user.account.address,
            ]),
            requestedShares
        );

        assert.equal(
            await token.read.balanceOf([
                vault.address,
            ]),
            0n
        );
    });

    // --------------------------------------------------
    // TEST 5: SHARE TRANSFER
    // --------------------------------------------------

    it("5. Should transfer vault shares without changing total managed assets", async () => {
        await depositForUser(DEPOSIT_AMOUNT);

        const assetsBefore = await vault.read.totalAssets();

        const sharesToTransfer = 300n * USDC;

        await vault.write.transfer(
            [recipient.account.address, sharesToTransfer],
            { account: user.account }
        );

        assert.equal(
            await vault.read.balanceOf([
                user.account.address,
            ]),
            700n * USDC
        );

        assert.equal(
            await vault.read.balanceOf([
                recipient.account.address,
            ]),
            sharesToTransfer
        );

        assert.equal(
            await vault.read.totalAssets(),
            assetsBefore
        );

        assert.equal(
            await vault.read.totalSupply(),
            DEPOSIT_AMOUNT
        );
    });

    // --------------------------------------------------
    // TEST 6: DELEGATED REDEMPTION
    // --------------------------------------------------

    it("6. Should allow an approved spender to redeem shares on behalf of the owner", async () => {
        await depositForUser(DEPOSIT_AMOUNT);

        const sharesToRedeem = 300n * USDC;

        await vault.write.approve(
            [spender.account.address, sharesToRedeem],
            { account: user.account }
        );

        await vault.write.redeem(
            [
                sharesToRedeem,
                recipient.account.address,
                user.account.address,
            ],
            { account: spender.account }
        );

        assert.equal(
            await vault.read.balanceOf([
                user.account.address,
            ]),
            700n * USDC
        );

        assert.equal(
            await token.read.balanceOf([
                recipient.account.address,
            ]),
            300n * USDC
        );

        assert.equal(
            await vault.read.allowance([
                user.account.address,
                spender.account.address,
            ]),
            0n
        );
    });

    // --------------------------------------------------
    // TEST 7: REDEEM MORE SHARES THAN OWNED
    // --------------------------------------------------

    it("7. Should reject redemption exceeding the user's share balance", async () => {
        await depositForUser(DEPOSIT_AMOUNT);

        const userSharesBefore = await vault.read.balanceOf([
            user.account.address,
        ]);

        const userAssetsBefore = await token.read.balanceOf([
            user.account.address,
        ]);

        await assert.rejects(async () => {
            await vault.write.redeem(
                [
                    userSharesBefore + 1n,
                    user.account.address,
                    user.account.address,
                ],
                { account: user.account }
            );
        });

        // Failed redemption must not change user balances.
        assert.equal(
            await vault.read.balanceOf([
                user.account.address,
            ]),
            userSharesBefore
        );

        assert.equal(
            await token.read.balanceOf([
                user.account.address,
            ]),
            userAssetsBefore
        );
    });

    // --------------------------------------------------
    // TEST 8: WITHDRAW MORE THAN MAXIMUM
    // --------------------------------------------------

    it("8. Should reject withdrawal exceeding the user's maximum withdrawable assets", async () => {
        await depositForUser(DEPOSIT_AMOUNT);

        const maxWithdraw = await vault.read.maxWithdraw([
            user.account.address,
        ]);

        assert.ok(maxWithdraw > 0n);

        await assert.rejects(async () => {
            await vault.write.withdraw(
                [
                    maxWithdraw + 1n,
                    user.account.address,
                    user.account.address,
                ],
                { account: user.account }
            );
        });

        assert.equal(
            await vault.read.balanceOf([
                user.account.address,
            ]),
            DEPOSIT_AMOUNT
        );
    });

    // --------------------------------------------------
    // TEST 9: PREVIEW WITHDRAW ROUNDING
    // --------------------------------------------------

    it("9. Should round previewWithdraw shares up when necessary", async () => {
        await depositForUser(DEPOSIT_AMOUNT);

        await allocateToStrategy(800n * USDC);

        // Simulate 100 USDC of yield.
        const yieldAmount = 100n * USDC;

        await token.write.approve(
            [strategy.address, yieldAmount],
            { account: owner.account }
        );

        await strategy.write.simulateYield(
            [yieldAmount],
            { account: owner.account }
        );

        const requestedAssets = 100n * USDC;

        const sharesRequired = await vault.read.previewWithdraw([
            requestedAssets,
        ]);

        const sharesConverted = await vault.read.convertToShares([
            requestedAssets,
        ]);

        // previewWithdraw rounds up; convertToShares rounds down.
        assert.ok(
            sharesRequired >= sharesConverted
        );

        assert.ok(
            sharesRequired - sharesConverted <= 1n,
            `Unexpected rounding difference: ${sharesRequired - sharesConverted}`
        );

        // Actually withdraw the requested assets.
        await vault.write.withdraw(
            [
                requestedAssets,
                user.account.address,
                user.account.address,
            ],
            { account: user.account }
        );

        assert.equal(
            await token.read.balanceOf([
                user.account.address,
            ]),
            1100n * USDC
        );
    });

    // --------------------------------------------------
    // TEST 10: FAIL-CLOSED VALUATION
    // --------------------------------------------------

    it("10. Should reject deposits and redemptions when a strategy valuation becomes unavailable", async () => {
        await depositForUser(DEPOSIT_AMOUNT);

        const faultyStrategy = await viem.deployContract(
            "FaultyStrategy",
            [token.address],
            { account: owner.account }
        );

        await faultyStrategy.write.setManager(
            [manager.address],
            { account: owner.account }
        );

        await manager.write.registerStrategy(
            [faultyStrategy.address, 5000n],
            { account: owner.account }
        );

        // Allocate 300 USDC to the faulty strategy.
        await vault.write.allocateToStrategy(
            [faultyStrategy.address, 300n * USDC],
            { account: owner.account }
        );

        const sharesBefore = await vault.read.balanceOf([
            user.account.address,
        ]);

        const userBalanceBefore = await token.read.balanceOf([
            user.account.address,
        ]);

        // Make strategy valuation fail.
        await faultyStrategy.write.setTotalAssetsFailure(
            [true],
            { account: owner.account }
        );

        // Vault valuation must fail.
        await assert.rejects(async () => {
            await vault.read.totalAssets();
        });

        // A new deposit must fail because share pricing is unavailable.
        await assert.rejects(async () => {
            await vault.write.deposit(
                [100n * USDC, user.account.address],
                { account: user.account }
            );
        });

        // Redemption must also fail because NAV is unavailable.
        await assert.rejects(async () => {
            await vault.write.redeem(
                [
                    100n * USDC,
                    user.account.address,
                    user.account.address,
                ],
                { account: user.account }
            );
        });

        // Existing user ownership must remain unchanged.
        assert.equal(
            await vault.read.balanceOf([
                user.account.address,
            ]),
            sharesBefore
        );

        assert.equal(
            await token.read.balanceOf([
                user.account.address,
            ]),
            userBalanceBefore
        );
    });
});
