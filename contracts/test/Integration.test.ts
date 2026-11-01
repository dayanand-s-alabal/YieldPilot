
import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { network } from "hardhat";

describe("YieldPilot - Full Integration Tests", () => {
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
    const ALLOCATION_AMOUNT = 800n * USDC;
    const YIELD_AMOUNT = 100n * USDC;

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

        // 2. Deploy StrategyManager with a 10% reserve.
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

        // 4. Connect the vault to the manager.
        await manager.write.initializeVault(
            [vault.address],
            { account: owner.account }
        );

        // 5. Deploy and configure the strategy.
        strategy = await viem.deployContract("MockStrategy", [
            token.address,
        ]);

        await strategy.write.setManager(
            [manager.address],
            { account: owner.account }
        );

        // 6. Register strategy with an 80% allocation cap.
        await manager.write.registerStrategy(
            [strategy.address, 8000n],
            { account: owner.account }
        );

        // 7. Fund test accounts.
        await token.write.mint(
            [user.account.address, 2000n * USDC],
            { account: owner.account }
        );

        await token.write.mint(
            [owner.account.address, 1000n * USDC],
            { account: owner.account }
        );
    });

    async function deposit(amount: bigint) {
        await token.write.approve(
            [vault.address, amount],
            { account: user.account }
        );

        await vault.write.deposit(
            [amount, user.account.address],
            { account: user.account }
        );
    }

    async function allocate(amount: bigint) {
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

    it("Should complete the entire YieldPilot lifecycle", async () => {
        // STEP 1: User deposits USDC.
        await deposit(DEPOSIT_AMOUNT);

        assert.equal(
            await vault.read.balanceOf([user.account.address]),
            DEPOSIT_AMOUNT
        );

        assert.equal(
            await vault.read.totalAssets(),
            DEPOSIT_AMOUNT
        );

        // STEP 2: Vault allocates funds to the strategy.
        await allocate(ALLOCATION_AMOUNT);

        assert.equal(
            await strategy.read.totalAssets(),
            ALLOCATION_AMOUNT
        );

        assert.equal(
            await manager.read.totalManagedAssets(),
            DEPOSIT_AMOUNT
        );

        // STEP 3: Strategy generates simulated yield.
        await generateYield(YIELD_AMOUNT);

        const expectedTotalAssets = DEPOSIT_AMOUNT + YIELD_AMOUNT;

        assert.equal(
            await vault.read.totalAssets(),
            expectedTotalAssets
        );

        // STEP 4: Verify the user's share value.
        const shares = await vault.read.balanceOf([
            user.account.address,
        ]);

        const redeemableAssets = await vault.read.previewRedeem([
            shares,
        ]);

        assert.ok(
            redeemableAssets > DEPOSIT_AMOUNT,
            "Share value should increase after yield"
        );

        // STEP 5: User redeems all shares.
        await vault.write.redeem(
            [
                shares,
                user.account.address,
                user.account.address,
            ],
            { account: user.account }
        );

        // STEP 6: Verify the withdrawal.
        const finalUserBalance = await token.read.balanceOf([
            user.account.address,
        ]);

        assert.equal(
            finalUserBalance,
            1000n * USDC + redeemableAssets
        );

        assert.equal(
            await vault.read.balanceOf([user.account.address]),
            0n
        );

        // At most one smallest token unit can remain due to ERC-4626 rounding.
        assert.ok(
            await vault.read.totalAssets() <= 1n,
            "Unexpected assets remain after full redemption"
        );
    });

    it("Should preserve user shares when strategy withdrawals are disabled", async () => {
        // Deposit and allocate funds.
        await deposit(DEPOSIT_AMOUNT);
        await allocate(ALLOCATION_AMOUNT);

        // Disable strategy withdrawals.
        await strategy.write.setWithdrawalsEnabled(
            [false],
            { account: owner.account }
        );

        const sharesBefore = await vault.read.balanceOf([
            user.account.address,
        ]);

        const userBalanceBefore = await token.read.balanceOf([
            user.account.address,
        ]);

        // Full redemption should fail because strategy liquidity is unavailable.
        await assert.rejects(async () => {
            await vault.write.redeem(
                [
                    sharesBefore,
                    user.account.address,
                    user.account.address,
                ],
                { account: user.account }
            );
        });

        // Verify transaction rollback.
        assert.equal(
            await vault.read.balanceOf([user.account.address]),
            sharesBefore
        );

        assert.equal(
            await token.read.balanceOf([user.account.address]),
            userBalanceBefore
        );
    });

    it("Should reject strategy allocation from an unauthorized account", async () => {
        await deposit(DEPOSIT_AMOUNT);

        await assert.rejects(async () => {
            await vault.write.allocateToStrategy(
                [strategy.address, 100n * USDC],
                { account: user.account }
            );
        });

        assert.equal(
            await strategy.read.totalAssets(),
            0n
        );
    });

    it("Should maintain total managed assets after allocation", async () => {
        await deposit(DEPOSIT_AMOUNT);

        await allocate(ALLOCATION_AMOUNT);

        const managerAssets = await manager.read.totalManagedAssets();
        const vaultAssets = await vault.read.totalAssets();

        assert.equal(managerAssets, DEPOSIT_AMOUNT);
        assert.equal(vaultAssets, DEPOSIT_AMOUNT);
    });
    
it("Should make a donation-based inflation attack economically measurable", async () => {
    const attackerDeposit = 1n * USDC;
    const donation = 1_000_000n * USDC;
    const victimDeposit = 1000n * USDC;

    // 1. Attacker deposits 1 USDC.
    await token.write.approve(
        [vault.address, attackerDeposit],
        { account: user.account }
    );

    await vault.write.deposit(
        [attackerDeposit, user.account.address],
        { account: user.account }
    );

    const attackerShares = await vault.read.balanceOf([
        user.account.address,
    ]);

    // 2. Fund attacker with additional USDC for the donation.
    await token.write.mint(
        [user.account.address, donation],
        { account: owner.account }
    );

    // 3. Attacker donates directly to the vault.
    await token.write.transfer(
        [vault.address, donation],
        { account: user.account }
    );

    // 4. Victim deposits 1000 USDC.
    await token.write.mint(
        [recipient.account.address, victimDeposit],
        { account: owner.account }
    );

    await token.write.approve(
        [vault.address, victimDeposit],
        { account: recipient.account }
    );

    await vault.write.deposit(
        [victimDeposit, recipient.account.address],
        { account: recipient.account }
    );

    // 5. Check victim's redeemable assets.
    const victimShares = await vault.read.balanceOf([
        recipient.account.address,
    ]);

    const victimAssets = await vault.read.previewRedeem([
        victimShares,
    ]);

    // 6. Attacker redeems their original shares.
    const attackerAssets = await vault.read.previewRedeem([
        attackerShares,
    ]);

    await vault.write.redeem(
        [
            attackerShares,
            user.account.address,
            user.account.address,
        ],
        { account: user.account }
    );

    // 7. Calculate attacker's profit or loss.
    const attackerCost = attackerDeposit + donation;
    const attackerProfit = attackerAssets - attackerCost;

    console.log("\nInflation Attack Results");
    console.log("------------------------");
    console.log("Victim deposited:", victimDeposit / USDC, "USDC");
    console.log("Victim redeemable:", victimAssets.toString(), "base units");
    console.log("Attacker invested:", attackerCost.toString(), "base units");
    console.log("Attacker redeemed:", attackerAssets.toString(), "base units");
    console.log("Attacker profit/loss:", attackerProfit.toString(), "base units");

    // The attacker should not recover more than their total investment.
    assert.ok(
        attackerProfit <= 0n,
        "Unexpected attacker profit in this test scenario"
    );
});

it("Should maintain fair share pricing for multiple depositors", async () => {
    const firstDeposit = 1000n * USDC;
    const secondDeposit = 1000n * USDC;

    // User A deposits.
    await deposit(firstDeposit);

    const userAShares = await vault.read.balanceOf([
        user.account.address,
    ]);

    // Allocate funds and generate yield.
    await allocate(800n * USDC);
    await generateYield(100n * USDC);

    // Recipient (User B) deposits after yield.
    await token.write.mint(
        [recipient.account.address, secondDeposit],
        { account: owner.account }
    );

    await token.write.approve(
        [vault.address, secondDeposit],
        { account: recipient.account }
    );

    await vault.write.deposit(
        [secondDeposit, recipient.account.address],
        { account: recipient.account }
    );

    const userBShares = await vault.read.balanceOf([
        recipient.account.address,
    ]);

    console.log("\nMultiple Depositor Results");
    console.log("User A shares:", userAShares.toString());
    console.log("User B shares:", userBShares.toString());

    // User B deposits the same amount but receives fewer shares.
    assert.ok(
        userBShares < userAShares,
        "Later depositor should receive fewer shares after yield"
    );

    // Total assets should include both deposits and generated yield.
    assert.equal(
        await vault.read.totalAssets(),
        2100n * USDC
    );
});

it("Should preserve fair ownership when multiple users withdraw", async () => {
    const depositAmount = 1000n * USDC;
    const yieldAmount = 200n * USDC;

    // User A deposits.
    await deposit(depositAmount);

    // User B deposits.
    await token.write.mint(
        [recipient.account.address, depositAmount],
        { account: owner.account }
    );

    await token.write.approve(
        [vault.address, depositAmount],
        { account: recipient.account }
    );

    await vault.write.deposit(
        [depositAmount, recipient.account.address],
        { account: recipient.account }
    );

    // Allocate funds and generate yield.
    await allocate(1600n * USDC);
    await generateYield(yieldAmount);

    const userAShares = await vault.read.balanceOf([
        user.account.address,
    ]);

    const userBShares = await vault.read.balanceOf([
        recipient.account.address,
    ]);

    // Check both users have equal shares before withdrawal.
    assert.equal(userAShares, userBShares);

    // User A redeems all shares.
    const userAExpectedAssets = await vault.read.previewRedeem([
        userAShares,
    ]);

    await vault.write.redeem(
        [
            userAShares,
            user.account.address,
            user.account.address,
        ],
        { account: user.account }
    );

    assert.equal(
        await vault.read.balanceOf([user.account.address]),
        0n
    );

    // User B should retain all their shares.
    assert.equal(
        await vault.read.balanceOf([recipient.account.address]),
        userBShares
    );

    // User B redeems remaining shares.
    const userBExpectedAssets = await vault.read.previewRedeem([
        userBShares,
    ]);

    await vault.write.redeem(
        [
            userBShares,
            recipient.account.address,
            recipient.account.address,
        ],
        { account: recipient.account }
    );

    // Both users should receive their respective claims.
    assert.ok(userAExpectedAssets > depositAmount);
    assert.ok(userBExpectedAssets > depositAmount);

    assert.equal(
        await vault.read.balanceOf([recipient.account.address]),
        0n
    );

    assert.ok(
        await vault.read.totalAssets() <= 1n,
        "Unexpected assets remain after both users withdraw"
    );
});

it("Should recover liquidity from another strategy when one fails", async () => {
    const secondStrategy = await viem.deployContract("MockStrategy", [
        token.address,
    ]);

    // Configure and register the second strategy.
    await secondStrategy.write.setManager(
        [manager.address],
        { account: owner.account }
    );

    await manager.write.registerStrategy(
        [secondStrategy.address, 8000n],
        { account: owner.account }
    );

    // User deposits 1000 USDC.
    await deposit(DEPOSIT_AMOUNT);

    // Allocate 400 USDC to each strategy.
    await allocate(400n * USDC);

    await vault.write.allocateToStrategy(
        [secondStrategy.address, 400n * USDC],
        { account: owner.account }
    );

    // Disable withdrawals from the first strategy.
    await strategy.write.setWithdrawalsEnabled(
        [false],
        { account: owner.account }
    );

    // User requests redemption of 500 USDC worth of shares.
    const sharesToRedeem = 500n * USDC;

    await vault.write.redeem(
        [
            sharesToRedeem,
            user.account.address,
            user.account.address,
        ],
        { account: user.account }
    );

    // First strategy should retain its assets.
    assert.equal(
        await strategy.read.totalAssets(),
        400n * USDC
    );

    // Second strategy should provide 300 USDC:
    // 100 USDC from manager reserve + 400 USDC from second strategy
    // means 300 USDC needs to be recovered from the second strategy.
    assert.equal(
        await secondStrategy.read.totalAssets(),
        100n * USDC
    );

    assert.equal(
        await token.read.balanceOf([user.account.address]),
        1500n * USDC
    );
});

it("Should use another strategy when the first strategy exceeds its withdrawal limit", async () => {
    // 1. Deploy a second strategy.
    const secondStrategy = await viem.deployContract("MockStrategy", [
        token.address,
    ]);

    await secondStrategy.write.setManager(
        [manager.address],
        { account: owner.account }
    );

    await manager.write.registerStrategy(
        [secondStrategy.address, 8000n],
        { account: owner.account }
    );

    // 2. Deposit 1000 USDC.
    await deposit(DEPOSIT_AMOUNT);

    // 3. Allocate 400 USDC to each strategy.
    await allocate(400n * USDC);

    await vault.write.allocateToStrategy(
        [secondStrategy.address, 400n * USDC],
        { account: owner.account }
    );

    // Manager should retain 200 USDC.
    assert.equal(
        await token.read.balanceOf([manager.address]),
        200n * USDC
    );

    // 4. Configure the first strategy to reject withdrawals
    // greater than 100 USDC.
    await strategy.write.setMaxWithdrawalAmount(
        [100n * USDC],
        { account: owner.account }
    );

    // 5. User redeems shares worth 500 USDC.
    // Manager uses 200 USDC reserve and needs 300 USDC
    // from the strategies.
    const sharesToRedeem = 500n * USDC;

    await vault.write.redeem(
        [
            sharesToRedeem,
            user.account.address,
            user.account.address,
        ],
        { account: user.account }
    );

    // 6. First strategy should retain all its assets.
    assert.equal(
        await strategy.read.totalAssets(),
        400n * USDC
    );

    // 7. Second strategy should provide the required 300 USDC.
    assert.equal(
        await secondStrategy.read.totalAssets(),
        100n * USDC
    );

    // 8. Verify the user's withdrawal.
    assert.equal(
        await token.read.balanceOf([user.account.address]),
        1500n * USDC
    );

    // 9. Verify the remaining portfolio value.
    assert.equal(
        await vault.read.totalAssets(),
        500n * USDC
    );
});
it("Should recover the remaining liquidity after a partial strategy withdrawal", async () => {
    const secondStrategy = await viem.deployContract("MockStrategy", [
        token.address,
    ]);

    await secondStrategy.write.setManager(
        [manager.address],
        { account: owner.account }
    );

    await manager.write.registerStrategy(
        [secondStrategy.address, 8000n],
        { account: owner.account }
    );

    await deposit(DEPOSIT_AMOUNT);

    await allocate(400n * USDC);

    await vault.write.allocateToStrategy(
        [secondStrategy.address, 400n * USDC],
        { account: owner.account }
    );

    await strategy.write.setWithdrawalPayoutBps(
        [5000n],
        { account: owner.account }
    );

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
        250n * USDC
    );

    assert.equal(
        await secondStrategy.read.totalAssets(),
        250n * USDC
    );

    assert.equal(
        await vault.read.totalAssets(),
        500n * USDC
    );
});
it("Should expose the failure when a strategy totalAssets() call reverts", async () => {
    // Deploy the faulty strategy.
    const faultyStrategy = await viem.deployContract("FaultyStrategy", [
        token.address,
    ]);

    await faultyStrategy.write.setManager(
        [manager.address],
        { account: owner.account }
    );

    await manager.write.registerStrategy(
        [faultyStrategy.address, 8000n],
        { account: owner.account }
    );

    // Deploy another healthy strategy.
    const healthyStrategy = await viem.deployContract("MockStrategy", [
        token.address,
    ]);

    await healthyStrategy.write.setManager(
        [manager.address],
        { account: owner.account }
    );

    await manager.write.registerStrategy(
        [healthyStrategy.address, 8000n],
        { account: owner.account }
    );

    // Deposit 1,000 USDC.
    await deposit(DEPOSIT_AMOUNT);

    // Allocate 200 + 300 + 300 USDC.
    await allocate(200n * USDC);

    await vault.write.allocateToStrategy(
        [faultyStrategy.address, 300n * USDC],
        { account: owner.account }
    );

    await vault.write.allocateToStrategy(
        [healthyStrategy.address, 300n * USDC],
        { account: owner.account }
    );

    // Make the first strategy unavailable for withdrawals.
    await strategy.write.setWithdrawalsEnabled(
        [false],
        { account: owner.account }
    );

    // Make the second strategy's totalAssets() revert.
    await faultyStrategy.write.setTotalAssetsFailure(
        [true],
        { account: owner.account }
    );

    // The user needs to redeem 500 USDC.
    // Current manager implementation is expected to revert.
    await assert.rejects(async () => {
        await vault.write.redeem(
            [
                500n * USDC,
                user.account.address,
                user.account.address,
            ],
            { account: user.account }
        );
    });
});

});
