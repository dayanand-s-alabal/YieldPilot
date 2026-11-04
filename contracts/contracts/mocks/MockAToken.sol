// SPDX-License-Identifier: MIT
pragma solidity ^0.8.34;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IAToken} from "../interfaces/IAToken.sol";

contract MockAToken is ERC20, IAToken {
    using SafeERC20 for IERC20;

    address public immutable override UNDERLYING_ASSET_ADDRESS;
    address public pool;

    modifier onlyPool() {
        require(msg.sender == pool, "Only pool can call");
        _;
    }

    constructor(
        address underlyingAsset,
        string memory name,
        string memory symbol
    ) ERC20(name, symbol) {
        UNDERLYING_ASSET_ADDRESS = underlyingAsset;
    }

    function setPool(address _pool) external {
        require(pool == address(0), "Pool already set");
        pool = _pool;
    }

    function mint(address account, uint256 amount) external onlyPool {
        _mint(account, amount);
    }

    function burn(address account, uint256 amount) external onlyPool {
        _burn(account, amount);
    }

    function transferUnderlying(address to, uint256 amount) external onlyPool {
        IERC20(UNDERLYING_ASSET_ADDRESS).safeTransfer(to, amount);
    }
}
