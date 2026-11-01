import { network } from "hardhat";

async function main() {
    console.log("\n====================================");
    console.log("   YIELDPILOT TESTNET INTERACTION");
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
        throw new Error("Wrong network. This script must run on Sepolia.");
    }

    const deployerAddress = deployer.account.address;

    // -------------------------------------
    // 2. DEPLOYED CONTRACT ADDRESSES
    // -------------------------------------

    const tokenAddress =
        "0xc6564a37e63f64c67ceec6ed9b316aba2412d560";

    const managerAddress =
        "0x45bbf9eb0ca86cc2b8e401eb563a6a7d5c198638";

    const strategyAddress =
        "0x31496ee5524923efe196709bee47b9d10c30293f";

    const vaultAddress =
        "0x8048009d01f88a449206af1ec79d49938e21b4ed";

    // 100 USDC = 100 * 10^6 base units.
    const depositAmount = 100_000_000n;

    console.log("Network: Sepolia");
    console.log("Chain ID:", chainId);
    console.log("Deployer:", deployerAddress);

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

    const vault = await viem.getContractAt(
        "YieldVault",
        vaultAddress
    );

    // -------------------------------------
    // 4. VERIFY CONTRACT CONFIGURATION
    // -------------------------------------

    console.log("\n1. Verifying contract configuration...");

    const tokenOwner = await token.read.owner();
    const vaultOwner = await vault.read.owner();
    const configuredVault = await manager.read.vault();
    const registered = await manager.read.isRegistered([
        strategyAddress,
    ]);

    if (tokenOwner.toLowerCase() !== deployerAddress.toLowerCase()) {
        throw new Error("Deployer is not MockUSDC owner.");
    }

    if (vaultOwner.toLowerCase() !== deployerAddress.toLowerCase()) {
        throw new Error("Deployer is not YieldVault owner.");
    }

    if (configuredVault.toLowerCase() !== vaultAddress.toLowerCase()) {
        throw new Error("StrategyManager vault address mismatch.");
    }

    if (!registered) {
        throw new Error("MockStrategy is not registered.");
    }

    console.log("MockUSDC owner verified.");
    console.log("YieldVault owner verified.");
    console.log("StrategyManager vault verified.");
    console.log("MockStrategy registration verified.");

    // -------------------------------------
    // 5. CHECK INITIAL BALANCES
    // -------------------------------------

    console.log("\n2. Checking initial balances...");

    const walletBalanceBefore = await token.read.balanceOf([
        deployerAddress,
    ]);

    const sharesBefore = await vault.read.balanceOf([
        deployerAddress,
    ]);

    const totalAssetsBefore = await vault.read.totalAssets();

    console.log(
        "Wallet USDC balance (base units):",
        walletBalanceBefore.toString()
    );

    console.log(
        "Vault shares before deposit:",
        sharesBefore.toString()
    );

    console.log(
        "Vault total assets before deposit:",
        totalAssetsBefore.toString()
    );

    // -------------------------------------
    // 6. MINT TEST USDC IF REQUIRED
    // -------------------------------------

    console.log("\n3. Checking test USDC balance...");

    if (walletBalanceBefore < depositAmount) {
        const mintAmount = depositAmount - walletBalanceBefore;

        console.log(
            "Minting additional base units:",
            mintAmount.toString()
        );

        const mintHash = await token.write.mint(
            [deployerAddress, mintAmount],
            { account: deployer.account }
        );

        console.log("Mint transaction:", mintHash);

        const mintReceipt = await publicClient.waitForTransactionReceipt({
            hash: mintHash,
        });

        if (mintReceipt.status !== "success") {
            throw new Error("MockUSDC mint transaction failed.");
        }

        console.log("Test USDC minted successfully.");
    } else {
        console.log("Sufficient test USDC already available.");
    }

    const walletBalanceAfterMint = await token.read.balanceOf([
        deployerAddress,
    ]);

    if (walletBalanceAfterMint < depositAmount) {
        throw new Error("Insufficient USDC balance after mint.");
    }

    // -------------------------------------
    // 7. APPROVE YIELD VAULT
    // -------------------------------------

    console.log("\n4. Approving YieldVault...");

    const approveHash = await token.write.approve(
        [vaultAddress, depositAmount],
        { account: deployer.account }
    );

    console.log("Approval transaction:", approveHash);

    const approveReceipt = await publicClient.waitForTransactionReceipt({
        hash: approveHash,
    });

    if (approveReceipt.status !== "success") {
        throw new Error("USDC approval transaction failed.");
    }

    const allowance = await token.read.allowance([
        deployerAddress,
        vaultAddress,
    ]);

    if (allowance < depositAmount) {
        throw new Error("Vault allowance verification failed.");
    }

    console.log("Vault approval successful.");

    // -------------------------------------
    // 8. DEPOSIT INTO YIELD VAULT
    // -------------------------------------

    console.log("\n5. Depositing 100 MockUSDC...");

    const depositHash = await vault.write.deposit(
        [depositAmount, deployerAddress],
        { account: deployer.account }
    );

    console.log("Deposit transaction:", depositHash);

    const depositReceipt = await publicClient.waitForTransactionReceipt({
        hash: depositHash,
    });

    if (depositReceipt.status !== "success") {
        throw new Error("YieldVault deposit transaction failed.");
    }

    console.log("Deposit transaction successful.");

    // -------------------------------------
    // 9. VERIFY FINAL ACCOUNTING
    // -------------------------------------

    console.log("\n6. Verifying final balances...");

    const walletBalanceAfter = await token.read.balanceOf([
        deployerAddress,
    ]);

    const sharesAfter = await vault.read.balanceOf([
        deployerAddress,
    ]);

    const totalAssetsAfter = await vault.read.totalAssets();

    const managerBalance = await token.read.balanceOf([
        managerAddress,
    ]);

    const strategyBalance = await token.read.balanceOf([
        strategyAddress,
    ]);

    const sharesReceived = sharesAfter - sharesBefore;
    const assetsIncrease = totalAssetsAfter - totalAssetsBefore;

    if (sharesReceived <= 0n) {
        throw new Error("No vault shares were received.");
    }

    if (assetsIncrease < depositAmount) {
        throw new Error("Vault total assets did not increase as expected.");
    }

    if (walletBalanceAfter !== walletBalanceAfterMint - depositAmount) {
        throw new Error("Wallet token balance verification failed.");
    }

    if (managerBalance < depositAmount) {
        throw new Error("Manager balance is lower than expected.");
    }

    // -------------------------------------
    // 10. DISPLAY RESULTS
    // -------------------------------------

    console.log("\n====================================");
    console.log("       DEPOSIT TEST SUCCESSFUL");
    console.log("====================================");

    console.log("Deposited USDC base units:", depositAmount.toString());
    console.log("Shares received:", sharesReceived.toString());
    console.log("Wallet USDC after deposit:", walletBalanceAfter.toString());
    console.log("Manager USDC balance:", managerBalance.toString());
    console.log("Strategy USDC balance:", strategyBalance.toString());
    console.log("Vault total assets:", totalAssetsAfter.toString());

    console.log("\nDeposit transaction:");
    console.log(
        `https://sepolia.etherscan.io/tx/${depositHash}`
    );

    console.log("\nApproval transaction:");
    console.log(
        `https://sepolia.etherscan.io/tx/${approveHash}`
    );

    console.log("\nMint transaction was required only if your wallet");
    console.log("initially had insufficient test USDC.");

    console.log("\nStage 2 deposit test completed.");
}

main().catch((error) => {
    console.error("\nTestnet interaction failed:");
    console.error(error);
    process.exitCode = 1;
});