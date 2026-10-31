package com.yieldpilot.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

public class RebalanceProposalResponse {

    private Long id;
    private Long vaultId;
    private String status;
    private BigDecimal totalAssets;
    private BigDecimal expectedNetBenefit;
    private BigDecimal estimatedCost;
    private String decisionReason;
    private String recommendation;
    private String description;
    private String reason;
    private String riskWarning;
    private LocalDateTime createdAt;
    private LocalDateTime expiresAt;
    private LocalDateTime approvedAt;
    private LocalDateTime executedAt;
    private List<AllocationResponse> items = new ArrayList<>();

    public RebalanceProposalResponse() {
    }

    public RebalanceProposalResponse(Long id, Long vaultId, String status, BigDecimal totalAssets,
                                     BigDecimal expectedNetBenefit, BigDecimal estimatedCost,
                                     String decisionReason, String recommendation, String description,
                                     String reason, String riskWarning, LocalDateTime createdAt,
                                     LocalDateTime expiresAt, LocalDateTime approvedAt,
                                     LocalDateTime executedAt, List<AllocationResponse> items) {
        this.id = id;
        this.vaultId = vaultId;
        this.status = status;
        this.totalAssets = totalAssets;
        this.expectedNetBenefit = expectedNetBenefit;
        this.estimatedCost = estimatedCost;
        this.decisionReason = decisionReason;
        this.recommendation = recommendation;
        this.description = description;
        this.reason = reason != null ? reason : decisionReason;
        this.riskWarning = riskWarning;
        this.createdAt = createdAt;
        this.expiresAt = expiresAt;
        this.approvedAt = approvedAt;
        this.executedAt = executedAt;
        if (items != null) this.items = items;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getVaultId() {
        return vaultId;
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
    }

    public String getRecommendation() {
        return recommendation;
    }

    public void setRecommendation(String recommendation) {
        this.recommendation = recommendation;
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

    public List<AllocationResponse> getItems() {
        return items;
    }

    public void setItems(List<AllocationResponse> items) {
        this.items = items;
    }

    // Backward compatibility methods
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

    public static RebalanceProposalResponseBuilder builder() {
        return new RebalanceProposalResponseBuilder();
    }

    public static class RebalanceProposalResponseBuilder {
        private Long id;
        private Long vaultId;
        private String status = "GENERATED";
        private BigDecimal totalAssets = BigDecimal.ZERO;
        private BigDecimal expectedNetBenefit = BigDecimal.ZERO;
        private BigDecimal estimatedCost = BigDecimal.ZERO;
        private String decisionReason;
        private String recommendation = "REBALANCE";
        private String description;
        private String reason;
        private String riskWarning;
        private LocalDateTime createdAt = LocalDateTime.now();
        private LocalDateTime expiresAt;
        private LocalDateTime approvedAt;
        private LocalDateTime executedAt;
        private List<AllocationResponse> items = new ArrayList<>();

        RebalanceProposalResponseBuilder() {
        }

        public RebalanceProposalResponseBuilder id(Long id) {
            this.id = id;
            return this;
        }

        public RebalanceProposalResponseBuilder vaultId(Long vaultId) {
            this.vaultId = vaultId;
            return this;
        }

        public RebalanceProposalResponseBuilder status(String status) {
            this.status = status;
            return this;
        }

        public RebalanceProposalResponseBuilder totalAssets(BigDecimal totalAssets) {
            this.totalAssets = totalAssets;
            return this;
        }

        public RebalanceProposalResponseBuilder expectedNetBenefit(BigDecimal expectedNetBenefit) {
            this.expectedNetBenefit = expectedNetBenefit;
            return this;
        }

        public RebalanceProposalResponseBuilder estimatedBenefit(Double estimatedBenefit) {
            this.expectedNetBenefit = estimatedBenefit != null ? BigDecimal.valueOf(estimatedBenefit) : BigDecimal.ZERO;
            return this;
        }

        public RebalanceProposalResponseBuilder estimatedCost(BigDecimal estimatedCost) {
            this.estimatedCost = estimatedCost;
            return this;
        }

        public RebalanceProposalResponseBuilder transactionCost(Double transactionCost) {
            this.estimatedCost = transactionCost != null ? BigDecimal.valueOf(transactionCost) : BigDecimal.ZERO;
            return this;
        }

        public RebalanceProposalResponseBuilder decisionReason(String decisionReason) {
            this.decisionReason = decisionReason;
            this.reason = decisionReason;
            return this;
        }

        public RebalanceProposalResponseBuilder recommendation(String recommendation) {
            this.recommendation = recommendation;
            return this;
        }

        public RebalanceProposalResponseBuilder description(String description) {
            this.description = description;
            return this;
        }

        public RebalanceProposalResponseBuilder reason(String reason) {
            this.reason = reason;
            if (this.decisionReason == null) this.decisionReason = reason;
            return this;
        }

        public RebalanceProposalResponseBuilder riskWarning(String riskWarning) {
            this.riskWarning = riskWarning;
            return this;
        }

        public RebalanceProposalResponseBuilder createdAt(LocalDateTime createdAt) {
            this.createdAt = createdAt;
            return this;
        }

        public RebalanceProposalResponseBuilder expiresAt(LocalDateTime expiresAt) {
            this.expiresAt = expiresAt;
            return this;
        }

        public RebalanceProposalResponseBuilder approvedAt(LocalDateTime approvedAt) {
            this.approvedAt = approvedAt;
            return this;
        }

        public RebalanceProposalResponseBuilder executedAt(LocalDateTime executedAt) {
            this.executedAt = executedAt;
            return this;
        }

        public RebalanceProposalResponseBuilder items(List<AllocationResponse> items) {
            this.items = items;
            return this;
        }

        public RebalanceProposalResponse build() {
            return new RebalanceProposalResponse(id, vaultId, status, totalAssets, expectedNetBenefit,
                    estimatedCost, decisionReason, recommendation, description, reason, riskWarning,
                    createdAt, expiresAt, approvedAt, executedAt, items);
        }
    }
}