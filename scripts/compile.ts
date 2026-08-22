import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
// @ts-ignore
import solc from "solc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function compileContract() {
  console.log("Compiling AuraConnect.sol...");
  const contractPath = path.resolve(__dirname, "../contracts/AuraConnect.sol");
  const source = fs.readFileSync(contractPath, "utf8");

  const input = {
    language: "Solidity",
    sources: {
      "AuraConnect.sol": {
        content: source,
      },
    },
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      outputSelection: {
        "*": {
          "*": ["abi", "evm.bytecode"],
        },
      },
    },
  };

  const output = JSON.parse(solc.compile(JSON.stringify(input)));

  if (output.errors) {
    let hasError = false;
    output.errors.forEach((err: any) => {
      console.error(err.formattedMessage);
      if (err.severity === "error") hasError = true;
    });
    if (hasError) {
      throw new Error("Compilation failed");
    }
  }

  const contract = output.contracts["AuraConnect.sol"]["AuraConnect"];
  const abi = contract.abi;
  const bytecode = contract.evm.bytecode.object;

  const outDir = path.resolve(__dirname, "../src/contracts");
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const outPath = path.join(outDir, "AuraConnect.json");
  const resultData = {
    contractName: "AuraConnect",
    abi,
    bytecode: `0x${bytecode}`,
    compilerVersion: "0.8.28",
    compiledAt: new Date().toISOString(),
  };

  fs.writeFileSync(outPath, JSON.stringify(resultData, null, 2));
  console.log(`✓ AuraConnect compiled successfully! Exported to ${outPath}`);
  return resultData;
}

compileContract();
