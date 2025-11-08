// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title CryptoMixer
 * @dev Conceptual crypto tumbler/mixer for anonymizing transactions
 * DISCLAIMER: Educational purposes only. Real mixers are far more complex.
 */
contract CryptoMixer is ReentrancyGuard {
    // Minimum deposit amount (0.01 ETH)
    uint256 public constant MIN_DEPOSIT = 0.01 ether;

    // Maximum deposit amount (10 ETH)
    uint256 public constant MAX_DEPOSIT = 10 ether;

    // Mixing fee (2%)
    uint256 public constant MIXING_FEE_PERCENT = 2;

    // Mixing pool
    uint256 public poolBalance;

    // Deposit tracking (hashed for privacy)
    mapping(bytes32 => uint256) private deposits;
    mapping(bytes32 => bool) private withdrawn;

    // Events
    event DepositReceived(bytes32 indexed depositHash, uint256 amount, uint256 timestamp);
    event WithdrawalExecuted(bytes32 indexed depositHash, address indexed recipient, uint256 amount);

    /**
     * @dev Deposit funds into the mixer
     * @param depositSecret Secret phrase (hashed off-chain, used for withdrawal)
     */
    function deposit(bytes32 depositSecret) external payable nonReentrant {
        require(msg.value >= MIN_DEPOSIT, "Deposit too small");
        require(msg.value <= MAX_DEPOSIT, "Deposit too large");
        require(deposits[depositSecret] == 0, "Deposit secret already used");

        // Create unique deposit hash
        bytes32 depositHash = keccak256(abi.encodePacked(depositSecret, msg.sender, block.timestamp));

        // Store deposit
        deposits[depositHash] = msg.value;
        poolBalance += msg.value;

        emit DepositReceived(depositHash, msg.value, block.timestamp);
    }

    /**
     * @dev Withdraw funds from mixer to a different address
     * @param depositSecret Original deposit secret
     * @param recipient Address to send mixed funds to
     */
    function withdraw(
        bytes32 depositSecret,
        address payable recipient
    ) external nonReentrant {
        // Reconstruct deposit hash (requires original secret)
        bytes32 depositHash = keccak256(abi.encodePacked(depositSecret, msg.sender, block.timestamp));

        require(deposits[depositHash] > 0, "Invalid deposit");
        require(!withdrawn[depositHash], "Already withdrawn");

        uint256 depositAmount = deposits[depositHash];
        uint256 fee = (depositAmount * MIXING_FEE_PERCENT) / 100;
        uint256 withdrawAmount = depositAmount - fee;

        // Mark as withdrawn
        withdrawn[depositHash] = true;
        poolBalance -= depositAmount;

        // Transfer mixed funds
        (bool success, ) = recipient.call{value: withdrawAmount}("");
        require(success, "Transfer failed");

        emit WithdrawalExecuted(depositHash, recipient, withdrawAmount);
    }

    /**
     * @dev Check if deposit exists (without revealing amount)
     */
    function hasDeposit(bytes32 depositHash) external view returns (bool) {
        return deposits[depositHash] > 0;
    }

    /**
     * @dev Get pool statistics (for transparency)
     */
    function getPoolStats() external view returns (uint256 balance, uint256 minDeposit, uint256 maxDeposit, uint256 fee) {
        return (poolBalance, MIN_DEPOSIT, MAX_DEPOSIT, MIXING_FEE_PERCENT);
    }

    /**
     * @dev Fallback to receive ETH
     */
    receive() external payable {
        poolBalance += msg.value;
    }
}
