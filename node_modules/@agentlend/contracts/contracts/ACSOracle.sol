// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

/**
 * @title ACSOracle
 * @dev Oracle contract for Agent Credit Score (ACS) verification.
 * Only the authorized oracle signer can push scores. Scores expire after a validity period.
 */
contract ACSOracle is Ownable {
    using ECDSA for bytes32;

    /// @dev Struct representing a signed ACS score payload
    struct ACSData {
        uint256 score;        // Credit score (300-900)
        uint256 timestamp;    // When the score was generated
        uint256 expiry;       // When the score expires
        bytes signature;      // ECDSA signature from oracle signer
    }

    /// @dev The authorized oracle signer address
    address public oracleSigner;

    /// @dev Score validity period in seconds (default: 20 minutes)
    uint256 public constant SCORE_VALIDITY = 1200;

    /// @dev Minimum valid score
    uint256 public constant MIN_SCORE = 300;

    /// @dev Maximum valid score
    uint256 public constant MAX_SCORE = 900;

    /// @dev Mapping from agent DID (bytes32) to latest ACS data
    mapping(bytes32 => ACSData) public agentScores;

    /// @dev Event emitted when a new score is set
    event ScoreUpdated(bytes32 indexed agentDID, uint256 score, uint256 timestamp, uint256 expiry);

    /// @dev Debug event for signature verification
    event DebugDigest(bytes32 digest, address recovered, address expected);

    /// @dev Event emitted when oracle signer is changed
    event OracleSignerChanged(address indexed oldSigner, address indexed newSigner);

    constructor(address _oracleSigner) Ownable(msg.sender) {
        require(_oracleSigner != address(0), "Invalid oracle signer");
        oracleSigner = _oracleSigner;
    }

    /**
     * @dev Set a new ACS score for an agent (called by oracle service)
     * @param agentDID The agent's DID as bytes32
     * @param score The credit score (300-900)
     * @param timestamp When the score was generated
     * @param expiry When the score expires
     * @param signature ECDSA signature from oracle signer
     */
    function setScore(
        bytes32 agentDID,
        uint256 score,
        uint256 timestamp,
        uint256 expiry,
        bytes calldata signature
    ) external {
        require(score >= MIN_SCORE && score <= MAX_SCORE, "Invalid score range");
        require(timestamp <= block.timestamp, "Future timestamp");
        require(expiry > block.timestamp, "Already expired");
        require(expiry - timestamp <= SCORE_VALIDITY, "Expiry too far");

        // Verify signature using OpenZeppelin ECDSA with Ethereum signed message prefix
        // This matches ethers.js signMessage() which adds the prefix
        bytes32 digest = keccak256(abi.encodePacked(agentDID, score, timestamp, expiry));
        bytes32 ethSignedMessageHash = MessageHashUtils.toEthSignedMessageHash(digest);
        address recovered = ECDSA.recover(ethSignedMessageHash, signature);
        require(recovered == oracleSigner, "Invalid signature");

        // Check if score is newer than existing
        ACSData storage existing = agentScores[agentDID];
        require(timestamp > existing.timestamp, "Stale score");

        agentScores[agentDID] = ACSData(score, timestamp, expiry, signature);
        emit ScoreUpdated(agentDID, score, timestamp, expiry);
    }

    /**
     * @dev Get the current valid ACS score for an agent
     * @param agentDID The agent's DID as bytes32
     * @return score The credit score (0 if no valid score)
     * @return timestamp When the score was generated
     * @return expiry When the score expires
     */
    function getScore(bytes32 agentDID) external view returns (uint256 score, uint256 timestamp, uint256 expiry) {
        ACSData memory data = agentScores[agentDID];
        if (data.expiry > block.timestamp && data.score != 0) {
            return (data.score, data.timestamp, data.expiry);
        }
        return (0, 0, 0);
    }

    /**
     * @dev Check if an agent has a valid score
     * @param agentDID The agent's DID as bytes32
     * @return bool True if valid score exists
     */
    function hasValidScore(bytes32 agentDID) external view returns (bool) {
        ACSData memory data = agentScores[agentDID];
        return data.expiry > block.timestamp && data.score != 0;
    }

    /**
     * @dev Update the oracle signer (owner only)
     * @param newSigner New oracle signer address
     */
    function setOracleSigner(address newSigner) external onlyOwner {
        require(newSigner != address(0), "Invalid signer");
        address oldSigner = oracleSigner;
        oracleSigner = newSigner;
        emit OracleSignerChanged(oldSigner, newSigner);
    }

    /**
     * @dev Compute digest for signature verification (for testing/debugging)
     * @param agentDID The agent's DID as bytes32
     * @param score The credit score (300-900)
     * @param timestamp When the score was generated
     * @param expiry When the score expires
     * @return digest The computed digest
     */
    function computeDigest(bytes32 agentDID, uint256 score, uint256 timestamp, uint256 expiry) external pure returns (bytes32) {
        return keccak256(abi.encodePacked(agentDID, score, timestamp, expiry));
    }

    /**
     * @dev Emergency function to invalidate a score (owner only)
     * @param agentDID The agent's DID as bytes32
     */
    function invalidateScore(bytes32 agentDID) external onlyOwner {
        delete agentScores[agentDID];
    }
}