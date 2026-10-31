package com.yieldpilot.controller;

import com.yieldpilot.blockchain.BlockchainService;
import com.yieldpilot.dto.*;
import com.yieldpilot.entity.VaultTransaction;
import com.yieldpilot.service.VaultService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1")
@CrossOrigin(origins = "*")
public class VaultController {

    private final VaultService vaultService;
    private final BlockchainService blockchainService;

    public VaultController(VaultService vaultService, BlockchainService blockchainService) {
        this.vaultService = vaultService;
        this.blockchainService = blockchainService;
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> healthCheck() {
        return ResponseEntity.ok(Map.of(
            "status", "UP",
            "blockchain", blockchainService.getNetworkStatus()
        ));
    }

    @GetMapping("/vault/summary")
    public ResponseEntity<VaultSummaryResponse> getVaultSummary() {
        return ResponseEntity.ok(vaultService.getVaultSummary());
    }

    @GetMapping("/vault/positions/{address}")
    public ResponseEntity<UserPositionResponse> getPosition(@PathVariable String address) {
        return ResponseEntity.ok(vaultService.getUserPosition(address));
    }

    @GetMapping("/vault/transactions")
    public ResponseEntity<List<TransactionResponse>> getTransactions() {
        return ResponseEntity.ok(vaultService.getTransactions());
    }

    @GetMapping("/vault/transactions/{address}")
    public ResponseEntity<List<TransactionResponse>> getTransactionsByWallet(@PathVariable String address) {
        return ResponseEntity.ok(vaultService.getTransactionsByWallet(address));
    }

    @PostMapping("/vault/simulate/deposit")
    public ResponseEntity<TransactionResponse> simulateDeposit(@Valid @RequestBody DepositRequest request) {
        return ResponseEntity.ok(vaultService.simulateDeposit(request));
    }

    @PostMapping("/vault/simulate/withdraw")
    public ResponseEntity<TransactionResponse> simulateWithdraw(@Valid @RequestBody WithdrawalRequest request) {
        return ResponseEntity.ok(vaultService.simulateWithdraw(request));
    }

    // Frontend compatibility endpoints
    @PostMapping("/vault/deposit")
    public ResponseEntity<VaultTransaction> deposit(@RequestBody TransactionRequest request) {
        return ResponseEntity.ok(vaultService.deposit(request));
    }

    @PostMapping("/vault/withdraw")
    public ResponseEntity<VaultTransaction> withdraw(@RequestBody TransactionRequest request) {
        return ResponseEntity.ok(vaultService.withdraw(request));
    }
}
