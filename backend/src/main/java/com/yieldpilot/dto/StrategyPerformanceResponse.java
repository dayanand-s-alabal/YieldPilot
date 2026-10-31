package com.yieldpilot.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class StrategyPerformanceResponse {

    private Long strategyId;
    private String strategyName;
    private LocalDateTime periodStart;
    private LocalDateTime periodEnd;
    private BigDecimal currentApy;
    private BigDecimal averageApy;
    private BigDecimal minApy;
    private BigDecimal maxApy;
    private long totalObservations;

    public StrategyPerformanceResponse() {
    }

    public StrategyPerformanceResponse(Long strategyId, String strategyName, LocalDateTime periodStart,
                                       LocalDateTime periodEnd, BigDecimal currentApy, BigDecimal averageApy,
                                       BigDecimal minApy, BigDecimal maxApy, long totalObservations) {
        this.strategyId = strategyId;
        this.strategyName = strategyName;
        this.periodStart = periodStart;
        this.periodEnd = periodEnd;
        this.currentApy = currentApy;
        this.averageApy = averageApy;
        this.minApy = minApy;
        this.maxApy = maxApy;
        this.totalObservations = totalObservations;
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

    public LocalDateTime getPeriodStart() {
        return periodStart;
    }

    public void setPeriodStart(LocalDateTime periodStart) {
        this.periodStart = periodStart;
    }

    public LocalDateTime getPeriodEnd() {
        return periodEnd;
    }

    public void setPeriodEnd(LocalDateTime periodEnd) {
        this.periodEnd = periodEnd;
    }

    public BigDecimal getCurrentApy() {
        return currentApy;
    }

    public void setCurrentApy(BigDecimal currentApy) {
        this.currentApy = currentApy;
    }

    public BigDecimal getAverageApy() {
        return averageApy;
    }

    public void setAverageApy(BigDecimal averageApy) {
        this.averageApy = averageApy;
    }

    public BigDecimal getMinApy() {
        return minApy;
    }

    public void setMinApy(BigDecimal minApy) {
        this.minApy = minApy;
    }

    public BigDecimal getMaxApy() {
        return maxApy;
    }

    public void setMaxApy(BigDecimal maxApy) {
        this.maxApy = maxApy;
    }

    public long getTotalObservations() {
        return totalObservations;
    }

    public void setTotalObservations(long totalObservations) {
        this.totalObservations = totalObservations;
    }

    public static StrategyPerformanceResponseBuilder builder() {
        return new StrategyPerformanceResponseBuilder();
    }

    public static class StrategyPerformanceResponseBuilder {
        private Long strategyId;
        private String strategyName;
        private LocalDateTime periodStart;
        private LocalDateTime periodEnd;
        private BigDecimal currentApy;
        private BigDecimal averageApy;
        private BigDecimal minApy;
        private BigDecimal maxApy;
        private long totalObservations;

        StrategyPerformanceResponseBuilder() {
        }

        public StrategyPerformanceResponseBuilder strategyId(Long strategyId) {
            this.strategyId = strategyId;
            return this;
        }

        public StrategyPerformanceResponseBuilder strategyName(String strategyName) {
            this.strategyName = strategyName;
            return this;
        }

        public StrategyPerformanceResponseBuilder periodStart(LocalDateTime periodStart) {
            this.periodStart = periodStart;
            return this;
        }

        public StrategyPerformanceResponseBuilder periodEnd(LocalDateTime periodEnd) {
            this.periodEnd = periodEnd;
            return this;
        }

        public StrategyPerformanceResponseBuilder currentApy(BigDecimal currentApy) {
            this.currentApy = currentApy;
            return this;
        }

        public StrategyPerformanceResponseBuilder averageApy(BigDecimal averageApy) {
            this.averageApy = averageApy;
            return this;
        }

        public StrategyPerformanceResponseBuilder minApy(BigDecimal minApy) {
            this.minApy = minApy;
            return this;
        }

        public StrategyPerformanceResponseBuilder maxApy(BigDecimal maxApy) {
            this.maxApy = maxApy;
            return this;
        }

        public StrategyPerformanceResponseBuilder totalObservations(long totalObservations) {
            this.totalObservations = totalObservations;
            return this;
        }

        public StrategyPerformanceResponse build() {
            return new StrategyPerformanceResponse(strategyId, strategyName, periodStart, periodEnd, currentApy, averageApy, minApy, maxApy, totalObservations);
        }
    }
}
