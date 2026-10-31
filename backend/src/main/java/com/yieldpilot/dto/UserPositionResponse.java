package com.yieldpilot.dto;

import java.math.BigDecimal;

public class UserPositionResponse {

    private String walletAddress;
    private Long vaultId;
    private BigDecimal shares;
    private BigDecimal depositedAssets;
    private BigDecimal currentAssetValue;
    private BigDecimal unrealizedYield;

    public UserPositionResponse() {
    }

    public UserPositionResponse(String walletAddress, Long vaultId, BigDecimal shares,
                                BigDecimal depositedAssets, BigDecimal currentAssetValue,
                                BigDecimal unrealizedYield) {
        this.walletAddress = walletAddress;
        this.vaultId = vaultId;
        this.shares = shares != null ? shares : BigDecimal.ZERO;
        this.depositedAssets = depositedAssets != null ? depositedAssets : BigDecimal.ZERO;
        this.currentAssetValue = currentAssetValue != null ? currentAssetValue : BigDecimal.ZERO;
        this.unrealizedYield = unrealizedYield != null ? unrealizedYield : BigDecimal.ZERO;
    }

    public String getWalletAddress() {
        return walletAddress;
    }

    public void setWalletAddress(String walletAddress) {
        this.walletAddress = walletAddress;
    }

    public Long getVaultId() {
        return vaultId;
    }

    public void setVaultId(Long vaultId) {
        this.vaultId = vaultId;
    }

    public BigDecimal getShares() {
        return shares;
    }

    public void setShares(BigDecimal shares) {
        this.shares = shares;
    }

    public BigDecimal getDepositedAssets() {
        return depositedAssets;
    }

    public void setDepositedAssets(BigDecimal depositedAssets) {
        this.depositedAssets = depositedAssets;
    }

    public BigDecimal getCurrentAssetValue() {
        return currentAssetValue;
    }

    public void setCurrentAssetValue(BigDecimal currentAssetValue) {
        this.currentAssetValue = currentAssetValue;
    }

    public BigDecimal getUnrealizedYield() {
        return unrealizedYield;
    }

    public void setUnrealizedYield(BigDecimal unrealizedYield) {
        this.unrealizedYield = unrealizedYield;
    }

    public static UserPositionResponseBuilder builder() {
        return new UserPositionResponseBuilder();
    }

    public static class UserPositionResponseBuilder {
        private String walletAddress;
        private Long vaultId;
        private BigDecimal shares = BigDecimal.ZERO;
        private BigDecimal depositedAssets = BigDecimal.ZERO;
        private BigDecimal currentAssetValue = BigDecimal.ZERO;
        private BigDecimal unrealizedYield = BigDecimal.ZERO;

        UserPositionResponseBuilder() {
        }

        public UserPositionResponseBuilder walletAddress(String walletAddress) {
            this.walletAddress = walletAddress;
            return this;
        }

        public UserPositionResponseBuilder vaultId(Long vaultId) {
            this.vaultId = vaultId;
            return this;
        }

        public UserPositionResponseBuilder shares(BigDecimal shares) {
            this.shares = shares;
            return this;
        }

        public UserPositionResponseBuilder depositedAssets(BigDecimal depositedAssets) {
            this.depositedAssets = depositedAssets;
            return this;
        }

        public UserPositionResponseBuilder currentAssetValue(BigDecimal currentAssetValue) {
            this.currentAssetValue = currentAssetValue;
            return this;
        }

        public UserPositionResponseBuilder unrealizedYield(BigDecimal unrealizedYield) {
            this.unrealizedYield = unrealizedYield;
            return this;
        }

        public UserPositionResponse build() {
            return new UserPositionResponse(walletAddress, vaultId, shares, depositedAssets, currentAssetValue, unrealizedYield);
        }
    }
}
