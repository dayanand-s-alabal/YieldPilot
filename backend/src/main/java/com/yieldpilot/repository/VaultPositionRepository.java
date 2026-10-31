package com.yieldpilot.repository;

import com.yieldpilot.entity.VaultPosition;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface VaultPositionRepository extends JpaRepository<VaultPosition, Long> {

    Optional<VaultPosition> findByVaultIdAndWalletAddress(Long vaultId, String walletAddress);

    Optional<VaultPosition> findByWalletAddress(String walletAddress);

    List<VaultPosition> findByVaultId(Long vaultId);

    long countBySharesGreaterThan(BigDecimal threshold);
}
