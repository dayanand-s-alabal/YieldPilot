
import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { network } from "hardhat";

describe("MockUSDC", () => {
  let viem: any;
  let owner: any;
  let user: any;
  let recipient: any;
  let token: any;

  const amount = 100n * 10n ** 6n; // 100 ypUSDC

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
  });

  it("Should have the correct token name and symbol", async () => {
    assert.equal(await token.read.name(), "YieldPilot USD");
    assert.equal(await token.read.symbol(), "ypUSDC");
  });

  it("Should use 6 decimal places", async () => {
    assert.equal(await token.read.decimals(), 6);
  });

  it("Should allow the owner to mint tokens", async () => {
    await token.write.mint(
      [user.account.address, amount],
      { account: owner.account }
    );

    const balance = await token.read.balanceOf([
      user.account.address,
    ]);

    assert.equal(balance, amount);
  });

  it("Should prevent non-owners from minting tokens", async () => {
    await assert.rejects(
      async () => {
        await token.write.mint(
          [user.account.address, amount],
          { account: user.account }
        );
      }
    );
  });

  it("Should transfer tokens between accounts", async () => {
    await token.write.mint(
      [user.account.address, amount],
      { account: owner.account }
    );

    await token.write.transfer(
      [recipient.account.address, amount],
      { account: user.account }
    );

    const recipientBalance = await token.read.balanceOf([
      recipient.account.address,
    ]);

    const userBalance = await token.read.balanceOf([
      user.account.address,
    ]);

    assert.equal(recipientBalance, amount);
    assert.equal(userBalance, 0n);
  });
});
