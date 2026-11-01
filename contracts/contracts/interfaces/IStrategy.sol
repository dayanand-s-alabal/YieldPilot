
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.34;

interface IStrategy {
    function asset() external view returns (address);

    function manager() external view returns (address);

    function totalAssets() external view returns (uint256);

    function deposit(uint256 amount) external;

    function withdraw(uint256 amount) external;

}
