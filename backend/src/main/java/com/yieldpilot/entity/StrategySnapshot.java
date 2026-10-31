package com.yieldpilot.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "strategy_snapshots")
public class StrategySnapshot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "strategy_id", nullable = false)
    @JsonIgnore
    private Strategy strategy;

    @Column(name = "strategy_id", insertable = false, updatable = false)
    private Long strategyId;

    @Column(nullable = false, precision = 10, scale = 4)
    private BigDecimal apy;

    @Column(name = "risk_score", nullable = false)
    private Integer riskScore;

    @Column(name = "available_liquidity", nullable = false, precision = 38, scale = 18)
    private BigDecimal availableLiquidity;

    @Column(name = "total_allocated", nullable = false, precision = 38, scale = 18)
    private BigDecimal totalAllocated;

    @Column(name = "recorded_at", nullable = false)
    private LocalDateTime recordedAt;

    public StrategySnapshot() {
    }

    public StrategySnapshot(Long id, Strategy strategy, BigDecimal apy, Integer riskScore,
                            BigDecimal availableLiquidity, BigDecimal totalAllocated, LocalDateTime recordedAt) {
        this.id = id;
        this.strategy = strategy;
        this.strategyId = strategy != null ? strategy.getId() : null;
        this.apy = apy;
        this.riskScore = riskScore;
        this.availableLiquidity = availableLiquidity;
        this.totalAllocated = totalAllocated;
        this.recordedAt = recordedAt != null ? recordedAt : LocalDateTime.now();
    }

    public StrategySnapshot(Long id, Long strategyId, Double apy, LocalDateTime recordedAt) {
        this.id = id;
        this.strategyId = strategyId;
        this.apy = apy != null ? BigDecimal.valueOf(apy) : BigDecimal.ZERO;
        this.riskScore = 2;
        this.availableLiquidity = BigDecimal.ZERO;
        this.totalAllocated = BigDecimal.ZERO;
        this.recordedAt = recordedAt != null ? recordedAt : LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Strategy getStrategy() {
        return strategy;
    }

    public void setStrategy(Strategy strategy) {
        this.strategy = strategy;
        if (strategy != null) {
            this.strategyId = strategy.getId();
        }
    }

    public Long getStrategyId() {
        if (strategyId != null) return strategyId;
        return strategy != null ? strategy.getId() : null;
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

    // Backward compatibility for timestamp
    public LocalDateTime getTimestamp() {
        return recordedAt;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.recordedAt = timestamp;
    }

    public static StrategySnapshotBuilder builder() {
        return new StrategySnapshotBuilder();
    }

    public static class StrategySnapshotBuilder {
        private Long id;
        private Strategy strategy;
        private Long strategyId;
        private BigDecimal apy;
        private Integer riskScore = 2;
        private BigDecimal availableLiquidity = BigDecimal.ZERO;
        private BigDecimal totalAllocated = BigDecimal.ZERO;
        private LocalDateTime recordedAt = LocalDateTime.now();

        StrategySnapshotBuilder() {
        }

        public StrategySnapshotBuilder id(Long id) {
            this.id = id;
            return this;
        }

        public StrategySnapshotBuilder strategy(Strategy strategy) {
            this.strategy = strategy;
            if (strategy != null) {
                this.strategyId = strategy.getId();
            }
            return this;
        }

        public StrategySnapshotBuilder strategyId(Long strategyId) {
            this.strategyId = strategyId;
            return this;
        }

        public StrategySnapshotBuilder apy(BigDecimal apy) {
            this.apy = apy;
            return this;
        }

        public StrategySnapshotBuilder apy(Double apy) {
            this.apy = apy != null ? BigDecimal.valueOf(apy) : BigDecimal.ZERO;
            return this;
        }

        public StrategySnapshotBuilder riskScore(Integer riskScore) {
            this.riskScore = riskScore;
            return this;
        }

        public StrategySnapshotBuilder availableLiquidity(BigDecimal availableLiquidity) {
            this.availableLiquidity = availableLiquidity;
            return this;
        }

        public StrategySnapshotBuilder availableLiquidity(Double availableLiquidity) {
            this.availableLiquidity = availableLiquidity != null ? BigDecimal.valueOf(availableLiquidity) : BigDecimal.ZERO;
            return this;
        }

        public StrategySnapshotBuilder totalAllocated(BigDecimal totalAllocated) {
            this.totalAllocated = totalAllocated;
            return this;
        }

        public StrategySnapshotBuilder totalAllocated(Double totalAllocated) {
            this.totalAllocated = totalAllocated != null ? BigDecimal.valueOf(totalAllocated) : BigDecimal.ZERO;
            return this;
        }

        public StrategySnapshotBuilder recordedAt(LocalDateTime recordedAt) {
            this.recordedAt = recordedAt;
            return this;
        }

        public StrategySnapshotBuilder timestamp(LocalDateTime timestamp) {
            this.recordedAt = timestamp;
            return this;
        }

        public StrategySnapshot build() {
            StrategySnapshot snapshot = new StrategySnapshot(id, strategy, apy, riskScore, availableLiquidity, totalAllocated, recordedAt);
            if (strategyId != null && snapshot.getStrategyId() == null) {
                snapshot.setStrategyId(strategyId);
            }
            return snapshot;
        }
    }
}