// SPDX-License-Identifier: MIT
pragma solidity ^0.8.34;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IPool} from "../interfaces/IPool.sol";
import {MockAToken} from "./MockAToken.sol";

contract MockAavePool is IPool {
    using SafeERC20 for IERC20;

    address public immutable asset;
    MockAToken public immutable aToken;

    constructor(address _asset, address _aToken) {
        asset = _asset;
        aToken = MockAToken(_aToken);
    }

    function supply(
        address supplyAsset,
        uint256 amount,
        address onBehalfOf,
        uint16 /* referralCode */
    ) external override {
        require(supplyAsset == asset, "Unsupported asset");
        require(amount > 0, "Invalid supply amount");

        // Transfer underlying tokens from user to aToken contract
        IERC20(asset).safeTransferFrom(msg.sender, address(aToken), amount);

        // Mint aTokens to receiver
        aToken.mint(onBehalfOf, amount);
    }

    function withdraw(
        address withdrawAsset,
        uint256 amount,
        address to
    ) external override returns (uint256) {
        require(withdrawAsset == asset, "Unsupported asset");
        require(amount > 0, "Invalid withdraw amount");

        uint256 availablePoolCash = IERC20(asset).balanceOf(address(aToken));
        require(availablePoolCash >= amount, "Aave: insufficient protocol cash");

        // Burn aTokens from caller
        aToken.burn(msg.sender, amount);

        // Transfer underlying tokens to receiver
        aToken.transferUnderlying(to, amount);

        return amount;
    }

    function getReserveNormalizedIncome(
        address /* assetAddress */
    ) external pure override returns (uint256) {
        return 1e27; // Ray = 1.0
    }

    // Helper for testing: simulate interest accrual by minting aTokens to user
    function accrueInterest(address user, uint256 interestAmount) external {
        aToken.mint(user, interestAmount);
    }

    // Helper for testing: simulate protocol illiquidity by transferring cash out of aToken
    function drainPoolCash(address drainTo, uint256 amount) external {
        aToken.transferUnderlying(drainTo, amount);
    }
}
