// SPDX-License-Identifier: MIT
pragma solidity ^0.8.34;

import {IStrategy} from "./IStrategy.sol";

/**
 * @title IProtocolStrategy
 * @notice Extended strategy interface with liquidity availability, metrics, and analytics
 */
interface IProtocolStrategy is IStrategy {
    function availableLiquidity() external view returns (uint256);

    function totalDeposited() external view returns (uint256);

    function totalWithdrawn() external view returns (uint256);

    function yieldEarned() external view returns (uint256);

    function protocolName() external view returns (string memory);
}
