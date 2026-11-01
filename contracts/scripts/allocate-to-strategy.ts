import { network } from "hardhat";

async function main() {
    console.log("\n====================================");
    console.log("   YIELDPILOT STRATEGY ALLOCATION");
    console.log("====================================\n");

    // 1. Connect to Sepolia
    const connection = await network.connect();
    const viem = connection.viem;

    const wallets = await viem.getWalletClients();
    const deployer = wallets[0];

    if (!deployer) {
        throw new Error("Deployer wallet not found.");
    }

    const publicClient = await viem.getPublicClient();

    const chainId = await publicClient.getChainId();

    if (chainId !== 11155111) {
        throw new Error("This script must run on Sepolia.");
    }

    const deployerAddress = deployer.account.address;

    // 2. Contract addresses
    const tokenAddress =
        "0xc6564a37e63f64c67ceec6ed9b316aba2412d560";

    const managerAddress =
        "0x45bbf9eb0ca86cc2b8e401eb563a6a7d5c198638";

    const strategyAddress =
        "0x31496ee5524923efe196709bee47b9d10c30293f";

    const vaultAddress =
        "0x8048009d01f88a449206af1ec79d49938e21b4ed";

    // 40 USDC = 40 * 10^6 base units
    const allocationAmount = 40_000_000n;

    // 3. Connect to contracts
    const token = await viem.getContractAt(
        "MockUSDC",
        tokenAddress
    );

    const manager = await viem.getContractAt(
        "StrategyManager",
        managerAddress
    );

    const vault = await viem.getContractAt(
        "YieldVault",
        vaultAddress
    );

    const strategy = await viem.getContractAt(
        "MockStrategy",
        strategyAddress
    );

    console.log("Network: Sepolia");
    console.log("Deployer:", deployerAddress);
    console.log("Allocation amount: 40 USDC");

    // 4. Verify configuration
    console.log("\n1. Verifying configuration...");

    const vaultOwner = await vault.read.owner();
    const registered = await manager.read.isRegistered([
        strategyAddress,
    ]);

    const configuredVault = await manager.read.vault();
    const strategyManager = await strategy.read.manager();

    const reserveBps = await manager.read.reserveBps();

    const allocationCapBps = await manager.read.allocationCapBps([
        strategyAddress,
    ]);

    if (vaultOwner.toLowerCase() !== deployerAddress.toLowerCase()) {
        throw new Error("Deployer is not the vault owner.");
    }

    if (!registered) {
        throw new Error("Strategy is not registered.");
    }

    if (configuredVault.toLowerCase() !== vaultAddress.toLowerCase()) {
        throw new Error("Vault address mismatch.");
    }

    if (strategyManager.toLowerCase() !== managerAddress.toLowerCase()) {
        throw new Error("Strategy manager mismatch.");
    }

    if (reserveBps !== 1000n) {
        throw new Error("Unexpected reserve configuration.");
    }

    if (allocationCapBps !== 5000n) {
        throw new Error("Unexpected allocation cap.");
    }

    console.log("Contract configuration verified.");

    // 5. Read initial balances
    console.log("\n2. Reading initial portfolio balances...");

    const managerBalanceBefore = await token.read.balanceOf([
        managerAddress,
    ]);

    const strategyBalanceBefore = await token.read.balanceOf([
        strategyAddress,
    ]);

    const totalAssetsBefore = await vault.read.totalAssets();

    const sharesBefore = await vault.read.balanceOf([
        deployerAddress,
    ]);

    console.log(
        "Manager balance:",
        managerBalanceBefore.toString()
    );

    console.log(
        "Strategy balance:",
        strategyBalanceBefore.toString()
    );

    console.log(
        "Vault total assets:",
        totalAssetsBefore.toString()
    );

    console.log(
        "Vault shares:",
        sharesBefore.toString()
    );

    // Prevent accidental repeated allocation.
    if (strategyBalanceBefore !== 0n) {
        throw new Error(
            "Strategy already holds assets. Aborting to prevent duplicate allocation."
        );
    }

    // 6. Check allocation constraints
    console.log("\n3. Checking allocation constraints...");

    if (managerBalanceBefore < allocationAmount) {
        throw new Error("Insufficient manager liquidity.");
    }

    const portfolioValue = await manager.read.totalManagedAssets();

    const requiredReserve =
        (portfolioValue * reserveBps) / 10000n;

    const maximumStrategyAssets =
        (portfolioValue * allocationCapBps) / 10000n;

    if (
        managerBalanceBefore - allocationAmount <
        requiredReserve
    ) {
        throw new Error("Allocation would violate reserve requirement.");
    }

    if (allocationAmount > maximumStrategyAssets) {
        throw new Error("Allocation exceeds strategy cap.");
    }

    console.log(
        "Minimum required reserve:",
        requiredReserve.toString()
    );

    console.log(
        "Maximum strategy allocation:",
        maximumStrategyAssets.toString()
    );

    console.log("Allocation constraints passed.");

    // 7. Allocate through YieldVault
    console.log("\n4. Allocating 40 USDC to MockStrategy...");

    const allocationHash = await vault.write.allocateToStrategy(
        [strategyAddress, allocationAmount],
        { account: deployer.account }
    );

    console.log("Allocation transaction:", allocationHash);

    const receipt = await publicClient.waitForTransactionReceipt({
        hash: allocationHash,
    });

    if (receipt.status !== "success") {
        throw new Error("Strategy allocation transaction failed.");
    }

    console.log("Allocation transaction successful.");

    // 8. Verify final balances
    console.log("\n5. Verifying final portfolio...");

    const managerBalanceAfter = await token.read.balanceOf([
        managerAddress,
    ]);

    const strategyBalanceAfter = await token.read.balanceOf([
        strategyAddress,
    ]);

    const totalAssetsAfter = await vault.read.totalAssets();

    const sharesAfter = await vault.read.balanceOf([
        deployerAddress,
    ]);

    const managedAssetsAfter = await manager.read.totalManagedAssets();

    if (
        managerBalanceAfter !==
        managerBalanceBefore - allocationAmount
    ) {
        throw new Error("Manager balance verification failed.");
    }

    if (
        strategyBalanceAfter !==
        strategyBalanceBefore + allocationAmount
    ) {
        throw new Error("Strategy balance verification failed.");
    }

    if (totalAssetsAfter !== totalAssetsBefore) {
        throw new Error("Portfolio total assets changed unexpectedly.");
    }

    if (sharesAfter !== sharesBefore) {
        throw new Error("Vault shares changed unexpectedly.");
    }

    if (managedAssetsAfter !== totalAssetsAfter) {
        throw new Error("Managed assets and vault accounting mismatch.");
    }

    // 9. Display results
    console.log("\n====================================");
    console.log("    ALLOCATION TEST SUCCESSFUL");
    console.log("====================================");

    console.log(
        "Manager balance:",
        managerBalanceAfter.toString()
    );

    console.log(
        "Strategy balance:",
        strategyBalanceAfter.toString()
    );

    console.log(
        "Vault total assets:",
        totalAssetsAfter.toString()
    );

    console.log(
        "Vault shares:",
        sharesAfter.toString()
    );

    console.log(
        "Managed portfolio assets:",
        managedAssetsAfter.toString()
    );

    console.log("\nAllocation transaction:");
    console.log(
        `https://sepolia.etherscan.io/tx/${allocationHash}`
    );

    console.log("\nStage 2 allocation test completed.");
}

main().catch((error) => {
    console.error("\nStrategy allocation failed:");
    console.error(error);
    process.exitCode = 1;
});