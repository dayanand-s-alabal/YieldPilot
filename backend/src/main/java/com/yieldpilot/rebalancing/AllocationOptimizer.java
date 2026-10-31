package com.yieldpilot.rebalancing;

import com.yieldpilot.entity.Strategy;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;

@Service
public class AllocationOptimizer {

    public static class StrategyAllocationPlan {
        private final Strategy strategy;
        private final double score;
        private double targetWeightPercent;
        private BigDecimal targetAmount;

        public StrategyAllocationPlan(Strategy strategy, double score, double targetWeightPercent, BigDecimal targetAmount) {
            this.strategy = strategy;
            this.score = score;
            this.targetWeightPercent = targetWeightPercent;
            this.targetAmount = targetAmount;
        }

        public Strategy getStrategy() {
            return strategy;
        }

        public double getScore() {
            return score;
        }

        public double getTargetWeightPercent() {
            return targetWeightPercent;
        }

        public void setTargetWeightPercent(double targetWeightPercent) {
            this.targetWeightPercent = targetWeightPercent;
        }

        public BigDecimal getTargetAmount() {
            return targetAmount;
        }

        public void setTargetAmount(BigDecimal targetAmount) {
            this.targetAmount = targetAmount;
        }
    }

    public static class OptimizationResult {
        private final boolean feasible;
        private final String message;
        private final List<StrategyAllocationPlan> plans;
        private final BigDecimal reserveAmount;

        public OptimizationResult(boolean feasible, String message, List<StrategyAllocationPlan> plans, BigDecimal reserveAmount) {
            this.feasible = feasible;
            this.message = message;
            this.plans = plans;
            this.reserveAmount = reserveAmount;
        }

        public boolean isFeasible() {
            return feasible;
        }

        public String getMessage() {
            return message;
        }

        public List<StrategyAllocationPlan> getPlans() {
            return plans;
        }

        public BigDecimal getReserveAmount() {
            return reserveAmount;
        }
    }

    /**
     * Backward-compatibility helper
     */
    public boolean isRebalanceNeeded(Double currentDeviation) {
        return currentDeviation != null && currentDeviation > 0.03;
    }

    /**
     * Performs iterative constrained allocation optimization.
     *
     * @param eligibleStrategies List of active eligible strategies
     * @param strategyScores Map of strategy ID to risk-adjusted score S_i
     * @param totalVaultAssets Total capital in vault V
     * @param minReservePercent Minimum percentage kept in vault as liquid reserve (e.g. 5.0%)
     * @return OptimizationResult
     */
    public OptimizationResult optimize(List<Strategy> eligibleStrategies,
                                       Map<Long, Double> strategyScores,
                                       BigDecimal totalVaultAssets,
                                       double minReservePercent) {

        if (eligibleStrategies == null || eligibleStrategies.isEmpty()) {
            return new OptimizationResult(false, "No eligible strategies available for allocation", List.of(), totalVaultAssets);
        }

        if (totalVaultAssets == null || totalVaultAssets.compareTo(BigDecimal.ZERO) <= 0) {
            return new OptimizationResult(false, "Vault has zero or negative assets to allocate", List.of(), BigDecimal.ZERO);
        }

        // Calculate available capital after minimum liquid reserve
        BigDecimal reserveRatio = BigDecimal.valueOf(Math.max(0.0, minReservePercent) / 100.0);
        BigDecimal reserveAmount = totalVaultAssets.multiply(reserveRatio).setScale(2, RoundingMode.HALF_UP);
        BigDecimal allocatableCapital = totalVaultAssets.subtract(reserveAmount);

        double totalScore = eligibleStrategies.stream()
                .mapToDouble(s -> strategyScores.getOrDefault(s.getId(), 0.0))
                .sum();

        if (totalScore <= 0.0) {
            return new OptimizationResult(false, "Total risk-adjusted scores of eligible strategies is zero", List.of(), totalVaultAssets);
        }

        // Initial unconstrained target amounts
        Map<Long, BigDecimal> targetAmounts = new HashMap<>();
        Set<Long> cappedStrategyIds = new HashSet<>();
        List<Strategy> remainingStrategies = new ArrayList<>(eligibleStrategies);
        BigDecimal remainingCapital = allocatableCapital;

        boolean redistributed;
        int maxIterations = eligibleStrategies.size() + 2;
        int iteration = 0;

        do {
            redistributed = false;
            iteration++;

            double remainingScoreSum = remainingStrategies.stream()
                    .mapToDouble(s -> strategyScores.getOrDefault(s.getId(), 0.0))
                    .sum();

            if (remainingScoreSum <= 0.0) {
                break;
            }

            for (Strategy s : new ArrayList<>(remainingStrategies)) {
                double proportionalWeight = strategyScores.getOrDefault(s.getId(), 0.0) / remainingScoreSum;
                BigDecimal proposedAmount = remainingCapital.multiply(BigDecimal.valueOf(proportionalWeight))
                        .setScale(2, RoundingMode.HALF_UP);

                // Maximum cap for this strategy
                double capPercent = s.getAllocationCapPercent() != null ? s.getAllocationCapPercent() : 40.0;
                BigDecimal maxCapAmount = totalVaultAssets.multiply(BigDecimal.valueOf(capPercent / 100.0))
                        .setScale(2, RoundingMode.HALF_UP);

                if (proposedAmount.compareTo(maxCapAmount) > 0) {
                    // Strategy exceeds cap -> clamp to cap and redistribute excess in next pass
                    targetAmounts.put(s.getId(), maxCapAmount);
                    cappedStrategyIds.add(s.getId());
                    remainingStrategies.remove(s);
                    remainingCapital = remainingCapital.subtract(maxCapAmount);
                    redistributed = true;
                    break;
                } else {
                    targetAmounts.put(s.getId(), proposedAmount);
                }
            }
        } while (redistributed && !remainingStrategies.isEmpty() && iteration < maxIterations);

        // Build plans
        List<StrategyAllocationPlan> plans = new ArrayList<>();
        BigDecimal totalAllocated = BigDecimal.ZERO;

        for (Strategy s : eligibleStrategies) {
            BigDecimal amount = targetAmounts.getOrDefault(s.getId(), BigDecimal.ZERO);
            totalAllocated = totalAllocated.add(amount);
            double weightPercent = totalVaultAssets.compareTo(BigDecimal.ZERO) > 0
                    ? amount.divide(totalVaultAssets, 4, RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100)).doubleValue()
                    : 0.0;

            plans.add(new StrategyAllocationPlan(s, strategyScores.getOrDefault(s.getId(), 0.0), weightPercent, amount));
        }

        BigDecimal finalReserve = totalVaultAssets.subtract(totalAllocated);
        return new OptimizationResult(true, "Constrained allocation optimized successfully", plans, finalReserve);
    }
}