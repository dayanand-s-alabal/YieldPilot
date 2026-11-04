// SPDX-License-Identifier: MIT
pragma solidity ^0.8.34;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IEmergencyManager} from "../interfaces/IEmergencyManager.sol";
import {IStrategy} from "../interfaces/IStrategy.sol";
import {IProtocolStrategy} from "../interfaces/IProtocolStrategy.sol";
import {IPriceOracle} from "../interfaces/IPriceOracle.sol";
import {IRiskManager} from "../interfaces/IRiskManager.sol";

interface IYieldVaultEmergency {
    function pause() external;
    function unpause() external;
    function paused() external view returns (bool);
}

interface IStrategyManagerEmergency {
    function setStrategyPaused(address strategy, bool paused) external;
    function emergencyWithdrawFromStrategy(address strategy, uint256 amount) external;
    function isStrategyPaused(address strategy) external view returns (bool);
}

/**
 * @title EmergencyManager
 * @notice Unified Emergency Risk Management system for YieldPilot
 *         Features:
 *         - Vault-wide emergency pause & unpause
 *         - Automatic strategy exclusion when risk exceeds configured threshold
 *         - Oracle failure and extreme price deviation circuit breakers
 *         - Stale APY detection and automated safety pause
 *         - Graceful emergency withdrawals with protocol liquidity availability checks
 *         - Complete auditable on-chain Recovery Logs
 */
contract EmergencyManager is Ownable, IEmergencyManager {
    // Linked YieldPilot components
    IYieldVaultEmergency public vault;
    IStrategyManagerEmergency public strategyManager;
    IRiskManager public riskManager;
    IPriceOracle public priceOracle;

    // Safety Thresholds
    uint256 public emergencyRiskThreshold = 70; // Risk score > 70 triggers emergency action
    uint256 public maxApyStaleDuration = 86400; // 24 hours max staleness

    // State Tracking
    bool public override isVaultEmergencyPaused;
    mapping(address => bool) public override isStrategyExcluded;
    mapping(address => uint256) public lastReportedApy;
    mapping(address => uint256) public lastApyTimestamp;

    // Incident / Recovery Logs
    RecoveryLog[] public recoveryLogs;

    // Events
    event VaultEmergencyPaused(address indexed triggeredBy, string reason);
    event VaultEmergencyUnpaused(address indexed triggeredBy);
    event StrategyExcluded(address indexed strategy, uint256 riskScore, string reason);
    event StrategyReinstated(address indexed strategy);
    event OracleFailureDetected(address indexed asset, string reason);
    event StaleApyDetected(address indexed strategy, uint256 lastReported, uint256 elapsed);
    event WithdrawalFailureAlert(address indexed strategy, uint256 requested, string reason);
    event EmergencyLiquidationExecuted(
        uint256 indexed logId,
        address indexed strategy,
        uint256 requested,
        uint256 recovered,
        uint256 locked
    );
    event ApyReported(address indexed strategy, uint256 apyBps, uint256 timestamp);
    event ThresholdUpdated(uint256 newRiskThreshold, uint256 newMaxApyStaleDuration);

    constructor(
        address initialOwner,
        address _vault,
        address _strategyManager,
        address _riskManager,
        address _priceOracle
    ) Ownable(initialOwner) {
        if (_vault != address(0)) vault = IYieldVaultEmergency(_vault);
        if (_strategyManager != address(0)) strategyManager = IStrategyManagerEmergency(_strategyManager);
        if (_riskManager != address(0)) riskManager = IRiskManager(_riskManager);
        if (_priceOracle != address(0)) priceOracle = IPriceOracle(_priceOracle);
    }

    function setVault(address _vault) external onlyOwner {
        require(_vault != address(0), "Invalid vault");
        vault = IYieldVaultEmergency(_vault);
    }

    function setStrategyManager(address _strategyManager) external onlyOwner {
        require(_strategyManager != address(0), "Invalid strategy manager");
        strategyManager = IStrategyManagerEmergency(_strategyManager);
    }

    function setRiskManager(address _riskManager) external onlyOwner {
        require(_riskManager != address(0), "Invalid risk manager");
        riskManager = IRiskManager(_riskManager);
    }

    function setPriceOracle(address _priceOracle) external onlyOwner {
        require(_priceOracle != address(0), "Invalid price oracle");
        priceOracle = IPriceOracle(_priceOracle);
    }

    function setThresholds(
        uint256 newRiskThreshold,
        uint256 newMaxApyStaleDuration
    ) external onlyOwner {
        require(newRiskThreshold <= 100, "Invalid risk threshold");
        require(newMaxApyStaleDuration > 0, "Invalid APY stale duration");
        emergencyRiskThreshold = newRiskThreshold;
        maxApyStaleDuration = newMaxApyStaleDuration;
        emit ThresholdUpdated(newRiskThreshold, newMaxApyStaleDuration);
    }

    /**
     * @notice Emergency pauses the entire vault, stopping all new deposits and allocations
     */
    function pauseVault(string calldata reason) external override onlyOwner {
        isVaultEmergencyPaused = true;
        if (address(vault) != address(0)) {
            vault.pause();
        }
        emit VaultEmergencyPaused(msg.sender, reason);
    }

    /**
     * @notice Unpauses the vault once conditions have returned to normal
     */
    function unpauseVault() external override onlyOwner {
        isVaultEmergencyPaused = false;
        if (address(vault) != address(0)) {
            vault.unpause();
        }
        emit VaultEmergencyUnpaused(msg.sender);
    }

    /**
     * @notice Records the latest APY for a strategy and updates the heartbeat timestamp
     */
    function reportApy(address strategy, uint256 apyBps) external onlyOwner {
        require(strategy != address(0), "Invalid strategy");
        lastReportedApy[strategy] = apyBps;
        lastApyTimestamp[strategy] = block.timestamp;
        emit ApyReported(strategy, apyBps, block.timestamp);
    }

    /**
     * @notice Returns whether APY reporting for a strategy is stale
     */
    function isApyStale(address strategy) public view returns (bool) {
        if (lastApyTimestamp[strategy] == 0) return true;
        return (block.timestamp - lastApyTimestamp[strategy]) > maxApyStaleDuration;
    }

    /**
     * @notice Checks the health of a price feed oracle
     */
    function checkOracleHealth(
        address asset
    ) public view returns (bool healthy, string memory reason) {
        if (address(priceOracle) == address(0)) {
            return (true, "No oracle configured");
        }

        bool feedValid = priceOracle.isFeedValid(asset);
        if (!feedValid) {
            return (false, "Oracle price feed stale, invalid, or reverted");
        }

        if (priceOracle.isVolatilityFlagged(asset)) {
            return (false, "Extreme price volatility circuit breaker tripped");
        }

        return (true, "Healthy");
    }

    /**
     * @notice Checks oracle health for an asset; trips pause if compromised
     */
    function triggerOracleFailureProtection(address asset) external {
        (bool healthy, string memory reason) = checkOracleHealth(asset);
        if (!healthy) {
            isVaultEmergencyPaused = true;
            if (address(vault) != address(0)) {
                vault.pause();
            }
            emit OracleFailureDetected(asset, reason);
        }
    }

    /**
     * @notice Checks for stale APY and pauses strategy allocations if detected
     */
    function triggerStaleApyProtection(address strategy) external {
        require(isApyStale(strategy), "APY is not stale");
        if (address(strategyManager) != address(0)) {
            strategyManager.setStrategyPaused(strategy, true);
        }
        uint256 elapsed = lastApyTimestamp[strategy] == 0
            ? 0
            : block.timestamp - lastApyTimestamp[strategy];
        emit StaleApyDetected(strategy, lastReportedApy[strategy], elapsed);
    }

    /**
     * @notice Evaluates strategy risk score against emergency threshold.
     *         If exceeded:
     *         1. Marks strategy ineligible & excluded.
     *         2. Halts new allocations via strategy manager pause.
     *         3. Attempts safe emergency liquidation subject to liquidity checks.
     */
    function evaluateStrategyRisk(
        address strategy
    ) external override returns (bool emergencyTriggered) {
        require(strategy != address(0), "Invalid strategy");
        require(address(riskManager) != address(0), "Risk manager not configured");

        uint256 score = riskManager.getRiskScore(strategy);

        if (score > emergencyRiskThreshold) {
            isStrategyExcluded[strategy] = true;

            if (address(strategyManager) != address(0)) {
                strategyManager.setStrategyPaused(strategy, true);
            }

            emit StrategyExcluded(
                strategy,
                score,
                "Risk score exceeded emergency threshold"
            );

            // Attempt safe emergency withdrawal
            emergencyLiquidate(strategy, "Auto-exclusion: Risk score exceeded emergency threshold");
            return true;
        }

        return false;
    }

    /**
     * @notice Safely liquidates an excluded or compromised strategy.
     *         Checks available protocol liquidity first; if partially illiquid,
     *         withdraws available funds and logs remaining locked assets.
     */
    function emergencyLiquidate(
        address strategy,
        string memory reason
    ) public override returns (uint256 recovered, uint256 locked) {
        require(strategy != address(0), "Invalid strategy");

        uint256 totalAssets = 0;
        try IStrategy(strategy).totalAssets() returns (uint256 assets) {
            totalAssets = assets;
        } catch {
            emit WithdrawalFailureAlert(strategy, 0, "Failed to query strategy totalAssets");
            return (0, 0);
        }

        if (totalAssets == 0) {
            return (0, 0);
        }

        // Check available protocol liquidity
        uint256 available = totalAssets;
        try IProtocolStrategy(strategy).availableLiquidity() returns (uint256 avail) {
            available = avail;
        } catch {
            // Default to totalAssets if strategy doesn't implement availableLiquidity
            available = totalAssets;
        }

        uint256 amountToWithdraw = available < totalAssets ? available : totalAssets;

        if (amountToWithdraw > 0 && address(strategyManager) != address(0)) {
            // Ensure strategy is paused first so emergency withdrawal succeeds
            if (!strategyManager.isStrategyPaused(strategy)) {
                strategyManager.setStrategyPaused(strategy, true);
            }

            try strategyManager.emergencyWithdrawFromStrategy(strategy, amountToWithdraw) {
                recovered = amountToWithdraw;
            } catch Error(string memory withdrawErr) {
                emit WithdrawalFailureAlert(strategy, amountToWithdraw, withdrawErr);
                recovered = 0;
            } catch {
                emit WithdrawalFailureAlert(strategy, amountToWithdraw, "Strategy emergency withdrawal failed");
                recovered = 0;
            }
        }

        locked = totalAssets > recovered ? totalAssets - recovered : 0;

        if (locked > 0) {
            emit WithdrawalFailureAlert(
                strategy,
                locked,
                "Protocol illiquidity: assets currently locked in lending pool"
            );
        }

        // Record incident log
        uint256 logId = recoveryLogs.length;
        RecoveryLog memory log = RecoveryLog({
            id: logId,
            timestamp: block.timestamp,
            strategy: strategy,
            reason: reason,
            requestedAmount: totalAssets,
            recoveredAmount: recovered,
            lockedAmount: locked,
            fullyRecovered: (locked == 0)
        });
        recoveryLogs.push(log);

        emit EmergencyLiquidationExecuted(
            logId,
            strategy,
            totalAssets,
            recovered,
            locked
        );

        return (recovered, locked);
    }

    /**
     * @notice Reinstates a strategy once risk is mitigated and protocol is safe
     */
    function reinstateStrategy(address strategy) external onlyOwner {
        require(strategy != address(0), "Invalid strategy");
        isStrategyExcluded[strategy] = false;

        if (address(strategyManager) != address(0)) {
            strategyManager.setStrategyPaused(strategy, false);
        }

        emit StrategyReinstated(strategy);
    }

    function getRecoveryLogsCount() external view returns (uint256) {
        return recoveryLogs.length;
    }

    function getAllRecoveryLogs() external view returns (RecoveryLog[] memory) {
        return recoveryLogs;
    }

    function getRecoveryLog(uint256 id) external view returns (RecoveryLog memory) {
        require(id < recoveryLogs.length, "Invalid log id");
        return recoveryLogs[id];
    }
}
