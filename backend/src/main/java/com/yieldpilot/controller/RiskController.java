package com.yieldpilot.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/v1/risk")
@CrossOrigin(origins = "*")
public class RiskController {

    private final Map<String, Integer> customScores = new HashMap<>();

    @GetMapping("/scores")
    public ResponseEntity<Map<String, Object>> getRiskScores() {
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("maxThreshold", 70);

        Map<String, Integer> weights = new LinkedHashMap<>();
        weights.put("volatility", 30);
        weights.put("liquidity", 25);
        weights.put("protocol", 25);
        weights.put("withdrawal", 20);
        response.put("weights", weights);

        Map<String, Object> strategies = new LinkedHashMap<>();

        Map<String, Object> mock = new LinkedHashMap<>();
        mock.put("score", customScores.getOrDefault("mock", 28));
        mock.put("volatilityRisk", 20);
        mock.put("liquidityRisk", 30);
        mock.put("protocolRisk", 35);
        mock.put("withdrawalRisk", 25);
        mock.put("eligible", true);
        mock.put("riskLevel", "Low");
        strategies.put("MockStrategy", mock);

        Map<String, Object> aave = new LinkedHashMap<>();
        aave.put("score", customScores.getOrDefault("aave", 22));
        aave.put("volatilityRisk", 15);
        aave.put("liquidityRisk", 15);
        aave.put("protocolRisk", 20);
        aave.put("withdrawalRisk", 40);
        aave.put("eligible", true);
        aave.put("riskLevel", "Very Low");
        strategies.put("Aave V3", aave);

        Map<String, Object> compound = new LinkedHashMap<>();
        compound.put("score", customScores.getOrDefault("compound", 45));
        compound.put("volatilityRisk", 35);
        compound.put("liquidityRisk", 40);
        compound.put("protocolRisk", 50);
        compound.put("withdrawalRisk", 50);
        compound.put("eligible", true);
        compound.put("riskLevel", "Medium");
        strategies.put("Compound V3", compound);

        response.put("strategies", strategies);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/scores/{strategyId}")
    public ResponseEntity<Map<String, Object>> updateRiskScore(
            @PathVariable String strategyId,
            @RequestBody Map<String, Object> body) {
        Number score = (Number) body.getOrDefault("score", 30);
        customScores.put(strategyId.toLowerCase(), score.intValue());

        Map<String, Object> res = new HashMap<>();
        res.put("strategyId", strategyId);
        res.put("updatedScore", score.intValue());
        res.put("status", "SUCCESS");
        return ResponseEntity.ok(res);
    }
}
