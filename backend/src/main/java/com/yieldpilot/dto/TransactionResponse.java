package com.yieldpilot.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class TransactionResponse {

    private Long transactionId;
    private Long vaultId;
    private String walletAddress;
    private BigDecimal assetAmount;
    private BigDecimal shareAmount;
    private String transactionType;
    private String status;
    private String source;
    private String transactionHash;
    private LocalDateTime createdAt;

    public TransactionResponse() {
    }

    public TransactionResponse(Long transactionId, Long vaultId, String walletAddress,
                               BigDecimal assetAmount, BigDecimal shareAmount, String transactionType,
                               String status, String source, String transactionHash, LocalDateTime createdAt) {
        this.transactionId = transactionId;
        this.vaultId = vaultId;
        this.walletAddress = walletAddress;
        this.assetAmount = assetAmount;
        this.shareAmount = shareAmount;
        this.transactionType = transactionType;
        this.status = status;
        this.source = source;
        this.transactionHash = transactionHash;
        this.createdAt = createdAt;
    }

    public Long getTransactionId() {
        return transactionId;
    }

    public void setTransactionId(Long transactionId) {
        this.transactionId = transactionId;
    }

    public Long getVaultId() {
        return vaultId;
    }

    public void setVaultId(Long vaultId) {
        this.vaultId = vaultId;
    }

    public String getWalletAddress() {
        return walletAddress;
    }

    public void setWalletAddress(String walletAddress) {
        this.walletAddress = walletAddress;
    }

    public BigDecimal getAssetAmount() {
        return assetAmount;
    }

    public void setAssetAmount(BigDecimal assetAmount) {
        this.assetAmount = assetAmount;
    }

    public BigDecimal getShareAmount() {
        return shareAmount;
    }

    public void setShareAmount(BigDecimal shareAmount) {
        this.shareAmount = shareAmount;
    }

    public String getTransactionType() {
        return transactionType;
    }

    public void setTransactionType(String transactionType) {
        this.transactionType = transactionType;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getSource() {
        return source;
    }

    public void setSource(String source) {
        this.source = source;
    }

    public String getTransactionHash() {
        return transactionHash;
    }

    public void setTransactionHash(String transactionHash) {
        this.transactionHash = transactionHash;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public static TransactionResponseBuilder builder() {
        return new TransactionResponseBuilder();
    }

    public static class TransactionResponseBuilder {
        private Long transactionId;
        private Long vaultId;
        private String walletAddress;
        private BigDecimal assetAmount;
        private BigDecimal shareAmount;
        private String transactionType;
        private String status;
        private String source;
        private String transactionHash;
        private LocalDateTime createdAt;

        TransactionResponseBuilder() {
        }

        public TransactionResponseBuilder transactionId(Long transactionId) {
            this.transactionId = transactionId;
            return this;
        }

        public TransactionResponseBuilder vaultId(Long vaultId) {
            this.vaultId = vaultId;
            return this;
        }

        public TransactionResponseBuilder walletAddress(String walletAddress) {
            this.walletAddress = walletAddress;
            return this;
        }

        public TransactionResponseBuilder assetAmount(BigDecimal assetAmount) {
            this.assetAmount = assetAmount;
            return this;
        }

        public TransactionResponseBuilder shareAmount(BigDecimal shareAmount) {
            this.shareAmount = shareAmount;
            return this;
        }

        public TransactionResponseBuilder transactionType(String transactionType) {
            this.transactionType = transactionType;
            return this;
        }

        public TransactionResponseBuilder status(String status) {
            this.status = status;
            return this;
        }

        public TransactionResponseBuilder source(String source) {
            this.source = source;
            return this;
        }

        public TransactionResponseBuilder transactionHash(String transactionHash) {
            this.transactionHash = transactionHash;
            return this;
        }

        public TransactionResponseBuilder createdAt(LocalDateTime createdAt) {
            this.createdAt = createdAt;
            return this;
        }

        public TransactionResponse build() {
            return new TransactionResponse(transactionId, vaultId, walletAddress, assetAmount, shareAmount,
                    transactionType, status, source, transactionHash, createdAt);
        }
    }
}
