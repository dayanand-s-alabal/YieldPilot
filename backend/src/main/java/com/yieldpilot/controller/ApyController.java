package com.yieldpilot.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/v1/apy")
@CrossOrigin(origins = "*")
public class ApyController {

    @GetMapping("/current")
    public ResponseEntity<Map<String, Object>> getCurrentApy() {
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("timestamp", System.currentTimeMillis());
        response.put("asset", "USDC");

        List<Map<String, Object>> protocols = new ArrayList<>();

        Map<String, Object> aave = new LinkedHashMap<>();
        aave.put("protocol", "Aave V3");
        aave.put("supplyApyPercent", 4.85);
        aave.put("rewardApyPercent", 0.25);
        aave.put("netApyPercent", 5.10);
        aave.put("riskLevel", "Low");
        aave.put("riskScore", 22);
        protocols.add(aave);

        Map<String, Object> compound = new LinkedHashMap<>();
        compound.put("protocol", "Compound V3");
        compound.put("supplyApyPercent", 5.30);
        compound.put("rewardApyPercent", 0.15);
        compound.put("netApyPercent", 5.45);
        compound.put("riskLevel", "Medium");
        compound.put("riskScore", 45);
        protocols.add(compound);

        Map<String, Object> mock = new LinkedHashMap<>();
        mock.put("protocol", "MockStrategy (Alpha)");
        mock.put("supplyApyPercent", 6.20);
        mock.put("rewardApyPercent", 0.0);
        mock.put("netApyPercent", 6.20);
        mock.put("riskLevel", "Low-Medium");
        mock.put("riskScore", 28);
        protocols.add(mock);

        response.put("protocols", protocols);
        response.put("recommendedStrategy", "Aave V3 (Optimal risk-adjusted yield)");

        return ResponseEntity.ok(response);
    }
}
