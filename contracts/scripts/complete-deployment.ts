
import { network } from "hardhat";
import { mkdir, writeFile } from "node:fs/promises";

async function main() {
    console.log("\n====================================");
    console.log("    YIELDPILOT DEPLOYMENT RESUME");
    console.log("====================================\n");

    const connection = await network.connect();
    const viem = connection.viem;

    const wallets = await viem.getWalletClients();
    const deployer = wallets[0];

    if (!deployer) {
        throw new Error("Deployment wallet not found.");
    }

    const publicClient = await viem.getPublicClient();

    const chainId = await publicClient.getChainId();

    if (chainId !== 11155111) {
        throw new Error("This script must run on Sepolia.");
    }

    const deployerAddress = deployer.account.address;

    // Existing deployed contract addresses.
    const tokenAddress =
        "0xc6564a37e63f64c67ceec6ed9b316aba2412d560";

    const managerAddress =
        "0x45bbf9eb0ca86cc2b8e401eb563a6a7d5c198638";

    const strategyAddress =
        "0x31496ee5524923efe196709bee47b9d10c30293f";

    console.log("Deployer:", deployerAddress);
    console.log("Chain ID:", chainId);

    const token = await viem.getContractAt(
        "MockUSDC",
        tokenAddress
    );

    const manager = await viem.getContractAt(
        "StrategyManager",
        managerAddress
    );

    const strategy = await viem.getContractAt(
        "MockStrategy",
        strategyAddress
    );

    // -------------------------------------
    // 1. VERIFY EXISTING CONTRACTS
    // -------------------------------------

    console.log("\n1. Verifying existing contracts...");

    const managerOwner = await manager.read.owner();
    const strategyOwner = await strategy.read.owner();
    const strategyManager = await strategy.read.manager();

    const managerAsset = await manager.read.asset();
    const strategyAsset = await strategy.read.asset();

    if (managerOwner.toLowerCase() !== deployerAddress.toLowerCase()) {
        throw new Error("Deployer is not the StrategyManager owner.");
    }

    if (strategyOwner.toLowerCase() !== deployerAddress.toLowerCase()) {
        throw new Error("Deployer is not the MockStrategy owner.");
    }

    if (managerAsset.toLowerCase() !== tokenAddress.toLowerCase()) {
        throw new Error("StrategyManager asset mismatch.");
    }

    if (strategyAsset.toLowerCase() !== tokenAddress.toLowerCase()) {
        throw new Error("MockStrategy asset mismatch.");
    }

    console.log("Existing contracts verified.");

    // -------------------------------------
    // 2. VERIFY MANAGER CONFIGURATION
    // -------------------------------------

    console.log("\n2. Checking strategy manager configuration...");

    if (strategyManager.toLowerCase() !== managerAddress.toLowerCase()) {
        console.log("Updating strategy manager...");

        const hash = await strategy.write.setManager(
            [managerAddress],
            { account: deployer.account }
        );

        await publicClient.waitForTransactionReceipt({
            hash,
        });
    } else {
        console.log("Strategy manager already configured.");
    }

    const updatedManager = await strategy.read.manager();

    if (updatedManager.toLowerCase() !== managerAddress.toLowerCase()) {
        throw new Error("Strategy manager verification failed.");
    }

    console.log("Strategy manager verified.");

    // -------------------------------------
    // 3. REGISTER STRATEGY
    // -------------------------------------

    console.log("\n3. Registering strategy...");

    const alreadyRegistered = await manager.read.isRegistered([
        strategyAddress,
    ]);

    if (!alreadyRegistered) {
        const hash = await manager.write.registerStrategy(
            [strategyAddress, 5000n],
            { account: deployer.account }
        );

        console.log("Registration transaction:", hash);

        const receipt = await publicClient.waitForTransactionReceipt({
            hash,
        });

        if (receipt.status !== "success") {
            throw new Error("Strategy registration transaction failed.");
        }
    } else {
        console.log("Strategy is already registered.");
    }

    const registered = await manager.read.isRegistered([
        strategyAddress,
    ]);

    if (!registered) {
        throw new Error("Strategy registration verification failed.");
    }

    console.log("Strategy registered successfully.");

    // -------------------------------------
    // 4. DEPLOY YIELD VAULT
    // -------------------------------------

    console.log("\n4. Deploying YieldVault...");

    const vault = await viem.deployContract("YieldVault", [
        tokenAddress,
        managerAddress,
        deployerAddress,
    ]);

    console.log("YieldVault:", vault.address);

    // -------------------------------------
    // 5. INITIALIZE MANAGER
    // -------------------------------------

    console.log("\n5. Initializing StrategyManager...");

    const currentVault = await manager.read.vault();

    if (currentVault !== "0x0000000000000000000000000000000000000000") {
        throw new Error(
            `Manager already initialized with vault ${currentVault}.`
        );
    }

    const initializeHash = await manager.write.initializeVault(
        [vault.address],
        { account: deployer.account }
    );

    console.log("Initialization transaction:", initializeHash);

    const initializeReceipt =
        await publicClient.waitForTransactionReceipt({
            hash: initializeHash,
        });

    if (initializeReceipt.status !== "success") {
        throw new Error("Vault initialization failed.");
    }

    // -------------------------------------
    // 6. VERIFY DEPLOYMENT
    // -------------------------------------

    console.log("\n6. Verifying deployment...");

    const configuredVault = await manager.read.vault();
    const reserveBps = await manager.read.reserveBps();
    const allocationCap = await manager.read.allocationCapBps([
        strategyAddress,
    ]);

    if (
        configuredVault.toLowerCase() !== vault.address.toLowerCase()
    ) {
        throw new Error("Vault address verification failed.");
    }

    if (reserveBps !== 1000n || allocationCap !== 5000n) {
        throw new Error("Vault configuration verification failed.");
    }

    console.log("Vault initialized:", configuredVault);
    console.log("Strategy registered:", registered);
    console.log("Reserve:", reserveBps.toString(), "BPS");
    console.log("Allocation cap:", allocationCap.toString(), "BPS");

    // -------------------------------------
    // 7. SAVE DEPLOYMENT INFORMATION
    // -------------------------------------

    const deployment = {
        project: "YieldPilot",
        network: "sepolia",
        chainId,
        deployer: deployerAddress,
        contracts: {
            MockUSDC: tokenAddress,
            StrategyManager: managerAddress,
            MockStrategy: strategyAddress,
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
    console.log("    YIELDPILOT DEPLOYMENT COMPLETE");
    console.log("====================================");

    console.log(JSON.stringify(deployment, null, 2));

    console.log("\nSaved to deployments/sepolia.json");
}

main().catch((error) => {
    console.error("\nDeployment resume failed:");
    console.error(error);
    process.exitCode = 1;
});
