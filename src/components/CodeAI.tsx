"use client";

import React, { useState, useEffect } from "react";
import { useAccount, useWriteContract, usePublicClient } from "wagmi";
import { parseEther, type Hash } from "viem";
import {
  Terminal,
  Send,
  Lock,
  Unlock,
  CheckCircle,
  ExternalLink,
  Loader2,
  Code2,
  Copy,
  Check,
  Zap,
  Shield,
  Layers,
  ArrowUpRight,
} from "lucide-react";
import { AuraConnectABI } from "@/contracts/AuraConnectABI";
import { MONAD_CONFIG } from "@/config/monad";
import {
  MemoryStore,
  CODE_AI_APP_ADDRESS,
  type AIMemory,
} from "@/services/memory";
import { BlockchainService } from "@/services/blockchain";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  usedContext?: boolean;
}

interface CodeAIProps {
  onNavigateToVault?: () => void;
}

export const CodeAI: React.FC<CodeAIProps> = ({ onNavigateToVault }) => {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const { writeContractAsync } = useWriteContract();

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Available memories discovered for connected wallet
  const [discoveredMemories, setDiscoveredMemories] = useState<AIMemory[]>([]);
  const [hasAccess, setHasAccess] = useState<boolean>(false);
  const [checkingAccess, setCheckingAccess] = useState<boolean>(true);

  const [txState, setTxState] = useState<{
    status: "idle" | "wallet_pending" | "submitting" | "confirmed" | "error";
    hash?: Hash;
    error?: string;
  }>({ status: "idle" });

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content:
        "⚡ **Code AI Terminal Initialized**\n\nI am your high-performance engineering assistant. Connect your wallet to enable cryptographic context sharing from your **AURA Vault**.",
      timestamp: "Just now",
    },
  ]);

  // Load memories and verify on-chain permissions
  const refreshContextState = async () => {
    if (!isConnected || !address) {
      setDiscoveredMemories([]);
      setHasAccess(false);
      setCheckingAccess(false);
      return;
    }

    setCheckingAccess(true);
    const userMems = MemoryStore.getMemories(address);

    // If no memories found in local store, check if there's any fallback memory or on-chain records
    let targetMemories = userMems;
    if (targetMemories.length === 0) {
      // Check global store
      const allMems = MemoryStore.getMemories();
      if (allMems.length > 0) {
        targetMemories = allMems;
      }
    }

    setDiscoveredMemories(targetMemories);

    if (targetMemories.length > 0) {
      const primaryMemory = targetMemories[0];
      // Check on-chain permission
      const access = await BlockchainService.checkHasAccess(
        primaryMemory.id,
        address
      );

      // Also check local grants if on-chain returns false
      const grants = MemoryStore.getGrants();
      const localGrant = grants.find(
        (g) =>
          g.memoryId.toLowerCase() === primaryMemory.id.toLowerCase() &&
          g.status === "active"
      );

      setHasAccess(access || Boolean(localGrant));
    } else {
      setHasAccess(false);
    }
    setCheckingAccess(false);
  };

  useEffect(() => {
    refreshContextState();
  }, [address, isConnected]);

  const targetMemory =
    discoveredMemories.length > 0 ? discoveredMemories[0] : null;

  const handlePayForAccess = async () => {
    if (!targetMemory) return;
    if (!isConnected || !address) {
      alert("Please connect your wallet first!");
      return;
    }

    try {
      setTxState({ status: "wallet_pending" });

      const feeWei = parseEther(targetMemory.accessFeeMON || "0.0001");
      console.log(
        `Submitting payForAccess transaction for memory ${targetMemory.id} with fee ${feeWei} wei on Monad Testnet...`
      );

      const hash = await writeContractAsync({
        address: MONAD_CONFIG.contractAddress,
        abi: AuraConnectABI,
        functionName: "payForAccess",
        args: [targetMemory.id],
        value: feeWei,
        gas: MONAD_CONFIG.gasConfig.payForAccessGasLimit,
      });

      setTxState({ status: "submitting", hash });
      console.log(`Payment transaction sent: ${hash}. Awaiting confirmation...`);

      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash });
      }

      setTxState({ status: "confirmed", hash });
      setHasAccess(true);

      // Save active grant in store
      MemoryStore.saveGrant({
        memoryId: targetMemory.id,
        appName: "Code AI",
        appAddress: address as `0x${string}`,
        grantedAt: Date.now(),
        paidAmountMON: targetMemory.accessFeeMON,
        txHash: hash,
        status: "active",
      });

      // Send auto-prompt to demonstrate context unlocking immediately
      const unlockNoticeMsg: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content: `🎉 **0.0001 MON Payment Confirmed on Monad!**\n\n🔓 **Context Unlocked**: \`${targetMemory.summary}\`\n\nCode AI now has active cryptographic clearance. Let's build something tailored to your exact stack!`,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        usedContext: true,
      };
      setMessages((prev) => [...prev, unlockNoticeMsg]);
    } catch (err: any) {
      console.error("Payment error:", err);
      setTxState({
        status: "error",
        error: err.shortMessage || err.message || "Payment transaction failed",
      });
    }
  };

  const handleSend = async (customPrompt?: string) => {
    const text = customPrompt || input;
    if (!text.trim() || loading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: text,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          persona: "code",
          messages: [...messages, userMsg],
          contextMemories: hasAccess && targetMemory ? [targetMemory] : [],
          hasAccess,
        }),
      });

      const data = await res.json();

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.content,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        usedContext: data.usedContext,
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      console.error("Code AI error:", err);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-4 sm:p-6 flex flex-col space-y-6">
      {/* Context Discovery Banner */}
      <div className="rounded-2xl p-5 glass-panel-code bg-zinc-950/90 border border-cyan-500/30 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-32 bg-cyan-500/5 blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start space-x-3.5">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all ${
                hasAccess
                  ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
                  : "bg-cyan-500/10 border-cyan-500/30 text-cyan-400"
              }`}
            >
              {hasAccess ? (
                <Unlock className="w-5 h-5" />
              ) : (
                <Lock className="w-5 h-5" />
              )}
            </div>

            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-bold text-white tracking-wide flex items-center space-x-2">
                  <span>AURA Sovereign Context Layer</span>
                  {hasAccess ? (
                    <span className="px-2 py-0.5 text-[10px] font-mono rounded-full bg-emerald-950 text-emerald-400 border border-emerald-700/50 flex items-center space-x-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                      <span>AUTHENTICATED ON MONAD</span>
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 text-[10px] font-mono rounded-full bg-zinc-900 text-amber-300 border border-amber-500/30">
                      ACCESS REQUIRED
                    </span>
                  )}
                </h3>
              </div>

              {targetMemory ? (
                <p className="text-xs text-zinc-300 mt-1 flex items-center space-x-2">
                  <span className="text-zinc-400">Detected Context:</span>
                  <span className="font-semibold text-cyan-300 font-mono bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40">
                    {targetMemory.title} ({targetMemory.summary})
                  </span>
                </p>
              ) : (
                <p className="text-xs text-zinc-400 mt-1">
                  No previous memories found in this session. Create a memory in{" "}
                  <strong className="text-purple-300">Life AI</strong> first!
                </p>
              )}
            </div>
          </div>

          {/* Action Trigger */}
          <div className="flex items-center space-x-3">
            {hasAccess ? (
              <div className="flex items-center space-x-2">
                <span className="text-xs font-mono text-emerald-400 flex items-center space-x-1 bg-emerald-950/80 px-3 py-2 rounded-xl border border-emerald-800/50">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <span>Context Active</span>
                </span>
                {onNavigateToVault && (
                  <button
                    onClick={onNavigateToVault}
                    className="text-xs text-zinc-400 hover:text-zinc-200 px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 transition flex items-center space-x-1"
                  >
                    <span>Manage in Vault</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ) : targetMemory ? (
              <button
                onClick={handlePayForAccess}
                disabled={
                  txState.status === "wallet_pending" ||
                  txState.status === "submitting"
                }
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 text-white text-xs font-bold shadow-lg shadow-cyan-500/25 flex items-center space-x-2 transition"
              >
                {txState.status === "wallet_pending" ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Confirm in Wallet...</span>
                  </>
                ) : txState.status === "submitting" ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processing Monad Tx...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 text-cyan-200" />
                    <span>
                      Unlock Context ({targetMemory.accessFeeMON} MON)
                    </span>
                  </>
                )}
              </button>
            ) : null}
          </div>
        </div>

        {/* Tx Feedback */}
        {txState.hash && (
          <div className="mt-3 pt-3 border-t border-cyan-900/40 flex items-center justify-between text-xs">
            <span className="text-zinc-400 font-mono">
              Monad Tx: {txState.hash.slice(0, 10)}...{txState.hash.slice(-8)}
            </span>
            <a
              href={BlockchainService.getExplorerTxUrl(txState.hash)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-400 hover:text-cyan-300 flex items-center space-x-1 font-mono underline"
            >
              <span>View on MonadScan</span>
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

      {/* Main Terminal Chat Area */}
      <div className="flex flex-col h-[580px] rounded-2xl glass-panel-code bg-zinc-950 border border-zinc-800 shadow-2xl overflow-hidden">
        {/* Terminal Header */}
        <div className="px-5 py-3 border-b border-zinc-800/80 bg-zinc-900/90 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex space-x-1.5">
              <span className="w-3 h-3 rounded-full bg-red-500/80" />
              <span className="w-3 h-3 rounded-full bg-amber-500/80" />
              <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
            </div>
            <div className="h-4 w-[1px] bg-zinc-700" />
            <div className="flex items-center space-x-2">
              <Terminal className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-mono font-medium text-zinc-300">
                code-ai@monad-testnet: ~/context
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
              Persona #2
            </span>
          </div>
        </div>

        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 font-mono text-xs">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[90%] rounded-xl p-4 leading-relaxed ${
                  msg.role === "user"
                    ? "bg-cyan-950/70 border border-cyan-800/50 text-cyan-100 rounded-br-none"
                    : "bg-zinc-900/90 border border-zinc-800 text-zinc-200 rounded-bl-none shadow-lg"
                }`}
              >
                {msg.usedContext && (
                  <div className="mb-3 pb-2 border-b border-zinc-800 flex items-center justify-between text-[10px] text-cyan-300">
                    <span className="flex items-center space-x-1">
                      <Zap className="w-3 h-3 text-cyan-400" />
                      <span>AURA CONTEXT INJECTED (React + TS + Minimal)</span>
                    </span>
                    <span className="text-zinc-500">Monad Verified</span>
                  </div>
                )}
                <div className="whitespace-pre-wrap">{msg.content}</div>
                <div className="mt-2 text-[10px] text-zinc-500 text-right">
                  {msg.timestamp}
                </div>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-center space-x-2 text-xs text-cyan-400 animate-pulse">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Generating context-aware code...</span>
            </div>
          )}
        </div>

        {/* Quick Coding Action Chips */}
        <div className="px-4 py-2 bg-zinc-900/60 border-t border-zinc-800 flex flex-wrap gap-2">
          <button
            onClick={() =>
              handleSend("Write a minimal clean component for my dashboard")
            }
            className="text-[11px] px-3 py-1 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 transition"
          >
            ⚡ Write a minimal component
          </button>
          <button
            onClick={() =>
              handleSend("Generate an execution context wrapper for Monad")
            }
            className="text-[11px] px-3 py-1 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 transition"
          >
            ⚡ Monad Execution Wrapper
          </button>
        </div>

        {/* Input Bar */}
        <div className="p-3 bg-zinc-950 border-t border-zinc-800 flex items-center space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Ask Code AI to build components or write code..."
            className="flex-1 bg-zinc-900 border border-zinc-700/60 rounded-xl px-4 py-2.5 text-xs text-zinc-100 font-mono placeholder-zinc-500 focus:outline-none focus:border-cyan-500 transition"
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || loading}
            className="p-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-black font-bold shadow-lg transition"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
