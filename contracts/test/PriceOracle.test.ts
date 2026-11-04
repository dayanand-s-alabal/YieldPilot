import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { network } from "hardhat";

describe("PriceOracle", () => {
    let viem: any;
    let owner: any;
    let user: any;

    let oracle: any;
    let mockFeedUSDC: any;
    let mockFeedETH: any;
    let mockUSDC: any;

    beforeEach(async () => {
        const connection = await network.create();
        viem = connection.viem;

        const wallets = await viem.getWalletClients();
        owner = wallets[0];
        user = wallets[1];

        mockUSDC = await viem.deployContract("MockUSDC", [
            owner.account.address,
        ]);

        // USDC feed with 8 decimals, initial price $1.00 = 100_000_000
        mockFeedUSDC = await viem.deployContract("MockAggregatorV3", [
            8,
            100_000_000n,
            "USDC / USD",
        ]);

        // ETH feed with 8 decimals, initial price $3000.00 = 300_000_000_000
        mockFeedETH = await viem.deployContract("MockAggregatorV3", [
            8,
            300_000_000_000n,
            "ETH / USD",
        ]);

        oracle = await viem.deployContract("PriceOracle", [
            owner.account.address,
        ]);
    });

    it("Should allow owner to register a price feed", async () => {
        await oracle.write.setPriceFeed(
            [mockUSDC.address, mockFeedUSDC.address, 3600n],
            { account: owner.account }
        );

        const configuredFeed = await oracle.read.priceFeeds([mockUSDC.address]);
        assert.equal(
            configuredFeed.toLowerCase(),
            mockFeedUSDC.address.toLowerCase()
        );

        const isValid = await oracle.read.isFeedValid([mockUSDC.address]);
        assert.equal(isValid, true);
    });

    it("Should reject feed registration from non-owner", async () => {
        await assert.rejects(async () => {
            await oracle.write.setPriceFeed(
                [mockUSDC.address, mockFeedUSDC.address, 3600n],
                { account: user.account }
            );
        });
    });

    it("Should return correct latest price and decimals", async () => {
        await oracle.write.setPriceFeed(
            [mockUSDC.address, mockFeedUSDC.address, 3600n],
            { account: owner.account }
        );

        const [price, decimals, updatedAt] = await oracle.read.getLatestPrice([
            mockUSDC.address,
        ]);

        assert.equal(price, 100_000_000n);
        assert.equal(decimals, 8);
        assert.ok(updatedAt > 0n);
    });

    it("Should normalize price to 8 decimals", async () => {
        // Feed with 18 decimals ($1.00 = 1e18)
        const mockFeed18 = await viem.deployContract("MockAggregatorV3", [
            18,
            1_000_000_000_000_000_000n,
            "TEST / USD",
        ]);

        await oracle.write.setPriceFeed(
            [mockUSDC.address, mockFeed18.address, 3600n],
            { account: owner.account }
        );

        const normalized = await oracle.read.getNormalizedPrice([
            mockUSDC.address,
        ]);
        assert.equal(normalized, 100_000_000n); // Scaled down to 8 decimals
    });

    it("Should calculate asset value in USD correctly", async () => {
        await oracle.write.setPriceFeed(
            [mockUSDC.address, mockFeedUSDC.address, 3600n],
            { account: owner.account }
        );

        // 100 USDC (6 decimals) = 100_000_000 base units
        const usdcAmount = 100n * 10n ** 6n;
        const valueUSD = await oracle.read.getAssetValueInUSD([
            mockUSDC.address,
            usdcAmount,
        ]);

        // 100 USD in 8 decimals = 100 * 10^8 = 10_000_000_000
        assert.equal(valueUSD, 10_000_000_000n);
    });

    it("Should reject negative or zero price", async () => {
        await oracle.write.setPriceFeed(
            [mockUSDC.address, mockFeedUSDC.address, 3600n],
            { account: owner.account }
        );

        // Set invalid zero price
        await mockFeedUSDC.write.setPrice([0n]);

        await assert.rejects(async () => {
            await oracle.read.getLatestPrice([mockUSDC.address]);
        });
    });

    it("Should reject stale price older than maxPriceAge", async () => {
        await oracle.write.setPriceFeed(
            [mockUSDC.address, mockFeedUSDC.address, 60n], // 60 seconds max age
            { account: owner.account }
        );

        // Set updatedAt in the past
        await mockFeedUSDC.write.setUpdatedAt([1000n]);

        await assert.rejects(async () => {
            await oracle.read.getLatestPrice([mockUSDC.address]);
        });
    });

    it("Should trigger volatility alert when price deviation exceeds threshold", async () => {
        await oracle.write.setPriceFeed(
            [mockUSDC.address, mockFeedUSDC.address, 3600n],
            { account: owner.account }
        );

        // Set max deviation to 10% (1000 BPS)
        await oracle.write.setMaxDeviationBps([mockUSDC.address, 1000n], {
            account: owner.account,
        });

        // First reading establishes baseline ($1.00)
        await oracle.write.updateAndCheckVolatility([mockUSDC.address], {
            account: owner.account,
        });

        // Price drops to $0.85 (15% drop > 10% threshold)
        await mockFeedUSDC.write.setPrice([85_000_000n]);

        await oracle.write.updateAndCheckVolatility([mockUSDC.address], {
            account: owner.account,
        });

        const flagged = await oracle.read.isVolatilityFlagged([mockUSDC.address]);
        assert.equal(flagged, true);

        // Owner clears volatility flag
        await oracle.write.clearVolatilityFlag([mockUSDC.address], {
            account: owner.account,
        });
        const cleared = await oracle.read.isVolatilityFlagged([mockUSDC.address]);
        assert.equal(cleared, false);
    });
});
