
import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { network } from "hardhat";

describe("MockStrategy", () => {
  let viem: any;
  let owner: any;
  let user: any;
  let recipient: any;
  let token: any;
  let strategy: any;
  const USDC = 10n ** 6n;
  const amount = 100n * 10n ** 6n;

  beforeEach(async () => {
    const connection = await network.create();
    viem = connection.viem;

    const wallets = await viem.getWalletClients();

    owner = wallets[0];
    user = wallets[1];
    recipient = wallets[2];

    token = await viem.deployContract("MockUSDC", [
      owner.account.address,
    ]);

    strategy = await viem.deployContract("MockStrategy", [
      token.address,
    ]);

    await strategy.write.setManager(
    [owner.account.address],
    { account: owner.account }
);

    // Give the owner test tokens.
    await token.write.mint(
      [owner.account.address, 1000n * 10n ** 6n],
      { account: owner.account }
    );

    // Give the user test tokens.
    await token.write.mint(
      [user.account.address, amount],
      { account: owner.account }
    );
  });

  it("Should initialize with the correct asset and manager", async () => {
    assert.equal(
      (await strategy.read.asset()).toLowerCase(),
      token.address.toLowerCase()
    );

    assert.equal(
      (await strategy.read.manager()).toLowerCase(),
      owner.account.address.toLowerCase()
    );
  });

  it("Should accept deposits from the manager", async () => {
    await token.write.approve(
      [strategy.address, amount],
      { account: owner.account }
    );

    await strategy.write.deposit(
      [amount],
      { account: owner.account }
    );

    assert.equal(await strategy.read.totalAssets(), amount);
  });

  it("Should reject deposits from unauthorized users", async () => {
    await assert.rejects(async () => {
      await strategy.write.deposit(
        [amount],
        { account: user.account }
      );
    });
  });

  it("Should allow the manager to withdraw assets", async () => {
    await token.write.approve(
      [strategy.address, amount],
      { account: owner.account }
    );

    await strategy.write.deposit(
      [amount],
      { account: owner.account }
    );

    await strategy.write.withdraw(
      [amount],
      { account: owner.account }
    );

    assert.equal(await strategy.read.totalAssets(), 0n);
  });

  it("Should simulate yield correctly", async () => {
    const yieldAmount = 10n * 10n ** 6n;

    await token.write.approve(
      [strategy.address, yieldAmount],
      { account: owner.account }
    );

    await strategy.write.simulateYield(
      [yieldAmount],
      { account: owner.account }
    );

    assert.equal(
      await strategy.read.totalAssets(),
      yieldAmount
    );
  });

  it("Should simulate losses correctly", async () => {
    const initialAmount = 100n * 10n ** 6n;
    const lossAmount = 5n * 10n ** 6n;

    await token.write.approve(
      [strategy.address, initialAmount],
      { account: owner.account }
    );

    await strategy.write.deposit(
      [initialAmount],
      { account: owner.account }
    );

    await strategy.write.simulateLoss(
      [lossAmount],
      { account: owner.account }
    );

    assert.equal(
      await strategy.read.totalAssets(),
      initialAmount - lossAmount
    );
  });

  it("Should reject withdrawals when disabled", async () => {
    await token.write.approve(
      [strategy.address, amount],
      { account: owner.account }
    );

    await strategy.write.deposit(
      [amount],
      { account: owner.account }
    );

    await strategy.write.setWithdrawalsEnabled(
      [false],
      { account: owner.account }
    );

    await assert.rejects(async () => {
      await strategy.write.withdraw(
        [amount],
        { account: owner.account }
      );
    });
  });

  it("Should allow the owner to change the manager", async () => {
    await strategy.write.setManager(
      [user.account.address],
      { account: owner.account }
    );

    assert.equal(
      (await strategy.read.manager()).toLowerCase(),
      user.account.address.toLowerCase()
    );
  });
  
it("Should reject withdrawals exceeding the configured limit", async () => {
    const depositAmount = 500n * USDC;
    const withdrawalLimit = 100n * USDC;
    const requestedWithdrawal = 200n * USDC;

    await token.write.approve(
        [strategy.address, depositAmount],
        { account: owner.account }
    );

    await strategy.write.deposit(
        [depositAmount],
        { account: owner.account }
    );

    await strategy.write.setMaxWithdrawalAmount(
        [withdrawalLimit],
        { account: owner.account }
    );

    await assert.rejects(async () => {
        await strategy.write.withdraw(
            [requestedWithdrawal],
            { account: owner.account }
        );
    });

    assert.equal(
        await strategy.read.totalAssets(),
        depositAmount
    );
});

it("Should allow withdrawals within the configured limit", async () => {
    const depositAmount = 500n * USDC;
    const withdrawalLimit = 100n * USDC;
    const requestedWithdrawal = 80n * USDC;

    await token.write.approve(
        [strategy.address, depositAmount],
        { account: owner.account }
    );

    await strategy.write.deposit(
        [depositAmount],
        { account: owner.account }
    );

    await strategy.write.setMaxWithdrawalAmount(
        [withdrawalLimit],
        { account: owner.account }
    );

    await strategy.write.withdraw(
        [requestedWithdrawal],
        { account: owner.account }
    );

    assert.equal(
        await strategy.read.totalAssets(),
        depositAmount - requestedWithdrawal
    );
});

});
