"use client";

import React, { useState, useEffect } from "react";
import { useAccount, useWriteContract, usePublicClient } from "wagmi";
import { type Hash } from "viem";
import {
  Shield,
  Key,
  Cpu,
  Trash2,
  ExternalLink,
  CheckCircle,
  XCircle,
  Loader2,
  Sparkles,
  Terminal,
  Clock,
  Layers,
  Database,
  Lock,
  RefreshCw,
} from "lucide-react";
import { AuraConnectABI } from "@/contracts/AuraConnectABI";
import { MONAD_CONFIG } from "@/config/monad";
import {
  MemoryStore,
  type AIMemory,
  type AccessGrant,
  CODE_AI_APP_ADDRESS,
} from "@/services/memory";
import { BlockchainService } from "@/services/blockchain";

export const AuraVault: React.FC = () => {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const { writeContractAsync } = useWriteContract();

  const [memories, setMemories] = useState<AIMemory[]>([]);
  const [grants, setGrants] = useState<AccessGrant[]>([]);
  const [activeTab, setActiveTab] = useState<"memories" | "apps" | "events">(
    "memories"
  );

  const [revokingApp, setRevokingApp] = useState<string | null>(null);
  const [txState, setTxState] = useState<{
    status: "idle" | "wallet_pending" | "submitting" | "confirmed" | "error";
    hash?: Hash;
    error?: string;
  }>({ status: "idle" });

  const loadVaultData = () => {
    if (!address) {
      setMemories(MemoryStore.getMemories());
      setGrants(MemoryStore.getGrants());
      return;
    }
    const mems = MemoryStore.getMemories(address);
    // If empty for this address, load all
    setMemories(mems.length > 0 ? mems : MemoryStore.getMemories());
    setGrants(MemoryStore.getGrants());
  };

  useEffect(() => {
    loadVaultData();
  }, [address, isConnected]);

  const handleRevoke = async (grant: AccessGrant) => {
    if (!isConnected || !address) {
      alert("Please connect your wallet first!");
      return;
    }

    try {
      setRevokingApp(grant.appName);
      setTxState({ status: "wallet_pending" });

      console.log("Submitting revokeAccess transaction on Monad Testnet...", {
        memoryId: grant.memoryId,
        consumer: grant.appAddress,
      });

      const hash = await writeContractAsync({
        address: MONAD_CONFIG.contractAddress,
        abi: AuraConnectABI,
        functionName: "revokeAccess",
        args: [grant.memoryId, grant.appAddress],
        gas: MONAD_CONFIG.gasConfig.revokeAccessGasLimit,
      });

      setTxState({ status: "submitting", hash });
      console.log(`Revoke transaction submitted: ${hash}`);

      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash });
      }

      setTxState({ status: "confirmed", hash });

      // Update local storage
      MemoryStore.updateGrantStatus(grant.memoryId, grant.appAddress, "revoked");
      loadVaultData();
    } catch (err: any) {
      console.error("Revoke error:", err);
      setTxState({
        status: "error",
        error: err.shortMessage || err.message || "Revocation failed",
      });
    } finally {
      setRevokingApp(null);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Identity & Protocol Stats Banner */}
      <div className="rounded-2xl p-6 glass-panel bg-gradient-to-r from-monad-950/90 via-zinc-950/90 to-purple-950/80 border border-monad-500/30 shadow-2xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Shield className="w-5 h-5 text-monad-400" />
              <h2 className="text-lg font-bold text-white tracking-wide">
                AURA Sovereign AI Vault
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-monad-500/20 text-monad-300 border border-monad-500/40">
                Monad Testnet
              </span>
            </div>
            <p className="text-xs text-zinc-300">
              Identity:{" "}
              <span className="font-mono text-monad-300 bg-monad-950/60 px-2 py-1 rounded border border-monad-700/40">
                {address || "0xNotConnected (Connect wallet to manage)"}
              </span>
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800">
              <div className="text-lg font-mono font-bold text-white">
                {memories.length}
              </div>
              <div className="text-[10px] text-zinc-400 uppercase tracking-wider">
                Owned Memories
              </div>
            </div>

            <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800">
              <div className="text-lg font-mono font-bold text-emerald-400">
                {grants.filter((g) => g.status === "active").length}
              </div>
              <div className="text-[10px] text-zinc-400 uppercase tracking-wider">
                Active Grants
              </div>
            </div>

            <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800">
              <div className="text-lg font-mono font-bold text-monad-300">
                0.0001 MON
              </div>
              <div className="text-[10px] text-zinc-400 uppercase tracking-wider">
                Protocol Price
              </div>
            </div>
          </div>
        </div>

        {/* Tx notification */}
        {txState.hash && (
          <div className="mt-4 pt-3 border-t border-monad-900/40 flex items-center justify-between text-xs">
            <span className="text-emerald-400 flex items-center space-x-1.5 font-medium">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>
                {txState.status === "confirmed"
                  ? "Access revoked on Monad EVM!"
                  : "Transaction in flight..."}
              </span>
            </span>
            <a
              href={BlockchainService.getExplorerTxUrl(txState.hash)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-monad-300 hover:text-monad-200 underline font-mono flex items-center space-x-1"
            >
              <span>View Tx on MonadScan</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}

        {txState.status === "error" && (
          <div className="mt-3 p-2.5 rounded-lg bg-red-950/80 border border-red-800 text-red-300 text-xs">
            ⚠️ {txState.error}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-zinc-800 pb-2">
        <button
          onClick={() => setActiveTab("memories")}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
            activeTab === "memories"
              ? "bg-monad-600 text-white shadow-lg"
              : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
          }`}
        >
          🧠 Sovereign Memories ({memories.length})
        </button>

        <button
          onClick={() => setActiveTab("apps")}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
            activeTab === "apps"
              ? "bg-monad-600 text-white shadow-lg"
              : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
          }`}
        >
          🔐 Connected Apps & Permissions ({grants.length})
        </button>
      </div>

      {/* Tab 1: Memories */}
      {activeTab === "memories" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {memories.length === 0 ? (
            <div className="col-span-2 text-center py-12 px-4 rounded-2xl border border-dashed border-zinc-800 bg-zinc-950/50">
              <Database className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
              <p className="text-xs text-zinc-400">
                No memories recorded yet. Start a conversation in{" "}
                <strong className="text-purple-400">Life AI</strong> to create
                your first context asset!
              </p>
            </div>
          ) : (
            memories.map((mem) => (
              <div
                key={mem.id}
                className="p-5 rounded-2xl glass-panel bg-zinc-950/80 border border-zinc-800/90 shadow-lg flex flex-col justify-between space-y-4 hover:border-monad-500/40 transition-all"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-white">
                        {mem.title}
                      </h4>
                      <span className="text-[10px] font-mono text-purple-300">
                        {mem.categoryLabel}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 text-monad-300 border border-monad-800">
                      {mem.accessFeeMON} MON
                    </span>
                  </div>

                  <p className="text-xs text-zinc-300 mt-3 p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/80 font-mono leading-relaxed">
                    {mem.content}
                  </p>

                  <div className="flex flex-wrap gap-1 mt-3">
                    {mem.tags.map((t, i) => (
                      <span
                        key={i}
                        className="text-[10px] px-2 py-0.5 rounded bg-zinc-900 text-zinc-400"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between text-[11px] text-zinc-500 font-mono">
                  <span>ID: {mem.id.slice(0, 10)}...</span>
                  <span>Origin: {mem.sourceApp}</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 2: Connected Apps */}
      {activeTab === "apps" && (
        <div className="space-y-4">
          {/* Default Life AI Application */}
          <div className="p-5 rounded-2xl glass-panel bg-zinc-950/80 border border-purple-900/40 flex items-center justify-between">
            <div className="flex items-center space-x-3.5">
              <div className="w-10 h-10 rounded-xl bg-purple-900/30 border border-purple-700/40 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-pink-400" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Life AI</h4>
                <p className="text-xs text-zinc-400">
                  Primary Companion & Context Creator
                </p>
              </div>
            </div>

            <span className="px-3 py-1 text-xs font-semibold rounded-lg bg-purple-950 text-purple-300 border border-purple-700">
              👑 Owner / Creator
            </span>
          </div>

          {/* Code AI Application & Granted Apps */}
          {grants.length === 0 ? (
            <div className="p-5 rounded-2xl glass-panel bg-zinc-950/80 border border-cyan-900/30 flex items-center justify-between">
              <div className="flex items-center space-x-3.5">
                <div className="w-10 h-10 rounded-xl bg-cyan-950/40 border border-cyan-800/40 flex items-center justify-center">
                  <Terminal className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Code AI</h4>
                  <p className="text-xs text-zinc-400">
                    High-Performance Coding Assistant
                  </p>
                </div>
              </div>

              <span className="px-3 py-1 text-xs font-semibold rounded-lg bg-zinc-900 text-zinc-400 border border-zinc-800">
                🔒 No Active Authorization
              </span>
            </div>
          ) : (
            grants.map((grant, idx) => (
              <div
                key={idx}
                className="p-5 rounded-2xl glass-panel bg-zinc-950/80 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-center space-x-3.5">
                  <div className="w-10 h-10 rounded-xl bg-cyan-950/40 border border-cyan-800/40 flex items-center justify-center">
                    <Terminal className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="text-sm font-bold text-white">
                        {grant.appName}
                      </h4>
                      {grant.status === "active" ? (
                        <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-emerald-950 text-emerald-400 border border-emerald-700/50">
                          ✓ Access Granted (Paid {grant.paidAmountMON} MON)
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-red-950 text-red-400 border border-red-800/50">
                          ✗ Revoked
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-400 font-mono mt-0.5">
                      Target Memory: {grant.memoryId.slice(0, 10)}...
                    </p>
                  </div>
                </div>

                <div>
                  {grant.status === "active" ? (
                    <button
                      onClick={() => handleRevoke(grant)}
                      disabled={revokingApp === grant.appName}
                      className="px-4 py-2 rounded-xl bg-red-950/80 hover:bg-red-900 border border-red-700/60 text-red-200 text-xs font-semibold transition flex items-center space-x-2 shadow-lg"
                    >
                      {revokingApp === grant.appName ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Revoking on Monad...</span>
                        </>
                      ) : (
                        <>
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Revoke Access (On-Chain)</span>
                        </>
                      )}
                    </button>
                  ) : (
                    <span className="text-xs text-zinc-500 font-mono">
                      Access Permanently Revoked
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
