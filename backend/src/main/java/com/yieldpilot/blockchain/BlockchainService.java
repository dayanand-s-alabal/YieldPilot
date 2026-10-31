package com.yieldpilot.blockchain;

import org.springframework.stereotype.Service;

@Service
public class BlockchainService {
    public String getNetworkStatus() {
        return "Connected to Hardhat Localhost (Chain ID: 31337)";
    }
}