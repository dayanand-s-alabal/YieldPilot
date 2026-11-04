// SPDX-License-Identifier: MIT
pragma solidity ^0.8.34;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IProtocolStrategy} from "../interfaces/IProtocolStrategy.sol";
import {IComet} from "../interfaces/IComet.sol";

/**
 * @title CompoundStrategy
 * @notice Real Compound V3 (Comet) adapter strategy with liquidity checks, balance tracking, and accrued interest analytics
 */
contract CompoundStrategy is Ownable, IProtocolStrategy {
    using SafeERC20 for IERC20;

    string public constant override protocolName = "Compound V3";
    IERC20 private immutable _asset;
    address public override manager;
    bool public withdrawalsEnabled = true;

    // Compound V3 Comet address
    address public comet;

    // Performance and Accounting Metrics
    uint256 public override totalDeposited;
    uint256 public override totalWithdrawn;

    event Deposited(uint256 amount);
    event Withdrawn(uint256 amount);
    event YieldAccrued(uint256 amount);
    event ManagerUpdated(address indexed manager);
    event CometUpdated(address indexed comet);
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

    function setComet(address _comet) external onlyOwner {
        comet = _comet;
        emit CometUpdated(_comet);
    }

    function setWithdrawalsEnabled(bool enabled) external onlyOwner {
        withdrawalsEnabled = enabled;
    }

    /**
     * @notice Total assets managed by this strategy:
     *         Idle tokens held + Comet balance in Compound V3
     */
    function totalAssets() public view override returns (uint256) {
        uint256 idle = _asset.balanceOf(address(this));
        uint256 inProtocol = 0;
        if (comet != address(0)) {
            inProtocol = IComet(comet).balanceOf(address(this));
        }
        return idle + inProtocol;
    }

    /**
     * @notice Checks available liquid assets in the protocol that can be withdrawn immediately.
     */
    function availableLiquidity() public view override returns (uint256) {
        uint256 idle = _asset.balanceOf(address(this));
        if (comet == address(0)) {
            return idle;
        }

        uint256 strategyClaim = IComet(comet).balanceOf(address(this));
        // Cash currently held by the Comet market contract
        uint256 cometCash = _asset.balanceOf(comet);

        uint256 accessibleProtocol = strategyClaim < cometCash ? strategyClaim : cometCash;
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
     * @notice Supplies funds into Compound V3 Comet market
     */
    function deposit(uint256 amount) external override onlyManager {
        require(amount > 0, "Amount must be > 0");

        // Pull tokens from manager
        _asset.safeTransferFrom(msg.sender, address(this), amount);

        if (comet != address(0)) {
            _asset.forceApprove(comet, amount);
            try IComet(comet).supply(address(_asset), amount) {
                // Supplied successfully
            } catch Error(string memory reason) {
                revert(string(abi.encodePacked("Compound supply failed: ", reason)));
            } catch {
                revert("Compound supply reverted unexpectedly");
            }
        }

        totalDeposited += amount;
        emit Deposited(amount);
    }

    /**
     * @notice Withdraws funds from Compound V3 Comet market to the manager
     */
    function withdraw(uint256 amount) external override onlyManager {
        require(withdrawalsEnabled, "Withdrawals disabled");
        require(amount > 0, "Amount must be > 0");

        uint256 available = availableLiquidity();
        require(amount <= available, "Insufficient Compound protocol liquidity");

        uint256 idle = _asset.balanceOf(address(this));
        if (idle < amount && comet != address(0)) {
            uint256 neededFromComet = amount - idle;
            try IComet(comet).withdraw(address(_asset), neededFromComet) {
                // Withdrawn successfully from Comet to address(this)
            } catch Error(string memory reason) {
                revert(string(abi.encodePacked("Compound withdraw failed: ", reason)));
            } catch {
                revert("Compound withdraw reverted unexpectedly");
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
