// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IGroth16Verifier {
    function verifyProof(
        uint[2] calldata _pA,
        uint[2][2] calldata _pB,
        uint[2] calldata _pC,
        uint[4] calldata _pubSignals
    ) external view returns (bool);
}

contract CarbonCredit {
    IGroth16Verifier public mrvVerifier;
    address public owner;

    // credit balances
    mapping(address => uint256) public creditBalance;
    // retired nullifiers
    mapping(bytes32 => bool) public retiredNullifiers;
    // MRV commitments on record
    mapping(bytes32 => bool) public mrvCommitments;

    event CreditMinted(address indexed to, uint256 amount, bytes32 commitment);
    event CreditRetired(address indexed by, uint256 amount, bytes32 nullifier);

    constructor(address _mrvVerifier) {
        mrvVerifier = IGroth16Verifier(_mrvVerifier);
        owner = msg.sender;
    }

    function verifyAndMint(
        uint[2] calldata _pA,
        uint[2][2] calldata _pB,
        uint[2] calldata _pC,
        uint[4] calldata _pubSignals,
        uint256 amount
    ) external {
        // Verify ZK proof
        require(
            mrvVerifier.verifyProof(_pA, _pB, _pC, _pubSignals),
            "Invalid MRV proof"
        );

        // Store commitment (pubSignals[3] is the Poseidon commitment)
        bytes32 commitment = bytes32(_pubSignals[3]);
        require(!mrvCommitments[commitment], "Commitment already used");
        mrvCommitments[commitment] = true;

        // Mint credits
        creditBalance[msg.sender] += amount;

        emit CreditMinted(msg.sender, amount, commitment);
    }

    function retireCredit(uint256 amount, bytes32 nullifier) external {
        require(creditBalance[msg.sender] >= amount, "Insufficient credits");
        require(!retiredNullifiers[nullifier], "Already retired");

        retiredNullifiers[nullifier] = true;
        creditBalance[msg.sender] -= amount;

        emit CreditRetired(msg.sender, amount, nullifier);
    }
}
