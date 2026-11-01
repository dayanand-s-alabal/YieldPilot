
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.34;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IStrategy} from "../interfaces/IStrategy.sol";

contract MaliciousStrategy is IStrategy, Ownable {
    using SafeERC20 for IERC20;

    address public immutable override asset;
    address public override manager;

    bool public revertOnDeposit;
    bool public revertOnWithdraw;
    bool public revertOnTotalAssets;

    bool public useReportedAssets;
    uint256 public reportedAssets;

    uint256 public withdrawalAmountOverride;

    modifier onlyManager() {
        require(msg.sender == manager, "Not authorized manager");
        _;
    }

    constructor(address assetAddress) Ownable(msg.sender) {
        require(assetAddress != address(0), "Invalid asset");

        asset = assetAddress;
        manager = msg.sender;
    }

    function setManager(address newManager) external onlyOwner {
        require(newManager != address(0), "Invalid manager");
        manager = newManager;
    }

    function configureFailures(
        bool depositFailure,
        bool withdrawalFailure,
        bool valuationFailure
    ) external onlyOwner {
        revertOnDeposit = depositFailure;
        revertOnWithdraw = withdrawalFailure;
        revertOnTotalAssets = valuationFailure;
    }

    function setReportedAssets(
        bool enabled,
        uint256 amount
    ) external onlyOwner {
        useReportedAssets = enabled;
        reportedAssets = amount;
    }

    function setWithdrawalAmountOverride(
        uint256 amount
    ) external onlyOwner {
        withdrawalAmountOverride = amount;
    }

    function totalAssets() external view override returns (uint256) {
        require(
            !revertOnTotalAssets,
            "MaliciousStrategy: valuation failed"
        );

        if (useReportedAssets) {
            return reportedAssets;
        }

        return IERC20(asset).balanceOf(address(this));
    }

    function deposit(uint256 amount) external override onlyManager {
        require(
            !revertOnDeposit,
            "MaliciousStrategy: deposit failed"
        );

        require(amount > 0, "Invalid amount");

        IERC20(asset).safeTransferFrom(
            msg.sender,
            address(this),
            amount
        );
    }

    function withdraw(uint256 amount) external override onlyManager {
        require(
            !revertOnWithdraw,
            "MaliciousStrategy: withdrawal failed"
        );

        require(amount > 0, "Invalid amount");

        uint256 transferAmount = withdrawalAmountOverride == 0
            ? amount
            : withdrawalAmountOverride;

        IERC20(asset).safeTransfer(manager, transferAmount);
    }
}
