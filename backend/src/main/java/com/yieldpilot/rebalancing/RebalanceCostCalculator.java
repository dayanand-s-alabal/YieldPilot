package com.yieldpilot.rebalancing;

import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

@Service
public class RebalanceCostCalculator {

    public static class CostBenefitAnalysis {
        private final BigDecimal totalTurnover;
        private final double driftPercentage;
        private final BigDecimal estimatedTransactionCost;
        private final BigDecimal additionalAnnualYield;
        private final BigDecimal expectedHorizonYield;
        private final BigDecimal expectedNetBenefit;
        private final boolean worthwhile;
        private final String decisionReason;

        public CostBenefitAnalysis(BigDecimal totalTurnover, double driftPercentage,
                                   BigDecimal estimatedTransactionCost, BigDecimal additionalAnnualYield,
                                   BigDecimal expectedHorizonYield, BigDecimal expectedNetBenefit,
                                   boolean worthwhile, String decisionReason) {
            this.totalTurnover = totalTurnover;
            this.driftPercentage = driftPercentage;
            this.estimatedTransactionCost = estimatedTransactionCost;
            this.additionalAnnualYield = additionalAnnualYield;
            this.expectedHorizonYield = expectedHorizonYield;
            this.expectedNetBenefit = expectedNetBenefit;
            this.worthwhile = worthwhile;
            this.decisionReason = decisionReason;
        }

        public BigDecimal getTotalTurnover() {
            return totalTurnover;
        }

        public double getDriftPercentage() {
            return driftPercentage;
        }

        public BigDecimal getEstimatedTransactionCost() {
            return estimatedTransactionCost;
        }

        public BigDecimal getAdditionalAnnualYield() {
            return additionalAnnualYield;
        }

        public BigDecimal getExpectedHorizonYield() {
            return expectedHorizonYield;
        }

        public BigDecimal getExpectedNetBenefit() {
            return expectedNetBenefit;
        }

        public boolean isWorthwhile() {
            return worthwhile;
        }

        public String getDecisionReason() {
            return decisionReason;
        }
    }

    public static class StrategyMovement {
        private final Long strategyId;
        private final String strategyName;
        private final double apy;
        private final BigDecimal currentAmount;
        private final BigDecimal targetAmount;
        private final BigDecimal amountToMove;
        private final String direction;

        public StrategyMovement(Long strategyId, String strategyName, double apy,
                                BigDecimal currentAmount, BigDecimal targetAmount,
                                BigDecimal amountToMove, String direction) {
            this.strategyId = strategyId;
            this.strategyName = strategyName;
            this.apy = apy;
            this.currentAmount = currentAmount;
            this.targetAmount = targetAmount;
            this.amountToMove = amountToMove;
            this.direction = direction;
        }

        public Long getStrategyId() {
            return strategyId;
        }

        public String getStrategyName() {
            return strategyName;
        }

        public double getApy() {
            return apy;
        }

        public BigDecimal getCurrentAmount() {
            return currentAmount;
        }

        public BigDecimal getTargetAmount() {
            return targetAmount;
        }

        public BigDecimal getAmountToMove() {
            return amountToMove;
        }

        public String getDirection() {
            return direction;
        }
    }

    public CostBenefitAnalysis evaluate(List<StrategyMovement> movements,
                                        BigDecimal totalAssets,
                                        int horizonDays,
                                        double minDriftThresholdPercent) {

        if (totalAssets == null || totalAssets.compareTo(BigDecimal.ZERO) <= 0) {
            return new CostBenefitAnalysis(BigDecimal.ZERO, 0.0, BigDecimal.ZERO, BigDecimal.ZERO,
                    BigDecimal.ZERO, BigDecimal.ZERO, false, "Vault has no assets to rebalance.");
        }

        BigDecimal totalGrossMovement = BigDecimal.ZERO;
        int movementLegCount = 0;
        BigDecimal currentAnnualYield = BigDecimal.ZERO;
        BigDecimal targetAnnualYield = BigDecimal.ZERO;

        for (StrategyMovement m : movements) {
            BigDecimal apyFactor = BigDecimal.valueOf(m.getApy() / 100.0);
            currentAnnualYield = currentAnnualYield.add(m.getCurrentAmount().multiply(apyFactor));
            targetAnnualYield = targetAnnualYield.add(m.getTargetAmount().multiply(apyFactor));

            if (!"HOLD".equalsIgnoreCase(m.getDirection()) && m.getAmountToMove().compareTo(BigDecimal.valueOf(1.0)) > 0) {
                totalGrossMovement = totalGrossMovement.add(m.getAmountToMove());
                movementLegCount++;
            }
        }

        // Turnover is half of gross movements (rebalancing transfers from source to target)
        BigDecimal totalTurnover = totalGrossMovement.divide(BigDecimal.valueOf(2), 2, RoundingMode.HALF_UP);
        double driftPercentage = totalAssets.compareTo(BigDecimal.ZERO) > 0
                ? totalTurnover.divide(totalAssets, 4, RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100)).doubleValue()
                : 0.0;

        // Base gas/tx cost per leg ($5 per leg) + slippage / AMM fee (0.05% of turnover)
        BigDecimal baseLegCost = BigDecimal.valueOf(movementLegCount * 5.0);
        BigDecimal slippageCost = totalTurnover.multiply(BigDecimal.valueOf(0.0005));
        BigDecimal estimatedCost = baseLegCost.add(slippageCost).setScale(2, RoundingMode.HALF_UP);

        // Additional annual yield
        BigDecimal additionalAnnualYield = targetAnnualYield.subtract(currentAnnualYield).setScale(2, RoundingMode.HALF_UP);

        // Yield over horizon: AdditionalAnnualYield * (horizonDays / 365)
        BigDecimal horizonRatio = BigDecimal.valueOf((double) horizonDays / 365.0);
        BigDecimal expectedHorizonYield = additionalAnnualYield.multiply(horizonRatio).setScale(2, RoundingMode.HALF_UP);

        // Net benefit = ExpectedHorizonYield - EstimatedCost
        BigDecimal netBenefit = expectedHorizonYield.subtract(estimatedCost).setScale(2, RoundingMode.HALF_UP);

        boolean driftExceeded = driftPercentage >= minDriftThresholdPercent;
        boolean worthwhile = netBenefit.compareTo(BigDecimal.ZERO) > 0 && driftExceeded;

        String decisionReason;
        if (movementLegCount == 0 || totalTurnover.compareTo(BigDecimal.ZERO) == 0) {
            decisionReason = "Current allocations match target weights. No movements required.";
        } else if (!driftExceeded) {
            decisionReason = String.format("Allocation drift (%.2f%%) is below the minimum threshold (%.2f%%). Rebalance held to prevent unnecessary churn.",
                    driftPercentage, minDriftThresholdPercent);
        } else if (netBenefit.compareTo(BigDecimal.ZERO) <= 0) {
            decisionReason = String.format("Estimated cost ($%s) exceeds %d-day expected yield ($%s), resulting in net negative benefit ($%s). Rebalance not recommended.",
                    estimatedCost, horizonDays, expectedHorizonYield, netBenefit);
        } else {
            decisionReason = String.format("Rebalance recommended: Expected %d-day additional yield of $%s exceeds estimated execution cost of $%s (Net Benefit: +$%s). Allocation drift: %.2f%%.",
                    horizonDays, expectedHorizonYield, estimatedCost, netBenefit, driftPercentage);
        }

        return new CostBenefitAnalysis(totalTurnover, driftPercentage, estimatedCost, additionalAnnualYield,
                expectedHorizonYield, netBenefit, worthwhile, decisionReason);
    }
}
