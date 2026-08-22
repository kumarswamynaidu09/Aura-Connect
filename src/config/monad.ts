import { defineChain } from "viem";

export const monadTestnet = defineChain({
  id: 10143,
  name: "Monad Testnet",
  nativeCurrency: {
    name: "MON",
    symbol: "MON",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: [
        process.env.NEXT_PUBLIC_MONAD_RPC || "https://testnet-rpc.monad.xyz",
      ],
    },
    public: {
      http: [
        process.env.NEXT_PUBLIC_MONAD_RPC || "https://testnet-rpc.monad.xyz",
      ],
    },
  },
  blockExplorers: {
    default: {
      name: "MonadScan",
      url: "https://testnet.monadscan.com",
    },
    socialscan: {
      name: "SocialScan",
      url: "https://monad-testnet.socialscan.io",
    },
  },
  testnet: true,
});

export const MONAD_CONFIG = {
  chainId: 10143,
  chain: monadTestnet,
  rpcUrl: process.env.NEXT_PUBLIC_MONAD_RPC || "https://testnet-rpc.monad.xyz",
  explorerUrl: "https://testnet.monadscan.com",
  defaultAccessFee: "0.0001", // in MON
  // AuraConnect deployed contract address on Monad Testnet
  contractAddress: (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ||
    "0x9A48F9c7A6E469bFe351E772877a5b3a8863f695") as `0x${string}`,
  gasConfig: {
    createMemoryGasLimit: 250000n,
    payForAccessGasLimit: 150000n,
    grantAccessGasLimit: 100000n,
    revokeAccessGasLimit: 100000n,
  },
};
