// SPDX-License-Identifier: MIT
pragma solidity ^0.8.34;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IProtocolStrategy} from "../interfaces/IProtocolStrategy.sol";
import {IPool} from "../interfaces/IPool.sol";
import {IAToken} from "../interfaces/IAToken.sol";

/**
 * @title AaveStrategy
 * @notice Real Aave V3 adapter strategy with liquidity checks, position tracking, and accrued interest analytics
 */
contract AaveStrategy is Ownable, IProtocolStrategy {
    using SafeERC20 for IERC20;

    string public constant override protocolName = "Aave V3";
    IERC20 private immutable _asset;
    address public override manager;
    bool public withdrawalsEnabled = true;

    // Aave V3 Protocol addresses
    address public pool;
    address public aToken;

    // Performance and Accounting Metrics
    uint256 public override totalDeposited;
    uint256 public override totalWithdrawn;

    event Deposited(uint256 amount);
    event Withdrawn(uint256 amount);
    event YieldAccrued(uint256 amount);
    event ManagerUpdated(address indexed manager);
    event PoolUpdated(address indexed pool, address indexed aToken);
    event ProtocolLiquidityWarning(uint256 requested, uint256 available);

    modifier onlyManager() {
        require(msg.sender == manager, "Not authorized manager");
        _;
    }

    constructor(
        address assetAddress,
        address initialOwner
    ) Ownable(initialOwner) {
        require(assetAddress != address(0), "Invalid asset");
        _asset = IERC20(assetAddress);
        manager = initialOwner;
    }

    function asset() external view override returns (address) {
        return address(_asset);
    }

    function setManager(address newManager) external onlyOwner {
        require(newManager != address(0), "Invalid manager");
        manager = newManager;
        emit ManagerUpdated(newManager);
    }

    function setPool(address _pool, address _aToken) external onlyOwner {
        pool = _pool;
        aToken = _aToken;
        emit PoolUpdated(_pool, _aToken);
    }

    function setWithdrawalsEnabled(bool enabled) external onlyOwner {
        withdrawalsEnabled = enabled;
    }

    /**
     * @notice Total assets managed by this strategy:
     *         Idle tokens held + aToken balance in Aave V3
     */
    function totalAssets() public view override returns (uint256) {
        uint256 idle = _asset.balanceOf(address(this));
        uint256 inProtocol = 0;
        if (aToken != address(0)) {
            inProtocol = IERC20(aToken).balanceOf(address(this));
        }
        return idle + inProtocol;
    }

    /**
     * @notice Checks available liquid assets in the protocol that can be withdrawn immediately.
     */
    function availableLiquidity() public view override returns (uint256) {
        uint256 idle = _asset.balanceOf(address(this));
        if (pool == address(0) || aToken == address(0)) {
            return idle;
        }

        uint256 strategyClaim = IERC20(aToken).balanceOf(address(this));
        // Cash currently held by the aToken contract
        uint256 protocolCash = _asset.balanceOf(aToken);

        uint256 accessibleProtocol = strategyClaim < protocolCash ? strategyClaim : protocolCash;
        return idle + accessibleProtocol;
    }

    /**
     * @notice Cumulative yield earned from interest accrual
     */
    function yieldEarned() external view override returns (uint256) {
        uint256 current = totalAssets();
        if (current + totalWithdrawn > totalDeposited) {
            return (current + totalWithdrawn) - totalDeposited;
        }
        return 0;
    }

    /**
     * @notice Supplies funds into Aave V3 lending pool
     */
    function deposit(uint256 amount) external override onlyManager {
        require(amount > 0, "Amount must be > 0");

        // Pull tokens from manager
        _asset.safeTransferFrom(msg.sender, address(this), amount);

        if (pool != address(0)) {
            _asset.forceApprove(pool, amount);
            try IPool(pool).supply(address(_asset), amount, address(this), 0) {
                // Supplied successfully
            } catch Error(string memory reason) {
                revert(string(abi.encodePacked("Aave supply failed: ", reason)));
            } catch {
                revert("Aave supply reverted unexpectedly");
            }
        }

        totalDeposited += amount;
        emit Deposited(amount);
    }

    /**
     * @notice Withdraws funds from Aave V3 lending pool to the manager
     */
    function withdraw(uint256 amount) external override onlyManager {
        require(withdrawalsEnabled, "Withdrawals disabled");
        require(amount > 0, "Amount must be > 0");

        uint256 available = availableLiquidity();
        require(amount <= available, "Insufficient Aave protocol liquidity");

        uint256 idle = _asset.balanceOf(address(this));
        if (idle < amount && pool != address(0)) {
            uint256 neededFromPool = amount - idle;
            try IPool(pool).withdraw(address(_asset), neededFromPool, address(this)) returns (uint256 withdrawn) {
                require(withdrawn >= neededFromPool, "Aave partial withdrawal received");
            } catch Error(string memory reason) {
                revert(string(abi.encodePacked("Aave withdraw failed: ", reason)));
            } catch {
                revert("Aave withdraw reverted unexpectedly");
            }
        }

        _asset.safeTransfer(manager, amount);
        totalWithdrawn += amount;
        emit Withdrawn(amount);
    }

    /**
     * @notice Simulates yield by transferring additional tokens (used for test environments)
     */
    function simulateYield(uint256 amount) external onlyOwner {
        require(amount > 0, "Amount must be > 0");
        _asset.safeTransferFrom(msg.sender, address(this), amount);
        emit YieldAccrued(amount);
    }
}
