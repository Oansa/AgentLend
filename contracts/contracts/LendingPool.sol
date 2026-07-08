// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./ACSOracle.sol";
import "./CollateralManager.sol";

/**
 * @title LendingPool
 * @dev Core lending protocol for AgentLend on CROO Network.
 * Implements A2A (Agent-to-Agent) lending with ACS-gated collateral ratios.
 * Features:
 * - Agent Credit Score (ACS) based loan terms
 * - Dynamic collateral ratios based on creditworthiness
 * - Fixed-term loans with interest
 * - Liquidation mechanism for undercollateralized positions
 * - Emergency pause functionality
 */
contract LendingPool is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    /// @dev Loan status enumeration
    enum LoanStatus {
        Active,      // Loan is active and accruing interest
        Repaid,      // Loan fully repaid
        Liquidated,  // Loan liquidated due to undercollateralization
        Defaulted    // Loan past maturity without repayment
    }

    /// @dev Loan struct containing all loan parameters
    struct Loan {
        uint256 id;                    // Unique loan ID
        bytes32 borrowerDID;           // Borrower's DID
        address lender;                // Lender address (can be agent or pool)
        address principalToken;        // Token used for principal (e.g., USDC)
        uint256 principalAmount;       // Principal amount
        uint256 interestRateBps;       // Interest rate in basis points per year
        uint256 startTime;             // Loan start timestamp
        uint256 maturity;              // Loan maturity timestamp
        address collateralToken;       // Collateral token address
        uint256 collateralAmount;      // Collateral amount locked
        LoanStatus status;             // Current loan status
        uint256 repaidAmount;          // Total amount repaid
        uint256 liquidatedAmount;      // Amount recovered via liquidation
    }

    /// @dev Configuration constants
    uint256 public constant MAX_LOAN_DURATION = 365 days;
    uint256 public constant MIN_LOAN_DURATION = 1 days;
    uint256 public constant MIN_INTEREST_RATE_BPS = 100; // 1% APR
    uint256 public constant MAX_INTEREST_RATE_BPS = 5000; // 50% APR
    uint256 public constant LIQUIDATION_THRESHOLD_BPS = 8000; // 80% - liquidate when collateral value < 80% of debt
    uint256 public constant LIQUIDATION_PENALTY_BPS = 1000; // 10% liquidation penalty
    uint256 public constant PROTOCOL_FEE_BPS = 50; // 0.5% protocol fee on interest

    /// @dev State variables
    ACSOracle public acsOracle;
    CollateralManager public collateralManager;
    IERC20 public immutable baseToken; // USDC or similar stablecoin

    uint256 public loanCounter;
    mapping(uint256 => Loan) public loans;
    mapping(bytes32 => uint256[]) public borrowerLoans; // DID -> loan IDs
    mapping(address => uint256[]) public lenderLoans;   // Lender -> loan IDs
    mapping(bytes32 => address) public borrowerAddresses; // DID -> wallet address

    bool public paused;

    /// @dev Events
    event LoanCreated(
        uint256 indexed loanId,
        bytes32 indexed borrowerDID,
        address indexed lender,
        address principalToken,
        uint256 principalAmount,
        uint256 interestRateBps,
        uint256 maturity,
        address collateralToken,
        uint256 collateralAmount
    );

    event LoanRepaid(
        uint256 indexed loanId,
        bytes32 indexed borrowerDID,
        uint256 principalAmount,
        uint256 interestAmount,
        uint256 protocolFee
    );

    event LoanLiquidated(
        uint256 indexed loanId,
        bytes32 indexed borrowerDID,
        address indexed liquidator,
        uint256 collateralSeized,
        uint256 debtCovered
    );

    event LoanDefaulted(
        uint256 indexed loanId,
        bytes32 indexed borrowerDID,
        uint256 outstandingDebt
    );

    event ProtocolFeeCollected(
        uint256 indexed loanId,
        uint256 feeAmount
    );

    event PoolPaused(bool paused);

    /// @dev Custom errors
    error LoanNotFound(uint256 loanId);
    error LoanNotActive(uint256 loanId);
    error InvalidLoanParameters(string reason);
    error InsufficientCollateral(uint256 required, uint256 provided);
    error InsufficientBalance(uint256 required, uint256 available);
    error InvalidACSScore(uint256 score);
    error ScoreExpired();
    error UnauthorizedLiquidator();
    error LoanNotDue(uint256 maturity);
    error LoanAlreadyRepaid();
    error PoolIsPaused();

    constructor(
        address _baseToken,
        address _acsOracle,
        address _collateralManager
    ) Ownable(msg.sender) {
        require(_baseToken != address(0), "Invalid base token");
        require(_acsOracle != address(0), "Invalid ACS Oracle");
        require(_collateralManager != address(0), "Invalid Collateral Manager");

        baseToken = IERC20(_baseToken);
        acsOracle = ACSOracle(_acsOracle);
        collateralManager = CollateralManager(_collateralManager);
    }

    /**
     * @dev Create a new loan with ACS-gated collateral requirements
     * @param borrowerDID Borrower's DID as bytes32
     * @param borrowerAddress Borrower's wallet address (receives principal)
     * @param principalAmount Principal amount in base token
     * @param interestRateBps Interest rate in basis points per year
     * @param duration Loan duration in seconds
     * @param collateralToken Collateral token address
     */
    function createLoan(
        bytes32 borrowerDID,
        address borrowerAddress,
        uint256 principalAmount,
        uint256 interestRateBps,
        uint256 duration,
        address collateralToken
    ) external nonReentrant returns (uint256 loanId) {
        require(!paused, "PoolIsPaused");
        require(principalAmount > 0, "Principal must be > 0");
        require(interestRateBps >= MIN_INTEREST_RATE_BPS && interestRateBps <= MAX_INTEREST_RATE_BPS, "Invalid interest rate");
        require(duration >= MIN_LOAN_DURATION && duration <= MAX_LOAN_DURATION, "Invalid duration");
        require(borrowerAddress != address(0), "Invalid borrower address");

        // Verify borrower has valid ACS score
        (uint256 score, uint256 timestamp, uint256 expiry) = acsOracle.getScore(borrowerDID);
        require(score > 0, "No valid ACS score");
        require(expiry > block.timestamp, "ACS score expired");

        // Calculate required collateral based on ACS score
        uint256 requiredCollateral = collateralManager.calculateRequiredCollateral(principalAmount, score);

        // Pull collateral from borrower to this contract first
        IERC20 token = IERC20(collateralToken);
        token.safeTransferFrom(borrowerAddress, address(this), requiredCollateral);

        // Approve CollateralManager to spend collateral from this contract
        token.approve(address(collateralManager), requiredCollateral);

        // Deposit collateral to CollateralManager
        collateralManager.depositCollateral(borrowerDID, collateralToken, requiredCollateral);

        // Transfer principal from lender DIRECTLY to borrower
        baseToken.safeTransferFrom(msg.sender, borrowerAddress, principalAmount);

        // Store DID -> address mapping for future claims
        borrowerAddresses[borrowerDID] = borrowerAddress;

        // Create loan record
        loanId = ++loanCounter;
        uint256 startTime = block.timestamp;
        uint256 maturity = startTime + duration;

        loans[loanId] = Loan({
            id: loanId,
            borrowerDID: borrowerDID,
            lender: msg.sender,
            principalToken: address(baseToken),
            principalAmount: principalAmount,
            interestRateBps: interestRateBps,
            startTime: startTime,
            maturity: maturity,
            collateralToken: collateralToken,
            collateralAmount: requiredCollateral,
            status: LoanStatus.Active,
            repaidAmount: 0,
            liquidatedAmount: 0
        });

        borrowerLoans[borrowerDID].push(loanId);
        lenderLoans[msg.sender].push(loanId);

        emit LoanCreated(
            loanId,
            borrowerDID,
            msg.sender,
            address(baseToken),
            principalAmount,
            interestRateBps,
            maturity,
            collateralToken,
            requiredCollateral
        );
    }

    /**
     * @dev Create a loan where borrower provides collateral directly
     * @param borrowerDID Borrower's DID as bytes32
     * @param borrowerAddress Borrower's wallet address (receives principal)
     * @param principalAmount Principal amount in base token
     * @param interestRateBps Interest rate in basis points per year
     * @param duration Loan duration in seconds
     * @param collateralToken Collateral token address
     * @param collateralAmount Collateral amount provided by borrower
     */
    function createLoanWithCollateral(
        bytes32 borrowerDID,
        address borrowerAddress,
        uint256 principalAmount,
        uint256 interestRateBps,
        uint256 duration,
        address collateralToken,
        uint256 collateralAmount
    ) external nonReentrant returns (uint256 loanId) {
        require(!paused, "PoolIsPaused");
        require(principalAmount > 0, "Principal must be > 0");
        require(interestRateBps >= MIN_INTEREST_RATE_BPS && interestRateBps <= MAX_INTEREST_RATE_BPS, "Invalid interest rate");
        require(duration >= MIN_LOAN_DURATION && duration <= MAX_LOAN_DURATION, "Invalid duration");
        require(collateralAmount > 0, "Collateral must be > 0");
        require(borrowerAddress != address(0), "Invalid borrower address");

        // Verify borrower has valid ACS score
        (uint256 score, , uint256 expiry) = acsOracle.getScore(borrowerDID);
        require(score > 0, "No valid ACS score");
        require(expiry > block.timestamp, "ACS score expired");

        // Verify collateral meets minimum requirement
        uint256 requiredCollateral = collateralManager.calculateRequiredCollateral(principalAmount, score);
        require(collateralAmount >= requiredCollateral, "Insufficient collateral");

        // Deposit collateral from borrower
        collateralManager.depositCollateral(borrowerDID, collateralToken, collateralAmount);

        // Transfer principal from lender DIRECTLY to borrower
        baseToken.safeTransferFrom(msg.sender, borrowerAddress, principalAmount);

        // Store DID -> address mapping for future claims
        borrowerAddresses[borrowerDID] = borrowerAddress;

        // Create loan record
        loanId = ++loanCounter;
        uint256 startTime = block.timestamp;
        uint256 maturity = startTime + duration;

        loans[loanId] = Loan({
            id: loanId,
            borrowerDID: borrowerDID,
            lender: msg.sender,
            principalToken: address(baseToken),
            principalAmount: principalAmount,
            interestRateBps: interestRateBps,
            startTime: startTime,
            maturity: maturity,
            collateralToken: collateralToken,
            collateralAmount: collateralAmount,
            status: LoanStatus.Active,
            repaidAmount: 0,
            liquidatedAmount: 0
        });

        borrowerLoans[borrowerDID].push(loanId);
        lenderLoans[msg.sender].push(loanId);

        emit LoanCreated(
            loanId,
            borrowerDID,
            msg.sender,
            address(baseToken),
            principalAmount,
            interestRateBps,
            maturity,
            collateralToken,
            collateralAmount
        );
    }

    /// @dev Event emitted when borrower claims principal
    event PrincipalClaimed(uint256 indexed loanId, bytes32 indexed borrowerDID, address indexed borrower, uint256 amount);

    /**
     * @dev Allow borrower to claim principal if it was sent to contract (legacy loans)
     * @param loanId Loan ID to claim principal for
     */
    function claimPrincipal(uint256 loanId) external nonReentrant {
        Loan storage loan = loans[loanId];
        require(loan.id != 0, "Loan not found");

        // Get borrower address from mapping
        address borrower = borrowerAddresses[loan.borrowerDID];
        require(borrower != address(0), "Borrower address not set");
        require(msg.sender == borrower, "Only borrower can claim");

        // Check if contract holds principal for this loan
        uint256 contractBalance = baseToken.balanceOf(address(this));
        require(contractBalance >= loan.principalAmount, "No principal to claim");

        // Transfer principal to borrower
        baseToken.safeTransfer(borrower, loan.principalAmount);

        emit PrincipalClaimed(loanId, loan.borrowerDID, borrower, loan.principalAmount);
    }

    /**
     * @dev Get borrower wallet address for a DID
     * @param borrowerDID Borrower's DID
     * @return Borrower's wallet address
     */
    function getBorrowerAddress(bytes32 borrowerDID) external view returns (address) {
        return borrowerAddresses[borrowerDID];
    }

    /**
     * @dev Repay a loan (principal + accrued interest)
     * @param loanId Loan ID to repay
     */
    function repayLoan(uint256 loanId) external nonReentrant {
        require(!paused, "Pool paused");

        Loan storage loan = loans[loanId];
        require(loan.id != 0, "Loan not found");
        require(loan.status == LoanStatus.Active, "Loan not active");

        // Calculate outstanding amount (principal + interest)
        uint256 outstanding = _calculateOutstanding(loan);
        uint256 interestAmount = outstanding > loan.principalAmount ? outstanding - loan.principalAmount : 0;
        uint256 protocolFee = (interestAmount * PROTOCOL_FEE_BPS) / 10000;
        uint256 totalDue = outstanding + protocolFee;

        // Transfer repayment from borrower (or anyone) to contract
        baseToken.safeTransferFrom(msg.sender, address(this), totalDue);

        // Calculate lender share (interest - protocol fee)
        uint256 lenderInterest = interestAmount - protocolFee;
        uint256 lenderRepayment = loan.principalAmount + lenderInterest;

        // Transfer principal + interest to lender
        baseToken.safeTransfer(loan.lender, lenderRepayment);

        // Transfer protocol fee to treasury (owner)
        if (protocolFee > 0) {
            baseToken.safeTransfer(owner(), protocolFee);
            emit ProtocolFeeCollected(loanId, protocolFee);
        }

        // Update loan state
        loan.status = LoanStatus.Repaid;
        loan.repaidAmount = totalDue;

        // Release collateral back to borrower
        // Note: In production, we'd map DID to wallet address. For now, use lender as fallback
        collateralManager.releaseCollateral(loan.borrowerDID, loan.collateralToken, loan.collateralAmount, loan.lender);

        emit LoanRepaid(loanId, loan.borrowerDID, loan.principalAmount, interestAmount, protocolFee);
    }

    /**
     * @dev Liquidate an undercollateralized loan
     * @param loanId Loan ID to liquidate
     */
    function liquidateLoan(uint256 loanId) external nonReentrant {
        require(!paused, "Pool paused");

        Loan storage loan = loans[loanId];
        require(loan.id != 0, "Loan not found");
        require(loan.status == LoanStatus.Active, "Loan not active");

        // Calculate current debt
        uint256 outstanding = _calculateOutstanding(loan);

        // Get current collateral value (in base token terms)
        // For simplicity, assume 1:1 collateral to base token ratio for liquidation check
        // In production, would use price oracle
        uint256 collateralValue = loan.collateralAmount; // Simplified

        // Check if position is undercollateralized (collateral < 80% of debt)
        uint256 threshold = (outstanding * LIQUIDATION_THRESHOLD_BPS) / 10000;
        require(collateralValue < threshold, "Position adequately collateralized");

        // Seize collateral (liquidator receives collateral at discount)
        uint256 seizeAmount = loan.collateralAmount;
        collateralManager.seizeCollateral(loan.borrowerDID, loan.collateralToken, seizeAmount, msg.sender);

        // Calculate debt covered by seized collateral (with penalty)
        uint256 debtCovered = (seizeAmount * (10000 - LIQUIDATION_PENALTY_BPS)) / 10000;
        debtCovered = debtCovered > outstanding ? outstanding : debtCovered;

        // Update loan state
        loan.status = LoanStatus.Liquidated;
        loan.liquidatedAmount = debtCovered;

        // Transfer covered debt to lender
        if (debtCovered > 0) {
            baseToken.safeTransfer(loan.lender, debtCovered);
        }

        emit LoanLiquidated(loanId, loan.borrowerDID, msg.sender, seizeAmount, debtCovered);
    }

    /**
     * @dev Handle loan default (called after maturity)
     * @param loanId Loan ID that defaulted
     */
    function handleDefault(uint256 loanId) external nonReentrant {
        require(!paused, "Pool paused");

        Loan storage loan = loans[loanId];
        require(loan.id != 0, "Loan not found");
        require(loan.status == LoanStatus.Active, "Loan not active");
        require(block.timestamp >= loan.maturity, "Loan not yet matured");

        // Calculate outstanding debt
        uint256 outstanding = _calculateOutstanding(loan);

        // Try to liquidate collateral to cover debt
        uint256 collateralValue = loan.collateralAmount; // Simplified

        if (collateralValue > 0) {
            // Seize all collateral
            collateralManager.seizeCollateral(loan.borrowerDID, loan.collateralToken, loan.collateralAmount, msg.sender);

            uint256 debtCovered = (collateralValue * (10000 - LIQUIDATION_PENALTY_BPS)) / 10000;
            debtCovered = debtCovered > outstanding ? outstanding : debtCovered;

            loan.liquidatedAmount = debtCovered;

            if (debtCovered > 0) {
                baseToken.safeTransfer(loan.lender, debtCovered);
            }
        }

        loan.status = LoanStatus.Defaulted;

        emit LoanDefaulted(loanId, loan.borrowerDID, outstanding - loan.liquidatedAmount);
    }

    /**
     * @dev Calculate outstanding amount for a loan (principal + accrued interest)
     * @param loan Loan struct
     * @return Outstanding amount
     */
    function _calculateOutstanding(Loan memory loan) internal view returns (uint256) {
        uint256 elapsed;
        if (block.timestamp >= loan.maturity) {
            elapsed = loan.maturity - loan.startTime;
        } else {
            elapsed = block.timestamp - loan.startTime;
        }

        // Simple interest: principal * rate * time / (365 days * 10000 bps)
        uint256 interest = (loan.principalAmount * loan.interestRateBps * elapsed) /
                          (365 days * 10000);

        return loan.principalAmount + interest;
    }

    /**
     * @dev Get outstanding amount for a loan
     * @param loanId Loan ID
     * @return Outstanding amount (principal + interest)
     */
    function getOutstanding(uint256 loanId) external view returns (uint256) {
        Loan storage loan = loans[loanId];
        require(loan.id != 0, "Loan not found");
        return _calculateOutstanding(loan);
    }

    /**
     * @dev Get loan details
     * @param loanId Loan ID
     * @return Loan struct
     */
    function getLoan(uint256 loanId) external view returns (Loan memory) {
        Loan storage loan = loans[loanId];
        require(loan.id != 0, "Loan not found");
        return loan;
    }

    /**
     * @dev Get all loan IDs for a borrower
     * @param borrowerDID Borrower's DID
     * @return Array of loan IDs
     */
    function getBorrowerLoans(bytes32 borrowerDID) external view returns (uint256[] memory) {
        return borrowerLoans[borrowerDID];
    }

    /**
     * @dev Get all loan IDs for a lender
     * @param lender Lender address
     * @return Array of loan IDs
     */
    function getLenderLoans(address lender) external view returns (uint256[] memory) {
        return lenderLoans[lender];
    }

    /**
     * @dev Pause/unpause the pool (owner only)
     * @param _paused New pause state
     */
    function setPaused(bool _paused) external onlyOwner {
        paused = _paused;
        emit PoolPaused(_paused);
    }

    /**
     * @dev Emergency withdrawal of base tokens (owner only)
     * @param token Token to withdraw
     * @param amount Amount to withdraw
     */
    function emergencyWithdraw(address token, uint256 amount) external onlyOwner {
        IERC20(token).safeTransfer(owner(), amount);
    }

    /**
     * @dev Update ACS Oracle address (owner only)
     * @param newOracle New ACS Oracle address
     */
    function setACSOracle(address newOracle) external onlyOwner {
        require(newOracle != address(0), "Invalid oracle");
        acsOracle = ACSOracle(newOracle);
    }

    /**
     * @dev Update Collateral Manager address (owner only)
     * @param newManager New Collateral Manager address
     */
    function setCollateralManager(address newManager) external onlyOwner {
        require(newManager != address(0), "Invalid manager");
        collateralManager = CollateralManager(newManager);
    }

    /**
     * @dev Get contract base token balance
     * @return Base token balance
     */
    function getBaseTokenBalance() external view returns (uint256) {
        return baseToken.balanceOf(address(this));
    }
}