package com.yieldpilot.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "vault_positions", uniqueConstraints = {
        @UniqueConstraint(name = "uq_vault_wallet", columnNames = {"vault_id", "wallet_address"})
})
public class VaultPosition {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vault_id", nullable = false)
    @JsonIgnore
    private Vault vault;

    @Column(name = "vault_id", insertable = false, updatable = false)
    private Long vaultId;

    @Column(name = "wallet_address", nullable = false, length = 64)
    private String walletAddress;

    @Column(nullable = false, precision = 38, scale = 18)
    private BigDecimal shares = BigDecimal.ZERO;

    @Column(name = "deposited_assets", nullable = false, precision = 38, scale = 18)
    private BigDecimal depositedAssets = BigDecimal.ZERO;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt = LocalDateTime.now();

    public VaultPosition() {
    }

    public VaultPosition(Long id, Vault vault, String walletAddress, BigDecimal shares,
                         BigDecimal depositedAssets, LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.vault = vault;
        this.vaultId = vault != null ? vault.getId() : null;
        this.walletAddress = walletAddress != null ? walletAddress.trim().toLowerCase() : null;
        this.shares = shares != null ? shares : BigDecimal.ZERO;
        this.depositedAssets = depositedAssets != null ? depositedAssets : BigDecimal.ZERO;
        this.createdAt = createdAt != null ? createdAt : LocalDateTime.now();
        this.updatedAt = updatedAt != null ? updatedAt : LocalDateTime.now();
    }

    @PrePersist
    public void onPrePersist() {
        if (createdAt == null) createdAt = LocalDateTime.now();
        if (updatedAt == null) updatedAt = LocalDateTime.now();
        if (walletAddress != null) walletAddress = walletAddress.trim().toLowerCase();
    }

    @PreUpdate
    public void onPreUpdate() {
        updatedAt = LocalDateTime.now();
        if (walletAddress != null) walletAddress = walletAddress.trim().toLowerCase();
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

    public BigDecimal getShares() {
        return shares != null ? shares : BigDecimal.ZERO;
    }

    public void setShares(BigDecimal shares) {
        this.shares = shares;
    }

    public BigDecimal getDepositedAssets() {
        return depositedAssets != null ? depositedAssets : BigDecimal.ZERO;
    }

    public void setDepositedAssets(BigDecimal depositedAssets) {
        this.depositedAssets = depositedAssets;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public static VaultPositionBuilder builder() {
        return new VaultPositionBuilder();
    }

    public static class VaultPositionBuilder {
        private Long id;
        private Vault vault;
        private Long vaultId;
        private String walletAddress;
        private BigDecimal shares = BigDecimal.ZERO;
        private BigDecimal depositedAssets = BigDecimal.ZERO;
        private LocalDateTime createdAt = LocalDateTime.now();
        private LocalDateTime updatedAt = LocalDateTime.now();

        VaultPositionBuilder() {
        }

        public VaultPositionBuilder id(Long id) {
            this.id = id;
            return this;
        }

        public VaultPositionBuilder vault(Vault vault) {
            this.vault = vault;
            if (vault != null) this.vaultId = vault.getId();
            return this;
        }

        public VaultPositionBuilder vaultId(Long vaultId) {
            this.vaultId = vaultId;
            return this;
        }

        public VaultPositionBuilder walletAddress(String walletAddress) {
            this.walletAddress = walletAddress;
            return this;
        }

        public VaultPositionBuilder shares(BigDecimal shares) {
            this.shares = shares;
            return this;
        }

        public VaultPositionBuilder depositedAssets(BigDecimal depositedAssets) {
            this.depositedAssets = depositedAssets;
            return this;
        }

        public VaultPositionBuilder createdAt(LocalDateTime createdAt) {
            this.createdAt = createdAt;
            return this;
        }

        public VaultPositionBuilder updatedAt(LocalDateTime updatedAt) {
            this.updatedAt = updatedAt;
            return this;
        }

        public VaultPosition build() {
            return new VaultPosition(id, vault, walletAddress, shares, depositedAssets, createdAt, updatedAt);
        }
    }
}
