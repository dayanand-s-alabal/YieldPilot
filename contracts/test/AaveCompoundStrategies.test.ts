import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { network } from "hardhat";

describe("YieldPilot - Aave and Compound Strategy Adapters", () => {
    let viem: any;
    let owner: any;
    let managerAccount: any;
    let token: any;
    let aaveStrategy: any;
    let compoundStrategy: any;

    const USDC = 10n ** 6n;

    beforeEach(async () => {
        const connection = await network.create();
        viem = connection.viem;

        const wallets = await viem.getWalletClients();
        owner = wallets[0];
        managerAccount = wallets[1];

        token = await viem.deployContract("MockUSDC", [owner.account.address]);

        aaveStrategy = await viem.deployContract("AaveStrategy", [
            token.address,
            owner.account.address,
        ]);
        await aaveStrategy.write.setManager([managerAccount.account.address], {
            account: owner.account,
        });

        compoundStrategy = await viem.deployContract("CompoundStrategy", [
            token.address,
            owner.account.address,
        ]);
        await compoundStrategy.write.setManager([managerAccount.account.address], {
            account: owner.account,
        });
    });

    it("Should correctly identify protocol names and underlying asset", async () => {
        const aaveName = await aaveStrategy.read.protocolName();
        const compoundName = await compoundStrategy.read.protocolName();
        assert.equal(aaveName, "Aave V3");
        assert.equal(compoundName, "Compound V3");

        const aaveAsset = await aaveStrategy.read.asset();
        const compAsset = await compoundStrategy.read.asset();
        assert.equal(aaveAsset.toLowerCase(), token.address.toLowerCase());
        assert.equal(compAsset.toLowerCase(), token.address.toLowerCase());
    });

    it("Should deposit, accrue yield, and withdraw from AaveStrategy", async () => {
        // Mint tokens to manager
        await token.write.mint([managerAccount.account.address, 1000n * USDC], {
            account: owner.account,
        });

        // Manager deposits 500 USDC
        await token.write.approve([aaveStrategy.address, 500n * USDC], {
            account: managerAccount.account,
        });
        await aaveStrategy.write.deposit([500n * USDC], {
            account: managerAccount.account,
        });

        assert.equal(await aaveStrategy.read.totalAssets(), 500n * USDC);

        // Owner simulates yield
        await token.write.mint([owner.account.address, 25n * USDC], {
            account: owner.account,
        });
        await token.write.approve([aaveStrategy.address, 25n * USDC], {
            account: owner.account,
        });
        await aaveStrategy.write.simulateYield([25n * USDC], {
            account: owner.account,
        });

        assert.equal(await aaveStrategy.read.totalAssets(), 525n * USDC);

        // Manager withdraws 200 USDC
        const managerBefore = await token.read.balanceOf([managerAccount.account.address]);
        await aaveStrategy.write.withdraw([200n * USDC], {
            account: managerAccount.account,
        });
        const managerAfter = await token.read.balanceOf([managerAccount.account.address]);

        assert.equal(managerAfter - managerBefore, 200n * USDC);
        assert.equal(await aaveStrategy.read.totalAssets(), 325n * USDC);
    });

    it("Should deposit and withdraw from CompoundStrategy", async () => {
        // Mint tokens to manager
        await token.write.mint([managerAccount.account.address, 1000n * USDC], {
            account: owner.account,
        });

        await token.write.approve([compoundStrategy.address, 400n * USDC], {
            account: managerAccount.account,
        });
        await compoundStrategy.write.deposit([400n * USDC], {
            account: managerAccount.account,
        });

        assert.equal(await compoundStrategy.read.totalAssets(), 400n * USDC);

        await compoundStrategy.write.withdraw([150n * USDC], {
            account: managerAccount.account,
        });
        assert.equal(await compoundStrategy.read.totalAssets(), 250n * USDC);
    });
});
