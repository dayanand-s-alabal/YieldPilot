package com.yieldpilot.rebalancing;

import com.yieldpilot.dto.AllocationResponse;
import com.yieldpilot.dto.RebalanceRequest;
import com.yieldpilot.entity.Strategy;
import com.yieldpilot.entity.StrategySnapshot;
import com.yieldpilot.entity.Vault;
import com.yieldpilot.repository.StrategyRepository;
import com.yieldpilot.repository.StrategySnapshotRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.*;

@Service
public class RebalanceEvaluator {

    private static final Logger log = LoggerFactory.getLogger(RebalanceEvaluator.class);

    private final StrategyRepository strategyRepository;
    private final StrategySnapshotRepository snapshotRepository;
    private final RiskScoringService riskScoringService;
    private final AllocationOptimizer allocationOptimizer;
    private final RebalanceCostCalculator costCalculator;

    public RebalanceEvaluator(StrategyRepository strategyRepository,
                              StrategySnapshotRepository snapshotRepository,
                              RiskScoringService riskScoringService,
                              AllocationOptimizer allocationOptimizer,
                              RebalanceCostCalculator costCalculator) {
        this.strategyRepository = strategyRepository;
        this.snapshotRepository = snapshotRepository;
        this.riskScoringService = riskScoringService;
        this.allocationOptimizer = allocationOptimizer;
        this.costCalculator = costCalculator;
    }

    public static class EvaluationResult {
        private final boolean eligible;
        private final String recommendation; // REBALANCE, HOLD
        private final BigDecimal expectedNetBenefit;
        private final BigDecimal estimatedCost;
        private final String decisionReason;
        private final List<AllocationResponse> items;
        private final List<RebalanceCostCalculator.StrategyMovement> movements;

        public EvaluationResult(boolean eligible, String recommendation, BigDecimal expectedNetBenefit,
                                BigDecimal estimatedCost, String decisionReason,
                                List<AllocationResponse> items,
                                List<RebalanceCostCalculator.StrategyMovement> movements) {
            this.eligible = eligible;
            this.recommendation = recommendation;
            this.expectedNetBenefit = expectedNetBenefit;
            this.estimatedCost = estimatedCost;
            this.decisionReason = decisionReason;
            this.items = items;
            this.movements = movements;
        }

        public boolean isEligible() {
            return eligible;
        }

        public String getRecommendation() {
            return recommendation;
        }

        public BigDecimal getExpectedNetBenefit() {
            return expectedNetBenefit;
        }

        public BigDecimal getEstimatedCost() {
            return estimatedCost;
        }

        public String getDecisionReason() {
            return decisionReason;
        }

        public List<AllocationResponse> getItems() {
            return items;
        }

        public List<RebalanceCostCalculator.StrategyMovement> getMovements() {
            return movements;
        }
    }

    /**
     * Backward-compatibility helper
     */
    public String evaluateAction(Double expectedBenefit, Double gasCost) {
        if (expectedBenefit == null || gasCost == null) return "HOLD";
        return expectedBenefit > gasCost ? "PROCEED" : "HOLD";
    }

    public EvaluationResult evaluateVault(Vault vault, RebalanceRequest request) {
        if (request == null) {
            request = new RebalanceRequest();
        }

        List<Strategy> allStrategies = strategyRepository.findAll();
        List<Strategy> eligibleStrategies = new ArrayList<>();
        Map<Long, Double> scores = new HashMap<>();
        List<String> exclusionReasons = new ArrayList<>();

        LocalDateTime staleThreshold = LocalDateTime.now().minusHours(24); // max observation age

        for (Strategy s : allStrategies) {
            if (!s.isActive()) {
                exclusionReasons.add(s.getName() + " is inactive");
                continue;
            }
            if (s.getRiskScore() > request.getMaxRiskScore()) {
                exclusionReasons.add(s.getName() + " risk score (" + s.getRiskScore() + ") exceeds maximum limit (" + request.getMaxRiskScore() + ")");
                continue;
            }
            if (s.getAllocationCapPercent() <= 0.0) {
                exclusionReasons.add(s.getName() + " has zero allocation cap");
                continue;
            }

            // Freshness check
            Optional<StrategySnapshot> latestSnapshot = snapshotRepository.findTopByStrategyIdOrderByRecordedAtDesc(s.getId());
            if (latestSnapshot.isPresent()) {
                if (latestSnapshot.get().getRecordedAt().isBefore(staleThreshold)) {
                    exclusionReasons.add(s.getName() + " snapshot observation is stale (older than 24 hours)");
                    continue;
                }
            }

            double apy = s.getCurrentApy() != null ? s.getCurrentApy() : 0.0;
            double score = riskScoringService.calculateScore(apy, s.getRiskScore(), request.getRiskAversion());
            scores.put(s.getId(), score);
            eligibleStrategies.add(s);
        }

        if (eligibleStrategies.isEmpty()) {
            String reason = "No strategies eligible for allocation: " + String.join("; ", exclusionReasons);
            return new EvaluationResult(false, "HOLD", BigDecimal.ZERO, BigDecimal.ZERO, reason, List.of(), List.of());
        }

        BigDecimal totalAssets = vault != null && vault.getTotalAssets() != null && vault.getTotalAssets().compareTo(BigDecimal.ZERO) > 0
                ? vault.getTotalAssets()
                : BigDecimal.valueOf(100000.0);

        // Run constrained allocation optimizer (keep 5% liquid reserve)
        AllocationOptimizer.OptimizationResult optResult = allocationOptimizer.optimize(
                eligibleStrategies, scores, totalAssets, 5.0);

        if (!optResult.isFeasible()) {
            return new EvaluationResult(false, "HOLD", BigDecimal.ZERO, BigDecimal.ZERO,
                    "Optimization infeasible: " + optResult.getMessage(), List.of(), List.of());
        }

        // Calculate movements
        List<RebalanceCostCalculator.StrategyMovement> movements = new ArrayList<>();
        List<AllocationResponse> itemResponses = new ArrayList<>();

        for (AllocationOptimizer.StrategyAllocationPlan plan : optResult.getPlans()) {
            Strategy s = plan.getStrategy();
            BigDecimal currentAmount = totalAssets.multiply(BigDecimal.valueOf(s.getAllocationPercentage() / 100.0))
                    .setScale(2, RoundingMode.HALF_UP);
            BigDecimal targetAmount = plan.getTargetAmount();
            BigDecimal diff = targetAmount.subtract(currentAmount);

            String direction;
            BigDecimal moveAmount = diff.abs();

            if (diff.compareTo(BigDecimal.valueOf(1.0)) > 0) {
                direction = "DEPOSIT";
            } else if (diff.compareTo(BigDecimal.valueOf(-1.0)) < 0) {
                direction = "WITHDRAW";
            } else {
                direction = "HOLD";
                moveAmount = BigDecimal.ZERO;
            }

            RebalanceCostCalculator.StrategyMovement movement = new RebalanceCostCalculator.StrategyMovement(
                    s.getId(), s.getName(), s.getCurrentApy(), currentAmount, targetAmount, moveAmount, direction);
            movements.add(movement);

            AllocationResponse item = AllocationResponse.builder()
                    .strategyId(s.getId())
                    .strategyName(s.getName())
                    .currentApy(s.getCurrentApy())
                    .riskScore(s.getRiskScore())
                    .riskAdjustedScore(plan.getScore())
                    .currentAllocationPercent(s.getAllocationPercentage())
                    .targetAllocationPercent(plan.getTargetWeightPercent())
                    .currentAllocationAmount(currentAmount)
                    .targetAllocationAmount(targetAmount)
                    .amountToMove(moveAmount)
                    .movementDirection(direction)
                    .build();
            itemResponses.add(item);
        }

        // Perform cost-benefit analysis
        RebalanceCostCalculator.CostBenefitAnalysis analysis = costCalculator.evaluate(
                movements, totalAssets, request.getEvaluationHorizonDays(), request.getMinDriftThresholdPercent());

        String recommendation = analysis.isWorthwhile() ? "REBALANCE" : "HOLD";

        return new EvaluationResult(true, recommendation, analysis.getExpectedNetBenefit(),
                analysis.getEstimatedTransactionCost(), analysis.getDecisionReason(), itemResponses, movements);
    }
}