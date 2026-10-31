package com.yieldpilot.repository;

import com.yieldpilot.entity.VaultTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface VaultTransactionRepository extends JpaRepository<VaultTransaction, Long> {

    List<VaultTransaction> findByWalletAddressOrderByCreatedAtDesc(String walletAddress);

    List<VaultTransaction> findByVaultIdOrderByCreatedAtDesc(Long vaultId);

    List<VaultTransaction> findAllByOrderByCreatedAtDesc();

    Optional<VaultTransaction> findByTransactionHash(String transactionHash);

    boolean existsByTransactionHash(String transactionHash);
}
