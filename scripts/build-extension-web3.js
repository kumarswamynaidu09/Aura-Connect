import * as esbuild from "esbuild";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function buildWeb3() {
  console.log("Building extension Web3 client bundle...");
  const entryPoint = path.resolve(__dirname, "../extension/src/web3-client.ts");
  const outfile = path.resolve(__dirname, "../extension/sidepanel/monad-web3.bundle.js");

  await esbuild.build({
    entryPoints: [entryPoint],
    bundle: true,
    outfile,
    format: "iife",
    globalName: "AuraWeb3Bundle",
    platform: "browser",
    target: ["es2020"],
    sourcemap: false,
    define: {
      "process.env.NODE_ENV": '"production"',
      "process.env.NEXT_PUBLIC_MONAD_RPC": '"https://testnet-rpc.monad.xyz"',
      "process.env.NEXT_PUBLIC_CONTRACT_ADDRESS": '"0x9A48F9c7A6E469bFe351E772877a5b3a8863f695"',
    },
  });

  console.log(`✓ Web3 bundle built successfully at: ${outfile}`);
}

buildWeb3().catch((err) => {
  console.error("Build failed:", err);
  process.exit(1);
});
