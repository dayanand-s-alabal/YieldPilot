package com.yieldpilot.controller;

import com.yieldpilot.dto.RebalanceProposalResponse;
import com.yieldpilot.dto.RebalanceRequest;
import com.yieldpilot.rebalancing.RebalanceProposalService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/rebalance")
@CrossOrigin(origins = "*")
public class RebalanceController {

    private final RebalanceProposalService proposalService;

    public RebalanceController(RebalanceProposalService proposalService) {
        this.proposalService = proposalService;
    }

    @PostMapping("/evaluate")
    public ResponseEntity<RebalanceProposalResponse> evaluate(@RequestBody(required = false) RebalanceRequest request) {
        if (request == null) {
            request = new RebalanceRequest();
        }
        return ResponseEntity.ok(proposalService.evaluateAndCreateProposal(request));
    }

    @GetMapping("/proposals")
    public ResponseEntity<List<RebalanceProposalResponse>> getProposals() {
        return ResponseEntity.ok(proposalService.getAllProposals());
    }

    @GetMapping("/proposals/{id}")
    public ResponseEntity<RebalanceProposalResponse> getProposalById(@PathVariable Long id) {
        return ResponseEntity.ok(proposalService.getProposalById(id));
    }

    @PostMapping("/proposals/{id}/approve")
    public ResponseEntity<RebalanceProposalResponse> approveProposal(@PathVariable Long id) {
        return ResponseEntity.ok(proposalService.approveProposal(id));
    }

    @PostMapping("/proposals/{id}/reject")
    public ResponseEntity<RebalanceProposalResponse> rejectProposal(@PathVariable Long id,
                                                                   @RequestBody(required = false) Map<String, String> body) {
        String reason = body != null ? body.get("reason") : null;
        return ResponseEntity.ok(proposalService.rejectProposal(id, reason));
    }

    @GetMapping("/history")
    public ResponseEntity<List<RebalanceProposalResponse>> getRebalanceHistory() {
        return ResponseEntity.ok(proposalService.getRebalanceHistory());
    }

    @PostMapping("/proposals/{id}/execute")
    public ResponseEntity<RebalanceProposalResponse> executeProposal(@PathVariable Long id) {
        return ResponseEntity.ok(proposalService.executeProposal(id));
    }
}
