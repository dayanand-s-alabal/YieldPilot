package com.yieldpilot.repository;

import com.yieldpilot.entity.RebalanceItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RebalanceItemRepository extends JpaRepository<RebalanceItem, Long> {
    List<RebalanceItem> findByProposalId(Long proposalId);
}
