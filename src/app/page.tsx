"use client";

import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { useAccount, useBalance } from "wagmi";
import { Brain, Shield, Clock, Search, Trash2, Key, ArrowRight, Zap, RefreshCw } from "lucide-react";

interface ContextRecord {
  id: number;
  platform: string;
  context_type: string;
  content: string;
  created_at: string;
}

export default function Dashboard() {
  const { address, isConnected } = useAccount();
  const { data: balanceData } = useBalance({ address, chainId: 10143 }); // Monad Testnet
  const [contexts, setContexts] = useState<ContextRecord[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchContexts = async (isBackground = false) => {
    if (!address) return;
    if (!isBackground) setLoading(true);
    try {
      const res = await fetch(`/api/context?walletAddress=${address}`);
      const data = await res.json();
      if (data.success) {
        setContexts(data.data);
      }
    } catch (err) {
      console.error("Failed to fetch contexts:", err);
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  useEffect(() => {
    if (isConnected && address) {
      fetchContexts();
      // Real-time polling for the hackathon demo
      const intervalId = setInterval(() => {
        fetchContexts(true);
      }, 2000);
      return () => clearInterval(intervalId);
    } else {
      setContexts([]);
    }
  }, [isConnected, address]);

  return (
    <div className="min-h-screen bg-[#0A0A0F] font-sans selection:bg-[#FF8A00]/30 selection:text-white relative">
      {/* Background Effects */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[#FF8A00]/5 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-[#FFD43B]/5 blur-[100px]" />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        <Navbar />

        <main className="flex-grow max-w-7xl mx-auto w-full px-4 py-8 md:py-12">
          
          {/* Dashboard Header */}
          <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6 animate-fade-in-up">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-[#F5F5F7] mb-2 flex items-center gap-3">
                <Shield className="w-8 h-8 text-[#FF8A00]" />
                AURA Vault
              </h1>
              <p className="text-[#8E8E93]">Manage your sovereign context and data permissions.</p>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="px-5 py-3 rounded-xl bg-[#12121A] border border-[#FF8A00]/20 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#FF8A00]/10 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-[#FFB000]" />
                </div>
                <div>
                  <div className="text-xs text-[#8E8E93] uppercase tracking-wider font-semibold">Network Balance</div>
                  <div className="text-[#F5F5F7] font-medium">
                    {isConnected ? (
                      <span className="text-[#FFB000]">{balanceData ? Number(balanceData.formatted).toFixed(4) : "0.0000"} MON</span>
                    ) : (
                      "Not Connected"
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {!isConnected ? (
            <div className="w-full flex flex-col items-center justify-center py-32 bg-[#12121A]/50 border border-white/5 rounded-2xl backdrop-blur-sm animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
              <Key className="w-16 h-16 text-[#FF8A00]/50 mb-6" />
              <h2 className="text-2xl font-semibold text-[#F5F5F7] mb-3">Connect Your Wallet</h2>
              <p className="text-[#8E8E93] max-w-md text-center mb-8">
                Please connect your Monad wallet to access your encrypted AURA Vault and manage your cross-app context.
              </p>
              <div className="text-[#FF8A00] font-medium flex items-center gap-2">
                Click "Connect Wallet" above <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Main Column: Context Stream */}
              <div className="lg:col-span-2 space-y-6 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-[#F5F5F7] flex items-center gap-2">
                    <Brain className="w-5 h-5 text-[#FF8A00]" />
                    Saved Context Stream
                  </h2>
                  <button 
                    onClick={fetchContexts}
                    disabled={loading}
                    className="p-2 text-[#8E8E93] hover:text-[#FFB000] transition-colors rounded-lg hover:bg-white/5"
                  >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  </button>
                </div>

                {contexts.length === 0 ? (
                  <div className="bg-[#12121A]/80 border border-white/5 rounded-2xl p-12 text-center flex flex-col items-center justify-center h-64 backdrop-blur-md">
                    <Search className="w-12 h-12 text-white/10 mb-4" />
                    <h3 className="text-[#F5F5F7] font-medium mb-2">No context found</h3>
                    <p className="text-[#8E8E93] text-sm max-w-xs">
                      Start browsing with the AURA extension enabled to automatically detect and save your preferences.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {contexts.map((ctx) => (
                      <div key={ctx.id} className="bg-[#12121A]/80 border border-white/5 hover:border-[#FF8A00]/30 transition-all rounded-2xl p-5 backdrop-blur-md group">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <span className="px-2.5 py-1 rounded-md bg-[#FF8A00]/10 text-[#FFB000] text-xs font-semibold uppercase tracking-wider border border-[#FF8A00]/20">
                              {ctx.platform}
                            </span>
                            <span className="text-[#8E8E93] text-xs flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(ctx.created_at).toLocaleString()}
                            </span>
                          </div>
                          <button className="text-[#8E8E93] hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <p className="text-[#F5F5F7] text-sm leading-relaxed whitespace-pre-wrap">
                          {ctx.content}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Side Column: Access Control */}
              <div className="space-y-6 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                <h2 className="text-xl font-semibold text-[#F5F5F7] flex items-center gap-2 mb-4">
                  <Shield className="w-5 h-5 text-[#FF8A00]" />
                  Active Permissions
                </h2>
                
                <div className="bg-[#12121A]/80 border border-[#FF8A00]/20 rounded-2xl p-5 backdrop-blur-md">
                  <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-sm font-bold text-white">
                        C
                      </div>
                      <div>
                        <div className="text-[#F5F5F7] font-medium text-sm">Claude AI</div>
                        <div className="text-[#8E8E93] text-xs">claude.ai</div>
                      </div>
                    </div>
                    <span className="px-2 py-1 rounded bg-green-500/10 text-green-400 text-xs font-medium border border-green-500/20">
                      Granted
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="text-xs text-[#8E8E93]">Unlock fee paid: 0.0001 MON</div>
                    <button className="text-xs font-medium text-red-400 hover:text-red-300 py-1 px-3 rounded hover:bg-red-400/10 transition-colors">
                      Revoke Access
                    </button>
                  </div>
                </div>

                <div className="bg-[#12121A]/80 border border-white/5 rounded-2xl p-5 backdrop-blur-md opacity-60 grayscale">
                  <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-sm font-bold text-white">
                        A
                      </div>
                      <div>
                        <div className="text-[#F5F5F7] font-medium text-sm">Amazon Shopping</div>
                        <div className="text-[#8E8E93] text-xs">amazon.com</div>
                      </div>
                    </div>
                    <span className="px-2 py-1 rounded bg-white/5 text-[#8E8E93] text-xs font-medium border border-white/10">
                      Revoked
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="text-xs text-[#8E8E93]">Access permanently locked</div>
                    <button className="text-xs font-medium text-[#FF8A00] hover:text-[#FFB000] py-1 px-3 rounded hover:bg-[#FF8A00]/10 transition-colors">
                      Restore
                    </button>
                  </div>
                </div>

              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
