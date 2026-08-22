import {
  createPublicClient,
  http,
  parseEther,
  formatEther,
  type Hash,
  type Address,
} from "viem";
import { monadTestnet, MONAD_CONFIG } from "@/config/monad";
import { AuraConnectABI } from "@/contracts/AuraConnectABI";

export interface TransactionStatus {
  hash?: Hash;
  status: "idle" | "wallet_pending" | "submitting" | "confirmed" | "error";
  error?: string;
  receipt?: any;
}

export class BlockchainService {
  private static publicClient = createPublicClient({
    chain: monadTestnet,
    transport: http(MONAD_CONFIG.rpcUrl),
  });

  static getPublicClient() {
    return this.publicClient;
  }

  /**
   * Checks on-chain whether consumer address has permission for memoryId
   */
  static async checkHasAccess(
    memoryId: `0x${string}`,
    consumerAddress: Address
  ): Promise<boolean> {
    try {
      const data = await this.publicClient.readContract({
        address: MONAD_CONFIG.contractAddress,
        abi: AuraConnectABI,
        functionName: "hasAccess",
        args: [memoryId, consumerAddress],
      });
      return Boolean(data);
    } catch (err) {
      console.warn("Error querying hasAccess on-chain, falling back:", err);
      return false;
    }
  }

  /**
   * Fetches on-chain MemoryRecord for given memoryId
   */
  static async getMemoryRecord(memoryId: `0x${string}`) {
    try {
      const record = await this.publicClient.readContract({
        address: MONAD_CONFIG.contractAddress,
        abi: AuraConnectABI,
        functionName: "getMemory",
        args: [memoryId],
      });
      return {
        id: record.id,
        owner: record.owner,
        metadataURI: record.metadataURI,
        accessFeeWei: record.accessFee,
        accessFeeMON: formatEther(record.accessFee),
        createdAt: Number(record.createdAt) * 1000,
        active: record.active,
      };
    } catch (err) {
      console.error("Error fetching memory record:", err);
      return null;
    }
  }

  /**
   * Fetches list of memory IDs owned by user address on-chain
   */
  static async getUserMemories(userAddress: Address): Promise<`0x${string}`[]> {
    try {
      const ids = await this.publicClient.readContract({
        address: MONAD_CONFIG.contractAddress,
        abi: AuraConnectABI,
        functionName: "getUserMemories",
        args: [userAddress],
      });
      return ids as `0x${string}`[];
    } catch (err) {
      console.error("Error fetching user memories from contract:", err);
      return [];
    }
  }

  /**
   * Formats Monad transaction URL for block explorer
   */
  static getExplorerTxUrl(txHash: string): string {
    return `${MONAD_CONFIG.explorerUrl}/tx/${txHash}`;
  }

  /**
   * Formats Monad address URL for block explorer
   */
  static getExplorerAddressUrl(address: string): string {
    return `${MONAD_CONFIG.explorerUrl}/address/${address}`;
  }
}
