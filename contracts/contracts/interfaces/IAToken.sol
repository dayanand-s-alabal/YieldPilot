// SPDX-License-Identifier: MIT
pragma solidity ^0.8.34;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title IAToken
 * @notice Minimal interface for Aave V3 aTokens
 */
interface IAToken is IERC20 {
    /**
     * @notice Returns the address of the underlying asset of this aToken
     */
    function UNDERLYING_ASSET_ADDRESS() external view returns (address);
}
