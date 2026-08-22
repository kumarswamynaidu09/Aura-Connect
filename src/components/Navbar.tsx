"use client";

import React from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Sparkles, Terminal, Shield, Cpu } from "lucide-react";
import { MONAD_CONFIG } from "@/config/monad";

export type PersonaType = "life" | "code" | "vault";

interface NavbarProps {
  currentPersona?: PersonaType;
  onSelectPersona?: (persona: PersonaType) => void;
  unlockedCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentPersona,
  onSelectPersona,
  unlockedCount = 0,
}) => {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-800/80 bg-[#0A0A0F]/80 backdrop-blur-xl transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Left Branding */}
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#FF8A00] via-[#FFB000] to-[#FFD43B] p-[1px] shadow-lg shadow-[#FF8A00]/20">
            <div className="w-full h-full bg-[#0A0A0F] rounded-[11px] flex items-center justify-center">
              <Cpu className="w-5 h-5 text-[#FFB000] animate-pulse-subtle" />
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-zinc-200 to-[#FFD43B] bg-clip-text text-transparent">
                AURA CONNECT
              </span>
              <span className="px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase rounded-full bg-[#FF8A00]/15 text-[#FFB000] border border-[#FF8A00]/30">
                Monad
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 hidden sm:block">
              Sovereign AI Context & Memory Protocol
            </p>
          </div>
        </div>

        {/* Center Persona Switcher (Only show if props provided) */}
        {currentPersona && onSelectPersona && (
          <nav className="flex items-center p-1 rounded-xl bg-zinc-900/90 border border-zinc-800/90 shadow-inner">
            <button
              onClick={() => onSelectPersona("life")}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                currentPersona === "life"
                  ? "bg-gradient-to-r from-purple-900/80 to-pink-900/80 text-white shadow-md border border-purple-500/40"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-pink-400" />
              <span>Life AI</span>
            </button>

            <button
              onClick={() => onSelectPersona("code")}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all relative ${
                currentPersona === "code"
                  ? "bg-gradient-to-r from-cyan-950 to-blue-950 text-cyan-200 shadow-md border border-cyan-500/40"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
              }`}
            >
              <Terminal className="w-3.5 h-3.5 text-cyan-400" />
              <span>Code AI</span>
              {unlockedCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping absolute -top-0.5 -right-0.5" />
              )}
            </button>

            <button
              onClick={() => onSelectPersona("vault")}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                currentPersona === "vault"
                  ? "bg-gradient-to-r from-monad-900/90 to-indigo-950 text-monad-200 shadow-md border border-monad-500/40"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
              }`}
            >
              <Shield className="w-3.5 h-3.5 text-monad-400" />
              <span>AURA Vault</span>
            </button>
          </nav>
        )}

        {/* Right Wallet Connect */}
        <div className="flex items-center space-x-3">
          <ConnectButton.Custom>
            {({
              account,
              chain,
              openAccountModal,
              openChainModal,
              openConnectModal,
              mounted,
            }) => {
              const ready = mounted;
              const connected = ready && account && chain;

              return (
                <div
                  {...(!ready && {
                    "aria-hidden": true,
                    style: {
                      opacity: 0,
                      pointerEvents: "none",
                      userSelect: "none",
                    },
                  })}
                >
                  {(() => {
                    if (!connected) {
                      return (
                        <button
                          onClick={openConnectModal}
                          type="button"
                          className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#FF8A00] to-[#FFB000] hover:shadow-[0_0_15px_rgba(255,138,0,0.4)] text-[#0A0A0F] text-xs font-bold transition flex items-center space-x-2"
                        >
                          <span>Connect Wallet</span>
                        </button>
                      );
                    }

                    if (chain.unsupported) {
                      return (
                        <button
                          onClick={openChainModal}
                          type="button"
                          className="px-3.5 py-1.5 rounded-xl bg-red-950 border border-red-800 text-red-300 text-xs font-medium hover:bg-red-900 transition"
                        >
                          Wrong Network (Switch to Monad)
                        </button>
                      );
                    }

                    return (
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={openChainModal}
                          className="px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 hover:bg-zinc-800 flex items-center space-x-1.5"
                        >
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                          <span>Monad Testnet</span>
                        </button>

                        <button
                          onClick={openAccountModal}
                          type="button"
                          className="px-3 py-1.5 rounded-lg bg-[#FF8A00]/10 border border-[#FF8A00]/30 text-xs text-[#FFB000] hover:bg-[#FF8A00]/20 font-mono font-medium transition"
                        >
                          {account.displayName}
                          {account.displayBalance ? ` • ${account.displayBalance}` : ""}
                        </button>
                      </div>
                    );
                  })()}
                </div>
              );
            }}
          </ConnectButton.Custom>
        </div>
      </div>
    </header>
  );
};
