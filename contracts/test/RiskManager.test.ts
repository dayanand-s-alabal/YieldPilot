import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { network } from "hardhat";

describe("RiskManager", () => {
    let viem: any;
    let owner: any;
    let reporter: any;
    let user: any;

    let riskManager: any;
    let strategyManager: any;
    let token: any;
    let strategyA: any;
    let strategyB: any;

    beforeEach(async () => {
        const connection = await network.create();
        viem = connection.viem;

        const wallets = await viem.getWalletClients();
        owner = wallets[0];
        reporter = wallets[1];
        user = wallets[2];

        token = await viem.deployContract("MockUSDC", [
            owner.account.address,
        ]);

        strategyManager = await viem.deployContract("StrategyManager", [
            token.address,
            owner.account.address,
            1000n, // 10% reserve
        ]);

        strategyA = await viem.deployContract("MockStrategy", [
            token.address,
        ]);

        strategyB = await viem.deployContract("MockStrategy", [
            token.address,
        ]);

        await strategyA.write.setManager([strategyManager.address], {
            account: owner.account,
        });
        await strategyB.write.setManager([strategyManager.address], {
            account: owner.account,
        });

        await strategyManager.write.registerStrategy([strategyA.address, 5000n], {
            account: owner.account,
        });
        await strategyManager.write.registerStrategy([strategyB.address, 5000n], {
            account: owner.account,
        });

        riskManager = await viem.deployContract("RiskManager", [
            owner.account.address,
            70n, // max threshold 70
        ]);

        await riskManager.write.setStrategyManager(
            [strategyManager.address],
            { account: owner.account }
        );
    });

    it("Should initialize with correct max risk threshold", async () => {
        const threshold = await riskManager.read.maxRiskScoreThreshold();
        assert.equal(threshold, 70n);
    });

    it("Should allow owner to authorize a risk reporter", async () => {
        await riskManager.write.setRiskReporter(
            [reporter.account.address, true],
            { account: owner.account }
        );

        const isAuthorized = await riskManager.read.isRiskReporter([
            reporter.account.address,
        ]);
        assert.equal(isAuthorized, true);
    });

    it("Should allow authorized reporter to update risk score", async () => {
        await riskManager.write.setRiskReporter(
            [reporter.account.address, true],
            { account: owner.account }
        );

        await riskManager.write.updateRiskScore([strategyA.address, 35n], {
            account: reporter.account,
        });

        const score = await riskManager.read.getRiskScore([strategyA.address]);
        assert.equal(score, 35n);
    });

    it("Should reject score update from unauthorized account", async () => {
        await assert.rejects(async () => {
            await riskManager.write.updateRiskScore([strategyA.address, 35n], {
                account: user.account,
            });
        });
    });

    it("Should calculate risk score correctly using component weights", async () => {
        // Default weights: Volatility 30, Liquidity 25, Protocol 25, Withdrawal 20
        // Test values: V=40, L=20, P=60, W=30
        // Expected = (40*30 + 20*25 + 60*25 + 30*20) / 100
        // = (1200 + 500 + 1500 + 600) / 100 = 3800 / 100 = 38
        const calculated = await riskManager.read.calculateRiskScore([
            40n,
            20n,
            60n,
            30n,
        ]);
        assert.equal(calculated, 38n);
    });

    it("Should evaluate strategy eligibility based on risk threshold", async () => {
        // Strategy A has low risk (score 40 <= 70) => eligible
        await riskManager.write.updateRiskScore([strategyA.address, 40n], {
            account: owner.account,
        });
        const eligibleA = await riskManager.read.isStrategyEligible([
            strategyA.address,
        ]);
        assert.equal(eligibleA, true);

        // Strategy B has high risk (score 85 > 70) => ineligible
        await riskManager.write.updateRiskScore([strategyB.address, 85n], {
            account: owner.account,
        });
        const eligibleB = await riskManager.read.isStrategyEligible([
            strategyB.address,
        ]);
        assert.equal(eligibleB, false);
    });

    it("Should mark strategy ineligible if paused in StrategyManager", async () => {
        await riskManager.write.updateRiskScore([strategyA.address, 30n], {
            account: owner.account,
        });

        // Pause strategy in StrategyManager
        await strategyManager.write.setStrategyPaused([strategyA.address, true], {
            account: owner.account,
        });

        const eligible = await riskManager.read.isStrategyEligible([
            strategyA.address,
        ]);
        assert.equal(eligible, false);
    });
});
