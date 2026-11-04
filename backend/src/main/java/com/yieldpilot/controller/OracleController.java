package com.yieldpilot.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/v1/oracle")
@CrossOrigin(origins = "*")
public class OracleController {

    @GetMapping("/prices")
    public ResponseEntity<Map<String, Object>> getOraclePrices() {
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("network", "Sepolia");
        response.put("timestamp", System.currentTimeMillis());

        Map<String, Object> feed = new LinkedHashMap<>();
        feed.put("pair", "USDC / USD");
        feed.put("price", 1.0001);
        feed.put("decimals", 8);
        feed.put("feedAddress", "0xA2F78ab2355fe2f984D808B5CeE7FD0A93D5270E");
        feed.put("roundId", "18446744073709562411");
        feed.put("updatedAgoSeconds", 36);
        feed.put("freshness", "FRESH");

        response.put("feed", feed);
        return ResponseEntity.ok(response);
    }
}
