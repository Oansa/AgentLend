// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title CollateralManager
 * @dev Manages collateral for AgentLend loans. Collateral ratio is ACS-gated.
 * Handles deposit, withdrawal, and liquidation of collateral.
 */
contract CollateralManager is Ownable, ReentrancyGuard {

    /// @dev Supported collateral tokens
    struct CollateralConfig {
        IERC20 token;
        bool active;
        uint256 decimals;
    }

    /// @dev Collateral configuration per token
    mapping(address => CollateralConfig) public collateralTokens;

    /// @dev Agent collateral balances: agentDID -> token -> amount
    mapping(bytes32 => mapping(address => uint256)) public collateralBalances;

    /// @dev Total collateral held per token
    mapping(address => uint256) public totalCollateral;

    /// @dev ACS score thresholds for collateral ratios (basis points: 1000 = 10%)
    // Score 900+ -> 10% collateral (1000 bps)
    // Score 700+ -> 15% collateral (1500 bps)
    // Score 500+ -> 25% collateral (2500 bps)
    // Score < 500 -> 40% collateral (4000 bps)
    uint256[4] public collateralRatios = [1000, 1500, 2500, 4000];
    uint256[4] public scoreThresholds = [900, 700, 500, 300];

    /// @dev Liquidation penalty (basis points) - 10% penalty to liquidator
    uint256 public constant LIQUIDATION_PENALTY_BPS = 1000;

    /// @dev Maximum number of active collateral tokens
    uint256 public constant MAX_COLLATERAL_TOKENS = 5;

    /// @dev Count of active collateral tokens
    uint256 public activeTokenCount;

    /// @dev LendingPool address (set after deployment)
    address public lendingPool;

    /// @dev Event emitted when collateral is deposited
    event CollateralDeposited(bytes32 indexed agentDID, address indexed token, uint256 amount);

    /// @dev Event emitted when collateral is withdrawn
    event CollateralWithdrawn(bytes32 indexed agentDID, address indexed token, uint256 amount);

    /// @dev Event emitted when collateral is seized (liquidation)
    event CollateralSeized(bytes32 indexed agentDID, address indexed token, uint256 amount, address indexed liquidator);

    /// @dev Event emitted when collateral token is added/removed
    event CollateralTokenUpdated(address indexed token, bool active);

    constructor() Ownable(msg.sender) {}

    using SafeERC20 for IERC20;

    /**
     * @dev Set the LendingPool address (owner only)
     * @param _lendingPool LendingPool contract address
     */
    function setLendingPool(address _lendingPool) external onlyOwner {
        require(_lendingPool != address(0), "Invalid address");
        lendingPool = _lendingPool;
    }

    /**
     * @dev Add or update a supported collateral token (owner only)
     * @param token ERC20 token address
     * @param active Whether the token is active
     */
    function setCollateralToken(address token, bool active) external onlyOwner {
        require(token != address(0), "Invalid token");
        CollateralConfig storage config = collateralTokens[token];

        if (active && !config.active) {
            require(activeTokenCount < MAX_COLLATERAL_TOKENS, "Max tokens reached");
            config.token = IERC20(token);
            config.active = true;
            config.decimals = ERC20(token).decimals();
            activeTokenCount++;
        } else if (!active && config.active) {
            config.active = false;
            activeTokenCount--;
        }
        emit CollateralTokenUpdated(token, active);
    }

    /**
     * @dev Get required collateral ratio for a given ACS score (basis points)
     * @param score ACS score (300-900)
     * @return ratio Collateral ratio in basis points
     */
    function getCollateralRatio(uint256 score) public view returns (uint256) {
        for (uint256 i = 0; i < scoreThresholds.length; i++) {
            if (score >= scoreThresholds[i]) {
                return collateralRatios[i];
            }
        }
        return collateralRatios[collateralRatios.length - 1]; // Max collateral for lowest scores
    }

    /**
     * @dev Calculate required collateral amount for a loan
     * @param loanAmount Loan amount in USDC
     * @param score ACS score
     * @return Required collateral amount
     */
    function calculateRequiredCollateral(uint256 loanAmount, uint256 score) public view returns (uint256) {
        uint256 ratio = getCollateralRatio(score);
        return (loanAmount * ratio) / 10000;
    }

    /**
     * @dev Deposit collateral for an agent
     * @param agentDID Agent's DID as bytes32
     * @param token Collateral token address
     * @param amount Amount to deposit
     */
    function depositCollateral(bytes32 agentDID, address token, uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be > 0");
        CollateralConfig storage config = collateralTokens[token];
        require(config.active, "Token not active");

        // Transfer from caller to this contract
        config.token.safeTransferFrom(msg.sender, address(this), amount);

        collateralBalances[agentDID][token] = collateralBalances[agentDID][token] + amount;
        totalCollateral[token] = totalCollateral[token] + amount;

        emit CollateralDeposited(agentDID, token, amount);
    }

    /**
     * @dev Withdraw collateral (only if position remains sufficiently collateralized)
     * @param agentDID Agent's DID as bytes32
     * @param token Collateral token address
     * @param amount Amount to withdraw
     */
    function withdrawCollateral(bytes32 agentDID, address token, uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be > 0");
        CollateralConfig storage config = collateralTokens[token];
        require(config.active, "Token not active");

        uint256 balance = collateralBalances[agentDID][token];
        require(balance >= amount, "Insufficient collateral balance");

        // Check if remaining collateral is sufficient for active loans
        // This check is done by LendingPool before calling withdraw

        collateralBalances[agentDID][token] = balance - amount;
        totalCollateral[token] = totalCollateral[token] - amount;

        config.token.safeTransfer(msg.sender, amount);
        emit CollateralWithdrawn(agentDID, token, amount);
    }

    /**
     * @dev Seize collateral during liquidation (called by LendingPool)
     * @param agentDID Agent's DID as bytes32
     * @param token Collateral token address
     * @param amount Amount to seize
     * @param liquidator Address receiving the collateral
     */
    function seizeCollateral(bytes32 agentDID, address token, uint256 amount, address liquidator) external nonReentrant {
        require(lendingPool == msg.sender, "Only LendingPool");
        require(amount > 0, "Amount must be > 0");

        CollateralConfig storage config = collateralTokens[token];
        require(config.active, "Token not active");

        uint256 balance = collateralBalances[agentDID][token];
        require(balance >= amount, "Insufficient collateral to seize");

        collateralBalances[agentDID][token] = balance - amount;
        totalCollateral[token] = totalCollateral[token] - amount;

        config.token.safeTransfer(liquidator, amount);
        emit CollateralSeized(agentDID, token, amount, liquidator);
    }

    /**
     * @dev Release collateral back to agent after full repayment (called by LendingPool)
     * @param agentDID Agent's DID as bytes32
     * @param token Collateral token address
     * @param amount Amount to release
     * @param recipient Address to receive the collateral
     */
    function releaseCollateral(bytes32 agentDID, address token, uint256 amount, address recipient) external nonReentrant {
        require(lendingPool == msg.sender, "Only LendingPool");
        require(amount > 0, "Amount must be > 0");

        CollateralConfig storage config = collateralTokens[token];
        require(config.active, "Token not active");

        uint256 balance = collateralBalances[agentDID][token];
        require(balance >= amount, "Insufficient collateral to release");

        collateralBalances[agentDID][token] = balance - amount;
        totalCollateral[token] = totalCollateral[token] - amount;

        config.token.safeTransfer(recipient, amount);
        emit CollateralWithdrawn(agentDID, token, amount);
    }

    /**
     * @dev Get agent's collateral balance for a token
     * @param agentDID Agent's DID as bytes32
     * @param token Collateral token address
     * @return Balance
     */
    function getCollateralBalance(bytes32 agentDID, address token) external view returns (uint256) {
        return collateralBalances[agentDID][token];
    }

    /**
     * @dev Get total collateral held for a token
     * @param token Collateral token address
     * @return Total collateral
     */
    function getTotalCollateral(address token) external view returns (uint256) {
        return totalCollateral[token];
    }
}