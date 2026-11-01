import { network } from "hardhat";

async function main() {
    console.log("\n====================================");
    console.log("      YIELDPILOT YIELD SIMULATION");
    console.log("====================================\n");

    // -------------------------------------
    // 1. CONNECT TO SEPOLIA
    // -------------------------------------

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

    // -------------------------------------
    // 2. CONTRACT ADDRESSES
    // -------------------------------------

    const tokenAddress =
        "0xc6564a37e63f64c67ceec6ed9b316aba2412d560";

    const managerAddress =
        "0x45bbf9eb0ca86cc2b8e401eb563a6a7d5c198638";

    const strategyAddress =
        "0x31496ee5524923efe196709bee47b9d10c30293f";

    const vaultAddress =
        "0x8048009d01f88a449206af1ec79d49938e21b4ed";

    // 10 USDC = 10 * 10^6 base units
    const yieldAmount = 10_000_000n;

    console.log("Network: Sepolia");
    console.log("Deployer:", deployerAddress);
    console.log("Simulated yield: 10 USDC");

    // -------------------------------------
    // 3. CONNECT TO CONTRACTS
    // -------------------------------------

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

    const vault = await viem.getContractAt(
        "YieldVault",
        vaultAddress
    );

    // -------------------------------------
    // 4. VERIFY OWNERSHIP AND CONFIGURATION
    // -------------------------------------

    console.log("\n1. Verifying contract configuration...");

    const tokenOwner = await token.read.owner();
    const strategyOwner = await strategy.read.owner();
    const vaultAddressFromManager = await manager.read.vault();

    if (tokenOwner.toLowerCase() !== deployerAddress.toLowerCase()) {
        throw new Error("Deployer is not MockUSDC owner.");
    }

    if (strategyOwner.toLowerCase() !== deployerAddress.toLowerCase()) {
        throw new Error("Deployer is not MockStrategy owner.");
    }

    if (
        vaultAddressFromManager.toLowerCase() !==
        vaultAddress.toLowerCase()
    ) {
        throw new Error("StrategyManager vault mismatch.");
    }

    console.log("Token ownership verified.");
    console.log("Strategy ownership verified.");
    console.log("Vault configuration verified.");

    // -------------------------------------
    // 5. CHECK INITIAL PORTFOLIO
    // -------------------------------------

    console.log("\n2. Reading initial portfolio...");

    const managerBalanceBefore = await token.read.balanceOf([
        managerAddress,
    ]);

    const strategyBalanceBefore = await token.read.balanceOf([
        strategyAddress,
    ]);

    const walletBalanceBefore = await token.read.balanceOf([
        deployerAddress,
    ]);

    const totalAssetsBefore = await vault.read.totalAssets();

    const sharesBefore = await vault.read.balanceOf([
        deployerAddress,
    ]);

    const shareValueBefore = await vault.read.convertToAssets([
        1_000_000n,
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
        "Wallet balance:",
        walletBalanceBefore.toString()
    );

    console.log(
        "Vault total assets:",
        totalAssetsBefore.toString()
    );

    console.log(
        "Vault shares:",
        sharesBefore.toString()
    );

    console.log(
        "Assets represented by 1 share:",
        shareValueBefore.toString()
    );

    // Prevent accidental repeated yield simulation.
    if (
        managerBalanceBefore !== 60_000_000n ||
        strategyBalanceBefore !== 40_000_000n ||
        totalAssetsBefore !== 100_000_000n ||
        sharesBefore !== 100_000_000n
    ) {
        throw new Error(
            "Unexpected initial portfolio state. Aborting yield simulation."
        );
    }

    // -------------------------------------
    // 6. MINT ADDITIONAL MOCK USDC
    // -------------------------------------

    console.log("\n3. Minting 10 additional MockUSDC...");

    const mintHash = await token.write.mint(
        [deployerAddress, yieldAmount],
        { account: deployer.account }
    );

    console.log("Mint transaction:", mintHash);

    const mintReceipt = await publicClient.waitForTransactionReceipt({
        hash: mintHash,
    });

    if (mintReceipt.status !== "success") {
        throw new Error("Yield funding mint failed.");
    }

    console.log("Additional 10 USDC minted.");

    // -------------------------------------
    // 7. APPROVE MOCK STRATEGY
    // -------------------------------------

    console.log("\n4. Approving MockStrategy...");

    const approveHash = await token.write.approve(
        [strategyAddress, yieldAmount],
        { account: deployer.account }
    );

    console.log("Approval transaction:", approveHash);

    const approveReceipt = await publicClient.waitForTransactionReceipt({
        hash: approveHash,
    });

    if (approveReceipt.status !== "success") {
        throw new Error("Strategy approval failed.");
    }

    const allowance = await token.read.allowance([
        deployerAddress,
        strategyAddress,
    ]);

    if (allowance < yieldAmount) {
        throw new Error("Strategy allowance verification failed.");
    }

    console.log("MockStrategy approval successful.");

    // -------------------------------------
    // 8. SIMULATE YIELD
    // -------------------------------------

    console.log("\n5. Simulating 10 USDC yield...");

    const yieldHash = await strategy.write.simulateYield(
        [yieldAmount],
        { account: deployer.account }
    );

    console.log("Yield transaction:", yieldHash);

    const yieldReceipt = await publicClient.waitForTransactionReceipt({
        hash: yieldHash,
    });

    if (yieldReceipt.status !== "success") {
        throw new Error("Yield simulation transaction failed.");
    }

    console.log("Yield simulation successful.");

    // -------------------------------------
    // 9. VERIFY UPDATED PORTFOLIO
    // -------------------------------------

    console.log("\n6. Verifying updated portfolio...");

    const managerBalanceAfter = await token.read.balanceOf([
        managerAddress,
    ]);

    const strategyBalanceAfter = await token.read.balanceOf([
        strategyAddress,
    ]);

    const walletBalanceAfter = await token.read.balanceOf([
        deployerAddress,
    ]);

    const totalAssetsAfter = await vault.read.totalAssets();

    const sharesAfter = await vault.read.balanceOf([
        deployerAddress,
    ]);

    const shareValueAfter = await vault.read.convertToAssets([
        1_000_000n,
    ]);

    const managedAssetsAfter = await manager.read.totalManagedAssets();

    // -------------------------------------
    // 10. ACCOUNTING ASSERTIONS
    // -------------------------------------

    if (managerBalanceAfter !== managerBalanceBefore) {
        throw new Error("Manager balance changed unexpectedly.");
    }

    if (
        strategyBalanceAfter !==
        strategyBalanceBefore + yieldAmount
    ) {
        throw new Error("Strategy yield balance verification failed.");
    }

    if (walletBalanceAfter !== 0n) {
        throw new Error("Wallet should have transferred its yield funding.");
    }

    if (totalAssetsAfter !== totalAssetsBefore + yieldAmount) {
        throw new Error("Vault total assets verification failed.");
    }

    if (sharesAfter !== sharesBefore) {
        throw new Error("Vault share supply changed unexpectedly.");
    }

    if (shareValueAfter <= shareValueBefore) {
        throw new Error("Vault share value did not increase.");
    }

    if (managedAssetsAfter !== totalAssetsAfter) {
        throw new Error("Managed assets and vault accounting mismatch.");
    }

    // -------------------------------------
    // 11. DISPLAY RESULTS
    // -------------------------------------

    console.log("\n====================================");
    console.log("       YIELD TEST SUCCESSFUL");
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
        "Assets represented by 1 share:",
        shareValueAfter.toString()
    );

    console.log(
        "Total portfolio increase:",
        (totalAssetsAfter - totalAssetsBefore).toString()
    );

    console.log("\nYield transaction:");
    console.log(
        `https://sepolia.etherscan.io/tx/${yieldHash}`
    );

    console.log("\nStage 2 yield simulation completed.");
}

main().catch((error) => {
    console.error("\nYield simulation failed:");
    console.error(error);
    process.exitCode = 1;
});
