"use client";

import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { ArrowRight, Brain, Lock, Zap, Shield, Blocks, Cpu, Link as LinkIcon, Database, ArrowDown, ExternalLink, Key } from "lucide-react";
import Link from "next/link";

export default function LandingPage() {
  const [mounted, setMounted] = useState(false);
  const [memories, setMemories] = useState(0);
  const [grants, setGrants] = useState(0);
  const [mon, setMon] = useState(0);
  const [wallets, setWallets] = useState(0);

  useEffect(() => {
    setMounted(true);
    
    // Simulate count up animation
    const duration = 2000;
    const steps = 60;
    const interval = duration / steps;
    let step = 0;
    
    const timer = setInterval(() => {
      step++;
      const progress = step / steps;
      // Easing function (easeOutExpo)
      const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      
      setMemories(Math.floor(847 * ease));
      setGrants(Math.floor(2341 * ease));
      setMon(+(12.4 * ease).toFixed(1));
      setWallets(Math.floor(156 * ease));
      
      if (step >= steps) clearInterval(timer);
    }, interval);
    
    return () => clearInterval(timer);
  }, []);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#0A0A0F] font-sans selection:bg-[#FF8A00]/30 selection:text-white overflow-x-hidden relative">
      {/* Background Effects */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[#FF8A00]/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-[#FFD43B]/5 blur-[100px]" />
        
        {/* CSS Particles */}
        <div className="absolute top-[30%] left-[20%] w-2 h-2 rounded-full bg-[#FF8A00] opacity-50 blur-[1px] animate-float" style={{ animationDelay: '0s' }} />
        <div className="absolute top-[60%] left-[80%] w-3 h-3 rounded-full bg-[#FFB000] opacity-30 blur-[2px] animate-float" style={{ animationDelay: '2s' }} />
        <div className="absolute top-[80%] left-[30%] w-1.5 h-1.5 rounded-full bg-[#FFD43B] opacity-60 blur-[1px] animate-float" style={{ animationDelay: '1.5s' }} />
        <div className="absolute top-[20%] right-[30%] w-2.5 h-2.5 rounded-full bg-[#FF8A00] opacity-40 blur-[1px] animate-float" style={{ animationDelay: '3s' }} />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        <Navbar />

        {/* HERO SECTION */}
        <main className="flex-grow">
          <section className="relative min-h-[90vh] flex flex-col justify-center items-center px-4 pt-20">
            <div className="max-w-5xl mx-auto text-center animate-fade-in-up">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#12121A]/80 border border-[#FF8A00]/20 text-xs font-medium text-[#FFB000] mb-8 backdrop-blur-md">
                <Zap className="w-3.5 h-3.5" />
                <span>Built on Monad • Blitz Hackathon 2026</span>
              </div>
              
              <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-[#F5F5F7] mb-6 leading-tight">
                Your AI Memory. <br className="hidden md:block" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF8A00] via-[#FFB000] to-[#FFD43B]">
                  Your Control.
                </span> Across Every App.
              </h1>
              
              <p className="text-lg md:text-xl text-[#8E8E93] max-w-3xl mx-auto mb-10 leading-relaxed">
                AURA CONNECT is a browser extension that lets you own your AI context on Monad — save what matters, carry it between ChatGPT, Claude, and any AI, and control exactly who can use it.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <button className="px-8 py-4 rounded-xl bg-gradient-to-r from-[#FF8A00] to-[#FFB000] text-[#0A0A0F] font-bold text-lg hover:shadow-[0_0_20px_rgba(255,138,0,0.4)] transition-all flex items-center gap-2">
                  <Cpu className="w-5 h-5" />
                  Install Extension
                </button>
                <button 
                  onClick={() => document.getElementById('problem')?.scrollIntoView({ behavior: 'smooth' })}
                  className="px-8 py-4 rounded-xl bg-[#12121A]/50 border border-[#FF8A00]/20 text-[#F5F5F7] font-medium text-lg hover:bg-[#12121A] hover:border-[#FF8A00]/50 transition-all flex items-center gap-2 backdrop-blur-sm"
                >
                  Watch Demo <ArrowDown className="w-5 h-5" />
                </button>
              </div>
            </div>
          </section>

          {/* THE PROBLEM SECTION */}
          <section id="problem" className="py-24 px-4 border-t border-[#FF8A00]/10 bg-[#0A0A0F]/50">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-16">
                <h2 className="text-3xl md:text-5xl font-bold text-[#F5F5F7] mb-4">Every AI Forgets You</h2>
                <p className="text-[#8E8E93] text-lg max-w-2xl mx-auto">You start from scratch every time you open a new chat or switch models.</p>
              </div>

              <div className="grid md:grid-cols-3 gap-6 mb-16">
                {['ChatGPT', 'Claude', 'Cursor'].map((ai, i) => (
                  <div key={ai} className="p-6 rounded-2xl bg-[#12121A]/80 backdrop-blur-[20px] border border-white/5 opacity-80 hover:opacity-100 transition-opacity">
                    <div className="flex items-center gap-3 mb-4 text-[#8E8E93]">
                      <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
                        <Brain className="w-4 h-4" />
                      </div>
                      <span className="font-semibold">{ai}</span>
                    </div>
                    <div className="space-y-3">
                      <div className="bg-[#0A0A0F] rounded-lg p-3 text-sm text-[#8E8E93] border border-white/5">
                        &quot;Who are you?&quot;
                      </div>
                      <div className="bg-[#0A0A0F] rounded-lg p-3 text-sm text-[#8E8E93] border border-white/5">
                        &quot;What&apos;s your stack?&quot;
                      </div>
                      <div className="bg-[#0A0A0F] rounded-lg p-3 text-sm text-[#8E8E93] border border-white/5">
                        &quot;What are your preferences?&quot;
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-col items-center">
                <div className="w-px h-16 bg-gradient-to-b from-transparent via-[#FF8A00]/50 to-[#FF8A00] mb-8" />
                <div className="px-6 py-4 rounded-2xl bg-gradient-to-r from-[#FF8A00]/10 to-[#FFB000]/10 border border-[#FF8A00]/30 backdrop-blur-[20px] text-center max-w-lg">
                  <h3 className="text-[#F5F5F7] font-bold text-xl mb-2 flex items-center justify-center gap-2">
                    <Shield className="w-5 h-5 text-[#FF8A00]" />
                    The AURA Solution
                  </h3>
                  <p className="text-[#FF8A00]/80">One sovereign identity. Travels everywhere. Controlled by you.</p>
                </div>
              </div>
            </div>
          </section>

          {/* HOW IT WORKS */}
          <section className="py-24 px-4">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-16">
                <h2 className="text-3xl md:text-5xl font-bold text-[#F5F5F7] mb-4">How AURA Works</h2>
                <p className="text-[#8E8E93] text-lg max-w-2xl mx-auto">A seamless layer between your mind and your AI tools.</p>
              </div>

              <div className="grid md:grid-cols-3 gap-8">
                {/* Step 1 */}
                <div className="p-8 rounded-3xl bg-[#12121A]/90 backdrop-blur-[20px] border border-[#FF8A00]/10 hover:border-[#FF8A00]/30 transition-all group relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-[#FF8A00]/5 rounded-full blur-3xl group-hover:bg-[#FF8A00]/10 transition-all" />
                  <div className="w-14 h-14 rounded-2xl bg-[#FF8A00]/10 flex items-center justify-center mb-6 border border-[#FF8A00]/20 text-[#FF8A00]">
                    <Database className="w-7 h-7" />
                  </div>
                  <h3 className="text-2xl font-bold text-[#F5F5F7] mb-3">1. Save Context</h3>
                  <p className="text-[#8E8E93] leading-relaxed">
                    Tell any AI about your stack, preferences, or projects. AURA detects useful context and saves it securely to your wallet.
                  </p>
                </div>

                {/* Step 2 */}
                <div className="p-8 rounded-3xl bg-[#12121A]/90 backdrop-blur-[20px] border border-[#FF8A00]/10 hover:border-[#FF8A00]/30 transition-all group relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-[#FFB000]/5 rounded-full blur-3xl group-hover:bg-[#FFB000]/10 transition-all" />
                  <div className="w-14 h-14 rounded-2xl bg-[#FFB000]/10 flex items-center justify-center mb-6 border border-[#FFB000]/20 text-[#FFB000]">
                    <Lock className="w-7 h-7" />
                  </div>
                  <h3 className="text-2xl font-bold text-[#F5F5F7] mb-3">2. Control Access</h3>
                  <p className="text-[#8E8E93] leading-relaxed">
                    When another AI wants your context, you decide. Approve with a lightning-fast 0.0001 MON micro-payment on Monad.
                  </p>
                </div>

                {/* Step 3 */}
                <div className="p-8 rounded-3xl bg-[#12121A]/90 backdrop-blur-[20px] border border-[#FF8A00]/10 hover:border-[#FF8A00]/30 transition-all group relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-[#FFD43B]/5 rounded-full blur-3xl group-hover:bg-[#FFD43B]/10 transition-all" />
                  <div className="w-14 h-14 rounded-2xl bg-[#FFD43B]/10 flex items-center justify-center mb-6 border border-[#FFD43B]/20 text-[#FFD43B]">
                    <Zap className="w-7 h-7" />
                  </div>
                  <h3 className="text-2xl font-bold text-[#F5F5F7] mb-3">3. Carry Everywhere</h3>
                  <p className="text-[#8E8E93] leading-relaxed">
                    Your context is injected directly into the AI's prompt. Manage, update, or revoke access anytime from your Vault.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* STATS */}
          <section className="py-16 px-4 bg-[#12121A]/50 border-y border-[#FF8A00]/10 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-[#FF8A00]/5 via-transparent to-[#FF8A00]/5" />
            <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 relative z-10">
              <div className="text-center">
                <div className="text-4xl md:text-5xl font-extrabold text-[#F5F5F7] mb-2">{memories}</div>
                <div className="text-sm font-medium text-[#8E8E93] uppercase tracking-wider">Memories Created</div>
              </div>
              <div className="text-center">
                <div className="text-4xl md:text-5xl font-extrabold text-[#F5F5F7] mb-2">{grants}</div>
                <div className="text-sm font-medium text-[#8E8E93] uppercase tracking-wider">Access Grants</div>
              </div>
              <div className="text-center">
                <div className="text-4xl md:text-5xl font-extrabold text-[#F5F5F7] mb-2">{mon}</div>
                <div className="text-sm font-medium text-[#8E8E93] uppercase tracking-wider">MON Transacted</div>
              </div>
              <div className="text-center">
                <div className="text-4xl md:text-5xl font-extrabold text-[#F5F5F7] mb-2">{wallets}</div>
                <div className="text-sm font-medium text-[#8E8E93] uppercase tracking-wider">Active Wallets</div>
              </div>
            </div>
          </section>

          {/* ARCHITECTURE */}
          <section className="py-24 px-4">
            <div className="max-w-5xl mx-auto">
              <div className="text-center mb-16">
                <h2 className="text-3xl md:text-5xl font-bold text-[#F5F5F7] mb-4">Protocol Architecture</h2>
                <p className="text-[#8E8E93] text-lg">Monad Testnet • Chain ID: 10143</p>
              </div>

              <div className="bg-[#12121A]/80 backdrop-blur-[20px] rounded-3xl border border-[#FF8A00]/20 p-8 md:p-12">
                <div className="flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
                  <div className="flex flex-col items-center p-6 bg-[#0A0A0F] rounded-2xl border border-white/5 w-full md:w-1/3">
                    <Key className="w-10 h-10 text-[#FF8A00] mb-4" />
                    <h4 className="font-bold text-[#F5F5F7]">User Wallet</h4>
                    <p className="text-sm text-[#8E8E93] mt-2">Signs context approvals</p>
                  </div>
                  
                  <div className="hidden md:flex items-center text-[#FF8A00]/50">
                    <div className="w-16 h-px bg-gradient-to-r from-transparent to-[#FF8A00]" />
                    <ArrowRight className="w-5 h-5 text-[#FF8A00]" />
                  </div>
                  <div className="md:hidden w-px h-10 bg-gradient-to-b from-[#FF8A00]/50 to-[#FF8A00]/10" />

                  <div className="flex flex-col items-center p-6 bg-gradient-to-b from-[#FF8A00]/10 to-[#0A0A0F] rounded-2xl border border-[#FF8A00]/30 w-full md:w-1/3 relative glow-orange">
                    <Blocks className="w-12 h-12 text-[#FFB000] mb-4" />
                    <h4 className="font-bold text-[#F5F5F7]">AURA Protocol</h4>
                    <p className="text-sm text-[#FF8A00]/80 mt-2">Monad Smart Contracts</p>
                  </div>

                  <div className="hidden md:flex items-center text-[#FF8A00]/50">
                    <div className="w-16 h-px bg-gradient-to-r from-[#FF8A00] to-transparent" />
                    <ArrowRight className="w-5 h-5 text-[#FF8A00]/50" />
                  </div>
                  <div className="md:hidden w-px h-10 bg-gradient-to-b from-[#FF8A00]/30 to-transparent" />

                  <div className="flex flex-col items-center p-6 bg-[#0A0A0F] rounded-2xl border border-white/5 w-full md:w-1/3">
                    <Brain className="w-10 h-10 text-[#FF8A00]/70 mb-4" />
                    <h4 className="font-bold text-[#F5F5F7]">AI Apps</h4>
                    <p className="text-sm text-[#8E8E93] mt-2">Consume via Extension</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* WHY MONAD */}
          <section className="py-24 px-4 bg-[#0A0A0F]/80">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-16">
                <h2 className="text-3xl md:text-5xl font-bold text-[#F5F5F7] mb-4">Built on Monad for a Reason</h2>
                <p className="text-[#8E8E93] text-lg max-w-2xl mx-auto">Why high-throughput EVM is the only way to build a real-time AI context layer.</p>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                <div className="p-6 rounded-2xl bg-[#12121A]/80 border border-white/5">
                  <div className="text-[#FF8A00] font-bold text-xl mb-3 flex items-center gap-2">
                    <Zap className="w-5 h-5" /> 10,000 TPS
                  </div>
                  <p className="text-[#8E8E93] text-sm leading-relaxed">
                    Context permissions need instant settlement. Monad's parallel execution makes access grants feel instant, not like waiting for a blockchain.
                  </p>
                </div>
                
                <div className="p-6 rounded-2xl bg-[#12121A]/80 border border-white/5">
                  <div className="text-[#FFB000] font-bold text-xl mb-3 flex items-center gap-2">
                    <Database className="w-5 h-5" /> $0.001 Transactions
                  </div>
                  <p className="text-[#8E8E93] text-sm leading-relaxed">
                    Micro-payments for AI context access only work when gas is negligible. Monad makes 0.0001 MON fees practical.
                  </p>
                </div>

                <div className="p-6 rounded-2xl bg-[#12121A]/80 border border-white/5">
                  <div className="text-[#FFD43B] font-bold text-xl mb-3 flex items-center gap-2">
                    <Blocks className="w-5 h-5" /> EVM Compatible
                  </div>
                  <p className="text-[#8E8E93] text-sm leading-relaxed">
                    Standard Solidity, standard wallets. If you know Ethereum, you know Monad. We can leverage wagmi, viem, and RainbowKit directly.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* TECH STACK */}
          <section className="py-24 px-4 border-t border-[#FF8A00]/10">
            <div className="max-w-4xl mx-auto text-center">
              <h3 className="text-xl font-semibold text-[#F5F5F7] mb-8">Powered By</h3>
              <div className="flex flex-wrap justify-center gap-4">
                {['Manifest V3', 'Monad EVM', 'Solidity', 'Viem', 'Next.js', 'TypeScript', 'TailwindCSS'].map(tech => (
                  <div key={tech} className="px-5 py-2.5 rounded-full bg-[#12121A]/80 border border-[#FF8A00]/20 text-[#8E8E93] font-medium backdrop-blur-sm hover:text-[#F5F5F7] hover:border-[#FF8A00]/50 transition-colors">
                    {tech}
                  </div>
                ))}
              </div>
            </div>
          </section>
        </main>

        {/* FOOTER */}
        <footer className="border-t border-white/5 bg-[#0A0A0F] py-12 px-4 text-center text-sm text-[#8E8E93]">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-gradient-to-tr from-[#FF8A00] to-[#FFD43B] flex items-center justify-center">
                <div className="w-3 h-3 rounded-sm bg-[#0A0A0F]" />
              </div>
              <span className="font-bold text-[#F5F5F7]">AURA CONNECT</span>
              <span className="mx-2 opacity-30">•</span>
              <span>Monad Blitz Hackathon 2026</span>
            </div>
            
            <div className="flex items-center gap-6">
              <Link href="#" className="hover:text-[#FF8A00] transition-colors flex items-center gap-1.5">
                <LinkIcon className="w-4 h-4" /> GitHub
              </Link>
              <Link href="#" className="hover:text-[#FF8A00] transition-colors flex items-center gap-1.5">
                <ExternalLink className="w-4 h-4" /> Monad Explorer
              </Link>
              <Link href="#" className="hover:text-[#FF8A00] transition-colors flex items-center gap-1.5">
                <ExternalLink className="w-4 h-4" /> Monad Docs
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
