import { keccak256, toHex, stringToBytes } from "viem";

export type MemoryCategory =
  | "technical_preferences"
  | "project_context"
  | "work_style"
  | "personal_goals";

export interface AIMemory {
  id: `0x${string}`; // bytes32
  rawId: string;
  title: string;
  category: MemoryCategory;
  categoryLabel: string;
  content: string;
  summary: string;
  sourceApp: "Life AI" | "Code AI" | "Manual";
  owner: `0x${string}`;
  createdAt: number;
  accessFeeMON: string; // e.g. "0.0001"
  metadataURI: string;
  encrypted: boolean;
  tags: string[];
}

export interface AccessGrant {
  memoryId: `0x${string}`;
  appName: string;
  appAddress: `0x${string}`;
  grantedAt: number;
  paidAmountMON: string;
  txHash?: string;
  status: "active" | "revoked";
}

// Fixed well-known consumer address for Code AI persona within Aura Connect ecosystem
export const CODE_AI_APP_ADDRESS = "0x829100000000000000000000000000000000C0DE" as `0x${string}`;
export const LIFE_AI_APP_ADDRESS = "0x71FE0000000000000000000000000000000071FE" as `0x${string}`;

/**
 * Deterministically generates a bytes32 memoryId from content and owner address
 */
export function generateMemoryId(title: string, owner: string): `0x${string}` {
  const seed = `${owner.toLowerCase()}_${title.toLowerCase().replace(/\s+/g, "_")}_${Date.now()}`;
  return keccak256(stringToBytes(seed));
}

// Browser & memory storage helper
const STORAGE_KEY = "aura_connect_memories_v1";
const GRANTS_KEY = "aura_connect_grants_v1";

export class MemoryStore {
  static getMemories(ownerAddress?: string): AIMemory[] {
    if (typeof window === "undefined") return [];
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) return [];
      const all: AIMemory[] = JSON.parse(data);
      if (ownerAddress) {
        return all.filter(
          (m) => m.owner.toLowerCase() === ownerAddress.toLowerCase()
        );
      }
      return all;
    } catch {
      return [];
    }
  }

  static saveMemory(memory: AIMemory): void {
    if (typeof window === "undefined") return;
    const current = this.getMemories();
    const filtered = current.filter((m) => m.id !== memory.id);
    filtered.unshift(memory);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  }

  static getMemoryById(id: `0x${string}`): AIMemory | undefined {
    const memories = this.getMemories();
    return memories.find((m) => m.id.toLowerCase() === id.toLowerCase());
  }

  static getGrants(): AccessGrant[] {
    if (typeof window === "undefined") return [];
    try {
      const data = localStorage.getItem(GRANTS_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  static saveGrant(grant: AccessGrant): void {
    if (typeof window === "undefined") return;
    const current = this.getGrants();
    const filtered = current.filter(
      (g) =>
        !(
          g.memoryId.toLowerCase() === grant.memoryId.toLowerCase() &&
          g.appAddress.toLowerCase() === grant.appAddress.toLowerCase()
        )
    );
    filtered.unshift(grant);
    localStorage.setItem(GRANTS_KEY, JSON.stringify(filtered));
  }

  static updateGrantStatus(
    memoryId: `0x${string}`,
    appAddress: `0x${string}`,
    status: "active" | "revoked"
  ): void {
    if (typeof window === "undefined") return;
    const grants = this.getGrants();
    const updated = grants.map((g) => {
      if (
        g.memoryId.toLowerCase() === memoryId.toLowerCase() &&
        g.appAddress.toLowerCase() === appAddress.toLowerCase()
      ) {
        return { ...g, status };
      }
      return g;
    });
    localStorage.setItem(GRANTS_KEY, JSON.stringify(updated));
  }
}
