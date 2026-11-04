// SPDX-License-Identifier: MIT
pragma solidity ^0.8.34;

interface IEmergencyManager {
    struct RecoveryLog {
        uint256 id;
        uint256 timestamp;
        address strategy;
        string reason;
        uint256 requestedAmount;
        uint256 recoveredAmount;
        uint256 lockedAmount;
        bool fullyRecovered;
    }

    function isVaultEmergencyPaused() external view returns (bool);

    function isStrategyExcluded(address strategy) external view returns (bool);

    function pauseVault(string calldata reason) external;

    function unpauseVault() external;

    function evaluateStrategyRisk(address strategy) external returns (bool emergencyTriggered);

    function emergencyLiquidate(
        address strategy,
        string calldata reason
    ) external returns (uint256 recovered, uint256 locked);
}
