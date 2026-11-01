import { network } from "hardhat";

async function main() {
    console.log("\n====================================");
    console.log("     YIELDPILOT WITHDRAWAL TEST");
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

    // Withdraw 80 USDC
    const withdrawalAmount = 80_000_000n;

    // 3. Connect to contracts
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

    console.log("Network: Sepolia");
    console.log("Deployer:", deployerAddress);
    console.log("Withdrawal amount: 80 USDC");

    // 4. Verify initial state
    console.log("\n1. Verifying initial state...");

    const owner = await vault.read.owner();
    const strategyRegistered = await manager.read.isRegistered([
        strategyAddress,
    ]);

    if (owner.toLowerCase() !== deployerAddress.toLowerCase()) {
        throw new Error("Deployer is not vault owner.");
    }

    if (!strategyRegistered) {
        throw new Error("Strategy is not registered.");
    }

    const managerBalanceBefore = await token.read.balanceOf([
        managerAddress,
    ]);

    const strategyBalanceBefore = await token.read.balanceOf([
        strategyAddress,
    ]);

    const walletBalanceBefore = await token.read.balanceOf([
        deployerAddress,
    ]);

    const sharesBefore = await vault.read.balanceOf([
        deployerAddress,
    ]);

    const totalAssetsBefore = await vault.read.totalAssets();

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
        "Vault shares:",
        sharesBefore.toString()
    );

    console.log(
        "Vault total assets:",
        totalAssetsBefore.toString()
    );

    // Guard against running this test in the wrong state.
    if (
        managerBalanceBefore !== 60_000_000n ||
        strategyBalanceBefore !== 50_000_000n ||
        totalAssetsBefore !== 110_000_000n ||
        sharesBefore !== 100_000_000n
    ) {
        throw new Error(
            "Unexpected initial state. Withdrawal test aborted."
        );
    }

    if (managerBalanceBefore >= withdrawalAmount) {
        throw new Error(
            "Manager has enough liquidity; this test would not exercise strategy withdrawal."
        );
    }

    if (
        managerBalanceBefore + strategyBalanceBefore <
        withdrawalAmount
    ) {
        throw new Error("Insufficient portfolio liquidity.");
    }

    // 5. Calculate expected shares to burn
    console.log("\n2. Calculating withdrawal...");

    const expectedShares = await vault.read.previewWithdraw([
        withdrawalAmount,
    ]);

    console.log(
        "Expected shares to burn:",
        expectedShares.toString()
    );

    // 6. Execute withdrawal
    console.log("\n3. Withdrawing 80 USDC...");

    const withdrawalHash = await vault.write.withdraw(
        [
            withdrawalAmount,
            deployerAddress,
            deployerAddress,
        ],
        { account: deployer.account }
    );

    console.log("Withdrawal transaction:", withdrawalHash);

    const receipt = await publicClient.waitForTransactionReceipt({
        hash: withdrawalHash,
    });

    if (receipt.status !== "success") {
        throw new Error("Withdrawal transaction failed.");
    }

    console.log("Withdrawal transaction successful.");

    // 7. Verify final balances
    console.log("\n4. Verifying final balances...");

    const managerBalanceAfter = await token.read.balanceOf([
        managerAddress,
    ]);

    const strategyBalanceAfter = await token.read.balanceOf([
        strategyAddress,
    ]);

    const walletBalanceAfter = await token.read.balanceOf([
        deployerAddress,
    ]);

    const sharesAfter = await vault.read.balanceOf([
        deployerAddress,
    ]);

    const totalAssetsAfter = await vault.read.totalAssets();

    const sharesBurned = sharesBefore - sharesAfter;
    const assetsReceived = walletBalanceAfter - walletBalanceBefore;

    console.log(
        "Manager balance:",
        managerBalanceAfter.toString()
    );

    console.log(
        "Strategy balance:",
        strategyBalanceAfter.toString()
    );

    console.log(
        "Wallet balance:",
        walletBalanceAfter.toString()
    );

    console.log(
        "Shares remaining:",
        sharesAfter.toString()
    );

    console.log(
        "Shares burned:",
        sharesBurned.toString()
    );

    console.log(
        "Vault total assets:",
        totalAssetsAfter.toString()
    );

    // 8. Assertions
    if (assetsReceived !== withdrawalAmount) {
        throw new Error("User did not receive the requested amount.");
    }

    if (sharesBurned !== expectedShares) {
        throw new Error("Unexpected number of shares burned.");
    }

    if (
        strategyBalanceAfter !==
        strategyBalanceBefore - 20_000_000n
    ) {
        throw new Error("Strategy withdrawal amount mismatch.");
    }

    if (managerBalanceAfter !== 0n) {
        throw new Error("Unexpected manager balance after withdrawal.");
    }

    if (
        totalAssetsAfter !==
        totalAssetsBefore - withdrawalAmount
    ) {
        throw new Error("Vault accounting mismatch after withdrawal.");
    }

    console.log("\n====================================");
    console.log("    WITHDRAWAL TEST SUCCESSFUL");
    console.log("====================================");

    console.log("User received: 80 USDC");
    console.log("Strategy supplied: 20 USDC");
    console.log("Remaining strategy assets: 30 USDC");

    console.log("\nWithdrawal transaction:");
    console.log(
        `https://sepolia.etherscan.io/tx/${withdrawalHash}`
    );

    console.log("\nStage 2 withdrawal test completed.");
}

main().catch((error) => {
    console.error("\nWithdrawal test failed:");
    console.error(error);
    process.exitCode = 1;
});