package com.yieldpilot.dto;

public class StrategyResponse {
    private Long id;
    private String name;
    private String strategyType;
    private Integer riskScore;
    private String riskLevel;
    private Double currentApy;
    private Double allocationPercentage;
    private Double allocationCapPercent;
    private Double liquidityAvailable;
    private String status;
    private Boolean active;

    public StrategyResponse() {
    }

    public StrategyResponse(Long id, String name, String strategyType, Integer riskScore, String riskLevel,
                            Double currentApy, Double allocationPercentage, Double allocationCapPercent,
                            Double liquidityAvailable, String status, Boolean active) {
        this.id = id;
        this.name = name;
        this.strategyType = strategyType;
        this.riskScore = riskScore;
        this.riskLevel = riskLevel;
        this.currentApy = currentApy;
        this.allocationPercentage = allocationPercentage;
        this.allocationCapPercent = allocationCapPercent;
        this.liquidityAvailable = liquidityAvailable;
        this.status = status;
        this.active = active;
    }

    // Backward compat constructor
    public StrategyResponse(Long id, String name, String riskLevel, Double currentApy,
                            Double allocationPercentage, Double liquidityAvailable, String status) {
        this(id, name, "Yield", null, riskLevel, currentApy, allocationPercentage, 40.0,
                liquidityAvailable, status, "Active".equalsIgnoreCase(status));
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getStrategyType() { return strategyType; }
    public void setStrategyType(String strategyType) { this.strategyType = strategyType; }

    public Integer getRiskScore() { return riskScore; }
    public void setRiskScore(Integer riskScore) { this.riskScore = riskScore; }

    public String getRiskLevel() { return riskLevel; }
    public void setRiskLevel(String riskLevel) { this.riskLevel = riskLevel; }

    public Double getCurrentApy() { return currentApy; }
    public void setCurrentApy(Double currentApy) { this.currentApy = currentApy; }

    public Double getAllocationPercentage() { return allocationPercentage; }
    public void setAllocationPercentage(Double allocationPercentage) { this.allocationPercentage = allocationPercentage; }

    public Double getAllocationCapPercent() { return allocationCapPercent; }
    public void setAllocationCapPercent(Double allocationCapPercent) { this.allocationCapPercent = allocationCapPercent; }

    public Double getLiquidityAvailable() { return liquidityAvailable; }
    public void setLiquidityAvailable(Double liquidityAvailable) { this.liquidityAvailable = liquidityAvailable; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Boolean getActive() { return active; }
    public void setActive(Boolean active) { this.active = active; }

    public static StrategyResponseBuilder builder() {
        return new StrategyResponseBuilder();
    }

    public static class StrategyResponseBuilder {
        private Long id;
        private String name;
        private String strategyType = "Yield";
        private Integer riskScore;
        private String riskLevel;
        private Double currentApy;
        private Double allocationPercentage;
        private Double allocationCapPercent = 40.0;
        private Double liquidityAvailable;
        private String status;
        private Boolean active;

        StrategyResponseBuilder() {}

        public StrategyResponseBuilder id(Long id) { this.id = id; return this; }
        public StrategyResponseBuilder name(String name) { this.name = name; return this; }
        public StrategyResponseBuilder strategyType(String strategyType) { this.strategyType = strategyType; return this; }
        public StrategyResponseBuilder riskScore(Integer riskScore) { this.riskScore = riskScore; return this; }
        public StrategyResponseBuilder riskLevel(String riskLevel) { this.riskLevel = riskLevel; return this; }
        public StrategyResponseBuilder currentApy(Double currentApy) { this.currentApy = currentApy; return this; }
        public StrategyResponseBuilder allocationPercentage(Double allocationPercentage) { this.allocationPercentage = allocationPercentage; return this; }
        public StrategyResponseBuilder allocationCapPercent(Double allocationCapPercent) { this.allocationCapPercent = allocationCapPercent; return this; }
        public StrategyResponseBuilder liquidityAvailable(Double liquidityAvailable) { this.liquidityAvailable = liquidityAvailable; return this; }
        public StrategyResponseBuilder status(String status) { this.status = status; return this; }
        public StrategyResponseBuilder active(Boolean active) { this.active = active; return this; }

        public StrategyResponse build() {
            return new StrategyResponse(id, name, strategyType, riskScore, riskLevel, currentApy,
                    allocationPercentage, allocationCapPercent, liquidityAvailable, status, active);
        }
    }
}