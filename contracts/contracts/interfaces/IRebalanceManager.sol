// SPDX-License-Identifier: MIT
pragma solidity ^0.8.34;

interface IRebalanceManager {
    function setTargetAllocation(
        address[] memory strategies,
        uint256[] memory targetWeightsBps,
        uint256 reserveTargetBps
    ) external;

    function setTargetAllocation(uint256[] calldata targetWeights) external;

    function calculateRebalance()
        external
        view
        returns (int256[] memory differences);

    function checkRebalance() external view returns (bool required);

    function executeRebalance() external;
}
