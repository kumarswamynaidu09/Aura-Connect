// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title AuraConnect
 * @dev Sovereign AI Context & Memory Protocol for Monad.
 * Allows users to register AI memory assets, manage granular application access,
 * and monetize context via micro-payments in native MON.
 */
contract AuraConnect {
    struct MemoryRecord {
        bytes32 id;
        address owner;
        string metadataURI;
        uint256 accessFee;
        uint256 createdAt;
        bool active;
    }

    // Mapping from memoryId => MemoryRecord
    mapping(bytes32 => MemoryRecord) public memories;
    
    // Mapping from memoryId => consumer address => hasAccess boolean
    mapping(bytes32 => mapping(address => bool)) public permissions;
    
    // Mapping from user address => array of owned memoryIds
    mapping(address => bytes32[]) private _userMemories;

    // Global memory list for discoverability
    bytes32[] public allMemoryIds;

    // Events
    event MemoryCreated(
        bytes32 indexed memoryId,
        address indexed owner,
        uint256 accessFee,
        string metadataURI
    );

    event AccessGranted(
        bytes32 indexed memoryId,
        address indexed consumer,
        address indexed granter
    );

    event AccessRevoked(
        bytes32 indexed memoryId,
        address indexed consumer,
        address indexed revoker
    );

    event PaymentReceived(
        bytes32 indexed memoryId,
        address indexed payer,
        address indexed owner,
        uint256 amount
    );

    event MemoryStatusUpdated(
        bytes32 indexed memoryId,
        bool active
    );

    // Modifiers
    modifier onlyMemoryOwner(bytes32 memoryId) {
        require(memories[memoryId].owner == msg.sender, "AuraConnect: caller is not memory owner");
        _;
    }

    /**
     * @notice Registers a new AI memory context on-chain.
     * @param memoryId Unique cryptographic hash identifying the memory
     * @param metadataURI Off-chain pointer (IPFS URI or encrypted store reference)
     * @param accessFee Fee in native MON wei required for 3rd-party apps to access
     */
    function createMemory(
        bytes32 memoryId,
        string calldata metadataURI,
        uint256 accessFee
    ) external {
        require(memoryId != bytes32(0), "AuraConnect: invalid memoryId");
        require(memories[memoryId].owner == address(0), "AuraConnect: memory already exists");

        MemoryRecord memory newRecord = MemoryRecord({
            id: memoryId,
            owner: msg.sender,
            metadataURI: metadataURI,
            accessFee: accessFee,
            createdAt: block.timestamp,
            active: true
        });

        memories[memoryId] = newRecord;
        _userMemories[msg.sender].push(memoryId);
        allMemoryIds.push(memoryId);

        // Owner always has intrinsic access
        permissions[memoryId][msg.sender] = true;

        emit MemoryCreated(memoryId, msg.sender, accessFee, metadataURI);
        emit AccessGranted(memoryId, msg.sender, msg.sender);
    }

    /**
     * @notice Allows memory owner to grant direct access to an application or consumer.
     * @param memoryId Memory identifier
     * @param consumer Consumer address (e.g. Code AI contract/agent or user delegate)
     */
    function grantAccess(bytes32 memoryId, address consumer) external onlyMemoryOwner(memoryId) {
        require(consumer != address(0), "AuraConnect: invalid consumer address");
        permissions[memoryId][consumer] = true;
        emit AccessGranted(memoryId, consumer, msg.sender);
    }

    /**
     * @notice Allows memory owner to revoke access from an application or consumer.
     * @param memoryId Memory identifier
     * @param consumer Consumer address to revoke
     */
    function revokeAccess(bytes32 memoryId, address consumer) external onlyMemoryOwner(memoryId) {
        require(consumer != address(0), "AuraConnect: invalid consumer address");
        require(consumer != msg.sender, "AuraConnect: cannot revoke owner access");
        permissions[memoryId][consumer] = false;
        emit AccessRevoked(memoryId, consumer, msg.sender);
    }

    /**
     * @notice Consumer or App pays the required fee to unlock access to a memory.
     * @param memoryId Memory identifier
     */
    function payForAccess(bytes32 memoryId) external payable {
        MemoryRecord storage mem = memories[memoryId];
        require(mem.owner != address(0), "AuraConnect: memory does not exist");
        require(mem.active, "AuraConnect: memory is inactive");
        require(msg.value >= mem.accessFee, "AuraConnect: insufficient payment");

        permissions[memoryId][msg.sender] = true;

        // Forward payment to memory owner
        if (msg.value > 0) {
            (bool success, ) = payable(mem.owner).call{value: msg.value}("");
            require(success, "AuraConnect: transfer to owner failed");
        }

        emit PaymentReceived(memoryId, msg.sender, mem.owner, msg.value);
        emit AccessGranted(memoryId, msg.sender, msg.sender);
    }

    /**
     * @notice Checks whether an address has active access to a memory.
     * @param memoryId Memory identifier
     * @param consumer Address to query
     */
    function hasAccess(bytes32 memoryId, address consumer) external view returns (bool) {
        if (memories[memoryId].owner == consumer) {
            return true;
        }
        return permissions[memoryId][consumer];
    }

    /**
     * @notice Returns memory record details.
     */
    function getMemory(bytes32 memoryId) external view returns (MemoryRecord memory) {
        require(memories[memoryId].owner != address(0), "AuraConnect: memory not found");
        return memories[memoryId];
    }

    /**
     * @notice Returns list of memory IDs owned by a user.
     */
    function getUserMemories(address user) external view returns (bytes32[] memory) {
        return _userMemories[user];
    }

    /**
     * @notice Returns total number of registered memories.
     */
    function totalMemoriesCount() external view returns (uint256) {
        return allMemoryIds.length;
    }
}
