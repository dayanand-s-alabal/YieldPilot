
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.34;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract MockStrategy is Ownable {
    using SafeERC20 for IERC20;

    IERC20 public immutable asset;

    address public manager;

    bool public withdrawalsEnabled = true;

    // Maximum amount allowed in a single withdrawal.
    // Zero means no additional withdrawal limit.
    uint256 public maxWithdrawalAmount;
    uint256 public withdrawalPayoutBps = 10_000;

    event Deposited(uint256 amount);
    event Withdrawn(uint256 amount);
    event YieldAdded(uint256 amount);
    event LossSimulated(uint256 amount);
    event WithdrawalPayoutUpdated(uint256 payoutBps);

    event ManagerUpdated(
        address indexed oldManager,
        address indexed newManager
    );

    event WithdrawalStatusChanged(bool enabled);

    event WithdrawalLimitUpdated(uint256 newLimit);

    modifier onlyManager() {
        require(
            msg.sender == manager,
            "Not authorized manager"
        );
        _;
    }

    constructor(address assetAddress)
        Ownable(msg.sender)
    {
        require(
            assetAddress != address(0),
            "Invalid asset"
        );

        asset = IERC20(assetAddress);
        manager = msg.sender;
    }

    // Returns the total assets currently held by this strategy.
    function totalAssets() external view returns (uint256) {
        return asset.balanceOf(address(this));
    }

    // Only the manager can deposit assets.
    function deposit(uint256 amount) external onlyManager {
        require(
            amount > 0,
            "Amount must be greater than zero"
        );

        asset.safeTransferFrom(
            msg.sender,
            address(this),
            amount
        );

        emit Deposited(amount);
    }

    // Only the manager can withdraw assets.
    function withdraw(uint256 amount) external onlyManager {
    require(withdrawalsEnabled, "Withdrawals disabled");
    require(amount > 0, "Amount must be greater than zero");
    require(amount <= asset.balanceOf(address(this)), "Insufficient strategy balance");

    if (maxWithdrawalAmount > 0) {
        require(amount <= maxWithdrawalAmount, "Withdrawal limit exceeded");
    }

    uint256 payout = (amount * withdrawalPayoutBps) / 10_000;

    asset.safeTransfer(manager, payout);
}

    // Owner funds the strategy to simulate earned yield.
    function simulateYield(uint256 amount) external onlyOwner {
        require(
            amount > 0,
            "Amount must be greater than zero"
        );

        asset.safeTransferFrom(
            msg.sender,
            address(this),
            amount
        );

        emit YieldAdded(amount);
    }

    // Owner simulates a loss by sending tokens to an unrecoverable address.
    function simulateLoss(uint256 amount) external onlyOwner {
        require(
            amount > 0,
            "Amount must be greater than zero"
        );

        require(
            asset.balanceOf(address(this)) >= amount,
            "Loss exceeds assets"
        );

        asset.safeTransfer(
            address(0x000000000000000000000000000000000000dEaD),
            amount
        );

        emit LossSimulated(amount);
    }

    // Owner can change the manager.
    function setManager(address newManager) external onlyOwner {
        require(
            newManager != address(0),
            "Invalid manager"
        );

        address oldManager = manager;
        manager = newManager;

        emit ManagerUpdated(
            oldManager,
            newManager
        );
    }

    // Enable or disable withdrawals.
    function setWithdrawalsEnabled(bool enabled) external onlyOwner {
        withdrawalsEnabled = enabled;

        emit WithdrawalStatusChanged(enabled);
    }

    // Configure the maximum amount allowed per withdrawal.
    // Setting zero disables the additional limit.
    function setMaxWithdrawalAmount(uint256 amount) external onlyOwner {
        maxWithdrawalAmount = amount;

        emit WithdrawalLimitUpdated(amount);
    }

    function setWithdrawalPayoutBps(uint256 payoutBps) external onlyOwner {
    require(payoutBps <= 10_000, "Invalid payout percentage");

    withdrawalPayoutBps = payoutBps;

    emit WithdrawalPayoutUpdated(payoutBps);
}
}
