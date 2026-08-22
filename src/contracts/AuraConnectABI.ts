export const AuraConnectABI = [
  {
    type: "function",
    name: "createMemory",
    inputs: [
      { name: "memoryId", type: "bytes32", internalType: "bytes32" },
      { name: "metadataURI", type: "string", internalType: "string" },
      { name: "accessFee", type: "uint256", internalType: "uint256" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "grantAccess",
    inputs: [
      { name: "memoryId", type: "bytes32", internalType: "bytes32" },
      { name: "consumer", type: "address", internalType: "address" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "revokeAccess",
    inputs: [
      { name: "memoryId", type: "bytes32", internalType: "bytes32" },
      { name: "consumer", type: "address", internalType: "address" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "payForAccess",
    inputs: [{ name: "memoryId", type: "bytes32", internalType: "bytes32" }],
    outputs: [],
    stateMutability: "payable",
  },
  {
    type: "function",
    name: "hasAccess",
    inputs: [
      { name: "memoryId", type: "bytes32", internalType: "bytes32" },
      { name: "consumer", type: "address", internalType: "address" },
    ],
    outputs: [{ name: "", type: "bool", internalType: "bool" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getMemory",
    inputs: [{ name: "memoryId", type: "bytes32", internalType: "bytes32" }],
    outputs: [
      {
        name: "",
        type: "tuple",
        internalType: "struct AuraConnect.MemoryRecord",
        components: [
          { name: "id", type: "bytes32", internalType: "bytes32" },
          { name: "owner", type: "address", internalType: "address" },
          { name: "metadataURI", type: "string", internalType: "string" },
          { name: "accessFee", type: "uint256", internalType: "uint256" },
          { name: "createdAt", type: "uint256", internalType: "uint256" },
          { name: "active", type: "bool", internalType: "bool" },
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getUserMemories",
    inputs: [{ name: "user", type: "address", internalType: "address" }],
    outputs: [{ name: "", type: "bytes32[]", internalType: "bytes32[]" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "totalMemoriesCount",
    inputs: [],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "event",
    name: "MemoryCreated",
    inputs: [
      { name: "memoryId", type: "bytes32", indexed: true, internalType: "bytes32" },
      { name: "owner", type: "address", indexed: true, internalType: "address" },
      { name: "accessFee", type: "uint256", indexed: false, internalType: "uint256" },
      { name: "metadataURI", type: "string", indexed: false, internalType: "string" },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "AccessGranted",
    inputs: [
      { name: "memoryId", type: "bytes32", indexed: true, internalType: "bytes32" },
      { name: "consumer", type: "address", indexed: true, internalType: "address" },
      { name: "granter", type: "address", indexed: true, internalType: "address" },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "AccessRevoked",
    inputs: [
      { name: "memoryId", type: "bytes32", indexed: true, internalType: "bytes32" },
      { name: "consumer", type: "address", indexed: true, internalType: "address" },
      { name: "revoker", type: "address", indexed: true, internalType: "address" },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "PaymentReceived",
    inputs: [
      { name: "memoryId", type: "bytes32", indexed: true, internalType: "bytes32" },
      { name: "payer", type: "address", indexed: true, internalType: "address" },
      { name: "owner", type: "address", indexed: true, internalType: "address" },
      { name: "amount", type: "uint256", indexed: false, internalType: "uint256" },
    ],
    anonymous: false,
  },
] as const;
