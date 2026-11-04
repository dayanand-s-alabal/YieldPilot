// SPDX-License-Identifier: MIT
pragma solidity ^0.8.34;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IRiskManager} from "../interfaces/IRiskManager.sol";

interface IStrategyManagerMinimal {
    function isRegistered(address strategy) external view returns (bool);
    function isStrategyPaused(address strategy) external view returns (bool);
}

contract RiskManager is Ownable, IRiskManager {
    uint256 public constant MAX_SCORE = 100;

    // Default max acceptable risk score (0-100 scale). Strategies with score > threshold are ineligible.
    uint256 public override maxRiskScoreThreshold = 70;

    // Component weights (must sum to 100)
    uint256 public weightVolatility = 30;
    uint256 public weightLiquidity = 25;
    uint256 public weightProtocol = 25;
    uint256 public weightWithdrawal = 20;

    address public strategyManager;

    mapping(address => uint256) public riskScores;
    mapping(address => bool) public isScoreSet;
    mapping(address => bool) public isRiskReporter;

    event RiskScoreUpdated(address indexed strategy, uint256 score);
    event RiskReporterUpdated(address indexed reporter, bool authorized);
    event MaxRiskScoreThresholdUpdated(uint256 newThreshold);
    event StrategyManagerUpdated(address indexed strategyManager);
    event RiskWeightsUpdated(
        uint256 weightVolatility,
        uint256 weightLiquidity,
        uint256 weightProtocol,
        uint256 weightWithdrawal
    );

    modifier onlyAuthorized() {
        require(
            msg.sender == owner() || isRiskReporter[msg.sender],
            "Unauthorized risk reporter"
        );
        _;
    }

    constructor(
        address initialOwner,
        uint256 initialThreshold
    ) Ownable(initialOwner) {
        if (initialThreshold > 0 && initialThreshold <= MAX_SCORE) {
            maxRiskScoreThreshold = initialThreshold;
        }
    }

    function setStrategyManager(address _strategyManager) external onlyOwner {
        strategyManager = _strategyManager;
        emit StrategyManagerUpdated(_strategyManager);
    }

    function setRiskReporter(
        address reporter,
        bool authorized
    ) external onlyOwner {
        require(reporter != address(0), "Invalid reporter");
        isRiskReporter[reporter] = authorized;
        emit RiskReporterUpdated(reporter, authorized);
    }

    function setMaxRiskScoreThreshold(
        uint256 newThreshold
    ) external onlyOwner {
        require(newThreshold <= MAX_SCORE, "Invalid threshold");
        maxRiskScoreThreshold = newThreshold;
        emit MaxRiskScoreThresholdUpdated(newThreshold);
    }

    function setRiskWeights(
        uint256 _weightVolatility,
        uint256 _weightLiquidity,
        uint256 _weightProtocol,
        uint256 _weightWithdrawal
    ) external onlyOwner {
        require(
            _weightVolatility +
                _weightLiquidity +
                _weightProtocol +
                _weightWithdrawal ==
                100,
            "Weights must sum to 100"
        );

        weightVolatility = _weightVolatility;
        weightLiquidity = _weightLiquidity;
        weightProtocol = _weightProtocol;
        weightWithdrawal = _weightWithdrawal;

        emit RiskWeightsUpdated(
            _weightVolatility,
            _weightLiquidity,
            _weightProtocol,
            _weightWithdrawal
        );
    }

    function calculateRiskScore(
        uint256 volatilityRisk,
        uint256 liquidityRisk,
        uint256 protocolRisk,
        uint256 withdrawalRisk
    ) public view returns (uint256) {
        require(
            volatilityRisk <= MAX_SCORE &&
                liquidityRisk <= MAX_SCORE &&
                protocolRisk <= MAX_SCORE &&
                withdrawalRisk <= MAX_SCORE,
            "Component risk exceeds max"
        );

        uint256 weightedSum = (volatilityRisk * weightVolatility) +
            (liquidityRisk * weightLiquidity) +
            (protocolRisk * weightProtocol) +
            (withdrawalRisk * weightWithdrawal);

        return weightedSum / 100;
    }

    function updateRiskScore(
        address strategy,
        uint256 score
    ) public override onlyAuthorized {
        require(strategy != address(0), "Invalid strategy");
        require(score <= MAX_SCORE, "Score exceeds max");

        riskScores[strategy] = score;
        isScoreSet[strategy] = true;

        emit RiskScoreUpdated(strategy, score);
    }

    function updateRiskScoreFromComponents(
        address strategy,
        uint256 volatilityRisk,
        uint256 liquidityRisk,
        uint256 protocolRisk,
        uint256 withdrawalRisk
    ) external onlyAuthorized {
        uint256 calculatedScore = calculateRiskScore(
            volatilityRisk,
            liquidityRisk,
            protocolRisk,
            withdrawalRisk
        );
        updateRiskScore(strategy, calculatedScore);
    }

    function getRiskScore(
        address strategy
    ) external view override returns (uint256) {
        return riskScores[strategy];
    }

    function isStrategyEligible(
        address strategy
    ) public view override returns (bool) {
        if (strategy == address(0)) return false;

        // If score is set, must not exceed threshold
        if (isScoreSet[strategy] && riskScores[strategy] > maxRiskScoreThreshold) {
            return false;
        }

        // If strategyManager is configured, check registration and pause status
        if (strategyManager != address(0)) {
            IStrategyManagerMinimal sm = IStrategyManagerMinimal(strategyManager);
            if (!sm.isRegistered(strategy)) return false;
            if (sm.isStrategyPaused(strategy)) return false;
        }

        return true;
    }
}
