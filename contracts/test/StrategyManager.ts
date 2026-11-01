
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
  // This test uses a separate manager that has not been initialized.
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
        { account: user.account }
      );
    });
  });

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

  it("Should allow the owner to update the reserve", async () => {
    await manager.write.setReserveBps(
      [1500n],
      { account: owner.account }
    );

    assert.equal(await manager.read.reserveBps(), 1500n);
  });

  // New test 1
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

  // New test 2
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
});
