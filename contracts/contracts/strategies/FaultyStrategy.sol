// SPDX-License-Identifier: MIT
pragma solidity ^0.8.34;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

import {IStrategy} from "../interfaces/IStrategy.sol";

contract FaultyStrategy is IStrategy, Ownable {
    using SafeERC20 for IERC20;

    address public immutable override asset;
    address public override manager;

    bool public shouldRevertTotalAssets;

    modifier onlyManager() {
        require(msg.sender == manager, "Not manager");
        _;
    }

    constructor(address assetAddress) Ownable(msg.sender) {
        require(assetAddress != address(0), "Invalid asset");

        asset = assetAddress;
    }

    function setManager(address managerAddress) external onlyOwner {
        require(managerAddress != address(0), "Invalid manager");
        manager = managerAddress;
    }

    function setTotalAssetsFailure(bool shouldRevert)
        external
        onlyOwner
    {
        shouldRevertTotalAssets = shouldRevert;
    }

    function deposit(uint256 amount) external override onlyManager {
        require(amount > 0, "Invalid amount");

        IERC20(asset).safeTransferFrom(msg.sender, address(this), amount);
    }

    function withdraw(uint256 amount) external override onlyManager {
        require(amount > 0, "Invalid amount");

        IERC20(asset).safeTransfer(manager, amount);
    }

    function totalAssets() external view override returns (uint256) {
        require(
            !shouldRevertTotalAssets,
            "FaultyStrategy: totalAssets failed"
        );

        return IERC20(asset).balanceOf(address(this));
    }
}