// SPDX-License-Identifier: MIT
pragma solidity ^0.8.34;

interface IPriceOracle {
    function getLatestPrice(
        address asset
    ) external view returns (int256 price, uint8 decimals, uint256 updatedAt);

    function getNormalizedPrice(
        address asset
    ) external view returns (uint256 normalizedPrice);

    function getAssetValueInUSD(
        address asset,
        uint256 amount
    ) external view returns (uint256 valueUSD);

    function isFeedValid(address asset) external view returns (bool);

    function isVolatilityFlagged(address asset) external view returns (bool);
}
