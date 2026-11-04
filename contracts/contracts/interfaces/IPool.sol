// SPDX-License-Identifier: MIT
pragma solidity ^0.8.34;

/**
 * @title IPool
 * @notice Minimal interface for Aave V3 Pool contract
 */
interface IPool {
    /**
     * @notice Supplies an amount of underlying asset into the reserve.
     * @param asset The address of the underlying asset to supply
     * @param amount The amount to be supplied
     * @param onBehalfOf The address that will receive the aTokens
     * @param referralCode Referral code (0 for none)
     */
    function supply(
        address asset,
        uint256 amount,
        address onBehalfOf,
        uint16 referralCode
    ) external;

    /**
     * @notice Withdraws an amount of underlying asset from the reserve.
     * @param asset The address of the underlying asset to withdraw
     * @param amount The amount to be withdrawn
     * @param to Address that will receive the underlying
     * @return The final amount withdrawn
     */
    function withdraw(
        address asset,
        uint256 amount,
        address to
    ) external returns (uint256);

    /**
     * @notice Returns the normalized income of the reserve.
     * @param asset The address of the underlying asset
     * @return The normalized income
     */
    function getReserveNormalizedIncome(
        address asset
    ) external view returns (uint256);
}
