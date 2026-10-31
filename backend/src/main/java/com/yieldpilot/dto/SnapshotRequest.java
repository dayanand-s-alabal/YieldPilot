package com.yieldpilot.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public class SnapshotRequest {

    private Long strategyId;

    @NotNull(message = "APY is required")
    @DecimalMin(value = "0.0", message = "APY cannot be negative")
    private BigDecimal apy;

    @NotNull(message = "Risk score is required")
    @Min(value = 1, message = "Risk score must be between 1 and 5")
    @Max(value = 5, message = "Risk score must be between 1 and 5")
    private Integer riskScore;

    @NotNull(message = "Available liquidity is required")
    @DecimalMin(value = "0.0", message = "Available liquidity cannot be negative")
    private BigDecimal availableLiquidity;

    @DecimalMin(value = "0.0", message = "Total allocated cannot be negative")
    private BigDecimal totalAllocated = BigDecimal.ZERO;

    private LocalDateTime recordedAt;

    public SnapshotRequest() {
    }

    public SnapshotRequest(Long strategyId, BigDecimal apy, Integer riskScore,
                           BigDecimal availableLiquidity, BigDecimal totalAllocated, LocalDateTime recordedAt) {
        this.strategyId = strategyId;
        this.apy = apy;
        this.riskScore = riskScore;
        this.availableLiquidity = availableLiquidity;
        this.totalAllocated = totalAllocated != null ? totalAllocated : BigDecimal.ZERO;
        this.recordedAt = recordedAt;
    }

    public Long getStrategyId() {
        return strategyId;
    }

    public void setStrategyId(Long strategyId) {
        this.strategyId = strategyId;
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
        return totalAllocated != null ? totalAllocated : BigDecimal.ZERO;
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
}
