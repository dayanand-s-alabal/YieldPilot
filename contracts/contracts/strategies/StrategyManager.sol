
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.34;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IStrategy} from "../interfaces/IStrategy.sol";

contract StrategyManager is Ownable {
    using SafeERC20 for IERC20;

    uint256 public constant BPS = 10_000;

    IERC20 public immutable asset;
    address public vault;

    // Minimum percentage of the portfolio that must remain liquid.
    uint256 public reserveBps;

    address[] private strategies;

    mapping(address => bool) public isRegistered;
    mapping(address => uint256) public allocationCapBps;
    mapping(address => uint256) public lastKnownStrategyAssets;
    mapping(address => bool) public isStrategyPaused;

    event StrategyRegistered(
        address indexed strategy,
        uint256 allocationCapBps
    );

    event VaultInitialized(address indexed vault);

    event StrategyRemoved(address indexed strategy);

    event StrategyAllocationCapUpdated(
        address indexed strategy,
        uint256 newCapBps
    );

    event StrategyPauseUpdated(
    address indexed strategy,
    bool paused
);

event EmergencyStrategyWithdrawal(
    address indexed strategy,
    uint256 requested,
    uint256 received
);
    event ReserveUpdated(uint256 newReserveBps);

    event Allocated(
        address indexed strategy,
        uint256 amount
    );

    event Withdrawn(
        address indexed strategy,
        uint256 amount
    );

    event VaultWithdrawal(uint256 amount);

    modifier onlyVault() {
        require(msg.sender == vault, "Only vault can call");
        _;
    }

    constructor(
    address assetAddress,
    address initialOwner,
    uint256 initialReserveBps
) Ownable(initialOwner) {
    require(assetAddress != address(0), "Invalid asset");
    require(
        initialReserveBps <= BPS,
        "Invalid reserve percentage"
    );

    asset = IERC20(assetAddress);
    reserveBps = initialReserveBps;
}

function initializeVault(address vaultAddress) external onlyOwner {
    require(vault == address(0), "Vault already initialized");
    require(vaultAddress != address(0), "Invalid vault");

    vault = vaultAddress;

    emit VaultInitialized(vaultAddress);
}

    // Number of registered strategies.
    function strategyCount() external view returns (uint256) {
        return strategies.length;
    }

    // Return a strategy address by index.
    function getStrategy(uint256 index) external view returns (address) {
        return strategies[index];
    }

    // Total assets = manager's liquid balance + strategy assets.
    function totalManagedAssets() public view returns (uint256 total) {
    total = asset.balanceOf(address(this));

    for (uint256 i = 0; i < strategies.length; i++) {
        address strategy = strategies[i];

        try IStrategy(strategy).totalAssets() returns (
            uint256 reportedAssets
        ) {
            total += reportedAssets;
        } catch {
            revert("Strategy valuation unavailable");
        }
    }
}

    // Register a strategy after its manager has been configured.
    function registerStrategy(
        address strategy,
        uint256 maxAllocationBps
    ) external onlyOwner {
        require(strategy != address(0), "Invalid strategy");
        require(!isRegistered[strategy], "Already registered");
        require(
            maxAllocationBps > 0 && maxAllocationBps <= BPS,
            "Invalid allocation cap"
        );

        IStrategy strategyContract = IStrategy(strategy);

        require(
            strategyContract.asset() == address(asset),
            "Asset mismatch"
        );

        require(
            strategyContract.manager() == address(this),
            "Manager mismatch"
        );

        strategies.push(strategy);
        isRegistered[strategy] = true;
        allocationCapBps[strategy] = maxAllocationBps;
        lastKnownStrategyAssets[strategy] =
            IStrategy(strategy).totalAssets();

        emit StrategyRegistered(strategy, maxAllocationBps);
    }

    // Remove a strategy only when it holds no assets.
    function removeStrategy(address strategy) external onlyOwner {
    require(isRegistered[strategy], "Strategy not registered");

    require(
        IStrategy(strategy).totalAssets() == 0,
        "Strategy still holds assets"
    );

    _removeStrategy(strategy);
}

function _removeStrategy(address strategy) internal {
    for (uint256 i = 0; i < strategies.length; i++) {
        if (strategies[i] == strategy) {
            strategies[i] = strategies[strategies.length - 1];
            strategies.pop();
            break;
        }
    }

    isRegistered[strategy] = false;
    isStrategyPaused[strategy] = false;

    delete allocationCapBps[strategy];
    delete lastKnownStrategyAssets[strategy];

    emit StrategyRemoved(strategy);
}
    function emergencyRemoveStrategy(
    address strategy
) external onlyOwner {
    require(isRegistered[strategy], "Strategy not registered");
    require(isStrategyPaused[strategy], "Strategy must be paused");

    require(
        lastKnownStrategyAssets[strategy] == 0,
        "Strategy recovery balance not cleared"
    );

    _removeStrategy(strategy);
}

    // Vault transfers assets into the manager.
    function fund(uint256 amount) external onlyVault {
        require(amount > 0, "Invalid amount");

        asset.safeTransferFrom(vault, address(this), amount);
    }

    // Allocate manager-held assets to a registered strategy.
    function allocate(
        address strategy,
        uint256 amount
    ) external onlyVault {
        require(isRegistered[strategy], "Strategy not registered");
        require(amount > 0, "Invalid amount");
        require(!isStrategyPaused[strategy], "Strategy is paused");

        uint256 liquidBalance = asset.balanceOf(address(this));
        require(liquidBalance >= amount, "Insufficient liquid assets");

        uint256 portfolioValue = totalManagedAssets();

        uint256 requiredReserve =
            (portfolioValue * reserveBps) / BPS;

        require(
            liquidBalance - amount >= requiredReserve,
            "Minimum reserve violation"
        );

        uint256 currentStrategyAssets =
            IStrategy(strategy).totalAssets();

        uint256 maximumStrategyAssets =
            (portfolioValue * allocationCapBps[strategy]) / BPS;

        require(
            currentStrategyAssets + amount <= maximumStrategyAssets,
            "Strategy allocation cap exceeded"
        );

        // Strategy pulls tokens from this manager.
        asset.forceApprove(strategy, amount);
        IStrategy(strategy).deposit(amount);

        lastKnownStrategyAssets[strategy] =
            IStrategy(strategy).totalAssets();

        emit Allocated(strategy, amount);
    }

    // Withdraw from a strategy and return the assets to the vault.
    function withdrawFromStrategy(
    address strategy,
    uint256 amount
) external onlyVault {
    require(isRegistered[strategy], "Strategy not registered");
    require(amount > 0, "Invalid amount");

    uint256 balanceBefore = asset.balanceOf(address(this));

    IStrategy(strategy).withdraw(amount);

    uint256 balanceAfter = asset.balanceOf(address(this));

    require(
        balanceAfter >= balanceBefore,
        "Invalid balance change"
    );

    uint256 received = balanceAfter - balanceBefore;

    require(
        received >= amount,
        "Insufficient strategy withdrawal"
    );

    asset.safeTransfer(vault, amount);

    // Refresh the recovery reference when valuation is available.
    try IStrategy(strategy).totalAssets() returns (
        uint256 updatedAssets
    ) {
        lastKnownStrategyAssets[strategy] = updatedAssets;
    } catch {
        // Do not treat a failed valuation as a valid live balance.
        // The vault's normal NAV calculation will fail closed.
    }

    emit Withdrawn(strategy, amount);
}

    // Return manager-held liquid assets directly to the vault.
    function withdrawLiquid(uint256 amount) external onlyVault {
        require(amount > 0, "Invalid amount");
        require(
            asset.balanceOf(address(this)) >= amount,
            "Insufficient liquid assets"
        );

        asset.safeTransfer(vault, amount);

        emit VaultWithdrawal(amount);
    }

    
    // Retrieve the requested amount from manager liquidity
    // and registered strategies, then transfer it to the vault.
    function withdrawToVault(uint256 amount) external onlyVault {
    require(amount > 0, "Invalid amount");

    uint256 available = asset.balanceOf(address(this));

    uint256 remaining = amount > available
        ? amount - available
        : 0;

    for (uint256 i = 0; i < strategies.length && remaining > 0; i++) {
        address strategy = strategies[i];

        uint256 strategyAssets;

        try IStrategy(strategy).totalAssets() returns (
            uint256 reportedAssets
        ) {
            strategyAssets = reportedAssets;
        } catch {
            continue;
        }

        if (strategyAssets == 0) {
            continue;
        }

        uint256 requested = strategyAssets < remaining
            ? strategyAssets
            : remaining;

        uint256 balanceBefore = asset.balanceOf(address(this));

        try IStrategy(strategy).withdraw(requested) {
            uint256 balanceAfter = asset.balanceOf(address(this));

            if (balanceAfter > balanceBefore) {
    uint256 received = balanceAfter - balanceBefore;

    try IStrategy(strategy).totalAssets() returns (
        uint256 updatedAssets
    ) {
        lastKnownStrategyAssets[strategy] = updatedAssets;
    } catch {
        uint256 previousKnown = lastKnownStrategyAssets[strategy];

        lastKnownStrategyAssets[strategy] =
            previousKnown > received
                ? previousKnown - received
                : 0;
    }

    if (received >= remaining) {
        remaining = 0;
    } else {
        remaining -= received;
    }
}
        } catch {
            continue;
        }
    }

    require(remaining == 0, "Insufficient portfolio liquidity");

    asset.safeTransfer(vault, amount);

    emit VaultWithdrawal(amount);
}

    // Update a strategy's maximum portfolio allocation.
    function setAllocationCap(
        address strategy,
        uint256 newCapBps
    ) external onlyOwner {
        require(isRegistered[strategy], "Strategy not registered");
        require(
            newCapBps > 0 && newCapBps <= BPS,
            "Invalid allocation cap"
        );

        allocationCapBps[strategy] = newCapBps;

        emit StrategyAllocationCapUpdated(strategy, newCapBps);
    }

    // Update the minimum liquid reserve percentage.
    function setReserveBps(uint256 newReserveBps) external onlyOwner {
        require(
            newReserveBps <= BPS,
            "Invalid reserve percentage"
        );

        reserveBps = newReserveBps;

        emit ReserveUpdated(newReserveBps);
    }

    function setStrategyPaused(
    address strategy,
    bool paused
) external onlyOwner {
    require(isRegistered[strategy], "Strategy not registered");

    isStrategyPaused[strategy] = paused;

    emit StrategyPauseUpdated(strategy, paused);
}
function emergencyWithdrawFromStrategy(
    address strategy,
    uint256 amount
) external onlyOwner {
    require(isRegistered[strategy], "Strategy not registered");
    require(isStrategyPaused[strategy], "Strategy must be paused");
    require(amount > 0, "Invalid amount");

    uint256 balanceBefore = asset.balanceOf(address(this));

    // Deliberately do not call totalAssets().
    IStrategy(strategy).withdraw(amount);

    uint256 balanceAfter = asset.balanceOf(address(this));

    require(
        balanceAfter >= balanceBefore,
        "Invalid balance change"
    );

    uint256 received = balanceAfter - balanceBefore;

    require(received > 0, "No assets recovered");

    uint256 previousKnown = lastKnownStrategyAssets[strategy];

    lastKnownStrategyAssets[strategy] =
        previousKnown > received
            ? previousKnown - received
            : 0;

    // Transfer recovered tokens directly to the vault.
    asset.safeTransfer(vault, received);

    emit EmergencyStrategyWithdrawal(
        strategy,
        amount,
        received
    );
}
}
