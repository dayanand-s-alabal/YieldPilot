import { createPublicClient, http, formatUnits } from "viem";
import { sepolia } from "viem/chains";

/**
 * Stage 3 & 5: Real-time APY & Volatility Data Collector
 * Fetches yield rates across DeFi protocols (e.g. Aave, Compound),
 * calculates historical asset volatility, computes risk-weighted scores,
 * and feeds the data to RiskManager and RebalanceManager.
 */

export interface ProtocolYieldInfo {
    protocol: "Aave" | "Compound";
    asset: string;
    supplyApyPercent: number;
    rewardApyPercent: number;
    netApyPercent: number;
    timestamp: number;
}

export interface RiskComponents {
    volatilityRisk: number; // 0-100
    liquidityRisk: number;  // 0-100
    protocolRisk: number;   // 0-100
    withdrawalRisk: number; // 0-100
}

/**
 * Calculates historical sample volatility:
 * sigma = sqrt( 1 / (N - 1) * sum( (r_i - r_bar)^2 ) )
 */
export function calculateVolatility(returns: number[]): number {
    const N = returns.length;
    if (N < 2) return 0;

    const mean = returns.reduce((sum, r) => sum + r, 0) / N;
    const variance =
        returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / (N - 1);

    return Math.sqrt(variance);
}

/**
 * Calculates weighted risk score on a 0-100 scale:
 * RiskScore = (w1*V + w2*L + w3*P + w4*W) / 100
 */
export function calculateWeightedRiskScore(
    components: RiskComponents,
    weights = { volatility: 30, liquidity: 25, protocol: 25, withdrawal: 20 }
): number {
    const weightedSum =
        components.volatilityRisk * weights.volatility +
        components.liquidityRisk * weights.liquidity +
        components.protocolRisk * weights.protocol +
        components.withdrawalRisk * weights.withdrawal;

    return Math.round(weightedSum / 100);
}

/**
 * Simulates fetching live or testnet protocol APY data.
 */
export async function fetchProtocolApy(
    protocol: "Aave" | "Compound",
    asset = "USDC"
): Promise<ProtocolYieldInfo> {
    // In production, queries Aave PoolDataProvider / Compound Comet contract or subgraphs
    // Illustrative live market estimates:
    const baseRates: Record<string, { supply: number; reward: number }> = {
        Aave: { supply: 4.85, reward: 0.25 },
        Compound: { supply: 5.30, reward: 0.15 },
    };

    const rate = baseRates[protocol] || { supply: 4.0, reward: 0.0 };
    const net = rate.supply + rate.reward;

    return {
        protocol,
        asset,
        supplyApyPercent: rate.supply,
        rewardApyPercent: rate.reward,
        netApyPercent: net,
        timestamp: Date.now(),
    };
}

async function main() {
    console.log("=== YieldPilot APY & Volatility Data Collector ===");

    const aaveApy = await fetchProtocolApy("Aave", "USDC");
    const compoundApy = await fetchProtocolApy("Compound", "USDC");

    console.log(`[Aave V3] USDC Net APY: ${aaveApy.netApyPercent.toFixed(2)}% (Supply: ${aaveApy.supplyApyPercent}%, Reward: ${aaveApy.rewardApyPercent}%)`);
    console.log(`[Compound V3] USDC Net APY: ${compoundApy.netApyPercent.toFixed(2)}% (Supply: ${compoundApy.supplyApyPercent}%, Reward: ${compoundApy.rewardApyPercent}%)`);

    // Sample 10-day returns for volatility calculation
    const sampleReturns = [0.0001, -0.0002, 0.0003, -0.0001, 0.0002, 0.0001, -0.0003, 0.0002, -0.0001, 0.0001];
    const assetVol = calculateVolatility(sampleReturns);
    console.log(`Calculated Asset Volatility (sigma): ${(assetVol * 100).toFixed(4)}%`);

    // Calculate risk scores
    const aaveRisk = calculateWeightedRiskScore({
        volatilityRisk: 15,
        liquidityRisk: 10,
        protocolRisk: 20,
        withdrawalRisk: 15,
    });

    const compoundRisk = calculateWeightedRiskScore({
        volatilityRisk: 25,
        liquidityRisk: 30,
        protocolRisk: 35,
        withdrawalRisk: 20,
    });

    console.log(`Aave Strategy Risk Score: ${aaveRisk}/100`);
    console.log(`Compound Strategy Risk Score: ${compoundRisk}/100`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
    main().catch(console.error);
}
