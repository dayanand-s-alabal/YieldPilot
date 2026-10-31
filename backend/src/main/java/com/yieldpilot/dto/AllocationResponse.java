package com.yieldpilot.dto;

import java.math.BigDecimal;

public class AllocationResponse {

    private Long strategyId;
    private String strategyName;
    private Double currentApy;
    private Integer riskScore;
    private Double riskAdjustedScore;
    private Double currentAllocationPercent;
    private Double targetAllocationPercent;
    private BigDecimal currentAllocationAmount;
    private BigDecimal targetAllocationAmount;
    private BigDecimal amountToMove;
    private String movementDirection;

    public AllocationResponse() {
    }

    public AllocationResponse(Long strategyId, String strategyName, Double currentApy, Integer riskScore,
                              Double riskAdjustedScore, Double currentAllocationPercent, Double targetAllocationPercent,
                              BigDecimal currentAllocationAmount, BigDecimal targetAllocationAmount,
                              BigDecimal amountToMove, String movementDirection) {
        this.strategyId = strategyId;
        this.strategyName = strategyName;
        this.currentApy = currentApy;
        this.riskScore = riskScore;
        this.riskAdjustedScore = riskAdjustedScore;
        this.currentAllocationPercent = currentAllocationPercent;
        this.targetAllocationPercent = targetAllocationPercent;
        this.currentAllocationAmount = currentAllocationAmount;
        this.targetAllocationAmount = targetAllocationAmount;
        this.amountToMove = amountToMove;
        this.movementDirection = movementDirection;
    }

    public Long getStrategyId() {
        return strategyId;
    }

    public void setStrategyId(Long strategyId) {
        this.strategyId = strategyId;
    }

    public String getStrategyName() {
        return strategyName;
    }

    public void setStrategyName(String strategyName) {
        this.strategyName = strategyName;
    }

    public Double getCurrentApy() {
        return currentApy;
    }

    public void setCurrentApy(Double currentApy) {
        this.currentApy = currentApy;
    }

    public Integer getRiskScore() {
        return riskScore;
    }

    public void setRiskScore(Integer riskScore) {
        this.riskScore = riskScore;
    }

    public Double getRiskAdjustedScore() {
        return riskAdjustedScore;
    }

    public void setRiskAdjustedScore(Double riskAdjustedScore) {
        this.riskAdjustedScore = riskAdjustedScore;
    }

    public Double getCurrentAllocationPercent() {
        return currentAllocationPercent;
    }

    public void setCurrentAllocationPercent(Double currentAllocationPercent) {
        this.currentAllocationPercent = currentAllocationPercent;
    }

    public Double getTargetAllocationPercent() {
        return targetAllocationPercent;
    }

    public void setTargetAllocationPercent(Double targetAllocationPercent) {
        this.targetAllocationPercent = targetAllocationPercent;
    }

    public BigDecimal getCurrentAllocationAmount() {
        return currentAllocationAmount;
    }

    public void setCurrentAllocationAmount(BigDecimal currentAllocationAmount) {
        this.currentAllocationAmount = currentAllocationAmount;
    }

    public BigDecimal getTargetAllocationAmount() {
        return targetAllocationAmount;
    }

    public void setTargetAllocationAmount(BigDecimal targetAllocationAmount) {
        this.targetAllocationAmount = targetAllocationAmount;
    }

    public BigDecimal getAmountToMove() {
        return amountToMove;
    }

    public void setAmountToMove(BigDecimal amountToMove) {
        this.amountToMove = amountToMove;
    }

    public String getMovementDirection() {
        return movementDirection;
    }

    public void setMovementDirection(String movementDirection) {
        this.movementDirection = movementDirection;
    }

    public static AllocationResponseBuilder builder() {
        return new AllocationResponseBuilder();
    }

    public static class AllocationResponseBuilder {
        private Long strategyId;
        private String strategyName;
        private Double currentApy;
        private Integer riskScore;
        private Double riskAdjustedScore;
        private Double currentAllocationPercent;
        private Double targetAllocationPercent;
        private BigDecimal currentAllocationAmount;
        private BigDecimal targetAllocationAmount;
        private BigDecimal amountToMove;
        private String movementDirection;

        AllocationResponseBuilder() {
        }

        public AllocationResponseBuilder strategyId(Long strategyId) {
            this.strategyId = strategyId;
            return this;
        }

        public AllocationResponseBuilder strategyName(String strategyName) {
            this.strategyName = strategyName;
            return this;
        }

        public AllocationResponseBuilder currentApy(Double currentApy) {
            this.currentApy = currentApy;
            return this;
        }

        public AllocationResponseBuilder riskScore(Integer riskScore) {
            this.riskScore = riskScore;
            return this;
        }

        public AllocationResponseBuilder riskAdjustedScore(Double riskAdjustedScore) {
            this.riskAdjustedScore = riskAdjustedScore;
            return this;
        }

        public AllocationResponseBuilder currentAllocationPercent(Double currentAllocationPercent) {
            this.currentAllocationPercent = currentAllocationPercent;
            return this;
        }

        public AllocationResponseBuilder targetAllocationPercent(Double targetAllocationPercent) {
            this.targetAllocationPercent = targetAllocationPercent;
            return this;
        }

        public AllocationResponseBuilder currentAllocationAmount(BigDecimal currentAllocationAmount) {
            this.currentAllocationAmount = currentAllocationAmount;
            return this;
        }

        public AllocationResponseBuilder targetAllocationAmount(BigDecimal targetAllocationAmount) {
            this.targetAllocationAmount = targetAllocationAmount;
            return this;
        }

        public AllocationResponseBuilder amountToMove(BigDecimal amountToMove) {
            this.amountToMove = amountToMove;
            return this;
        }

        public AllocationResponseBuilder movementDirection(String movementDirection) {
            this.movementDirection = movementDirection;
            return this;
        }

        public AllocationResponse build() {
            return new AllocationResponse(strategyId, strategyName, currentApy, riskScore, riskAdjustedScore,
                    currentAllocationPercent, targetAllocationPercent, currentAllocationAmount,
                    targetAllocationAmount, amountToMove, movementDirection);
        }
    }
}
