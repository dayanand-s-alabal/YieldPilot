
import { network } from "hardhat";

async function main() {
    const connection = await network.connect();
    const viem = connection.viem;

    const managerAddress =
        "0x45bbf9eb0ca86cc2b8e401eb563a6a7d5c198638";

    const strategyAddress =
        "0x31496ee5524923efe196709bee47b9d10c30293f";

    const manager = await viem.getContractAt(
        "StrategyManager",
        managerAddress
    );

    const strategy = await viem.getContractAt(
        "MockStrategy",
        strategyAddress
    );

    console.log("\n--- ON-CHAIN CONFIGURATION ---");

    console.log(
        "Manager owner:",
        await manager.read.owner()
    );

    console.log(
        "Strategy owner:",
        await strategy.read.owner()
    );

    console.log(
        "Strategy manager:",
        await strategy.read.manager()
    );

    console.log(
        "Expected manager:",
        managerAddress
    );

    console.log(
        "Strategy asset:",
        await strategy.read.asset()
    );

    console.log(
        "Manager asset:",
        await manager.read.asset()
    );

    console.log(
        "Manager registration:",
        await manager.read.isRegistered([
            strategyAddress
        ])
    );
}

main().catch(console.error);
