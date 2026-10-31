package com.yieldpilot.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "strategies")
public class Strategy {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String name;

    @Column(name = "strategy_type")
    private String strategyType;

    @Column(name = "risk_score")
    private Integer riskScore;

    @Column(name = "risk_level")
    private String riskLevel; // Low Risk, Balanced, High Yield

    @Column(name = "current_apy")
    private Double currentApy;

    @Column(name = "allocation_percentage")
    private Double allocationPercentage;

    @Column(name = "allocation_cap_percent")
    private Double allocationCapPercent;

    @Column(name = "liquidity_available")
    private Double liquidityAvailable;

    @Column(name = "status")
    private String status; // Active, Paused

    @Column(name = "active")
    private Boolean active;

    public Strategy() {
    }

    public Strategy(Long id, String name, String strategyType, Integer riskScore, String riskLevel,
                    Double currentApy, Double allocationPercentage, Double allocationCapPercent,
                    Double liquidityAvailable, String status, Boolean active) {
        this.id = id;
        this.name = name;
        this.strategyType = strategyType != null ? strategyType : "Yield";
        this.riskScore = riskScore != null ? riskScore : defaultRiskScore(riskLevel);
        this.riskLevel = riskLevel != null ? riskLevel : defaultRiskLevel(riskScore);
        this.currentApy = currentApy != null ? currentApy : 0.0;
        this.allocationPercentage = allocationPercentage != null ? allocationPercentage : 0.0;
        this.allocationCapPercent = allocationCapPercent != null ? allocationCapPercent : 40.0;
        this.liquidityAvailable = liquidityAvailable != null ? liquidityAvailable : 0.0;
        this.active = active != null ? active : ("Active".equalsIgnoreCase(status) || status == null);
        this.status = status != null ? status : (this.active ? "Active" : "Paused");
    }

    public Strategy(Long id, String name, String riskLevel, Double currentApy, Double allocationPercentage, Double liquidityAvailable, String status) {
        this(id, name, "Yield", defaultRiskScore(riskLevel), riskLevel, currentApy, allocationPercentage, 40.0, liquidityAvailable, status, "Active".equalsIgnoreCase(status));
    }

    private static int defaultRiskScore(String riskLevel) {
        if (riskLevel == null) return 2;
        return switch (riskLevel.toLowerCase()) {
            case "low risk", "low" -> 1;
            case "balanced", "medium" -> 2;
            case "high yield", "high" -> 4;
            default -> 2;
        };
    }

    private static String defaultRiskLevel(Integer score) {
        if (score == null) return "Balanced";
        if (score <= 1) return "Low Risk";
        if (score <= 3) return "Balanced";
        return "High Yield";
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getStrategyType() {
        return strategyType != null ? strategyType : "Yield";
    }

    public void setStrategyType(String strategyType) {
        this.strategyType = strategyType;
    }

    public Integer getRiskScore() {
        if (riskScore != null) return riskScore;
        return defaultRiskScore(riskLevel);
    }

    public void setRiskScore(Integer riskScore) {
        this.riskScore = riskScore;
        if (this.riskLevel == null && riskScore != null) {
            this.riskLevel = defaultRiskLevel(riskScore);
        }
    }

    public String getRiskLevel() {
        if (riskLevel != null) return riskLevel;
        return defaultRiskLevel(riskScore);
    }

    public void setRiskLevel(String riskLevel) {
        this.riskLevel = riskLevel;
        if (this.riskScore == null && riskLevel != null) {
            this.riskScore = defaultRiskScore(riskLevel);
        }
    }

    public Double getCurrentApy() {
        return currentApy;
    }

    public void setCurrentApy(Double currentApy) {
        this.currentApy = currentApy;
    }

    public Double getAllocationPercentage() {
        return allocationPercentage;
    }

    public void setAllocationPercentage(Double allocationPercentage) {
        this.allocationPercentage = allocationPercentage;
    }

    public Double getAllocationCapPercent() {
        return allocationCapPercent != null ? allocationCapPercent : 40.0;
    }

    public void setAllocationCapPercent(Double allocationCapPercent) {
        this.allocationCapPercent = allocationCapPercent;
    }

    public Double getLiquidityAvailable() {
        return liquidityAvailable;
    }

    public void setLiquidityAvailable(Double liquidityAvailable) {
        this.liquidityAvailable = liquidityAvailable;
    }

    public String getStatus() {
        if (status != null) return status;
        return Boolean.TRUE.equals(active) ? "Active" : "Paused";
    }

    public void setStatus(String status) {
        this.status = status;
        this.active = "Active".equalsIgnoreCase(status);
    }

    public Boolean getActive() {
        if (active != null) return active;
        return "Active".equalsIgnoreCase(status);
    }

    public void setActive(Boolean active) {
        this.active = active;
        this.status = Boolean.TRUE.equals(active) ? "Active" : "Paused";
    }

    public boolean isActive() {
        return Boolean.TRUE.equals(getActive());
    }

    public static StrategyBuilder builder() {
        return new StrategyBuilder();
    }

    public static class StrategyBuilder {
        private Long id;
        private String name;
        private String strategyType = "Yield";
        private Integer riskScore;
        private String riskLevel;
        private Double currentApy = 0.0;
        private Double allocationPercentage = 0.0;
        private Double allocationCapPercent = 40.0;
        private Double liquidityAvailable = 0.0;
        private String status = "Active";
        private Boolean active = true;

        StrategyBuilder() {
        }

        public StrategyBuilder id(Long id) {
            this.id = id;
            return this;
        }

        public StrategyBuilder name(String name) {
            this.name = name;
            return this;
        }

        public StrategyBuilder strategyType(String strategyType) {
            this.strategyType = strategyType;
            return this;
        }

        public StrategyBuilder riskScore(Integer riskScore) {
            this.riskScore = riskScore;
            return this;
        }

        public StrategyBuilder riskLevel(String riskLevel) {
            this.riskLevel = riskLevel;
            return this;
        }

        public StrategyBuilder currentApy(Double currentApy) {
            this.currentApy = currentApy;
            return this;
        }

        public StrategyBuilder allocationPercentage(Double allocationPercentage) {
            this.allocationPercentage = allocationPercentage;
            return this;
        }

        public StrategyBuilder allocationCapPercent(Double allocationCapPercent) {
            this.allocationCapPercent = allocationCapPercent;
            return this;
        }

        public StrategyBuilder liquidityAvailable(Double liquidityAvailable) {
            this.liquidityAvailable = liquidityAvailable;
            return this;
        }

        public StrategyBuilder status(String status) {
            this.status = status;
            this.active = "Active".equalsIgnoreCase(status);
            return this;
        }

        public StrategyBuilder active(Boolean active) {
            this.active = active;
            this.status = Boolean.TRUE.equals(active) ? "Active" : "Paused";
            return this;
        }

        public Strategy build() {
            return new Strategy(id, name, strategyType, riskScore, riskLevel, currentApy,
                    allocationPercentage, allocationCapPercent, liquidityAvailable, status, active);
        }
    }
}