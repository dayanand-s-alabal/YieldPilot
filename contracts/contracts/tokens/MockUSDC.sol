
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.34;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract MockUSDC is ERC20, Ownable {

    constructor(address initialOwner)
        ERC20("YieldPilot USD", "ypUSDC")
        Ownable(initialOwner)
    {}

    // USDC uses 6 decimal places instead of the ERC20 default of 18.
    function decimals() public pure override returns (uint8) {
        return 6;
    }

    // Only the owner can mint test tokens.
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
}
