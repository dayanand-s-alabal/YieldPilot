package com.yieldpilot.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "rebalance_proposals")
public class RebalanceProposal {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vault_id")
    @JsonIgnore
    private Vault vault;

    @Column(name = "vault_id", insertable = false, updatable = false)
    private Long vaultId;

    @Column(nullable = false, length = 32)
    private String status = "GENERATED"; // GENERATED, APPROVED, EXECUTED, REJECTED, EXPIRED, FAILED

    @Column(name = "total_assets", nullable = false, precision = 38, scale = 18)
    private BigDecimal totalAssets = BigDecimal.ZERO;

    @Column(name = "expected_net_benefit", nullable = false, precision = 38, scale = 18)
    private BigDecimal expectedNetBenefit = BigDecimal.ZERO;

    @Column(name = "estimated_cost", nullable = false, precision = 38, scale = 18)
    private BigDecimal estimatedCost = BigDecimal.ZERO;

    @Column(name = "decision_reason", columnDefinition = "TEXT")
    private String decisionReason;

    // Backward compatibility fields
    private String description;
    private String reason;
    private String riskWarning;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "expires_at")
    private LocalDateTime expiresAt;

    @Column(name = "approved_at")
    private LocalDateTime approvedAt;

    @Column(name = "executed_at")
    private LocalDateTime executedAt;

    @OneToMany(mappedBy = "proposal", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    private List<RebalanceItem> items = new ArrayList<>();

    public RebalanceProposal() {
    }

    public RebalanceProposal(Long id, Vault vault, String status, BigDecimal totalAssets,
                             BigDecimal expectedNetBenefit, BigDecimal estimatedCost, String decisionReason,
                             String description, String reason, String riskWarning,
                             LocalDateTime createdAt, LocalDateTime expiresAt,
                             LocalDateTime approvedAt, LocalDateTime executedAt, List<RebalanceItem> items) {
        this.id = id;
        this.vault = vault;
        this.vaultId = vault != null ? vault.getId() : null;
        this.status = status != null ? status : "GENERATED";
        this.totalAssets = totalAssets != null ? totalAssets : BigDecimal.ZERO;
        this.expectedNetBenefit = expectedNetBenefit != null ? expectedNetBenefit : BigDecimal.ZERO;
        this.estimatedCost = estimatedCost != null ? estimatedCost : BigDecimal.ZERO;
        this.decisionReason = decisionReason;
        this.description = description;
        this.reason = reason != null ? reason : decisionReason;
        this.riskWarning = riskWarning;
        this.createdAt = createdAt != null ? createdAt : LocalDateTime.now();
        this.expiresAt = expiresAt != null ? expiresAt : this.createdAt.plusHours(24);
        this.approvedAt = approvedAt;
        this.executedAt = executedAt;
        if (items != null) {
            this.items = items;
            for (RebalanceItem item : items) {
                item.setProposal(this);
            }
        }
    }

    @PrePersist
    public void onPrePersist() {
        if (createdAt == null) createdAt = LocalDateTime.now();
        if (expiresAt == null) expiresAt = createdAt.plusHours(24);
        if (reason == null) reason = decisionReason;
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

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public BigDecimal getTotalAssets() {
        return totalAssets;
    }

    public void setTotalAssets(BigDecimal totalAssets) {
        this.totalAssets = totalAssets;
    }

    public BigDecimal getExpectedNetBenefit() {
        return expectedNetBenefit;
    }

    public void setExpectedNetBenefit(BigDecimal expectedNetBenefit) {
        this.expectedNetBenefit = expectedNetBenefit;
    }

    public BigDecimal getEstimatedCost() {
        return estimatedCost;
    }

    public void setEstimatedCost(BigDecimal estimatedCost) {
        this.estimatedCost = estimatedCost;
    }

    public String getDecisionReason() {
        return decisionReason;
    }

    public void setDecisionReason(String decisionReason) {
        this.decisionReason = decisionReason;
        if (this.reason == null) this.reason = decisionReason;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getReason() {
        return reason != null ? reason : decisionReason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public String getRiskWarning() {
        return riskWarning;
    }

    public void setRiskWarning(String riskWarning) {
        this.riskWarning = riskWarning;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getExpiresAt() {
        return expiresAt;
    }

    public void setExpiresAt(LocalDateTime expiresAt) {
        this.expiresAt = expiresAt;
    }

    public LocalDateTime getApprovedAt() {
        return approvedAt;
    }

    public void setApprovedAt(LocalDateTime approvedAt) {
        this.approvedAt = approvedAt;
    }

    public LocalDateTime getExecutedAt() {
        return executedAt;
    }

    public void setExecutedAt(LocalDateTime executedAt) {
        this.executedAt = executedAt;
    }

    public List<RebalanceItem> getItems() {
        return items;
    }

    public void setItems(List<RebalanceItem> items) {
        this.items = items;
        if (items != null) {
            for (RebalanceItem item : items) {
                item.setProposal(this);
            }
        }
    }

    public void addItem(RebalanceItem item) {
        items.add(item);
        item.setProposal(this);
    }

    // Backward compatibility helpers
    public Double getEstimatedBenefit() {
        return expectedNetBenefit != null ? expectedNetBenefit.doubleValue() : null;
    }

    public void setEstimatedBenefit(Double estimatedBenefit) {
        this.expectedNetBenefit = estimatedBenefit != null ? BigDecimal.valueOf(estimatedBenefit) : BigDecimal.ZERO;
    }

    public Double getTransactionCost() {
        return estimatedCost != null ? estimatedCost.doubleValue() : null;
    }

    public void setTransactionCost(Double transactionCost) {
        this.estimatedCost = transactionCost != null ? BigDecimal.valueOf(transactionCost) : BigDecimal.ZERO;
    }

    public static RebalanceProposalBuilder builder() {
        return new RebalanceProposalBuilder();
    }

    public static class RebalanceProposalBuilder {
        private Long id;
        private Vault vault;
        private Long vaultId;
        private String status = "GENERATED";
        private BigDecimal totalAssets = BigDecimal.ZERO;
        private BigDecimal expectedNetBenefit = BigDecimal.ZERO;
        private BigDecimal estimatedCost = BigDecimal.ZERO;
        private String decisionReason;
        private String description;
        private String reason;
        private String riskWarning;
        private LocalDateTime createdAt = LocalDateTime.now();
        private LocalDateTime expiresAt;
        private LocalDateTime approvedAt;
        private LocalDateTime executedAt;
        private List<RebalanceItem> items = new ArrayList<>();

        RebalanceProposalBuilder() {
        }

        public RebalanceProposalBuilder id(Long id) {
            this.id = id;
            return this;
        }

        public RebalanceProposalBuilder vault(Vault vault) {
            this.vault = vault;
            if (vault != null) this.vaultId = vault.getId();
            return this;
        }

        public RebalanceProposalBuilder vaultId(Long vaultId) {
            this.vaultId = vaultId;
            return this;
        }

        public RebalanceProposalBuilder status(String status) {
            this.status = status;
            return this;
        }

        public RebalanceProposalBuilder totalAssets(BigDecimal totalAssets) {
            this.totalAssets = totalAssets;
            return this;
        }

        public RebalanceProposalBuilder expectedNetBenefit(BigDecimal expectedNetBenefit) {
            this.expectedNetBenefit = expectedNetBenefit;
            return this;
        }

        public RebalanceProposalBuilder estimatedBenefit(Double estimatedBenefit) {
            this.expectedNetBenefit = estimatedBenefit != null ? BigDecimal.valueOf(estimatedBenefit) : BigDecimal.ZERO;
            return this;
        }

        public RebalanceProposalBuilder estimatedCost(BigDecimal estimatedCost) {
            this.estimatedCost = estimatedCost;
            return this;
        }

        public RebalanceProposalBuilder transactionCost(Double transactionCost) {
            this.estimatedCost = transactionCost != null ? BigDecimal.valueOf(transactionCost) : BigDecimal.ZERO;
            return this;
        }

        public RebalanceProposalBuilder decisionReason(String decisionReason) {
            this.decisionReason = decisionReason;
            this.reason = decisionReason;
            return this;
        }

        public RebalanceProposalBuilder description(String description) {
            this.description = description;
            return this;
        }

        public RebalanceProposalBuilder reason(String reason) {
            this.reason = reason;
            if (this.decisionReason == null) this.decisionReason = reason;
            return this;
        }

        public RebalanceProposalBuilder riskWarning(String riskWarning) {
            this.riskWarning = riskWarning;
            return this;
        }

        public RebalanceProposalBuilder createdAt(LocalDateTime createdAt) {
            this.createdAt = createdAt;
            return this;
        }

        public RebalanceProposalBuilder expiresAt(LocalDateTime expiresAt) {
            this.expiresAt = expiresAt;
            return this;
        }

        public RebalanceProposalBuilder approvedAt(LocalDateTime approvedAt) {
            this.approvedAt = approvedAt;
            return this;
        }

        public RebalanceProposalBuilder executedAt(LocalDateTime executedAt) {
            this.executedAt = executedAt;
            return this;
        }

        public RebalanceProposalBuilder items(List<RebalanceItem> items) {
            this.items = items;
            return this;
        }

        public RebalanceProposal build() {
            return new RebalanceProposal(id, vault, status, totalAssets, expectedNetBenefit, estimatedCost,
                    decisionReason, description, reason, riskWarning, createdAt, expiresAt, approvedAt, executedAt, items);
        }
    }
}