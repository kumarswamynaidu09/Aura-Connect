"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  generateKeyPair,
  exportPublicKey,
  importPublicKey,
  hashAsset,
  signData,
  verifySignature,
  generateAssetId
} from "@/lib/crypto";
import { 
  Upload, CheckCircle, XCircle, FileText, Download, 
  Fingerprint, ArrowRight, ShieldCheck, AlertTriangle, Key, Activity
} from "lucide-react";

export default function ProofPassApp() {
  const [view, setView] = useState<"home" | "create" | "verify">("home");

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white selection:bg-emerald-500/30 font-sans overflow-x-hidden">
      {/* Navbar */}
      <nav className="border-b border-white/5 bg-black/20 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div 
            className="flex items-center gap-2 cursor-pointer group" 
            onClick={() => setView("home")}
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-500 to-emerald-200 flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.3)] group-hover:shadow-[0_0_25px_rgba(16,185,129,0.5)] transition-all">
              <ShieldCheck className="w-5 h-5 text-black" />
            </div>
            <span className="text-xl font-bold tracking-tight">PROOF<span className="text-emerald-400">PASS</span></span>
          </div>
          <div className="flex gap-6 text-sm font-medium text-zinc-400">
            <button 
              onClick={() => setView("create")}
              className={`hover:text-white transition-colors ${view === 'create' ? 'text-white' : ''}`}
            >
              CREATE PASSPORT
            </button>
            <button 
              onClick={() => setView("verify")}
              className={`hover:text-white transition-colors ${view === 'verify' ? 'text-white' : ''}`}
            >
              VERIFY ASSET
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-12">
        {view === "home" && <HomeView setView={setView} />}
        {view === "create" && <CreateView setView={setView} />}
        {view === "verify" && <VerifyView />}
      </main>
    </div>
  );
}

function HomeView({ setView }: { setView: (v: any) => void }) {
  return (
    <div className="flex flex-col items-center text-center mt-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-emerald-400 text-xs font-semibold mb-8">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        CLIENT-SIDE CRYPTOGRAPHY
      </div>
      
      <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 bg-gradient-to-b from-white to-zinc-500 bg-clip-text text-transparent">
        AI can create anything.<br />
        ProofPass proves where it came from.
      </h1>
      
      <p className="text-xl text-zinc-400 max-w-2xl mb-12 leading-relaxed">
        Portable cryptographic provenance for AI-generated content.
        Every asset carries its proof—cryptographically signed, universally verifiable, and completely self-contained.
      </p>

      <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
        <button 
          onClick={() => setView("create")}
          className="px-8 py-4 bg-white text-black font-semibold rounded-xl hover:bg-zinc-200 transition-all shadow-[0_0_40px_rgba(255,255,255,0.1)] flex items-center justify-center gap-2"
        >
          Create Passport <ArrowRight className="w-4 h-4" />
        </button>
        <button 
          onClick={() => setView("verify")}
          className="px-8 py-4 bg-zinc-900 border border-zinc-800 text-white font-semibold rounded-xl hover:bg-zinc-800 transition-all flex items-center justify-center gap-2"
        >
          Verify Asset <ShieldCheck className="w-4 h-4" />
        </button>
      </div>

      {/* Portability Demo Section */}
      <div className="mt-32 w-full max-w-4xl border-t border-zinc-800 pt-16">
        <h2 className="text-2xl font-bold mb-12 text-zinc-300">Move the asset anywhere.</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left relative">
          {/* Connector Line */}
          <div className="hidden md:block absolute top-1/2 left-[15%] right-[15%] h-[1px] bg-gradient-to-r from-zinc-800 via-emerald-500/50 to-zinc-800 -z-10"></div>
          
          <div className="bg-[#121214] border border-zinc-800 rounded-2xl p-6 shadow-2xl relative z-10">
            <div className="text-xs text-zinc-500 font-mono mb-4">DEVICE A</div>
            <div className="flex items-center gap-3 mb-2">
              <FileText className="w-5 h-5 text-emerald-400" />
              <span className="font-medium">Original Asset</span>
            </div>
            <div className="flex items-center gap-3">
              <Fingerprint className="w-5 h-5 text-emerald-400" />
              <span className="font-medium">Passport JSON</span>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center text-zinc-500 z-10 py-4 md:py-0">
            <Download className="w-6 h-6 mb-2" />
            <span className="text-xs font-mono font-bold tracking-widest uppercase">Export & Move</span>
          </div>

          <div className="bg-[#121214] border border-zinc-800 rounded-2xl p-6 shadow-2xl relative z-10">
            <div className="text-xs text-zinc-500 font-mono mb-4">DEVICE B</div>
            <div className="flex items-center gap-3 mb-2 text-zinc-400">
              <Upload className="w-5 h-5" />
              <span className="font-medium">Upload both files</span>
            </div>
            <div className="flex items-center gap-3 text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
              <span className="font-medium">100% Verified</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// CREATE PASSPORT VIEW
// ==========================================
function CreateView({ setView }: { setView: (v: any) => void }) {
  const [assetFile, setAssetFile] = useState<File | null>(null);
  const [assetText, setAssetText] = useState(`[SYSTEM]: You are an advanced AI research assistant.
[USER]: Generate a summary of the upcoming theoretical changes to EVM parallelization.
[ASSISTANT]: 
The evolution of EVM parallelization represents a fundamental shift in blockchain scalability. Rather than executing transactions sequentially, next-generation networks (like Monad) implement optimistic parallel execution. 

Key architectural changes include:
1. State Access Tracking: The engine tracks memory and storage slots accessed during execution.
2. Optimistic Execution: Transactions are run simultaneously across multiple threads.
3. Conflict Resolution: If a transaction reads state modified by a prior concurrent transaction, it is scheduled for re-execution.

This theoretical model effectively decouples transaction processing speed from the standard block-time limitations of legacy EVM environments, allowing throughputs exceeding 10,000 TPS while maintaining 100% bytecode compatibility.`);
  const [inputType, setInputType] = useState<"file" | "text">("text");
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [passport, setPassport] = useState<any>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Load or generate master keypair for the demo
  const [keyPair, setKeyPair] = useState<any>(null);

  useEffect(() => {
    // Generate an ephemeral keypair for this session if not exists
    generateKeyPair().then(kp => setKeyPair(kp));
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAssetFile(file);
      if (file.type.startsWith('image/')) {
        setPreviewUrl(URL.createObjectURL(file));
      } else {
        setPreviewUrl(null);
      }
    }
  };

  const handleCreate = async () => {
    if (!keyPair) return;
    if (inputType === "file" && !assetFile) return;
    if (inputType === "text" && !assetText.trim()) return;

    setIsProcessing(true);

    try {
      let buffer: ArrayBuffer;
      let mimeType = "text/plain";
      
      if (inputType === "file" && assetFile) {
        buffer = await assetFile.arrayBuffer();
        mimeType = assetFile.type || "application/octet-stream";
      } else {
        buffer = new TextEncoder().encode(assetText).buffer;
      }

      // 1. Hash the asset
      const hash = await hashAsset(buffer);

      // 2. Prepare payload
      const pubKeyJwk = await exportPublicKey(keyPair.publicKey);
      
      const payload = {
        protocol: "ProofPass",
        version: "1.0",
        assetId: generateAssetId(),
        assetType: mimeType,
        origin: "AI_GENERATED",
        createdAt: new Date().toISOString(),
        hashAlgorithm: "SHA-256",
        hash: hash,
        signatureAlgorithm: "ECDSA-P256-SHA256",
        publicKey: pubKeyJwk
      };

      // Canonical serialization for signing
      const payloadString = JSON.stringify(payload);
      
      // 3. Sign
      const signature = await signData(keyPair.privateKey, payloadString);

      // 4. Final Passport
      const finalPassport = {
        ...payload,
        signature
      };

      // Simulate a small delay for dramatic effect
      setTimeout(() => {
        setPassport(finalPassport);
        setIsProcessing(false);
      }, 800);

    } catch (e) {
      console.error(e);
      setIsProcessing(false);
    }
  };

  const downloadPassport = () => {
    if (!passport) return;
    const blob = new Blob([JSON.stringify(passport, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `proofpass-${passport.assetId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadAsset = () => {
    if (!assetFile) return;
    const url = URL.createObjectURL(assetFile);
    const a = document.createElement("a");
    a.href = url;
    a.download = assetFile.name;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (passport) {
    return (
      <div className="max-w-2xl mx-auto animate-in fade-in zoom-in-95 duration-500">
        <div className="bg-[#111113] border border-emerald-500/30 rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(16,185,129,0.1)] relative">
          
          {/* Certificate Header */}
          <div className="bg-emerald-500/10 border-b border-emerald-500/20 p-8 flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
                CONTENT PASSPORT
              </h2>
              <p className="text-emerald-400 font-mono text-sm mt-2">{passport.assetId}</p>
            </div>
            <div className="bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 px-3 py-1 rounded-full text-xs font-bold tracking-widest flex items-center gap-2">
              <CheckCircle className="w-4 h-4" /> VERIFIED
            </div>
          </div>

          {/* Certificate Body */}
          <div className="p-8 space-y-8">
            <div className="grid grid-cols-2 gap-8">
              <div>
                <div className="text-xs text-zinc-500 font-mono mb-1 uppercase">Origin</div>
                <div className="text-lg text-white font-medium flex items-center gap-2">
                  <Activity className="w-5 h-5 text-zinc-400" />
                  {passport.origin.replace('_', ' ')}
                </div>
              </div>
              <div>
                <div className="text-xs text-zinc-500 font-mono mb-1 uppercase">Created</div>
                <div className="text-lg text-white font-medium">
                  {new Date(passport.createdAt).toLocaleString(undefined, {
                    day: '2-digit', month: 'short', year: 'numeric',
                    hour: '2-digit', minute: '2-digit'
                  })}
                </div>
              </div>
            </div>

            <div>
              <div className="text-xs text-zinc-500 font-mono mb-1 uppercase">Cryptographic Hash (SHA-256)</div>
              <div className="bg-black/50 border border-zinc-800 p-3 rounded-lg font-mono text-sm text-zinc-300 break-all leading-relaxed">
                {passport.hash}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8 pt-4 border-t border-zinc-800">
              <div>
                <div className="text-xs text-zinc-500 font-mono mb-1 uppercase">Signature</div>
                <div className="text-sm text-white font-medium">{passport.signatureAlgorithm}</div>
              </div>
              <div>
                <div className="text-xs text-zinc-500 font-mono mb-1 uppercase">Status</div>
                <div className="text-sm text-emerald-400 font-medium flex items-center gap-1">
                  <Key className="w-4 h-4" /> Cryptographically Signed
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-8 flex flex-col sm:flex-row gap-4">
          <button 
            onClick={downloadPassport}
            className="flex-1 bg-white text-black py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-zinc-200 transition-colors"
          >
            <Download className="w-5 h-5" /> EXPORT PASSPORT
          </button>
          
          {inputType === "file" && (
             <button 
               onClick={downloadAsset}
               className="flex-1 bg-zinc-800 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-zinc-700 transition-colors"
             >
               <Download className="w-5 h-5" /> DOWNLOAD ASSET
             </button>
          )}

          <button 
            onClick={() => setView("verify")}
            className="flex-1 bg-zinc-900 border border-zinc-800 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-zinc-800 transition-colors"
          >
            VERIFY NOW <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h2 className="text-3xl font-bold mb-8">Create a Content Passport</h2>
      
      <div className="bg-[#121214] border border-zinc-800 p-2 rounded-2xl flex gap-2 mb-8">
        <button 
          onClick={() => setInputType("file")}
          className={`flex-1 py-2 text-sm font-medium rounded-xl transition-all ${inputType === 'file' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-white'}`}
        >
          Upload File
        </button>
        <button 
          onClick={() => setInputType("text")}
          className={`flex-1 py-2 text-sm font-medium rounded-xl transition-all ${inputType === 'text' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-white'}`}
        >
          Raw Text
        </button>
      </div>

      <div className="bg-[#121214] border border-zinc-800 rounded-3xl p-8 mb-8 shadow-xl">
        {inputType === "file" ? (
          <div className="space-y-6">
            <label className="block border-2 border-dashed border-zinc-700 hover:border-emerald-500/50 bg-black/20 rounded-2xl p-12 text-center cursor-pointer transition-colors group">
              <input type="file" className="hidden" onChange={handleFileChange} />
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-zinc-800 group-hover:bg-emerald-500/20 flex items-center justify-center transition-colors">
                  <Upload className="w-8 h-8 text-zinc-400 group-hover:text-emerald-400" />
                </div>
                <div>
                  <div className="text-lg font-medium text-white mb-1">Upload AI Asset</div>
                  <div className="text-sm text-zinc-500">Images, videos, or documents</div>
                </div>
                {assetFile && (
                  <div className="mt-4 px-4 py-2 bg-zinc-800 rounded-lg text-sm text-emerald-400 font-mono">
                    {assetFile.name}
                  </div>
                )}
              </div>
            </label>
            
            {previewUrl && (
              <div className="rounded-xl overflow-hidden border border-zinc-800">
                <img src={previewUrl} alt="Preview" className="w-full h-auto max-h-64 object-cover opacity-80" />
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <label className="text-sm font-mono text-zinc-400">RAW TEXT CONTENT</label>
            <textarea 
              value={assetText}
              onChange={(e) => setAssetText(e.target.value)}
              className="w-full h-48 bg-black/50 border border-zinc-800 rounded-xl p-4 text-white font-mono text-sm focus:outline-none focus:border-emerald-500/50 resize-none transition-colors"
              placeholder="Paste AI-generated text here..."
            />
          </div>
        )}
      </div>

      <button 
        onClick={handleCreate}
        disabled={isProcessing || (inputType === 'file' ? !assetFile : !assetText.trim()) || !keyPair}
        className="w-full bg-white text-black py-4 rounded-xl font-bold text-lg hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(255,255,255,0.1)]"
      >
        {isProcessing ? (
          <><div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div> PROCESSING...</>
        ) : (
          <><Fingerprint className="w-6 h-6" /> CREATE PASSPORT</>
        )}
      </button>
    </div>
  );
}

// ==========================================
// VERIFY PASSPORT VIEW
// ==========================================
function VerifyView() {
  const [assetFile, setAssetFile] = useState<File | null>(null);
  const [assetText, setAssetText] = useState(`[SYSTEM]: You are an advanced AI research assistant.
[USER]: Generate a summary of the upcoming theoretical changes to EVM parallelization.
[ASSISTANT]: 
The evolution of EVM parallelization represents a fundamental shift in blockchain scalability. Rather than executing transactions sequentially, next-generation networks (like Monad) implement optimistic parallel execution. 

Key architectural changes include:
1. State Access Tracking: The engine tracks memory and storage slots accessed during execution.
2. Optimistic Execution: Transactions are run simultaneously across multiple threads.
3. Conflict Resolution: If a transaction reads state modified by a prior concurrent transaction, it is scheduled for re-execution.

This theoretical model effectively decouples transaction processing speed from the standard block-time limitations of legacy EVM environments, allowing throughputs exceeding 10,000 TPS while maintaining 100% bytecode compatibility.`);
  const [inputType, setInputType] = useState<"file" | "text">("text");
  const [passportFile, setPassportFile] = useState<File | null>(null);
  
  const [isVerifying, setIsVerifying] = useState(false);
  const [result, setResult] = useState<{
    status: 'authentic' | 'tampered' | 'error';
    passportHash?: string;
    actualHash?: string;
    signatureValid?: boolean;
    errorMsg?: string;
    passport?: any;
  } | null>(null);

  // State for simulated tampering
  const [tamperedBuffer, setTamperedBuffer] = useState<ArrayBuffer | null>(null);

  const handleAssetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAssetFile(e.target.files[0]);
      setResult(null);
      setTamperedBuffer(null);
    }
  };

  const handlePassportChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPassportFile(e.target.files[0]);
      setResult(null);
      setTamperedBuffer(null);
    }
  };

  const handleVerify = async (useTamperedBuffer: ArrayBuffer | null = null) => {
    if (!passportFile) return;
    if (inputType === "file" && !assetFile) return;
    if (inputType === "text" && !assetText.trim()) return;

    setIsVerifying(true);
    setResult(null);

    try {
      // 1. Read Passport JSON
      const passportText = await passportFile.text();
      const passport = JSON.parse(passportText);

      // 2. Read Asset
      let buffer: ArrayBuffer;
      if (useTamperedBuffer) {
        buffer = useTamperedBuffer;
      } else if (inputType === "file" && assetFile) {
        buffer = await assetFile.arrayBuffer();
      } else {
        buffer = new TextEncoder().encode(assetText).buffer;
      }

      // 3. Hash actual asset
      const actualHash = await hashAsset(buffer);
      
      // 4. Verify Signature
      const { signature, ...payload } = passport;
      const payloadString = JSON.stringify(payload);
      
      let signatureValid = false;
      try {
        const pubKey = await importPublicKey(passport.publicKey);
        signatureValid = await verifySignature(pubKey, signature, payloadString);
      } catch (e) {
        console.error("Signature verification failed", e);
      }

      // 5. Check Hash Match
      const hashesMatch = (actualHash === passport.hash);

      setTimeout(() => {
        if (signatureValid && hashesMatch) {
          setResult({
            status: 'authentic',
            passportHash: passport.hash,
            actualHash,
            signatureValid,
            passport
          });
        } else {
          setResult({
            status: 'tampered',
            passportHash: passport.hash,
            actualHash,
            signatureValid,
            passport
          });
        }
        setIsVerifying(false);
      }, 600);

    } catch (e) {
      console.error(e);
      setResult({ status: 'error', errorMsg: 'Failed to read files or invalid passport format.' });
      setIsVerifying(false);
    }
  };

  const simulateTampering = async () => {
    if (inputType === 'text') {
      setAssetText(prev => prev + " [MODIFIED BY MALICIOUS ACTOR]");
      // State won't immediately update for handleVerify in this tick, so we wait
      setTimeout(() => document.getElementById('verify-btn')?.click(), 100);
    } else if (assetFile) {
      // Modify a few bytes in the file buffer
      const buffer = await assetFile.arrayBuffer();
      const view = new Uint8Array(buffer);
      if (view.length > 100) {
        view[view.length - 50] = view[view.length - 50] ^ 0xFF; // flip bits
      }
      setTamperedBuffer(buffer);
      handleVerify(buffer);
    }
  };

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold mb-4">Verify an Asset</h2>
        <p className="text-zinc-400 max-w-xl mx-auto">
          Upload an asset and its Content Passport to cryptographically verify whether the content is authentic and unmodified.
        </p>
      </div>

      {!result && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {/* Asset Upload */}
          <div className="bg-[#121214] border border-zinc-800 rounded-3xl p-6 shadow-xl flex flex-col">
            <h3 className="text-sm font-mono text-zinc-500 mb-4 uppercase">1. Provide Asset</h3>
            
            <div className="bg-black/30 p-1 rounded-xl flex gap-1 mb-4">
              <button 
                onClick={() => setInputType("file")}
                className={`flex-1 py-1 text-xs font-medium rounded-lg transition-all ${inputType === 'file' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-white'}`}
              >
                File
              </button>
              <button 
                onClick={() => setInputType("text")}
                className={`flex-1 py-1 text-xs font-medium rounded-lg transition-all ${inputType === 'text' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-white'}`}
              >
                Text
              </button>
            </div>

            {inputType === "file" ? (
              <label className="flex-1 border-2 border-dashed border-zinc-700 hover:border-emerald-500/50 bg-black/20 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-colors group">
                <input type="file" className="hidden" onChange={handleAssetChange} />
                <FileText className="w-8 h-8 text-zinc-500 group-hover:text-emerald-400 mb-2 transition-colors" />
                <span className="text-sm text-zinc-300 font-medium">Upload original asset</span>
                {assetFile && (
                  <span className="mt-2 text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded truncate max-w-full">
                    {assetFile.name}
                  </span>
                )}
              </label>
            ) : (
              <textarea 
                value={assetText}
                onChange={(e) => { setAssetText(e.target.value); setResult(null); }}
                className="flex-1 w-full bg-black/20 border-2 border-dashed border-zinc-700 rounded-2xl p-4 text-white font-mono text-sm focus:outline-none focus:border-emerald-500/50 resize-none transition-colors min-h-[150px]"
                placeholder="Paste AI text here..."
              />
            )}
          </div>

          {/* Passport Upload */}
          <div className="bg-[#121214] border border-zinc-800 rounded-3xl p-6 shadow-xl flex flex-col">
            <h3 className="text-sm font-mono text-zinc-500 mb-4 uppercase">2. Provide Passport</h3>
            <label className="flex-1 border-2 border-dashed border-zinc-700 hover:border-emerald-500/50 bg-black/20 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-colors group">
              <input type="file" accept=".json" className="hidden" onChange={handlePassportChange} />
              <Fingerprint className="w-8 h-8 text-zinc-500 group-hover:text-emerald-400 mb-2 transition-colors" />
              <span className="text-sm text-zinc-300 font-medium">Upload passport.json</span>
              {passportFile && (
                <span className="mt-2 text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded truncate max-w-full">
                  {passportFile.name}
                </span>
              )}
            </label>
          </div>
        </div>
      )}

      {/* Action Button */}
      {!result && (
        <button 
          id="verify-btn"
          onClick={() => handleVerify()}
          disabled={isVerifying || !passportFile || (inputType === 'file' ? !assetFile : !assetText.trim())}
          className="w-full bg-white text-black py-4 rounded-xl font-bold text-lg hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(255,255,255,0.1)]"
        >
          {isVerifying ? (
            <><div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div> VERIFYING CRYPTOGRAPHY...</>
          ) : (
            <><ShieldCheck className="w-6 h-6" /> VERIFY ORIGIN</>
          )}
        </button>
      )}

      {/* ERROR STATE */}
      {result?.status === 'error' && (
        <div className="bg-red-500/10 border border-red-500/50 rounded-2xl p-6 text-center">
          <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-red-500 mb-2">Invalid Input</h3>
          <p className="text-red-400/80">{result.errorMsg}</p>
          <button onClick={() => setResult(null)} className="mt-6 px-6 py-2 bg-zinc-900 border border-zinc-800 rounded-lg hover:bg-zinc-800">Try Again</button>
        </div>
      )}

      {/* AUTHENTIC STATE */}
      {result?.status === 'authentic' && (
        <div className="bg-[#111113] border border-emerald-500/50 rounded-3xl overflow-hidden shadow-[0_0_60px_rgba(16,185,129,0.15)] animate-in fade-in zoom-in-95 duration-500">
          <div className="bg-emerald-500/20 border-b border-emerald-500/30 p-8 flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.5)] mb-4">
              <CheckCircle className="w-8 h-8 text-black" />
            </div>
            <h2 className="text-3xl font-extrabold text-white tracking-tight mb-2">AUTHENTIC</h2>
            <p className="text-emerald-400 font-medium">Content matches its original cryptographic passport.</p>
          </div>

          <div className="p-8">
            {/* Visual Chain */}
            <div className="flex justify-between items-center max-w-sm mx-auto mb-10 text-xs font-mono font-bold text-zinc-500">
              <div className="flex flex-col items-center text-white"><FileText className="w-6 h-6 mb-2 text-zinc-400" />ASSET</div>
              <ArrowRight className="w-4 h-4 text-emerald-500/50" />
              <div className="flex flex-col items-center text-white"><Activity className="w-6 h-6 mb-2 text-zinc-400" />SHA-256</div>
              <ArrowRight className="w-4 h-4 text-emerald-500/50" />
              <div className="flex flex-col items-center text-white"><Fingerprint className="w-6 h-6 mb-2 text-zinc-400" />PASSPORT</div>
              <ArrowRight className="w-4 h-4 text-emerald-500/50" />
              <div className="flex flex-col items-center text-emerald-400"><ShieldCheck className="w-6 h-6 mb-2 text-emerald-400" />VERIFIED</div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-zinc-800">
                <span className="text-sm font-mono text-zinc-500 uppercase">Origin</span>
                <span className="font-medium text-white">{result.passport.origin.replace('_', ' ')}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-zinc-800">
                <span className="text-sm font-mono text-zinc-500 uppercase">Created</span>
                <span className="font-medium text-white">{new Date(result.passport.createdAt).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-zinc-800">
                <span className="text-sm font-mono text-zinc-500 uppercase">Hash Match</span>
                <span className="font-medium text-emerald-400 flex items-center gap-1"><CheckCircle className="w-4 h-4" /> MATCHING</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-zinc-800">
                <span className="text-sm font-mono text-zinc-500 uppercase">Passport Signature</span>
                <span className="font-medium text-emerald-400 flex items-center gap-1"><CheckCircle className="w-4 h-4" /> VALID</span>
              </div>
            </div>

            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <button 
                onClick={simulateTampering}
                className="flex-1 bg-red-500/10 border border-red-500/50 text-red-500 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-red-500/20 transition-colors"
              >
                <AlertTriangle className="w-5 h-5" /> SIMULATE TAMPERING
              </button>
              <button 
                onClick={() => setResult(null)}
                className="flex-1 bg-zinc-900 border border-zinc-800 text-white py-3 rounded-xl font-bold flex items-center justify-center hover:bg-zinc-800 transition-colors"
              >
                Verify Another
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAMPERED STATE */}
      {result?.status === 'tampered' && (
        <div className="bg-[#111113] border border-red-500/50 rounded-3xl overflow-hidden shadow-[0_0_60px_rgba(239,68,68,0.15)] animate-in fade-in zoom-in-95 duration-500">
          <div className="bg-red-500/20 border-b border-red-500/30 p-8 flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(239,68,68,0.5)] mb-4">
              <XCircle className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl font-extrabold text-white tracking-tight mb-2">TAMPERED</h2>
            <p className="text-red-400 font-medium">Cryptographic verification failed.</p>
          </div>

          <div className="p-8">
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-8 text-sm text-red-300">
              <AlertTriangle className="w-5 h-5 mb-2 inline-block" /> The passport is authentic, but this asset is <strong>not the asset</strong> that was originally certified. It has been modified.
            </div>

            <div className="space-y-6">
              <div>
                <div className="text-xs text-zinc-500 font-mono mb-1 uppercase">Original Hash (from Passport)</div>
                <div className="bg-black/50 border border-zinc-800 p-3 rounded-lg font-mono text-sm text-emerald-400/70 break-all leading-relaxed">
                  {result.passportHash}
                </div>
              </div>

              <div>
                <div className="text-xs text-zinc-500 font-mono mb-1 uppercase">Current Asset Hash</div>
                <div className="bg-black/50 border border-red-500/30 p-3 rounded-lg font-mono text-sm text-red-400 break-all leading-relaxed">
                  {result.actualHash}
                </div>
              </div>

              <div className="flex justify-between items-center py-3 border-b border-zinc-800">
                <span className="text-sm font-mono text-zinc-500 uppercase">Hash Match</span>
                <span className="font-medium text-red-500 flex items-center gap-1"><XCircle className="w-4 h-4" /> FAILED</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-zinc-800">
                <span className="text-sm font-mono text-zinc-500 uppercase">Passport Signature</span>
                <span className="font-medium text-emerald-400 flex items-center gap-1">
                  {result.signatureValid ? <><CheckCircle className="w-4 h-4" /> VALID</> : <><XCircle className="w-4 h-4 text-red-500" /> INVALID</>}
                </span>
              </div>
            </div>

            <button 
              onClick={() => {
                setResult(null);
                setTamperedBuffer(null);
                if (inputType === 'text') {
                  setAssetText(assetText.replace(" [MODIFIED BY MALICIOUS ACTOR]", ""));
                }
              }}
              className="w-full mt-8 bg-zinc-900 border border-zinc-800 text-white py-4 rounded-xl font-bold flex items-center justify-center hover:bg-zinc-800 transition-colors"
            >
              Reset & Try Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
