// SPDX-License-Identifier: MIT
pragma solidity ^0.8.34;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title IComet
 * @notice Minimal interface for Compound V3 Comet contracts
 */
interface IComet is IERC20 {
    /**
     * @notice Supply an amount of asset to the protocol
     * @param asset The asset to supply
     * @param amount The amount to supply
     */
    function supply(address asset, uint256 amount) external;

    /**
     * @notice Withdraw an amount of asset from the protocol
     * @param asset The asset to withdraw
     * @param amount The amount to withdraw
     */
    function withdraw(address asset, uint256 amount) external;

    /**
     * @notice Returns the base token of the Comet market
     */
    function baseToken() external view returns (address);

    /**
     * @notice Returns the supply rate given current utilization
     */
    function getSupplyRate(uint256 utilization) external view returns (uint64);

    /**
     * @notice Returns the current utilization rate of the protocol
     */
    function getUtilization() external view returns (uint256);
}
