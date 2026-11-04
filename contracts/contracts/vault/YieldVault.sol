// SPDX-License-Identifier: MIT
pragma solidity ^0.8.34;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ERC4626} from "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";

interface IStrategyManager {
    function asset() external view returns (IERC20);

    function vault() external view returns (address);

    function totalManagedAssets() external view returns (uint256);

    function allocate(address strategy, uint256 amount) external;

    function fund(uint256 amount) external;

    function withdrawToVault(uint256 amount) external;
}

contract YieldVault is ERC4626, Ownable, Pausable {
    using SafeERC20 for IERC20;

    IStrategyManager public immutable strategyManager;
    address public emergencyManager;

    event AssetsTransferredToManager(uint256 amount);
    event AssetsRetrievedFromManager(uint256 amount);
    event AssetsAllocatedToStrategy(address indexed strategy, uint256 amount);
    event EmergencyManagerUpdated(address indexed emergencyManager);

    constructor(
        IERC20 assetToken,
        address managerAddress,
        address initialOwner
    )
        ERC20("YieldPilot Vault Share", "ypSHARE")
        ERC4626(assetToken)
        Ownable(initialOwner)
    {
        require(managerAddress != address(0), "Invalid manager");

        IStrategyManager manager = IStrategyManager(managerAddress);

        require(
            address(manager.asset()) == address(assetToken),
            "Asset mismatch"
        );

        strategyManager = manager;
    }

    function setEmergencyManager(address _emergencyManager) external onlyOwner {
        emergencyManager = _emergencyManager;
        emit EmergencyManagerUpdated(_emergencyManager);
    }

    function pause() external {
        require(
            msg.sender == owner() ||
                (emergencyManager != address(0) && msg.sender == emergencyManager),
            "Unauthorized pause caller"
        );
        _pause();
    }

    function unpause() external {
        require(
            msg.sender == owner() ||
                (emergencyManager != address(0) && msg.sender == emergencyManager),
            "Unauthorized unpause caller"
        );
        _unpause();
    }

    // Total portfolio assets:
    // Vault-held assets + manager-held and strategy assets.
    function totalAssets() public view override returns (uint256) {
        return
            IERC20(asset()).balanceOf(address(this)) +
            strategyManager.totalManagedAssets();
    }

    function allocateToStrategy(
        address strategy,
        uint256 amount
    ) external onlyOwner whenNotPaused {
        require(amount > 0, "Invalid amount");

        strategyManager.allocate(strategy, amount);

        emit AssetsAllocatedToStrategy(strategy, amount);
    }

    // After ERC4626 transfers assets from the user and mints shares,
    // move the deposited assets to StrategyManager.
    function _deposit(
        address caller,
        address receiver,
        uint256 assets,
        uint256 shares
    ) internal override whenNotPaused {
        super._deposit(caller, receiver, assets, shares);

        IERC20 token = IERC20(asset());

        token.forceApprove(address(strategyManager), assets);
        strategyManager.fund(assets);

        emit AssetsTransferredToManager(assets);
    }

    // Retrieve any shortfall from the manager before ERC4626
    // transfers assets to the withdrawal receiver.
    function _withdraw(
        address caller,
        address receiver,
        address owner_,
        uint256 assets,
        uint256 shares
    ) internal override {
        uint256 vaultBalance = IERC20(asset()).balanceOf(address(this));

        if (assets > vaultBalance) {
            uint256 shortfall = assets - vaultBalance;

            strategyManager.withdrawToVault(shortfall);

            emit AssetsRetrievedFromManager(shortfall);
        }

        super._withdraw(
            caller,
            receiver,
            owner_,
            assets,
            shares
        );
    }
}
