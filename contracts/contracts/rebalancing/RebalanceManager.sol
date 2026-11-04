// SPDX-License-Identifier: MIT
pragma solidity ^0.8.34;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IStrategy} from "../interfaces/IStrategy.sol";
import {IRiskManager} from "../interfaces/IRiskManager.sol";
import {IRebalanceManager} from "../interfaces/IRebalanceManager.sol";
import {AutomationCompatibleInterface} from "../interfaces/AutomationCompatibleInterface.sol";

interface IStrategyManagerRebalance {
    function asset() external view returns (IERC20);
    function totalManagedAssets() external view returns (uint256);
    function reserveBps() external view returns (uint256);
    function strategyCount() external view returns (uint256);
    function getStrategy(uint256 index) external view returns (address);
    function getStrategies() external view returns (address[] memory);
    function isRegistered(address strategy) external view returns (bool);
    function isStrategyPaused(address strategy) external view returns (bool);
    function allocationCapBps(address strategy) external view returns (uint256);
    function allocate(address strategy, uint256 amount) external;
    function rebalanceWithdraw(address strategy, uint256 amount) external;
}

contract RebalanceManager is
    Ownable,
    Pausable,
    IRebalanceManager,
    AutomationCompatibleInterface
{
    uint256 public constant BPS = 10_000;

    IStrategyManagerRebalance public immutable strategyManager;
    IRiskManager public riskManager;

    // Minimum deviation in BPS required before rebalancing (e.g. 500 = 5%)
    uint256 public rebalanceThresholdBps = 500;

    // Minimum time between rebalances
    uint256 public minRebalanceInterval = 3600; // 1 hour
    uint256 public lastRebalanceTimestamp;

    // Target weights in BPS
    uint256 public targetReserveBps;
    mapping(address => uint256) public targetStrategyBps;
    address[] private targetStrategies;

    event TargetAllocationUpdated(
        uint256 targetReserveBps,
        address[] strategies,
        uint256[] targetStrategyBps
    );
    event RebalanceThresholdUpdated(uint256 newThresholdBps);
    event MinRebalanceIntervalUpdated(uint256 newInterval);
    event RiskManagerUpdated(address indexed newRiskManager);
    event Rebalanced(
        uint256 totalPortfolioAssets,
        uint256 timestamp
    );
    event StrategySkippedRisk(address indexed strategy, uint256 currentRisk);

    constructor(
        address _strategyManager,
        address _riskManager,
        address initialOwner
    ) Ownable(initialOwner) {
        require(_strategyManager != address(0), "Invalid strategy manager");
        strategyManager = IStrategyManagerRebalance(_strategyManager);

        if (_riskManager != address(0)) {
            riskManager = IRiskManager(_riskManager);
        }
    }

    function setRiskManager(address _riskManager) external onlyOwner {
        riskManager = IRiskManager(_riskManager);
        emit RiskManagerUpdated(_riskManager);
    }

    function setRebalanceThresholdBps(
        uint256 _thresholdBps
    ) external onlyOwner {
        require(_thresholdBps <= BPS, "Threshold exceeds 100%");
        rebalanceThresholdBps = _thresholdBps;
        emit RebalanceThresholdUpdated(_thresholdBps);
    }

    function setMinRebalanceInterval(
        uint256 _intervalSeconds
    ) external onlyOwner {
        minRebalanceInterval = _intervalSeconds;
        emit MinRebalanceIntervalUpdated(_intervalSeconds);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    // Configure target allocations: reserve target and list of strategies with their target weights.
    function setTargetAllocation(
        address[] memory strategies,
        uint256[] memory targetWeightsBps,
        uint256 reserveTargetBps
    ) public override onlyOwner {
        require(
            strategies.length == targetWeightsBps.length,
            "Mismatched array lengths"
        );

        uint256 totalBps = reserveTargetBps;
        require(
            reserveTargetBps >= strategyManager.reserveBps(),
            "Reserve below minimum requirement"
        );

        // Reset previous targets
        for (uint256 i = 0; i < targetStrategies.length; i++) {
            delete targetStrategyBps[targetStrategies[i]];
        }
        delete targetStrategies;

        targetReserveBps = reserveTargetBps;

        for (uint256 i = 0; i < strategies.length; i++) {
            address strategy = strategies[i];
            uint256 weight = targetWeightsBps[i];

            require(strategy != address(0), "Invalid strategy");
            require(
                strategyManager.isRegistered(strategy),
                "Strategy not registered"
            );
            require(
                !strategyManager.isStrategyPaused(strategy),
                "Strategy is paused"
            );
            require(
                weight <= strategyManager.allocationCapBps(strategy),
                "Target exceeds allocation cap"
            );

            if (address(riskManager) != address(0) && weight > 0) {
                require(
                    riskManager.isStrategyEligible(strategy),
                    "Strategy ineligible by risk"
                );
            }

            targetStrategyBps[strategy] = weight;
            targetStrategies.push(strategy);
            totalBps += weight;
        }

        require(totalBps == BPS, "Total weights must equal 10000 BPS");

        emit TargetAllocationUpdated(
            reserveTargetBps,
            strategies,
            targetWeightsBps
        );
    }

    // Convenience function to set target weights for all registered strategies in StrategyManager order.
    function setTargetAllocation(
        uint256[] calldata targetWeights
    ) external override onlyOwner {
        uint256 count = strategyManager.strategyCount();
        require(targetWeights.length == count, "Weight length mismatch");

        address[] memory registeredStrategies = new address[](count);
        uint256[] memory weights = new uint256[](count);
        uint256 strategiesTotalBps = 0;

        for (uint256 i = 0; i < count; i++) {
            registeredStrategies[i] = strategyManager.getStrategy(i);
            weights[i] = targetWeights[i];
            strategiesTotalBps += targetWeights[i];
        }

        require(
            strategiesTotalBps <= BPS,
            "Strategies weight exceeds 10000 BPS"
        );
        uint256 reserveWeight = BPS - strategiesTotalBps;

        setTargetAllocation(
            registeredStrategies,
            weights,
            reserveWeight
        );
    }

    function getTargetStrategies() external view returns (address[] memory) {
        return targetStrategies;
    }

    // Calculates differences for each registered strategy:
    // positive difference: excess assets to withdraw (current > target)
    // negative difference: deficit assets to allocate (current < target)
    function calculateRebalance()
        public
        view
        override
        returns (int256[] memory differences)
    {
        uint256 count = strategyManager.strategyCount();
        differences = new int256[](count);

        uint256 totalAssets = strategyManager.totalManagedAssets();
        if (totalAssets == 0) {
            return differences;
        }

        for (uint256 i = 0; i < count; i++) {
            address strategy = strategyManager.getStrategy(i);
            uint256 currentAssets = IStrategy(strategy).totalAssets();
            uint256 targetBps = targetStrategyBps[strategy];
            uint256 targetAssets = (totalAssets * targetBps) / BPS;

            if (currentAssets > targetAssets) {
                differences[i] = int256(currentAssets - targetAssets);
            } else if (targetAssets > currentAssets) {
                differences[i] = -int256(targetAssets - currentAssets);
            } else {
                differences[i] = 0;
            }
        }
    }

    // Check whether rebalancing is required based on threshold and interval
    function checkRebalance() public view override returns (bool required) {
        if (paused()) return false;
        if (targetStrategies.length == 0 && targetReserveBps == 0) return false;

        if (
            lastRebalanceTimestamp > 0 &&
            block.timestamp < lastRebalanceTimestamp + minRebalanceInterval
        ) {
            return false;
        }

        uint256 totalAssets = strategyManager.totalManagedAssets();
        if (totalAssets == 0) return false;

        uint256 count = strategyManager.strategyCount();

        for (uint256 i = 0; i < count; i++) {
            address strategy = strategyManager.getStrategy(i);
            uint256 currentAssets = IStrategy(strategy).totalAssets();
            uint256 currentBps = (currentAssets * BPS) / totalAssets;
            uint256 targetBps = targetStrategyBps[strategy];

            // If a strategy holding assets is paused or risk-ineligible, urgent rebalance needed
            if (currentAssets > 0) {
                if (strategyManager.isStrategyPaused(strategy)) {
                    return true;
                }
                if (
                    address(riskManager) != address(0) &&
                    !riskManager.isStrategyEligible(strategy)
                ) {
                    return true;
                }
            }

            uint256 diffBps = currentBps > targetBps
                ? currentBps - targetBps
                : targetBps - currentBps;

            if (diffBps >= rebalanceThresholdBps) {
                return true;
            }
        }

        return false;
    }

    // Execute rebalancing across strategies
    function executeRebalance() public override whenNotPaused {
        if (msg.sender != owner()) {
            require(checkRebalance(), "Rebalance threshold not reached");
        }

        _executeRebalance();
    }

    function _executeRebalance() internal {
        uint256 count = strategyManager.strategyCount();
        uint256 totalAssets = strategyManager.totalManagedAssets();
        require(totalAssets > 0, "No assets to rebalance");

        // Phase 1: Withdraw from strategies holding excess or ineligible/paused
        for (uint256 i = 0; i < count; i++) {
            address strategy = strategyManager.getStrategy(i);
            uint256 currentAssets = IStrategy(strategy).totalAssets();
            uint256 targetBps = targetStrategyBps[strategy];

            bool isEligible = true;
            if (address(riskManager) != address(0)) {
                isEligible = riskManager.isStrategyEligible(strategy);
            }
            if (strategyManager.isStrategyPaused(strategy)) {
                isEligible = false;
            }

            if (!isEligible && currentAssets > 0) {
                // Withdraw all assets from ineligible or paused strategy
                strategyManager.rebalanceWithdraw(strategy, currentAssets);
                continue;
            }

            uint256 targetAssets = (totalAssets * targetBps) / BPS;

            if (currentAssets > targetAssets) {
                uint256 excess = currentAssets - targetAssets;
                if (excess > 0) {
                    strategyManager.rebalanceWithdraw(strategy, excess);
                }
            }
        }

        // Phase 2: Allocate to deficit strategies that are eligible
        for (uint256 i = 0; i < count; i++) {
            address strategy = strategyManager.getStrategy(i);
            if (strategyManager.isStrategyPaused(strategy)) {
                continue;
            }

            if (address(riskManager) != address(0)) {
                if (!riskManager.isStrategyEligible(strategy)) {
                    emit StrategySkippedRisk(
                        strategy,
                        riskManager.getRiskScore(strategy)
                    );
                    continue;
                }
            }

            uint256 currentAssets = IStrategy(strategy).totalAssets();
            uint256 targetBps = targetStrategyBps[strategy];
            uint256 targetAssets = (totalAssets * targetBps) / BPS;

            if (targetAssets > currentAssets) {
                uint256 deficit = targetAssets - currentAssets;
                if (deficit > 0) {
                    strategyManager.allocate(strategy, deficit);
                }
            }
        }

        lastRebalanceTimestamp = block.timestamp;

        emit Rebalanced(totalAssets, block.timestamp);
    }

    // Chainlink Automation Keeper Interface
    function checkUpkeep(
        bytes calldata /* checkData */
    )
        external
        view
        override
        returns (bool upkeepNeeded, bytes memory performData)
    {
        upkeepNeeded = checkRebalance();
        performData = "";
    }

    function performUpkeep(
        bytes calldata /* performData */
    ) external override whenNotPaused {
        require(checkRebalance(), "Upkeep not needed");
        _executeRebalance();
    }
}
