import { createWalletClient, createPublicClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import * as dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { monadTestnet } from "../src/config/monad";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  console.log("------------------------------------------");
  console.log("🚀 Deploying AuraConnect to Monad Testnet");
  console.log("------------------------------------------");

  const contractJsonPath = path.resolve(
    __dirname,
    "../src/contracts/AuraConnect.json"
  );
  if (!fs.existsSync(contractJsonPath)) {
    throw new Error("AuraConnect.json not found. Run compile first.");
  }
  const compiled = JSON.parse(fs.readFileSync(contractJsonPath, "utf8"));

  const privateKey = (process.env.DEPLOYER_PRIVATE_KEY ||
    process.env.PRIVATE_KEY) as `0x${string}`;

  if (!privateKey) {
    console.log(
      "⚠️ No DEPLOYER_PRIVATE_KEY or PRIVATE_KEY found in .env.\n" +
        "Please provide DEPLOYER_PRIVATE_KEY in .env.local to deploy on-chain."
    );
    process.exit(1);
  }

  const account = privateKeyToAccount(privateKey);
  console.log(`Deployer address: ${account.address}`);

  const publicClient = createPublicClient({
    chain: monadTestnet,
    transport: http(process.env.NEXT_PUBLIC_MONAD_RPC || "https://testnet-rpc.monad.xyz"),
  });

  const balance = await publicClient.getBalance({ address: account.address });
  console.log(`Deployer balance: ${balance} wei (${Number(balance) / 1e18} MON)`);

  const walletClient = createWalletClient({
    account,
    chain: monadTestnet,
    transport: http(process.env.NEXT_PUBLIC_MONAD_RPC || "https://testnet-rpc.monad.xyz"),
  });

  console.log("Deploying contract...");
  const hash = await walletClient.deployContract({
    abi: compiled.abi,
    bytecode: compiled.bytecode as `0x${string}`,
    args: [],
    gas: 1500000n,
  });

  console.log(`Deployment transaction submitted: ${hash}`);
  console.log(`Explorer: https://testnet.monadscan.com/tx/${hash}`);

  console.log("Waiting for receipt...");
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  const contractAddress = receipt.contractAddress;

  console.log(`\n🎉 AuraConnect deployed successfully!`);
  console.log(`Contract Address: ${contractAddress}`);
  console.log(`Block Number: ${receipt.blockNumber}`);
  console.log(`Explorer URL: https://testnet.monadscan.com/address/${contractAddress}`);

  // Update .env.local and deployment-info.json
  const envPath = path.resolve(__dirname, "../.env.local");
  let envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, "utf8") : "";
  if (envContent.includes("NEXT_PUBLIC_CONTRACT_ADDRESS=")) {
    envContent = envContent.replace(
      /NEXT_PUBLIC_CONTRACT_ADDRESS=.*/,
      `NEXT_PUBLIC_CONTRACT_ADDRESS=${contractAddress}`
    );
  } else {
    envContent += `\nNEXT_PUBLIC_CONTRACT_ADDRESS=${contractAddress}\n`;
  }
  fs.writeFileSync(envPath, envContent);

  const deploymentInfo = {
    network: "monad-testnet",
    chainId: 10143,
    contractAddress,
    transactionHash: hash,
    deployer: account.address,
    deployedAt: new Date().toISOString(),
  };

  fs.writeFileSync(
    path.resolve(__dirname, "../deployment-info.json"),
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log("Deployment info saved to deployment-info.json and .env.local");
}

main().catch((err) => {
  console.error("Deployment failed:", err);
  process.exit(1);
});
