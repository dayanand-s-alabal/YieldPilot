package com.yieldpilot.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/v1/emergency")
@CrossOrigin(origins = "*")
public class EmergencyController {

    private boolean vaultPaused = false;
    private final List<Map<String, Object>> recoveryLogs = new ArrayList<>();
    private final Map<String, Boolean> excludedStrategies = new HashMap<>();

    public EmergencyController() {
        // Seed default recovery incident for demo
        Map<String, Object> incident = new LinkedHashMap<>();
        incident.put("id", 1);
        incident.put("timestamp", LocalDateTime.now().minusHours(6).toString());
        incident.put("strategy", "Compound V3 Adapter (Testnet)");
        incident.put("reason", "Simulated Risk Breach: Protocol Risk score reached 74/100");
        incident.put("requestedAmountUSD", 500.00);
        incident.put("recoveredAmountUSD", 350.00);
        incident.put("lockedAmountUSD", 150.00);
        incident.put("status", "Partially Recovered - $150 locked in Comet pool awaiting borrower repayment");
        incident.put("fullyRecovered", false);
        recoveryLogs.add(incident);
    }

    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> getEmergencyStatus() {
        Map<String, Object> status = new LinkedHashMap<>();
        status.put("vaultEmergencyPaused", vaultPaused);
        status.put("emergencyRiskThreshold", 70);
        status.put("maxApyStaleHours", 24);

        // Oracle Health Check
        Map<String, Object> oracle = new LinkedHashMap<>();
        oracle.put("feedStatus", "ONLINE");
        oracle.put("lastPriceUSD", 1.0001);
        oracle.put("maxDeviationThresholdBps", 300);
        oracle.put("volatilityCircuitBreakerTripped", false);
        status.put("oracleHealth", oracle);

        // APY Staleness
        Map<String, Object> apyHealth = new LinkedHashMap<>();
        apyHealth.put("lastHeartbeat", LocalDateTime.now().minusMinutes(12).toString());
        apyHealth.put("isStale", false);
        status.put("apyHealth", apyHealth);

        // Strategy Exclusion States
        Map<String, Object> strategyExclusions = new LinkedHashMap<>();
        strategyExclusions.put("Aave V3", excludedStrategies.getOrDefault("Aave V3", false));
        strategyExclusions.put("Compound V3", excludedStrategies.getOrDefault("Compound V3", false));
        status.put("excludedStrategies", strategyExclusions);

        status.put("recoveryLogsCount", recoveryLogs.size());

        return ResponseEntity.ok(status);
    }

    @GetMapping("/logs")
    public ResponseEntity<List<Map<String, Object>>> getRecoveryLogs() {
        return ResponseEntity.ok(recoveryLogs);
    }

    @PostMapping("/pause")
    public ResponseEntity<Map<String, Object>> toggleVaultPause(@RequestParam(defaultValue = "Emergency action triggered by operator") String reason) {
        vaultPaused = !vaultPaused;
        Map<String, Object> res = new LinkedHashMap<>();
        res.put("vaultEmergencyPaused", vaultPaused);
        res.put("reason", reason);
        res.put("timestamp", LocalDateTime.now().toString());
        return ResponseEntity.ok(res);
    }

    @PostMapping("/evaluate")
    public ResponseEntity<Map<String, Object>> evaluateRisk(@RequestParam String strategy, @RequestParam int riskScore) {
        boolean triggered = riskScore > 70;
        excludedStrategies.put(strategy, triggered);

        if (triggered) {
            Map<String, Object> incident = new LinkedHashMap<>();
            incident.put("id", recoveryLogs.size() + 1);
            incident.put("timestamp", LocalDateTime.now().toString());
            incident.put("strategy", strategy);
            incident.put("reason", "Automated exclusion: Risk score of " + riskScore + "/100 exceeded safety threshold (70/100)");
            incident.put("requestedAmountUSD", 400.00);
            incident.put("recoveredAmountUSD", 400.00);
            incident.put("lockedAmountUSD", 0.00);
            incident.put("status", "Fully Recovered into Vault Reserve");
            incident.put("fullyRecovered", true);
            recoveryLogs.add(0, incident);
        }

        Map<String, Object> res = new LinkedHashMap<>();
        res.put("strategy", strategy);
        res.put("riskScore", riskScore);
        res.put("emergencyTriggered", triggered);
        res.put("excluded", triggered);
        return ResponseEntity.ok(res);
    }
}
