package com.yieldpilot.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class SnapshotResponse {

    private Long id;
    private Long strategyId;
    private String strategyName;
    private BigDecimal apy;
    private Integer riskScore;
    private BigDecimal availableLiquidity;
    private BigDecimal totalAllocated;
    private LocalDateTime recordedAt;

    public SnapshotResponse() {
    }

    public SnapshotResponse(Long id, Long strategyId, String strategyName, BigDecimal apy,
                            Integer riskScore, BigDecimal availableLiquidity, BigDecimal totalAllocated,
                            LocalDateTime recordedAt) {
        this.id = id;
        this.strategyId = strategyId;
        this.strategyName = strategyName;
        this.apy = apy;
        this.riskScore = riskScore;
        this.availableLiquidity = availableLiquidity;
        this.totalAllocated = totalAllocated;
        this.recordedAt = recordedAt;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
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

    public BigDecimal getApy() {
        return apy;
    }

    public void setApy(BigDecimal apy) {
        this.apy = apy;
    }

    public Integer getRiskScore() {
        return riskScore;
    }

    public void setRiskScore(Integer riskScore) {
        this.riskScore = riskScore;
    }

    public BigDecimal getAvailableLiquidity() {
        return availableLiquidity;
    }

    public void setAvailableLiquidity(BigDecimal availableLiquidity) {
        this.availableLiquidity = availableLiquidity;
    }

    public BigDecimal getTotalAllocated() {
        return totalAllocated;
    }

    public void setTotalAllocated(BigDecimal totalAllocated) {
        this.totalAllocated = totalAllocated;
    }

    public LocalDateTime getRecordedAt() {
        return recordedAt;
    }

    public void setRecordedAt(LocalDateTime recordedAt) {
        this.recordedAt = recordedAt;
    }

    public static SnapshotResponseBuilder builder() {
        return new SnapshotResponseBuilder();
    }

    public static class SnapshotResponseBuilder {
        private Long id;
        private Long strategyId;
        private String strategyName;
        private BigDecimal apy;
        private Integer riskScore;
        private BigDecimal availableLiquidity;
        private BigDecimal totalAllocated;
        private LocalDateTime recordedAt;

        SnapshotResponseBuilder() {
        }

        public SnapshotResponseBuilder id(Long id) {
            this.id = id;
            return this;
        }

        public SnapshotResponseBuilder strategyId(Long strategyId) {
            this.strategyId = strategyId;
            return this;
        }

        public SnapshotResponseBuilder strategyName(String strategyName) {
            this.strategyName = strategyName;
            return this;
        }

        public SnapshotResponseBuilder apy(BigDecimal apy) {
            this.apy = apy;
            return this;
        }

        public SnapshotResponseBuilder riskScore(Integer riskScore) {
            this.riskScore = riskScore;
            return this;
        }

        public SnapshotResponseBuilder availableLiquidity(BigDecimal availableLiquidity) {
            this.availableLiquidity = availableLiquidity;
            return this;
        }

        public SnapshotResponseBuilder totalAllocated(BigDecimal totalAllocated) {
            this.totalAllocated = totalAllocated;
            return this;
        }

        public SnapshotResponseBuilder recordedAt(LocalDateTime recordedAt) {
            this.recordedAt = recordedAt;
            return this;
        }

        public SnapshotResponse build() {
            return new SnapshotResponse(id, strategyId, strategyName, apy, riskScore, availableLiquidity, totalAllocated, recordedAt);
        }
    }
}
