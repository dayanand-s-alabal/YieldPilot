package com.yieldpilot.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "vault_transactions")
public class VaultTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vault_id")
    @JsonIgnore
    private Vault vault;

    @Column(name = "vault_id", insertable = false, updatable = false)
    private Long vaultId;

    @Column(name = "wallet_address", length = 64)
    private String walletAddress;

    @Column(name = "transaction_type", nullable = false, length = 32)
    private String transactionType; // DEPOSIT, WITHDRAW, REBALANCE, HARVEST

    @Column(name = "asset_amount", nullable = false, precision = 38, scale = 18)
    private BigDecimal assetAmount = BigDecimal.ZERO;

    @Column(name = "share_amount", nullable = false, precision = 38, scale = 18)
    private BigDecimal shareAmount = BigDecimal.ZERO;

    @Column(name = "transaction_hash", length = 128, unique = true)
    private String transactionHash;

    @Column(nullable = false, length = 32)
    private String status = "SIMULATED"; // SIMULATED, CONFIRMED, FAILED

    @Column(nullable = false, length = 32)
    private String source = "SIMULATED"; // SIMULATED, BLOCKCHAIN

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public VaultTransaction() {
    }

    public VaultTransaction(Long id, Vault vault, String walletAddress, String transactionType,
                            BigDecimal assetAmount, BigDecimal shareAmount, String transactionHash,
                            String status, String source, LocalDateTime createdAt) {
        this.id = id;
        this.vault = vault;
        this.vaultId = vault != null ? vault.getId() : null;
        this.walletAddress = walletAddress != null ? walletAddress.trim().toLowerCase() : null;
        this.transactionType = transactionType != null ? transactionType.toUpperCase() : "DEPOSIT";
        this.assetAmount = assetAmount != null ? assetAmount : BigDecimal.ZERO;
        this.shareAmount = shareAmount != null ? shareAmount : BigDecimal.ZERO;
        this.transactionHash = transactionHash;
        this.status = status != null ? status : "SIMULATED";
        this.source = source != null ? source : "SIMULATED";
        this.createdAt = createdAt != null ? createdAt : LocalDateTime.now();
    }

    // Constructor for backward compatibility
    public VaultTransaction(Long id, String type, Double amount, String asset, String status, String txHash, LocalDateTime timestamp) {
        this.id = id;
        this.transactionType = type != null ? type.toUpperCase() : "DEPOSIT";
        this.assetAmount = amount != null ? BigDecimal.valueOf(amount) : BigDecimal.ZERO;
        this.shareAmount = this.assetAmount;
        this.status = status != null ? status : "CONFIRMED";
        this.source = "SIMULATED";
        this.transactionHash = txHash;
        this.createdAt = timestamp != null ? timestamp : LocalDateTime.now();
    }

    @PrePersist
    public void onPrePersist() {
        if (createdAt == null) createdAt = LocalDateTime.now();
        if (walletAddress != null) walletAddress = walletAddress.trim().toLowerCase();
        if (transactionType != null) transactionType = transactionType.toUpperCase();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Vault getVault() {
        return vault;
    }

    public void setVault(Vault vault) {
        this.vault = vault;
        if (vault != null) this.vaultId = vault.getId();
    }

    public Long getVaultId() {
        if (vaultId != null) return vaultId;
        return vault != null ? vault.getId() : null;
    }

    public void setVaultId(Long vaultId) {
        this.vaultId = vaultId;
    }

    public String getWalletAddress() {
        return walletAddress;
    }

    public void setWalletAddress(String walletAddress) {
        this.walletAddress = walletAddress != null ? walletAddress.trim().toLowerCase() : null;
    }

    public String getTransactionType() {
        return transactionType;
    }

    public void setTransactionType(String transactionType) {
        this.transactionType = transactionType != null ? transactionType.toUpperCase() : null;
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

    public String getTransactionHash() {
        return transactionHash;
    }

    public void setTransactionHash(String transactionHash) {
        this.transactionHash = transactionHash;
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

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    // Backward compatibility getters/setters
    public String getType() {
        return transactionType;
    }

    public void setType(String type) {
        this.transactionType = type != null ? type.toUpperCase() : null;
    }

    public Double getAmount() {
        return assetAmount != null ? assetAmount.doubleValue() : null;
    }

    public void setAmount(Double amount) {
        this.assetAmount = amount != null ? BigDecimal.valueOf(amount) : BigDecimal.ZERO;
    }

    public String getAsset() {
        return vault != null ? vault.getAssetSymbol() : "USDC";
    }

    public void setAsset(String asset) {
        // no-op or handled via vault
    }

    public String getTxHash() {
        return transactionHash;
    }

    public void setTxHash(String txHash) {
        this.transactionHash = txHash;
    }

    public LocalDateTime getTimestamp() {
        return createdAt;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.createdAt = timestamp;
    }

    public static VaultTransactionBuilder builder() {
        return new VaultTransactionBuilder();
    }

    public static class VaultTransactionBuilder {
        private Long id;
        private Vault vault;
        private Long vaultId;
        private String walletAddress;
        private String transactionType = "DEPOSIT";
        private BigDecimal assetAmount = BigDecimal.ZERO;
        private BigDecimal shareAmount = BigDecimal.ZERO;
        private String transactionHash;
        private String status = "SIMULATED";
        private String source = "SIMULATED";
        private LocalDateTime createdAt = LocalDateTime.now();

        VaultTransactionBuilder() {
        }

        public VaultTransactionBuilder id(Long id) {
            this.id = id;
            return this;
        }

        public VaultTransactionBuilder vault(Vault vault) {
            this.vault = vault;
            if (vault != null) this.vaultId = vault.getId();
            return this;
        }

        public VaultTransactionBuilder vaultId(Long vaultId) {
            this.vaultId = vaultId;
            return this;
        }

        public VaultTransactionBuilder walletAddress(String walletAddress) {
            this.walletAddress = walletAddress;
            return this;
        }

        public VaultTransactionBuilder transactionType(String transactionType) {
            this.transactionType = transactionType;
            return this;
        }

        public VaultTransactionBuilder type(String type) {
            this.transactionType = type;
            return this;
        }

        public VaultTransactionBuilder assetAmount(BigDecimal assetAmount) {
            this.assetAmount = assetAmount;
            return this;
        }

        public VaultTransactionBuilder amount(Double amount) {
            this.assetAmount = amount != null ? BigDecimal.valueOf(amount) : BigDecimal.ZERO;
            this.shareAmount = this.assetAmount;
            return this;
        }

        public VaultTransactionBuilder shareAmount(BigDecimal shareAmount) {
            this.shareAmount = shareAmount;
            return this;
        }

        public VaultTransactionBuilder transactionHash(String transactionHash) {
            this.transactionHash = transactionHash;
            return this;
        }

        public VaultTransactionBuilder txHash(String txHash) {
            this.transactionHash = txHash;
            return this;
        }

        public VaultTransactionBuilder status(String status) {
            this.status = status;
            return this;
        }

        public VaultTransactionBuilder source(String source) {
            this.source = source;
            return this;
        }

        public VaultTransactionBuilder asset(String asset) {
            return this;
        }

        public VaultTransactionBuilder createdAt(LocalDateTime createdAt) {
            this.createdAt = createdAt;
            return this;
        }

        public VaultTransactionBuilder timestamp(LocalDateTime timestamp) {
            this.createdAt = timestamp;
            return this;
        }

        public VaultTransaction build() {
            return new VaultTransaction(id, vault, walletAddress, transactionType, assetAmount, shareAmount,
                    transactionHash, status, source, createdAt);
        }
    }
}