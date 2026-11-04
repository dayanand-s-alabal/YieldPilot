// SPDX-License-Identifier: MIT
pragma solidity ^0.8.34;

interface IRiskManager {
    function updateRiskScore(address strategy, uint256 score) external;

    function getRiskScore(address strategy) external view returns (uint256);

    function isStrategyEligible(address strategy) external view returns (bool);

    function maxRiskScoreThreshold() external view returns (uint256);
}
