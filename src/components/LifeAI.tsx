"use client";

import React, { useState } from "react";
import { useAccount, useWriteContract, usePublicClient } from "wagmi";
import { parseEther, type Hash } from "viem";
import {
  Sparkles,
  Send,
  Save,
  CheckCircle,
  ExternalLink,
  ShieldCheck,
  Cpu,
  Loader2,
  Lock,
  ArrowRight,
} from "lucide-react";
import { AuraConnectABI } from "@/contracts/AuraConnectABI";
import { MONAD_CONFIG } from "@/config/monad";
import {
  MemoryStore,
  generateMemoryId,
  type AIMemory,
} from "@/services/memory";
import { BlockchainService } from "@/services/blockchain";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

interface LifeAIProps {
  onMemoryCreated?: (memory: AIMemory) => void;
  onNavigateToCodeAI?: () => void;
}

export const LifeAI: React.FC<LifeAIProps> = ({
  onMemoryCreated,
  onNavigateToCodeAI,
}) => {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const { writeContractAsync } = useWriteContract();

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content:
        "Hello! I am **Life AI**, your personal AI companion. Everything you discuss with me can be distilled into sovereign context assets that **you own on Monad** and can selectively permission to other AI apps.",
      timestamp: "Just now",
    },
  ]);

  const [extractedMemory, setExtractedMemory] = useState<{
    title: string;
    category: any;
    categoryLabel: string;
    summary: string;
    content: string;
    tags: string[];
    accessFeeMON: string;
  } | null>(null);

  const [txState, setTxState] = useState<{
    status: "idle" | "wallet_pending" | "submitting" | "confirmed" | "error";
    hash?: Hash;
    error?: string;
  }>({ status: "idle" });

  const quickPrompts = [
    "I'm building with React and TypeScript and prefer minimal interfaces.",
    "I focus on high-performance EVM dApps with async execution on Monad.",
    "My current project is a decentralized context protocol for AI agents.",
  ];

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || input;
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
      // 1. Call AI chat API
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          persona: "life",
          messages: [...messages, userMsg],
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
      };
      setMessages((prev) => [...prev, aiMsg]);

      // 2. Call memory extraction API
      const extractRes = await fetch("/api/ai/extract-memory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      const extractData = await extractRes.json();
      if (extractData.success && extractData.extractedMemory) {
        setExtractedMemory(extractData.extractedMemory);
      }
    } catch (err: any) {
      console.error("Life AI error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToMonad = async () => {
    if (!extractedMemory) return;
    if (!isConnected || !address) {
      alert("Please connect your Monad wallet first!");
      return;
    }

    try {
      setTxState({ status: "wallet_pending" });

      const memoryId = generateMemoryId(extractedMemory.title, address);
      const metadataURI = `aura://monad/${memoryId}`;
      const feeWei = parseEther(extractedMemory.accessFeeMON || "0.0001");

      console.log("Submitting createMemory transaction on Monad Testnet...", {
        memoryId,
        metadataURI,
        feeWei,
      });

      // Submit on-chain transaction
      const hash = await writeContractAsync({
        address: MONAD_CONFIG.contractAddress,
        abi: AuraConnectABI,
        functionName: "createMemory",
        args: [memoryId, metadataURI, feeWei],
        gas: MONAD_CONFIG.gasConfig.createMemoryGasLimit,
      });

      setTxState({ status: "submitting", hash });
      console.log(`Transaction sent: ${hash}. Waiting for confirmation...`);

      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash });
      }

      setTxState({ status: "confirmed", hash });

      // Save off-chain structured memory
      const newMemory: AIMemory = {
        id: memoryId,
        rawId: memoryId,
        title: extractedMemory.title,
        category: extractedMemory.category,
        categoryLabel: extractedMemory.categoryLabel,
        content: extractedMemory.content,
        summary: extractedMemory.summary,
        sourceApp: "Life AI",
        owner: address as `0x${string}`,
        createdAt: Date.now(),
        accessFeeMON: extractedMemory.accessFeeMON || "0.0001",
        metadataURI,
        encrypted: true,
        tags: extractedMemory.tags,
      };

      MemoryStore.saveMemory(newMemory);
      if (onMemoryCreated) {
        onMemoryCreated(newMemory);
      }
    } catch (err: any) {
      console.error("Save memory transaction error:", err);
      setTxState({
        status: "error",
        error: err.shortMessage || err.message || "Transaction failed",
      });
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Left Chat Window */}
      <div className="lg:col-span-7 flex flex-col h-[650px] rounded-2xl glass-panel-life bg-gradient-to-b from-purple-950/40 to-zinc-950/80 border border-purple-800/30 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-purple-900/30 flex items-center justify-between bg-purple-950/50 backdrop-blur-md">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-pink-500/20 border border-pink-500/40 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-pink-300" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white flex items-center space-x-2">
                <span>Life AI Assistant</span>
                <span className="w-1.5 h-1.5 rounded-full bg-pink-400 animate-pulse" />
              </h2>
              <p className="text-[11px] text-purple-300/70">
                Personal Companion & Context Origin
              </p>
            </div>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-900/50 text-purple-200 border border-purple-700/50">
            Persona #1
          </span>
        </div>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                  msg.role === "user"
                    ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-br-none shadow-lg"
                    : "bg-zinc-900/90 text-zinc-200 border border-purple-900/30 rounded-bl-none shadow-md"
                }`}
              >
                <div className="whitespace-pre-line">{msg.content}</div>
                <div
                  className={`text-[10px] mt-1.5 text-right ${
                    msg.role === "user"
                      ? "text-purple-200/70"
                      : "text-zinc-400"
                  }`}
                >
                  {msg.timestamp}
                </div>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex items-center space-x-2 text-xs text-purple-300 animate-pulse">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Life AI is thinking and analyzing context...</span>
            </div>
          )}
        </div>

        {/* Quick Prompts */}
        <div className="px-4 py-2 bg-purple-950/20 border-t border-purple-900/20 flex flex-wrap gap-1.5">
          {quickPrompts.map((prompt, i) => (
            <button
              key={i}
              onClick={() => handleSend(prompt)}
              className="text-[11px] text-left px-2.5 py-1 rounded-md bg-purple-900/30 hover:bg-purple-800/50 text-purple-200 border border-purple-700/30 transition truncate max-w-full"
            >
              ⚡ {prompt}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3 bg-zinc-950/80 border-t border-purple-900/30 flex items-center space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Share what you're building or your tech preferences..."
            className="flex-1 bg-zinc-900/80 border border-purple-900/40 rounded-xl px-4 py-2.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-purple-500 transition"
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || loading}
            className="p-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white shadow-lg transition"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Right Context Extraction & Monad Minting Panel */}
      <div className="lg:col-span-5 flex flex-col space-y-4">
        {/* Memory Detection Card */}
        <div className="p-5 rounded-2xl glass-panel-life bg-zinc-950/90 border border-purple-600/30 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center space-x-2">
                <Cpu className="w-4 h-4 text-purple-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-purple-200">
                  AI Context Engine
                </h3>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-950 text-purple-300 border border-purple-700">
                Monad Testnet
              </span>
            </div>

            {extractedMemory ? (
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-white">
                    {extractedMemory.title}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-purple-900/50 text-pink-300 border border-purple-700/40">
                    {extractedMemory.categoryLabel}
                  </span>
                </div>

                <p className="text-xs text-zinc-300 bg-purple-950/30 p-3 rounded-xl border border-purple-900/30 leading-relaxed font-mono">
                  {extractedMemory.content}
                </p>

                <div className="flex flex-wrap gap-1">
                  {extractedMemory.tags.map((t, idx) => (
                    <span
                      key={idx}
                      className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-300"
                    >
                      #{t}
                    </span>
                  ))}
                </div>

                <div className="p-3 rounded-xl bg-zinc-900/70 border border-zinc-800 text-xs flex items-center justify-between">
                  <span className="text-zinc-400">Default Access Fee:</span>
                  <span className="font-mono font-bold text-monad-400">
                    {extractedMemory.accessFeeMON} MON
                  </span>
                </div>
              </div>
            ) : (
              <div className="mt-8 text-center py-8 px-4 border border-dashed border-zinc-800 rounded-xl">
                <Sparkles className="w-8 h-8 text-purple-400/40 mx-auto mb-2 animate-bounce" />
                <p className="text-xs text-zinc-400 font-medium">
                  Chat with Life AI to extract sovereign context.
                </p>
                <p className="text-[11px] text-zinc-500 mt-1">
                  Try clicking one of the quick prompts!
                </p>
              </div>
            )}
          </div>

          {/* Action Button & Transaction Status */}
          <div className="mt-5 pt-4 border-t border-zinc-800/80 space-y-3">
            {txState.status === "confirmed" ? (
              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-emerald-950/70 border border-emerald-700/50 text-emerald-300 text-xs flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <div>
                    <p className="font-semibold">Memory Registered on Monad!</p>
                    <p className="text-[10px] text-emerald-400/80">
                      Ownership recorded under wallet {address?.slice(0, 6)}...
                      {address?.slice(-4)}
                    </p>
                  </div>
                </div>

                {txState.hash && (
                  <a
                    href={BlockchainService.getExplorerTxUrl(txState.hash)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center space-x-1.5 text-xs text-purple-300 hover:text-purple-200 transition underline font-mono"
                  >
                    <span>View transaction on MonadScan</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}

                {onNavigateToCodeAI && (
                  <button
                    onClick={onNavigateToCodeAI}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-semibold shadow-lg shadow-cyan-600/30 flex items-center justify-center space-x-2 transition"
                  >
                    <span>Switch to Code AI (Request Access)</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            ) : (
              <button
                onClick={handleSaveToMonad}
                disabled={
                  !extractedMemory ||
                  txState.status === "wallet_pending" ||
                  txState.status === "submitting"
                }
                className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 via-monad-600 to-pink-600 hover:opacity-90 disabled:opacity-40 text-white text-xs font-semibold shadow-xl shadow-purple-600/30 flex items-center justify-center space-x-2 transition"
              >
                {txState.status === "wallet_pending" ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Confirm in Wallet...</span>
                  </>
                ) : txState.status === "submitting" ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Recording to Monad Testnet...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save Context to Monad (0 MON)</span>
                  </>
                )}
              </button>
            )}

            {txState.status === "error" && (
              <div className="p-2.5 rounded-lg bg-red-950/70 border border-red-800 text-red-300 text-xs">
                ⚠️ {txState.error}
              </div>
            )}
          </div>
        </div>

        {/* Info card */}
        <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 text-[11px] text-zinc-400 flex items-start space-x-3">
          <ShieldCheck className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
          <p>
            <strong className="text-zinc-200">Zero Leakage:</strong> Raw
            memories remain encrypted. Only on-chain ownership, hash ID, and
            access fees are committed to the Monad EVM.
          </p>
        </div>
      </div>
    </div>
  );
};
