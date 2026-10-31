package com.yieldpilot.rebalancing;

import com.yieldpilot.dto.AllocationResponse;
import com.yieldpilot.dto.RebalanceProposalResponse;
import com.yieldpilot.dto.RebalanceRequest;
import com.yieldpilot.entity.*;
import com.yieldpilot.exception.ResourceNotFoundException;
import com.yieldpilot.repository.RebalanceItemRepository;
import com.yieldpilot.repository.RebalanceProposalRepository;
import com.yieldpilot.repository.StrategyRepository;
import com.yieldpilot.repository.VaultTransactionRepository;
import com.yieldpilot.service.VaultService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class RebalanceProposalService {

    private final RebalanceProposalRepository proposalRepository;
    private final RebalanceItemRepository itemRepository;
    private final VaultService vaultService;
    private final RebalanceEvaluator rebalanceEvaluator;
    private final StrategyRepository strategyRepository;
    private final VaultTransactionRepository transactionRepository;

    public RebalanceProposalService(RebalanceProposalRepository proposalRepository,
                                    RebalanceItemRepository itemRepository,
                                    VaultService vaultService,
                                    RebalanceEvaluator rebalanceEvaluator,
                                    StrategyRepository strategyRepository,
                                    VaultTransactionRepository transactionRepository) {
        this.proposalRepository = proposalRepository;
        this.itemRepository = itemRepository;
        this.vaultService = vaultService;
        this.rebalanceEvaluator = rebalanceEvaluator;
        this.strategyRepository = strategyRepository;
        this.transactionRepository = transactionRepository;
    }

    @Transactional
    public RebalanceProposalResponse evaluateAndCreateProposal(RebalanceRequest request) {
        Vault vault = vaultService.getOrCreateDefaultVault();
        RebalanceEvaluator.EvaluationResult eval = rebalanceEvaluator.evaluateVault(vault, request);


        RebalanceProposal proposal = RebalanceProposal.builder()
                .vault(vault)
                .status("GENERATED")
                .totalAssets(vault.getTotalAssets())
                .expectedNetBenefit(eval.getExpectedNetBenefit())
                .estimatedCost(eval.getEstimatedCost())
                .decisionReason(eval.getDecisionReason())
                .description("Dynamic Yield Rebalancing Proposal [" + eval.getRecommendation() + "]")
                .riskWarning("Execution involves multi-strategy routing and automated vault allocation adjustment.")
                .createdAt(LocalDateTime.now())
                .expiresAt(LocalDateTime.now().plusHours(24))
                .build();


        RebalanceProposal saved = proposalRepository.save(proposal);

        for (AllocationResponse itemDto : eval.getItems()) {
            Strategy strategy = strategyRepository.findById(itemDto.getStrategyId()).orElse(null);
            if (strategy != null) {
                RebalanceItem item = RebalanceItem.builder()
                        .proposal(saved)
                        .strategy(strategy)
                        .currentAllocation(itemDto.getCurrentAllocationAmount())
                        .targetAllocation(itemDto.getTargetAllocationAmount())
                        .amountToMove(itemDto.getAmountToMove())
                        .movementDirection(itemDto.getMovementDirection())
                        .build();
                itemRepository.save(item);
                saved.addItem(item);
            }
        }

        return mapToResponse(saved, eval.getItems(), eval.getRecommendation());
    }

    @Transactional(readOnly = true)
    public List<RebalanceProposalResponse> getAllProposals() {
        return proposalRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public RebalanceProposalResponse getProposalById(Long id) {
        RebalanceProposal proposal = proposalRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Rebalance proposal not found with ID: " + id));
        return mapToResponse(proposal);
    }

    @Transactional
    public RebalanceProposalResponse approveProposal(Long id) {
        RebalanceProposal proposal = proposalRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Rebalance proposal not found with ID: " + id));

        // Safety check: Cannot approve already approved or executed proposal
        if ("APPROVED".equalsIgnoreCase(proposal.getStatus())) {
            throw new IllegalStateException("Proposal has already been approved.");
        }
        if ("EXECUTED".equalsIgnoreCase(proposal.getStatus())) {
            throw new IllegalStateException("Proposal has already been executed.");
        }
        if ("REJECTED".equalsIgnoreCase(proposal.getStatus())) {
            throw new IllegalStateException("Proposal was previously rejected.");
        }

        // Expiration check
        if (proposal.getExpiresAt() != null && proposal.getExpiresAt().isBefore(LocalDateTime.now())) {
            proposal.setStatus("EXPIRED");
            proposalRepository.save(proposal);
            throw new IllegalStateException("Proposal has expired and cannot be approved.");
        }

        proposal.setStatus("APPROVED");
        proposal.setApprovedAt(LocalDateTime.now());
        RebalanceProposal saved = proposalRepository.save(proposal);
        return mapToResponse(saved);
    }

    @Transactional
    public RebalanceProposalResponse rejectProposal(Long id, String reason) {
        RebalanceProposal proposal = proposalRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Rebalance proposal not found with ID: " + id));

        if ("EXECUTED".equalsIgnoreCase(proposal.getStatus())) {
            throw new IllegalStateException("Executed proposal cannot be rejected.");
        }

        proposal.setStatus("REJECTED");
        if (reason != null && !reason.trim().isEmpty()) {
            proposal.setDecisionReason(proposal.getDecisionReason() + " | Rejection note: " + reason.trim());
        }
        RebalanceProposal saved = proposalRepository.save(proposal);
        return mapToResponse(saved);
    }

    @Transactional
    public RebalanceProposalResponse executeProposal(Long id) {
        RebalanceProposal proposal = proposalRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Rebalance proposal not found with ID: " + id));

        // Prevent duplicate execution
        if ("EXECUTED".equalsIgnoreCase(proposal.getStatus())) {
            throw new IllegalStateException("Proposal has already been executed. Duplicate execution prevented.");
        }
        if ("REJECTED".equalsIgnoreCase(proposal.getStatus())) {
            throw new IllegalStateException("Cannot execute a rejected proposal.");
        }

        // Check expiration
        if (proposal.getExpiresAt() != null && proposal.getExpiresAt().isBefore(LocalDateTime.now())) {
            proposal.setStatus("EXPIRED");
            proposalRepository.save(proposal);
            throw new IllegalStateException("Proposal has expired. Cannot execute.");
        }

        // Execute: update strategy allocations based on proposal items
        BigDecimal totalMoveAmount = BigDecimal.ZERO;
        List<RebalanceItem> items = itemRepository.findByProposalId(proposal.getId());

        for (RebalanceItem item : items) {
            Strategy strategy = item.getStrategy();
            if (strategy != null) {
                if (proposal.getTotalAssets().compareTo(BigDecimal.ZERO) > 0) {
                    double targetPercent = item.getTargetAllocation()
                            .divide(proposal.getTotalAssets(), 4, BigDecimal.ROUND_HALF_UP)
                            .multiply(BigDecimal.valueOf(100)).doubleValue();
                    strategy.setAllocationPercentage(targetPercent);
                    strategyRepository.save(strategy);
                }
                totalMoveAmount = totalMoveAmount.add(item.getAmountToMove());
            }
        }

        proposal.setStatus("EXECUTED");
        proposal.setExecutedAt(LocalDateTime.now());
        RebalanceProposal saved = proposalRepository.save(proposal);

        // Record a transaction for the vault history
        VaultTransaction transaction = VaultTransaction.builder()
                .vault(proposal.getVault())
                .transactionType("REBALANCE")
                .assetAmount(totalMoveAmount)
                .shareAmount(BigDecimal.ZERO)
                .status("CONFIRMED")
                .source("SIMULATED")
                .transactionHash("0x" + UUID.randomUUID().toString().replace("-", "").substring(0, 32))
                .createdAt(LocalDateTime.now())
                .build();
        transactionRepository.save(transaction);

        return mapToResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<RebalanceProposalResponse> getRebalanceHistory() {
        return proposalRepository.findAllByOrderByCreatedAtDesc().stream()
                .filter(p -> "EXECUTED".equalsIgnoreCase(p.getStatus()) ||
                             "APPROVED".equalsIgnoreCase(p.getStatus()) ||
                             "REJECTED".equalsIgnoreCase(p.getStatus()))
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    private RebalanceProposalResponse mapToResponse(RebalanceProposal p) {
        List<RebalanceItem> items = itemRepository.findByProposalId(p.getId());
        List<AllocationResponse> itemDtos = items.stream().map(it -> {
            Strategy s = it.getStrategy();
            double apy = s != null && s.getCurrentApy() != null ? s.getCurrentApy() : 0.0;
            int risk = s != null && s.getRiskScore() != null ? s.getRiskScore() : 2;
            double currentPct = s != null ? s.getAllocationPercentage() : 0.0;
            double targetPct = p.getTotalAssets().compareTo(BigDecimal.ZERO) > 0
                    ? it.getTargetAllocation().divide(p.getTotalAssets(), 4, BigDecimal.ROUND_HALF_UP).multiply(BigDecimal.valueOf(100)).doubleValue()
                    : 0.0;

            return AllocationResponse.builder()
                    .strategyId(s != null ? s.getId() : it.getStrategyId())
                    .strategyName(s != null ? s.getName() : "Strategy " + it.getStrategyId())
                    .currentApy(apy)
                    .riskScore(risk)
                    .currentAllocationPercent(currentPct)
                    .targetAllocationPercent(targetPct)
                    .currentAllocationAmount(it.getCurrentAllocation())
                    .targetAllocationAmount(it.getTargetAllocation())
                    .amountToMove(it.getAmountToMove())
                    .movementDirection(it.getMovementDirection())
                    .build();
        }).collect(Collectors.toList());

        String recommendation = p.getExpectedNetBenefit().compareTo(BigDecimal.ZERO) > 0 ? "REBALANCE" : "HOLD";
        return mapToResponse(p, itemDtos, recommendation);
    }

    private RebalanceProposalResponse mapToResponse(RebalanceProposal p, List<AllocationResponse> items, String recommendation) {
        return RebalanceProposalResponse.builder()
                .id(p.getId())
                .vaultId(p.getVaultId())
                .status(p.getStatus())
                .totalAssets(p.getTotalAssets())
                .expectedNetBenefit(p.getExpectedNetBenefit())
                .estimatedBenefit(p.getEstimatedBenefit())
                .estimatedCost(p.getEstimatedCost())
                .transactionCost(p.getTransactionCost())
                .decisionReason(p.getDecisionReason())
                .recommendation(recommendation)
                .description(p.getDescription())
                .reason(p.getReason())
                .riskWarning(p.getRiskWarning())
                .createdAt(p.getCreatedAt())
                .expiresAt(p.getExpiresAt())
                .approvedAt(p.getApprovedAt())
                .executedAt(p.getExecutedAt())
                .items(items)
                .build();
    }
}
