"use client";

import React, { useState, useEffect } from "react";
import { Navbar, PersonaType } from "@/components/Navbar";
import { LifeAI } from "@/components/LifeAI";
import { CodeAI } from "@/components/CodeAI";
import { AuraVault } from "@/components/AuraVault";
import { MemoryStore, type AIMemory } from "@/services/memory";
import { Sparkles, Terminal, Shield, ArrowRight, CheckCircle2, Zap } from "lucide-react";
import { useAccount } from "wagmi";

export default function Home() {
  const { address } = useAccount();
  const [currentPersona, setCurrentPersona] = useState<PersonaType>("life");
  const [memoriesCount, setMemoriesCount] = useState<number>(0);
  const [activeGrantsCount, setActiveGrantsCount] = useState<number>(0);

  const updateStats = () => {
    const mems = MemoryStore.getMemories(address);
    const grants = MemoryStore.getGrants().filter((g) => g.status === "active");
    setMemoriesCount(mems.length);
    setActiveGrantsCount(grants.length);
  };

  useEffect(() => {
    updateStats();
  }, [address, currentPersona]);

  return (
    <div className="min-h-screen flex flex-col bg-[#09090b]">
      {/* Top Navigation */}
      <Navbar
        currentPersona={currentPersona}
        onSelectPersona={(p) => {
          setCurrentPersona(p);
          updateStats();
        }}
        unlockedCount={activeGrantsCount}
      />

      {/* Demo Flow Stepper / Guide Bar */}
      <div className="border-b border-zinc-900 bg-zinc-950/60 px-4 py-2.5">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between text-xs text-zinc-400 gap-2">
          <div className="flex items-center space-x-2 font-mono text-[11px]">
            <span className="text-monad-400 font-bold uppercase tracking-wider">
              North Star Demo Flow:
            </span>
            <span className={currentPersona === "life" ? "text-pink-300 font-semibold" : ""}>
              1. Talk in Life AI
            </span>
            <span>→</span>
            <span className="text-purple-300">2. Save to Monad</span>
            <span>→</span>
            <span className={currentPersona === "code" ? "text-cyan-300 font-semibold" : ""}>
              3. Open Code AI & Pay 0.0001 MON
            </span>
            <span>→</span>
            <span className="text-emerald-300">4. Context Injected</span>
            <span>→</span>
            <span className={currentPersona === "vault" ? "text-monad-300 font-semibold" : ""}>
              5. Revoke in Vault
            </span>
          </div>

          <div className="flex items-center space-x-3 text-[11px] font-mono">
            <span className="text-zinc-500">Network:</span>
            <span className="text-emerald-400 flex items-center space-x-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Monad Testnet (10143)</span>
            </span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 flex flex-col justify-center">
        {currentPersona === "life" && (
          <div className="space-y-6 animate-fadeIn">
            <div className="text-center max-w-2xl mx-auto space-y-1.5 pt-2 pb-1">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center justify-center space-x-2">
                <span>🌸 Life AI Companion</span>
              </h1>
              <p className="text-xs sm:text-sm text-zinc-400">
                Share your stack, projects, or thoughts. Life AI distills your personal preferences into cryptographically-owned context on Monad.
              </p>
            </div>
            <LifeAI
              onMemoryCreated={() => {
                updateStats();
              }}
              onNavigateToCodeAI={() => {
                setCurrentPersona("code");
                updateStats();
              }}
            />
          </div>
        )}

        {currentPersona === "code" && (
          <div className="space-y-6 animate-fadeIn">
            <div className="text-center max-w-2xl mx-auto space-y-1.5 pt-2 pb-1">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center justify-center space-x-2">
                <span>⚡ Code AI Terminal</span>
              </h1>
              <p className="text-xs sm:text-sm text-zinc-400">
                High-performance developer assistant. Discovers sovereign context created in other apps and requests on-chain permission with micro-payments.
              </p>
            </div>
            <CodeAI
              onNavigateToVault={() => {
                setCurrentPersona("vault");
                updateStats();
              }}
            />
          </div>
        )}

        {currentPersona === "vault" && (
          <div className="space-y-6 animate-fadeIn">
            <div className="text-center max-w-2xl mx-auto space-y-1.5 pt-2 pb-1">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center justify-center space-x-2">
                <span>🛡️ AURA Context Vault</span>
              </h1>
              <p className="text-xs sm:text-sm text-zinc-400">
                Your sovereign AI identity center. Manage owned memory assets, audit connected applications, and revoke context access on Monad anytime.
              </p>
            </div>
            <AuraVault />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-900 bg-zinc-950 py-6 mt-12">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-500 gap-4">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-zinc-300">AURA CONNECT</span>
            <span>•</span>
            <span>Monad Blitz Hackathon</span>
          </div>

          <div className="flex items-center space-x-4 font-mono text-[11px]">
            <a
              href="https://testnet.monadscan.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-zinc-400 hover:text-monad-300 transition"
            >
              Monad Explorer
            </a>
            <span>•</span>
            <a
              href="https://docs.monad.xyz"
              target="_blank"
              rel="noopener noreferrer"
              className="text-zinc-400 hover:text-monad-300 transition"
            >
              Monad Docs
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
