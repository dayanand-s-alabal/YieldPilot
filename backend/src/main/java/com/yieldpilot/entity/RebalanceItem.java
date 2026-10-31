package com.yieldpilot.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "rebalance_items")
public class RebalanceItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "proposal_id", nullable = false)
    @JsonIgnore
    private RebalanceProposal proposal;

    @Column(name = "proposal_id", insertable = false, updatable = false)
    private Long proposalId;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "strategy_id", nullable = false)
    private Strategy strategy;

    @Column(name = "strategy_id", insertable = false, updatable = false)
    private Long strategyId;

    @Column(name = "current_allocation", nullable = false, precision = 38, scale = 18)
    private BigDecimal currentAllocation = BigDecimal.ZERO;

    @Column(name = "target_allocation", nullable = false, precision = 38, scale = 18)
    private BigDecimal targetAllocation = BigDecimal.ZERO;

    @Column(name = "amount_to_move", nullable = false, precision = 38, scale = 18)
    private BigDecimal amountToMove = BigDecimal.ZERO;

    @Column(name = "movement_direction", nullable = false, length = 32)
    private String movementDirection = "HOLD"; // DEPOSIT, WITHDRAW, HOLD

    public RebalanceItem() {
    }

    public RebalanceItem(Long id, RebalanceProposal proposal, Strategy strategy, BigDecimal currentAllocation,
                         BigDecimal targetAllocation, BigDecimal amountToMove, String movementDirection) {
        this.id = id;
        this.proposal = proposal;
        this.proposalId = proposal != null ? proposal.getId() : null;
        this.strategy = strategy;
        this.strategyId = strategy != null ? strategy.getId() : null;
        this.currentAllocation = currentAllocation != null ? currentAllocation : BigDecimal.ZERO;
        this.targetAllocation = targetAllocation != null ? targetAllocation : BigDecimal.ZERO;
        this.amountToMove = amountToMove != null ? amountToMove : BigDecimal.ZERO;
        this.movementDirection = movementDirection != null ? movementDirection : "HOLD";
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public RebalanceProposal getProposal() {
        return proposal;
    }

    public void setProposal(RebalanceProposal proposal) {
        this.proposal = proposal;
        if (proposal != null) this.proposalId = proposal.getId();
    }

    public Long getProposalId() {
        if (proposalId != null) return proposalId;
        return proposal != null ? proposal.getId() : null;
    }

    public void setProposalId(Long proposalId) {
        this.proposalId = proposalId;
    }

    public Strategy getStrategy() {
        return strategy;
    }

    public void setStrategy(Strategy strategy) {
        this.strategy = strategy;
        if (strategy != null) this.strategyId = strategy.getId();
    }

    public Long getStrategyId() {
        if (strategyId != null) return strategyId;
        return strategy != null ? strategy.getId() : null;
    }

    public void setStrategyId(Long strategyId) {
        this.strategyId = strategyId;
    }

    public BigDecimal getCurrentAllocation() {
        return currentAllocation;
    }

    public void setCurrentAllocation(BigDecimal currentAllocation) {
        this.currentAllocation = currentAllocation;
    }

    public BigDecimal getTargetAllocation() {
        return targetAllocation;
    }

    public void setTargetAllocation(BigDecimal targetAllocation) {
        this.targetAllocation = targetAllocation;
    }

    public BigDecimal getAmountToMove() {
        return amountToMove;
    }

    public void setAmountToMove(BigDecimal amountToMove) {
        this.amountToMove = amountToMove;
    }

    public String getMovementDirection() {
        return movementDirection;
    }

    public void setMovementDirection(String movementDirection) {
        this.movementDirection = movementDirection;
    }

    public static RebalanceItemBuilder builder() {
        return new RebalanceItemBuilder();
    }

    public static class RebalanceItemBuilder {
        private Long id;
        private RebalanceProposal proposal;
        private Long proposalId;
        private Strategy strategy;
        private Long strategyId;
        private BigDecimal currentAllocation = BigDecimal.ZERO;
        private BigDecimal targetAllocation = BigDecimal.ZERO;
        private BigDecimal amountToMove = BigDecimal.ZERO;
        private String movementDirection = "HOLD";

        RebalanceItemBuilder() {
        }

        public RebalanceItemBuilder id(Long id) {
            this.id = id;
            return this;
        }

        public RebalanceItemBuilder proposal(RebalanceProposal proposal) {
            this.proposal = proposal;
            if (proposal != null) this.proposalId = proposal.getId();
            return this;
        }

        public RebalanceItemBuilder proposalId(Long proposalId) {
            this.proposalId = proposalId;
            return this;
        }

        public RebalanceItemBuilder strategy(Strategy strategy) {
            this.strategy = strategy;
            if (strategy != null) this.strategyId = strategy.getId();
            return this;
        }

        public RebalanceItemBuilder strategyId(Long strategyId) {
            this.strategyId = strategyId;
            return this;
        }

        public RebalanceItemBuilder currentAllocation(BigDecimal currentAllocation) {
            this.currentAllocation = currentAllocation;
            return this;
        }

        public RebalanceItemBuilder targetAllocation(BigDecimal targetAllocation) {
            this.targetAllocation = targetAllocation;
            return this;
        }

        public RebalanceItemBuilder amountToMove(BigDecimal amountToMove) {
            this.amountToMove = amountToMove;
            return this;
        }

        public RebalanceItemBuilder movementDirection(String movementDirection) {
            this.movementDirection = movementDirection;
            return this;
        }

        public RebalanceItem build() {
            return new RebalanceItem(id, proposal, strategy, currentAllocation, targetAllocation, amountToMove, movementDirection);
        }
    }
}
