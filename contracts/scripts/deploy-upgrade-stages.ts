import { network } from "hardhat";
import { mkdir, writeFile } from "node:fs/promises";

/**
 * Script to deploy the 5 new modules / 6 stages:
 * 1. PriceOracle (Chainlink Data Feed integration)
 * 2. RiskManager (Multi-factor risk scoring engine)
 * 3. RebalanceManager (Automated threshold & drift rebalancer, Chainlink Automation Keeper)
 * 4. AaveStrategy & CompoundStrategy adapters
 */
async function main() {
    console.log("\n=======================================================");
    console.log("       YIELDPILOT UPGRADE DEPLOYMENT (STAGES 1 - 6)    ");
    console.log("=======================================================\n");

    const connection = await network.connect();
    const viem = connection.viem;
    const wallets = await viem.getWalletClients();

    if (wallets.length === 0) {
        throw new Error("No deployment wallet available.");
    }

    const deployer = wallets[0];
    const deployerAddress = deployer.account.address;
    const publicClient = await viem.getPublicClient();
    const chainId = await publicClient.getChainId();

    console.log("Network Chain ID:", chainId);
    console.log("Deployer:", deployerAddress);

    // Existing Sepolia addresses (or configured in deployments/sepolia.json)
    const MOCK_USDC_SEPOLIA = "0xc6564a37e63f64c67ceec6ed9b316aba2412d560";
    const STRATEGY_MANAGER_SEPOLIA = "0x45bbf9eb0ca86cc2b8e401eb563a6a7d5c198638";
    // Chainlink official Sepolia USDC/USD feed: 0xA2F78ab2355fe2f984D808B5CeE7FD0A93D5270E
    const CHAINLINK_SEPOLIA_USDC_FEED = "0xA2F78ab2355fe2f984D808B5CeE7FD0A93D5270E";

    // 1. Deploy PriceOracle
    console.log("\n1. Deploying PriceOracle...");
    // DEBUG: Check deployer balance and gas affordability
const balance = await publicClient.getBalance({
  address: deployerAddress,
});

const fees = await publicClient.estimateFeesPerGas();

const block = await publicClient.getBlock();

const maxFeePerGas =
  fees.maxFeePerGas ?? fees.gasPrice ?? 0n;

const affordableGas =
  maxFeePerGas > 0n ? balance / maxFeePerGas : 0n;

console.log("\n========== DEPLOYMENT DIAGNOSTICS ==========");
console.log("Deployer:", deployerAddress);
console.log("Balance (ETH):", Number(balance) / 1e18);
console.log("Balance (wei):", balance.toString());
console.log("Max fee per gas (wei):", maxFeePerGas.toString());
console.log("Affordable gas:", affordableGas.toString());
console.log("Current block gas limit:", block.gasLimit.toString());
console.log("============================================\n");
    const oracle = await viem.deployContract("PriceOracle", [deployerAddress]);
    console.log("PriceOracle deployed at:", oracle.address);

    // Configure feed on PriceOracle
    console.log("Configuring USDC price feed...");
    await oracle.write.setPriceFeed(
        [MOCK_USDC_SEPOLIA, CHAINLINK_SEPOLIA_USDC_FEED, 3600n],
        { account: deployer.account }
    );
    console.log("USDC Price feed linked.");

    // 2. Deploy RiskManager
    console.log("\n2. Deploying RiskManager (threshold: 70/100)...");
    const riskManager = await viem.deployContract("RiskManager", [
        deployerAddress,
        70n,
    ]);
    console.log("RiskManager deployed at:", riskManager.address);

    await riskManager.write.setStrategyManager(
        [STRATEGY_MANAGER_SEPOLIA],
        { account: deployer.account }
    );
    console.log("StrategyManager linked to RiskManager.");

    // 3. Deploy RebalanceManager
    console.log("\n3. Deploying RebalanceManager...");
    const rebalanceManager = await viem.deployContract("RebalanceManager", [
        STRATEGY_MANAGER_SEPOLIA,
        riskManager.address,
        deployerAddress,
    ]);
    console.log("RebalanceManager deployed at:", rebalanceManager.address);

    // Set 5% rebalance threshold (500 bps)
    await rebalanceManager.write.setRebalanceThresholdBps([500n], {
        account: deployer.account,
    });
    console.log("Rebalance threshold set to 5% (500 BPS)");

    // 4. Deploy Aave & Compound Strategies (adapters)
    console.log("\n4. Deploying AaveStrategy...");
    const aaveStrategy = await viem.deployContract("AaveStrategy", [
        MOCK_USDC_SEPOLIA,
        deployerAddress,
    ]);
    console.log("AaveStrategy deployed at:", aaveStrategy.address);

    console.log("Deploying CompoundStrategy...");
    const compoundStrategy = await viem.deployContract("CompoundStrategy", [
        MOCK_USDC_SEPOLIA,
        deployerAddress,
    ]);
    console.log("CompoundStrategy deployed at:", compoundStrategy.address);

    // Save deployment record
    const deploymentRecord = {
        network: chainId === 11155111 ? "sepolia" : "local",
        chainId,
        deployer: deployerAddress,
        contracts: {
            PriceOracle: oracle.address,
            RiskManager: riskManager.address,
            RebalanceManager: rebalanceManager.address,
            AaveStrategy: aaveStrategy.address,
            CompoundStrategy: compoundStrategy.address,
        },
        parameters: {
            rebalanceThresholdBps: 500,
            maxRiskScoreThreshold: 70,
            riskWeights: { volatility: 30, liquidity: 25, protocol: 25, withdrawal: 20 },
            feedAddress: CHAINLINK_SEPOLIA_USDC_FEED,
        },
        deployedAt: new Date().toISOString(),
    };

    await mkdir("./deployments", { recursive: true });
    await writeFile(
        "./deployments/upgrade-stages.json",
        JSON.stringify(deploymentRecord, null, 2)
    );
    console.log("\nDeployment record saved to deployments/upgrade-stages.json");
    console.log("=======================================================\n");
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
