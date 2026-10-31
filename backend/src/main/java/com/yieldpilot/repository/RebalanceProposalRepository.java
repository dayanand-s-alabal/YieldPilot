package com.yieldpilot.repository;

import com.yieldpilot.entity.RebalanceProposal;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RebalanceProposalRepository extends JpaRepository<RebalanceProposal, Long> {
    List<RebalanceProposal> findAllByOrderByCreatedAtDesc();
    List<RebalanceProposal> findByStatusOrderByCreatedAtDesc(String status);
    List<RebalanceProposal> findByVaultIdOrderByCreatedAtDesc(Long vaultId);
}
