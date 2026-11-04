// SPDX-License-Identifier: MIT
pragma solidity ^0.8.34;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IComet} from "../interfaces/IComet.sol";

contract MockCompoundComet is ERC20, IComet {
    using SafeERC20 for IERC20;

    address public immutable override baseToken;

    constructor(
        address _baseToken,
        string memory name,
        string memory symbol
    ) ERC20(name, symbol) {
        baseToken = _baseToken;
    }

    function supply(address asset, uint256 amount) external override {
        require(asset == baseToken, "Unsupported asset");
        require(amount > 0, "Invalid amount");

        IERC20(asset).safeTransferFrom(msg.sender, address(this), amount);
        _mint(msg.sender, amount);
    }

    function withdraw(address asset, uint256 amount) external override {
        require(asset == baseToken, "Unsupported asset");
        require(amount > 0, "Invalid amount");
        require(balanceOf(msg.sender) >= amount, "Insufficient comet balance");

        uint256 availableCash = IERC20(asset).balanceOf(address(this));
        require(availableCash >= amount, "Compound: insufficient protocol cash");

        _burn(msg.sender, amount);
        IERC20(asset).safeTransfer(msg.sender, amount);
    }

    function getSupplyRate(uint256 /* utilization */) external pure override returns (uint64) {
        return 500000000; // illustrative rate
    }

    function getUtilization() external pure override returns (uint256) {
        return 7500; // 75%
    }

    // Helper for testing: simulate interest accrual
    function accrueInterest(address user, uint256 interestAmount) external {
        _mint(user, interestAmount);
    }

    // Helper for testing: simulate illiquidity
    function drainCometCash(address to, uint256 amount) external {
        IERC20(baseToken).safeTransfer(to, amount);
    }
}
