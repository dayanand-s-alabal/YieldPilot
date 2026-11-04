// SPDX-License-Identifier: MIT
pragma solidity ^0.8.34;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IERC20Metadata} from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import {AggregatorV3Interface} from "../interfaces/AggregatorV3Interface.sol";
import {IPriceOracle} from "../interfaces/IPriceOracle.sol";

contract PriceOracle is Ownable, IPriceOracle {
    uint256 public constant BPS = 10_000;
    uint8 public constant NORMALIZED_DECIMALS = 8;

    uint256 public defaultMaxPriceAge = 3600; // 1 hour

    mapping(address => address) public priceFeeds;
    mapping(address => uint256) public assetMaxPriceAge;
    mapping(address => uint256) public lastReportedPrice;
    mapping(address => uint256) public maxDeviationBps;
    mapping(address => bool) public isVolatilityFlagged;

    event PriceFeedUpdated(
        address indexed asset,
        address indexed feed,
        uint256 maxPriceAge
    );
    event FeedRemoved(address indexed asset);
    event VolatilityAlert(
        address indexed asset,
        uint256 previousPrice,
        uint256 newPrice,
        uint256 deviationBps
    );
    event VolatilityFlagCleared(address indexed asset);
    event MaxDeviationUpdated(address indexed asset, uint256 deviationBps);

    constructor(address initialOwner) Ownable(initialOwner) {}

    function setPriceFeed(
        address asset,
        address feed,
        uint256 maxPriceAge
    ) external onlyOwner {
        require(asset != address(0), "Invalid asset");
        require(feed != address(0), "Invalid feed");

        priceFeeds[asset] = feed;
        assetMaxPriceAge[asset] = maxPriceAge > 0
            ? maxPriceAge
            : defaultMaxPriceAge;

        // Verify that feed is callable
        AggregatorV3Interface(feed).decimals();

        emit PriceFeedUpdated(asset, feed, assetMaxPriceAge[asset]);
    }

    function removePriceFeed(address asset) external onlyOwner {
        require(priceFeeds[asset] != address(0), "Feed not registered");
        delete priceFeeds[asset];
        delete assetMaxPriceAge[asset];
        delete lastReportedPrice[asset];
        delete isVolatilityFlagged[asset];

        emit FeedRemoved(asset);
    }

    function setMaxDeviationBps(
        address asset,
        uint256 deviationBps
    ) external onlyOwner {
        require(deviationBps <= BPS, "Invalid deviation BPS");
        maxDeviationBps[asset] = deviationBps;

        emit MaxDeviationUpdated(asset, deviationBps);
    }

    function clearVolatilityFlag(address asset) external onlyOwner {
        isVolatilityFlagged[asset] = false;
        emit VolatilityFlagCleared(asset);
    }

    function setDefaultMaxPriceAge(uint256 newMaxAge) external onlyOwner {
        require(newMaxAge > 0, "Invalid max age");
        defaultMaxPriceAge = newMaxAge;
    }

    function getLatestPrice(
        address asset
    )
        public
        view
        override
        returns (int256 price, uint8 decimals, uint256 updatedAt)
    {
        address feed = priceFeeds[asset];
        require(feed != address(0), "Feed not configured");

        AggregatorV3Interface priceFeed = AggregatorV3Interface(feed);
        decimals = priceFeed.decimals();

        uint80 roundId;
        uint80 answeredInRound;
        (
            roundId,
            price,
            ,
            updatedAt,
            answeredInRound
        ) = priceFeed.latestRoundData();

        require(price > 0, "Invalid price");
        require(updatedAt > 0, "Invalid timestamp");
        require(answeredInRound >= roundId, "Stale round");

        uint256 maxAge = assetMaxPriceAge[asset] > 0
            ? assetMaxPriceAge[asset]
            : defaultMaxPriceAge;

        require(block.timestamp - updatedAt <= maxAge, "Stale price");
    }

    function isFeedValid(address asset) public view override returns (bool) {
        address feed = priceFeeds[asset];
        if (feed == address(0)) return false;

        try AggregatorV3Interface(feed).latestRoundData() returns (
            uint80 roundId,
            int256 price,
            uint256,
            uint256 updatedAt,
            uint80 answeredInRound
        ) {
            if (price <= 0 || updatedAt == 0) return false;
            if (answeredInRound < roundId) return false;

            uint256 maxAge = assetMaxPriceAge[asset] > 0
                ? assetMaxPriceAge[asset]
                : defaultMaxPriceAge;

            if (block.timestamp - updatedAt > maxAge) return false;
            return true;
        } catch {
            return false;
        }
    }

    function getNormalizedPrice(
        address asset
    ) public view override returns (uint256 normalizedPrice) {
        (int256 rawPrice, uint8 feedDecimals, ) = getLatestPrice(asset);
        uint256 price = uint256(rawPrice);

        if (feedDecimals == NORMALIZED_DECIMALS) {
            return price;
        } else if (feedDecimals < NORMALIZED_DECIMALS) {
            return price * (10 ** (NORMALIZED_DECIMALS - feedDecimals));
        } else {
            return price / (10 ** (feedDecimals - NORMALIZED_DECIMALS));
        }
    }

    function getAssetValueInUSD(
        address asset,
        uint256 amount
    ) external view override returns (uint256 valueUSD) {
        if (amount == 0) return 0;

        uint256 normalizedPrice = getNormalizedPrice(asset);
        uint8 assetDecimals = IERC20Metadata(asset).decimals();

        // valueUSD has 8 decimals (USD 1.00 = 100_000_000)
        return (amount * normalizedPrice) / (10 ** assetDecimals);
    }

    function updateAndCheckVolatility(
        address asset
    ) external returns (bool highVolatility) {
        uint256 currentPrice = getNormalizedPrice(asset);
        uint256 previousPrice = lastReportedPrice[asset];

        lastReportedPrice[asset] = currentPrice;

        if (previousPrice > 0 && maxDeviationBps[asset] > 0) {
            uint256 diff = currentPrice > previousPrice
                ? currentPrice - previousPrice
                : previousPrice - currentPrice;

            uint256 deviationBps = (diff * BPS) / previousPrice;

            if (deviationBps >= maxDeviationBps[asset]) {
                isVolatilityFlagged[asset] = true;
                emit VolatilityAlert(
                    asset,
                    previousPrice,
                    currentPrice,
                    deviationBps
                );
                return true;
            }
        }

        return isVolatilityFlagged[asset];
    }
}
