package com.yieldpilot.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "vaults")
public class Vault {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(name = "asset_symbol", nullable = false)
    private String assetSymbol = "USDC";

    @Column(name = "total_assets", nullable = false, precision = 38, scale = 18)
    private BigDecimal totalAssets = BigDecimal.ZERO;

    @Column(name = "total_shares", nullable = false, precision = 38, scale = 18)
    private BigDecimal totalShares = BigDecimal.ZERO;

    @Column(name = "estimated_apy", nullable = false, precision = 10, scale = 4)
    private BigDecimal estimatedApy = BigDecimal.ZERO;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt = LocalDateTime.now();

    public Vault() {
    }

    public Vault(Long id, String name, String assetSymbol, BigDecimal totalAssets, BigDecimal totalShares,
                 BigDecimal estimatedApy, LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.name = name;
        this.assetSymbol = assetSymbol != null ? assetSymbol : "USDC";
        this.totalAssets = totalAssets != null ? totalAssets : BigDecimal.ZERO;
        this.totalShares = totalShares != null ? totalShares : BigDecimal.ZERO;
        this.estimatedApy = estimatedApy != null ? estimatedApy : BigDecimal.ZERO;
        this.createdAt = createdAt != null ? createdAt : LocalDateTime.now();
        this.updatedAt = updatedAt != null ? updatedAt : LocalDateTime.now();
    }

    @PrePersist
    public void onPrePersist() {
        if (createdAt == null) createdAt = LocalDateTime.now();
        if (updatedAt == null) updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    public void onPreUpdate() {
        updatedAt = LocalDateTime.now();
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

    public String getAssetSymbol() {
        return assetSymbol;
    }

    public void setAssetSymbol(String assetSymbol) {
        this.assetSymbol = assetSymbol;
    }

    public BigDecimal getTotalAssets() {
        return totalAssets != null ? totalAssets : BigDecimal.ZERO;
    }

    public void setTotalAssets(BigDecimal totalAssets) {
        this.totalAssets = totalAssets;
    }

    public BigDecimal getTotalShares() {
        return totalShares != null ? totalShares : BigDecimal.ZERO;
    }

    public void setTotalShares(BigDecimal totalShares) {
        this.totalShares = totalShares;
    }

    public BigDecimal getEstimatedApy() {
        return estimatedApy != null ? estimatedApy : BigDecimal.ZERO;
    }

    public void setEstimatedApy(BigDecimal estimatedApy) {
        this.estimatedApy = estimatedApy;
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

    public static VaultBuilder builder() {
        return new VaultBuilder();
    }

    public static class VaultBuilder {
        private Long id;
        private String name;
        private String assetSymbol = "USDC";
        private BigDecimal totalAssets = BigDecimal.ZERO;
        private BigDecimal totalShares = BigDecimal.ZERO;
        private BigDecimal estimatedApy = BigDecimal.ZERO;
        private LocalDateTime createdAt = LocalDateTime.now();
        private LocalDateTime updatedAt = LocalDateTime.now();

        VaultBuilder() {
        }

        public VaultBuilder id(Long id) {
            this.id = id;
            return this;
        }

        public VaultBuilder name(String name) {
            this.name = name;
            return this;
        }

        public VaultBuilder assetSymbol(String assetSymbol) {
            this.assetSymbol = assetSymbol;
            return this;
        }

        public VaultBuilder totalAssets(BigDecimal totalAssets) {
            this.totalAssets = totalAssets;
            return this;
        }

        public VaultBuilder totalShares(BigDecimal totalShares) {
            this.totalShares = totalShares;
            return this;
        }

        public VaultBuilder estimatedApy(BigDecimal estimatedApy) {
            this.estimatedApy = estimatedApy;
            return this;
        }

        public VaultBuilder createdAt(LocalDateTime createdAt) {
            this.createdAt = createdAt;
            return this;
        }

        public VaultBuilder updatedAt(LocalDateTime updatedAt) {
            this.updatedAt = updatedAt;
            return this;
        }

        public Vault build() {
            return new Vault(id, name, assetSymbol, totalAssets, totalShares, estimatedApy, createdAt, updatedAt);
        }
    }
}
