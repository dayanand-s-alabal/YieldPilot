package com.yieldpilot.service;

import com.yieldpilot.dto.RebalanceProposalResponse;
import com.yieldpilot.dto.RebalanceRequest;
import com.yieldpilot.rebalancing.RebalanceProposalService;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class RebalanceService {

    private final RebalanceProposalService proposalService;

    public RebalanceService(RebalanceProposalService proposalService) {
        this.proposalService = proposalService;
    }

    public List<RebalanceProposalResponse> getProposals() {
        return proposalService.getAllProposals();
    }

    public RebalanceProposalResponse evaluateAllocation() {
        return proposalService.evaluateAndCreateProposal(new RebalanceRequest());
    }

    public RebalanceProposalResponse executeProposal(Long id) {
        return proposalService.executeProposal(id);
    }
}
