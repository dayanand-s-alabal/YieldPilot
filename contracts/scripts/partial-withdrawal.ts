import { network } from "hardhat";

async function main() {
    console.log("\n====================================");
    console.log("    YIELDPILOT PARTIAL WITHDRAWAL");
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

    // Withdraw exactly 20 USDC.
    const withdrawalAmount = 20_000_000n;

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

    console.log("Network: Sepolia");
    console.log("Deployer:", deployerAddress);
    console.log("Withdrawal amount: 20 USDC");

    // 4. Verify current state
    console.log("\n1. Checking current portfolio...");

    const owner = await vault.read.owner();

    if (owner.toLowerCase() !== deployerAddress.toLowerCase()) {
        throw new Error("Deployer is not the vault owner.");
    }

    const walletBefore = await token.read.balanceOf([
        deployerAddress,
    ]);

    const managerBefore = await token.read.balanceOf([
        managerAddress,
    ]);

    const strategyBefore = await token.read.balanceOf([
        strategyAddress,
    ]);

    const sharesBefore = await vault.read.balanceOf([
        deployerAddress,
    ]);

    const totalAssetsBefore = await vault.read.totalAssets();

    console.log("Wallet balance:", walletBefore.toString());
    console.log("Manager balance:", managerBefore.toString());
    console.log("Strategy balance:", strategyBefore.toString());
    console.log("Vault shares:", sharesBefore.toString());
    console.log("Vault total assets:", totalAssetsBefore.toString());

    // Safety checks: ensure this is the intended test state.
    if (
        walletBefore !== 80_000_000n ||
        managerBefore !== 0n ||
        strategyBefore !== 30_000_000n ||
        sharesBefore !== 27_272_727n ||
        totalAssetsBefore !== 30_000_000n
    ) {
        throw new Error(
            "Unexpected portfolio state. Partial withdrawal aborted."
        );
    }

    // 5. Calculate the shares required
    console.log("\n2. Calculating required shares...");

    const expectedShares = await vault.read.previewWithdraw([
        withdrawalAmount,
    ]);

    if (expectedShares >= sharesBefore) {
        throw new Error(
            "Withdrawal would consume all remaining shares."
        );
    }

    console.log(
        "Shares expected to burn:",
        expectedShares.toString()
    );

    // 6. Execute partial withdrawal
    console.log("\n3. Executing partial withdrawal...");

    const withdrawalHash = await vault.write.withdraw(
        [
            withdrawalAmount,
            deployerAddress,
            deployerAddress,
        ],
        { account: deployer.account }
    );

    console.log("Transaction:", withdrawalHash);

    const receipt = await publicClient.waitForTransactionReceipt({
        hash: withdrawalHash,
    });

    if (receipt.status !== "success") {
        throw new Error("Partial withdrawal transaction failed.");
    }

    console.log("Partial withdrawal successful.");

    // 7. Verify final balances
    console.log("\n4. Verifying final portfolio...");

    const walletAfter = await token.read.balanceOf([
        deployerAddress,
    ]);

    const managerAfter = await token.read.balanceOf([
        managerAddress,
    ]);

    const strategyAfter = await token.read.balanceOf([
        strategyAddress,
    ]);

    const sharesAfter = await vault.read.balanceOf([
        deployerAddress,
    ]);

    const totalAssetsAfter = await vault.read.totalAssets();

    const received = walletAfter - walletBefore;
    const sharesBurned = sharesBefore - sharesAfter;

    // 8. Validate accounting
    if (received !== withdrawalAmount) {
        throw new Error("Wallet did not receive exactly 20 USDC.");
    }

    if (sharesBurned !== expectedShares) {
        throw new Error("Unexpected number of shares burned.");
    }

    if (managerAfter !== 0n) {
        throw new Error("Unexpected manager balance.");
    }

    if (strategyAfter !== 10_000_000n) {
        throw new Error("Unexpected remaining strategy balance.");
    }

    if (totalAssetsAfter !== 10_000_000n) {
        throw new Error("Unexpected remaining vault assets.");
    }

    if (sharesAfter === 0n) {
        throw new Error("All shares were unexpectedly redeemed.");
    }

    console.log("\n====================================");
    console.log("   PARTIAL WITHDRAWAL SUCCESSFUL");
    console.log("====================================");

    console.log(
        "Wallet MockUSDC:",
        walletAfter.toString()
    );

    console.log(
        "StrategyManager:",
        managerAfter.toString()
    );

    console.log(
        "MockStrategy:",
        strategyAfter.toString()
    );

    console.log(
        "Remaining vault shares:",
        sharesAfter.toString()
    );

    console.log(
        "Remaining vault assets:",
        totalAssetsAfter.toString()
    );

    console.log("\nWithdrawal transaction:");
    console.log(
        `https://sepolia.etherscan.io/tx/${withdrawalHash}`
    );

    console.log("\nPartial withdrawal test completed.");
}

main().catch((error) => {
    console.error("\nPartial withdrawal failed:");
    console.error(error);
    process.exitCode = 1;
});