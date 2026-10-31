package com.yieldpilot.dto;

import java.math.BigDecimal;

public class VaultSummaryResponse {

    private Double totalValueLocked;
    private BigDecimal totalAssets;
    private BigDecimal totalShares;
    private Double estimatedApy;
    private int totalStrategies;
    private long activeUsers;
    private String assetSymbol;

    // Backward compatibility fields
    private Double userDepositedValue;
    private Double vaultShares;
    private Double estimatedEarnings;
    private Double currentApy;
    private Double apyChangePercentage;

    public VaultSummaryResponse() {
    }

    public VaultSummaryResponse(Double totalValueLocked, BigDecimal totalAssets, BigDecimal totalShares,
                                Double estimatedApy, int totalStrategies, long activeUsers, String assetSymbol,
                                Double userDepositedValue, Double vaultShares, Double estimatedEarnings,
                                Double currentApy, Double apyChangePercentage) {
        this.totalValueLocked = totalValueLocked;
        this.totalAssets = totalAssets;
        this.totalShares = totalShares;
        this.estimatedApy = estimatedApy;
        this.totalStrategies = totalStrategies;
        this.activeUsers = activeUsers;
        this.assetSymbol = assetSymbol != null ? assetSymbol : "USDC";
        this.userDepositedValue = userDepositedValue;
        this.vaultShares = vaultShares;
        this.estimatedEarnings = estimatedEarnings;
        this.currentApy = currentApy != null ? currentApy : estimatedApy;
        this.apyChangePercentage = apyChangePercentage;
    }

    public Double getTotalValueLocked() {
        if (totalValueLocked != null) return totalValueLocked;
        return totalAssets != null ? totalAssets.doubleValue() : 0.0;
    }

    public void setTotalValueLocked(Double totalValueLocked) {
        this.totalValueLocked = totalValueLocked;
    }

    public BigDecimal getTotalAssets() {
        return totalAssets != null ? totalAssets : (totalValueLocked != null ? BigDecimal.valueOf(totalValueLocked) : BigDecimal.ZERO);
    }

    public void setTotalAssets(BigDecimal totalAssets) {
        this.totalAssets = totalAssets;
        if (totalAssets != null) {
            this.totalValueLocked = totalAssets.doubleValue();
        }
    }

    public BigDecimal getTotalShares() {
        return totalShares != null ? totalShares : BigDecimal.ZERO;
    }

    public void setTotalShares(BigDecimal totalShares) {
        this.totalShares = totalShares;
    }

    public Double getEstimatedApy() {
        return estimatedApy != null ? estimatedApy : currentApy;
    }

    public void setEstimatedApy(Double estimatedApy) {
        this.estimatedApy = estimatedApy;
        this.currentApy = estimatedApy;
    }

    public int getTotalStrategies() {
        return totalStrategies;
    }

    public void setTotalStrategies(int totalStrategies) {
        this.totalStrategies = totalStrategies;
    }

    public long getActiveUsers() {
        return activeUsers;
    }

    public void setActiveUsers(long activeUsers) {
        this.activeUsers = activeUsers;
    }

    public String getAssetSymbol() {
        return assetSymbol != null ? assetSymbol : "USDC";
    }

    public void setAssetSymbol(String assetSymbol) {
        this.assetSymbol = assetSymbol;
    }

    public Double getUserDepositedValue() {
        return userDepositedValue;
    }

    public void setUserDepositedValue(Double userDepositedValue) {
        this.userDepositedValue = userDepositedValue;
    }

    public Double getVaultShares() {
        return vaultShares;
    }

    public void setVaultShares(Double vaultShares) {
        this.vaultShares = vaultShares;
    }

    public Double getEstimatedEarnings() {
        return estimatedEarnings;
    }

    public void setEstimatedEarnings(Double estimatedEarnings) {
        this.estimatedEarnings = estimatedEarnings;
    }

    public Double getCurrentApy() {
        return currentApy != null ? currentApy : estimatedApy;
    }

    public void setCurrentApy(Double currentApy) {
        this.currentApy = currentApy;
        this.estimatedApy = currentApy;
    }

    public Double getApyChangePercentage() {
        return apyChangePercentage;
    }

    public void setApyChangePercentage(Double apyChangePercentage) {
        this.apyChangePercentage = apyChangePercentage;
    }

    public static VaultSummaryResponseBuilder builder() {
        return new VaultSummaryResponseBuilder();
    }

    public static class VaultSummaryResponseBuilder {
        private Double totalValueLocked;
        private BigDecimal totalAssets;
        private BigDecimal totalShares;
        private Double estimatedApy;
        private int totalStrategies;
        private long activeUsers;
        private String assetSymbol = "USDC";
        private Double userDepositedValue;
        private Double vaultShares;
        private Double estimatedEarnings;
        private Double currentApy;
        private Double apyChangePercentage;

        VaultSummaryResponseBuilder() {
        }

        public VaultSummaryResponseBuilder totalValueLocked(Double totalValueLocked) {
            this.totalValueLocked = totalValueLocked;
            return this;
        }

        public VaultSummaryResponseBuilder totalAssets(BigDecimal totalAssets) {
            this.totalAssets = totalAssets;
            if (totalAssets != null) this.totalValueLocked = totalAssets.doubleValue();
            return this;
        }

        public VaultSummaryResponseBuilder totalShares(BigDecimal totalShares) {
            this.totalShares = totalShares;
            return this;
        }

        public VaultSummaryResponseBuilder estimatedApy(Double estimatedApy) {
            this.estimatedApy = estimatedApy;
            this.currentApy = estimatedApy;
            return this;
        }

        public VaultSummaryResponseBuilder totalStrategies(int totalStrategies) {
            this.totalStrategies = totalStrategies;
            return this;
        }

        public VaultSummaryResponseBuilder activeUsers(long activeUsers) {
            this.activeUsers = activeUsers;
            return this;
        }

        public VaultSummaryResponseBuilder assetSymbol(String assetSymbol) {
            this.assetSymbol = assetSymbol;
            return this;
        }

        public VaultSummaryResponseBuilder userDepositedValue(Double userDepositedValue) {
            this.userDepositedValue = userDepositedValue;
            return this;
        }

        public VaultSummaryResponseBuilder vaultShares(Double vaultShares) {
            this.vaultShares = vaultShares;
            return this;
        }

        public VaultSummaryResponseBuilder estimatedEarnings(Double estimatedEarnings) {
            this.estimatedEarnings = estimatedEarnings;
            return this;
        }

        public VaultSummaryResponseBuilder currentApy(Double currentApy) {
            this.currentApy = currentApy;
            this.estimatedApy = currentApy;
            return this;
        }

        public VaultSummaryResponseBuilder apyChangePercentage(Double apyChangePercentage) {
            this.apyChangePercentage = apyChangePercentage;
            return this;
        }

        public VaultSummaryResponse build() {
            return new VaultSummaryResponse(totalValueLocked, totalAssets, totalShares, estimatedApy,
                    totalStrategies, activeUsers, assetSymbol, userDepositedValue, vaultShares,
                    estimatedEarnings, currentApy, apyChangePercentage);
        }
    }
}