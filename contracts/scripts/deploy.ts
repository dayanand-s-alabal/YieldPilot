
import { network } from "hardhat";
import { mkdir, writeFile } from "node:fs/promises";

async function main() {
    console.log("\n====================================");
    console.log("       YIELDPILOT DEPLOYMENT");
    console.log("====================================\n");

    // Connect to the network selected by Hardhat CLI.
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

    // Prevent accidental deployment to the wrong network.
    if (chainId !== 11155111) {
        throw new Error(
            `Wrong network! Expected Sepolia (11155111), received ${chainId}.`
        );
    }

    console.log("Network: Sepolia");
    console.log("Chain ID:", chainId);
    console.log("Deployer:", deployerAddress);

    // -------------------------------------
    // 1. DEPLOY MOCK USDC
    // -------------------------------------

    console.log("\n1. Deploying MockUSDC...");

    const token = await viem.deployContract("MockUSDC", [
        deployerAddress,
    ]);

    console.log("MockUSDC:", token.address);

    // -------------------------------------
    // 2. DEPLOY STRATEGY MANAGER
    // -------------------------------------

    console.log("\n2. Deploying StrategyManager...");

    const manager = await viem.deployContract("StrategyManager", [
        token.address,
        deployerAddress,
        1000n, // 10% liquid reserve
    ]);

    console.log("StrategyManager:", manager.address);

    // -------------------------------------
    // 3. DEPLOY MOCK STRATEGY
    // -------------------------------------

    console.log("\n3. Deploying MockStrategy...");

    const strategy = await viem.deployContract("MockStrategy", [
        token.address,
    ]);

    console.log("MockStrategy:", strategy.address);

    // Connect strategy to manager.
    console.log("Connecting MockStrategy to StrategyManager...");

    await strategy.write.setManager(
        [manager.address],
        { account: deployer.account }
    );

    // Register strategy with a 50% allocation cap.
    console.log("Registering strategy...");

    await manager.write.registerStrategy(
        [strategy.address, 5000n],
        { account: deployer.account }
    );

    // -------------------------------------
    // 4. DEPLOY YIELD VAULT
    // -------------------------------------

    console.log("\n4. Deploying YieldVault...");

    const vault = await viem.deployContract("YieldVault", [
        token.address,
        manager.address,
        deployerAddress,
    ]);

    console.log("YieldVault:", vault.address);

    // -------------------------------------
    // 5. INITIALIZE VAULT
    // -------------------------------------

    console.log("\n5. Initializing StrategyManager...");

    await manager.write.initializeVault(
        [vault.address],
        { account: deployer.account }
    );

    console.log("Vault successfully initialized.");

    // -------------------------------------
    // 6. VERIFY DEPLOYED CONFIGURATION
    // -------------------------------------

    console.log("\n6. Verifying deployment...");

    const registered = await manager.read.isRegistered([
        strategy.address,
    ]);

    const configuredVault = await manager.read.vault();
    const reserveBps = await manager.read.reserveBps();
    const allocationCap = await manager.read.allocationCapBps([
        strategy.address,
    ]);

    if (!registered) {
        throw new Error("Strategy registration verification failed.");
    }

    if (
        configuredVault.toLowerCase() !== vault.address.toLowerCase()
    ) {
        throw new Error("Vault initialization verification failed.");
    }

    if (reserveBps !== 1000n || allocationCap !== 5000n) {
        throw new Error("Strategy configuration verification failed.");
    }

    console.log("Strategy registered:", registered);
    console.log("Configured vault:", configuredVault);
    console.log("Reserve:", reserveBps.toString(), "BPS");
    console.log("Allocation cap:", allocationCap.toString(), "BPS");

    // -------------------------------------
    // 7. SAVE DEPLOYMENT ADDRESSES
    // -------------------------------------

    const deployment = {
        project: "YieldPilot",
        network: "sepolia",
        chainId,
        deployer: deployerAddress,
        contracts: {
            MockUSDC: token.address,
            StrategyManager: manager.address,
            MockStrategy: strategy.address,
            YieldVault: vault.address,
        },
        configuration: {
            reserveBps: reserveBps.toString(),
            strategyAllocationCapBps: allocationCap.toString(),
        },
        deployedAt: new Date().toISOString(),
    };

    await mkdir("deployments", { recursive: true });

    await writeFile(
        "deployments/sepolia.json",
        JSON.stringify(deployment, null, 2),
        "utf-8"
    );

    console.log("\n====================================");
    console.log("       DEPLOYMENT SUCCESSFUL");
    console.log("====================================");

    console.log("\nDeployment addresses:");
    console.log(JSON.stringify(deployment.contracts, null, 2));

    console.log("\nSaved to deployments/sepolia.json");
}

main().catch((error) => {
    console.error("\nDeployment failed:");
    console.error(error);
    process.exitCode = 1;
});
