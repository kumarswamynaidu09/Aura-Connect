import {
  createPublicClient,
  http,
  parseEther,
  formatEther,
  formatGwei,
  encodeFunctionData,
  getAddress,
  keccak256,
  stringToBytes,
  type Hash,
  type Address,
} from "viem";
import { monadTestnet } from "../../src/config/monad";
import { AuraConnectABI } from "../../src/contracts/AuraConnectABI";
import AuraConnectArtifact from "../../src/contracts/AuraConnect.json";

declare const chrome: any;

export const DEFAULT_CONTRACT_ADDRESS = getAddress("0x9A48F9c7A6E469BFE351e772877A5B3A8863f695");
export let ACTIVE_CONTRACT_ADDRESS: Address = DEFAULT_CONTRACT_ADDRESS;

export const MONAD_CHAIN_ID_HEX = "0x279f"; // 10143
export const MONAD_CHAIN_ID_DEC = 10143;
export const MONAD_RPC_URL = "https://testnet-rpc.monad.xyz";
export const MONAD_EXPLORER_URL = "https://testnet.monadscan.com";

// Public RPC Client for reading contract state on Monad Testnet
export const publicClient = createPublicClient({
  chain: monadTestnet,
  transport: http(MONAD_RPC_URL),
});

/**
 * Updates active contract address
 */
export function setActiveContractAddress(addr: string) {
  try {
    ACTIVE_CONTRACT_ADDRESS = getAddress(addr);
  } catch (e) {
    ACTIVE_CONTRACT_ADDRESS = DEFAULT_CONTRACT_ADDRESS;
  }
}

/**
 * Robust Chrome Extension Provider Bridge.
 */
export async function sendProviderRequest(args: { method: string; params?: any[] }): Promise<any> {
  // 1. Direct window.ethereum if available
  if (typeof window !== "undefined" && (window as any).ethereum && !(window as any).ethereum.__isExtensionBridge) {
    try {
      return await (window as any).ethereum.request(args);
    } catch (err: any) {
      if (err.message && !err.message.includes("not found")) {
        throw err;
      }
    }
  }

  // 2. Extension context: Execute script in active tab's MAIN world
  if (typeof chrome !== "undefined" && chrome.tabs && chrome.scripting) {
    let targetTabId: number | undefined;

    try {
      const activeTabs = await chrome.tabs.query({ active: true, currentWindow: true });
      if (activeTabs && activeTabs[0] && activeTabs[0].id && activeTabs[0].url) {
        const url = activeTabs[0].url;
        if (url.startsWith("http://") || url.startsWith("https://")) {
          targetTabId = activeTabs[0].id;
        }
      }
    } catch (e) {}

    if (!targetTabId) {
      try {
        const allTabs = await chrome.tabs.query({});
        const webTab = allTabs.find((t: any) => t.id && t.url && (t.url.startsWith("http://") || t.url.startsWith("https://")));
        if (webTab && webTab.id) {
          targetTabId = webTab.id;
        }
      } catch (e) {}
    }

    if (!targetTabId) {
      throw new Error("Please open any web tab (e.g. Claude or ChatGPT) to connect MetaMask.");
    }

    // First attempt: Call inpage bridge through content script message
    try {
      const response: any = await new Promise((resolve) => {
        chrome.tabs.sendMessage(
          targetTabId!,
          {
            type: "AURA_ETH_REQUEST",
            method: args.method,
            params: args.params,
          },
          (res: any) => {
            if (chrome.runtime.lastError || !res) {
              resolve(null);
            } else {
              resolve(res);
            }
          }
        );
        setTimeout(() => resolve(null), 1200);
      });

      if (response) {
        if (response.error) {
          if (response.error === "METAMASK_NOT_DETECTED") {
            throw new Error("MetaMask is not detected. Please make sure MetaMask is installed and unlocked in Chrome.");
          }
          const customErr: any = new Error(response.error);
          if (response.code) customErr.code = response.code;
          throw customErr;
        }
        return response.result;
      }
    } catch (e: any) {
      if (e.message && e.message.includes("MetaMask")) {
        throw e;
      }
    }

    // Second attempt: Direct executeScript in MAIN execution world
    let results: any[];
    try {
      results = await chrome.scripting.executeScript({
        target: { tabId: targetTabId! },
        world: "MAIN",
        func: async (rpcPayload: { method: string; params?: any[] }) => {
          const findProvider = () => {
            const w = window as any;
            if (w.ethereum) return w.ethereum;
            if (w.rabby) return w.rabby;
            if (w.phantom?.ethereum) return w.phantom.ethereum;
            if (w.coinbaseWalletExtension) return w.coinbaseWalletExtension;
            return null;
          };

          let eth = findProvider();
          if (!eth) {
            for (let i = 0; i < 4; i++) {
              await new Promise((r) => setTimeout(r, 150));
              eth = findProvider();
              if (eth) break;
            }
          }

          if (!eth) {
            return { error: "METAMASK_NOT_DETECTED" };
          }

          try {
            const res = await eth.request(rpcPayload);
            return { result: res };
          } catch (err: any) {
            return { error: err?.message || String(err), code: err?.code };
          }
        },
        args: [args],
      });
    } catch (scriptErr: any) {
      if (scriptErr?.message && (scriptErr.message.includes("Cannot access") || scriptErr.message.includes("permission"))) {
        throw new Error("Please switch to an active web tab (like Claude or ChatGPT) to connect MetaMask.");
      }
      throw scriptErr;
    }

    if (!results || !results[0] || results[0].result === undefined) {
      throw new Error("No response from wallet provider.");
    }

    const response = results[0].result as { result?: any; error?: string; code?: number };
    if (response.error) {
      if (response.error === "METAMASK_NOT_DETECTED") {
        throw new Error("MetaMask is not detected. Please make sure MetaMask is installed and unlocked in Chrome.");
      }
      const customErr: any = new Error(response.error);
      if (response.code) customErr.code = response.code;
      throw customErr;
    }

    return response.result;
  }

  throw new Error("No Web3 wallet provider available.");
}

/**
 * Gets currently selected account without prompting
 */
export async function getConnectedAccount(): Promise<Address | null> {
  try {
    const accounts = (await sendProviderRequest({ method: "eth_accounts" })) as string[];
    if (accounts && accounts.length > 0 && accounts[0]) {
      return getAddress(accounts[0]) as Address;
    }
    return null;
  } catch (err) {
    return null;
  }
}

/**
 * Gets currently active chain ID
 */
export async function getCurrentChainId(): Promise<number> {
  try {
    const hex = (await sendProviderRequest({ method: "eth_chainId" })) as string;
    return parseInt(hex, 16);
  } catch (err) {
    return 0;
  }
}

/**
 * Gets balance of an address on Monad Testnet
 */
export async function getWalletBalance(addr: Address): Promise<{ wei: bigint; formatted: string }> {
  try {
    const wei = await publicClient.getBalance({ address: addr });
    return {
      wei,
      formatted: Number(formatEther(wei)).toFixed(4),
    };
  } catch (e) {
    return { wei: 0n, formatted: "0.0000" };
  }
}

/**
 * Checks if active contract has bytecode deployed on Monad Testnet
 */
export async function checkContractDeployed(addr: Address = ACTIVE_CONTRACT_ADDRESS): Promise<boolean> {
  try {
    const code = await publicClient.getBytecode({ address: addr });
    return Boolean(code && code.length > 2);
  } catch (e) {
    return false;
  }
}

/**
 * Ensures connected wallet is switched to Monad Testnet (10143)
 */
export async function ensureMonadNetwork(): Promise<boolean> {
  const currentChainId = await getCurrentChainId();
  if (currentChainId === MONAD_CHAIN_ID_DEC) {
    return true;
  }

  try {
    await sendProviderRequest({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: MONAD_CHAIN_ID_HEX }],
    });
    return true;
  } catch (switchError: any) {
    if (switchError.code === 4902 || switchError?.data?.originalError?.code === 4902 || String(switchError).includes("4902")) {
      await sendProviderRequest({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: MONAD_CHAIN_ID_HEX,
            chainName: "Monad Testnet",
            nativeCurrency: {
              name: "MON",
              symbol: "MON",
              decimals: 18,
            },
            rpcUrls: [MONAD_RPC_URL],
            blockExplorerUrls: [MONAD_EXPLORER_URL],
          },
        ],
      });
      return true;
    }
    throw switchError;
  }
}

/**
 * Connects user wallet and returns the REAL connected address
 */
export async function connectUserWallet(): Promise<Address> {
  await ensureMonadNetwork();

  try {
    const accounts = (await sendProviderRequest({
      method: "eth_requestAccounts",
    })) as string[];

    if (!accounts || !accounts[0]) {
      throw new Error("Wallet connection was rejected.");
    }

    return getAddress(accounts[0]) as Address;
  } catch (error: any) {
    if (error?.message && error.message.includes("already pending")) {
      throw new Error("MetaMask is waiting for you! Please open the MetaMask extension popup to approve the connection.");
    }
    throw error;
  }
}

/**
 * Deploys AuraConnect contract directly from user's connected wallet on Monad Testnet
 */
export async function deployAuraConnectContract(): Promise<{ contractAddress: Address; hash: Hash }> {
  const from = await connectUserWallet();
  await ensureMonadNetwork();

  console.log(`[AURA] Deploying AuraConnect from ${from}...`);

  const txHash = (await sendProviderRequest({
    method: "eth_sendTransaction",
    params: [
      {
        from,
        data: AuraConnectArtifact.bytecode,
        gas: "0x16E360", // 1,500,000 gas limit for deployment
      },
    ],
  })) as Hash;

  console.log(`[AURA] Deploy tx submitted: ${txHash}. Waiting for confirmation...`);

  const receipt = await publicClient.waitForTransactionReceipt({
    hash: txHash,
    confirmations: 1,
    timeout: 60000,
  });

  if (!receipt.contractAddress) {
    throw new Error("Deployment completed but no contract address returned.");
  }

  const deployedAddr = getAddress(receipt.contractAddress);
  setActiveContractAddress(deployedAddr);

  return { contractAddress: deployedAddr, hash: txHash };
}

/**
 * Executes real createMemory() on Monad Testnet
 */
export async function executeCreateMemoryOnChain(
  memoryId: `0x${string}`,
  metadataURI: string,
  accessFeeMon: string = "0.0001"
): Promise<{ hash: Hash; blockNumber: bigint }> {
  const from = await connectUserWallet();
  await ensureMonadNetwork();

  const feeWei = parseEther(accessFeeMon);

  const calldata = encodeFunctionData({
    abi: AuraConnectABI,
    functionName: "createMemory",
    args: [memoryId, metadataURI, feeWei],
  });

  // Calculate gas limit with tight buffer as per Monad gas documentation
  let gasLimit = 65000n;
  try {
    const estimated = await publicClient.estimateGas({
      account: from,
      to: ACTIVE_CONTRACT_ADDRESS,
      data: calldata,
    });
    gasLimit = estimated + estimated / 10n; // 10% tight buffer
  } catch (e) {
    gasLimit = 65000n;
  }

  const gasPrice = await publicClient.getGasPrice();
  const balance = await publicClient.getBalance({ address: from });
  const totalCost = gasLimit * gasPrice;

  console.log("==========================================");
  console.log("[AURA DEBUG] Transaction Pre-flight:");
  console.log("Wallet:", from);
  console.log("Balance:", formatEther(balance), "MON");
  console.log("Chain ID:", MONAD_CHAIN_ID_DEC);
  console.log("Contract:", ACTIVE_CONTRACT_ADDRESS);
  console.log("Function: createMemory");
  console.log("Gas Limit:", gasLimit.toString());
  console.log("Gas Price:", formatGwei(gasPrice), "Gwei");
  console.log("Estimated Gas Fee:", formatEther(totalCost), "MON");
  console.log("==========================================");

  if (balance < totalCost) {
    throw new Error(
      `Insufficient MON for gas fee. Required: ~${formatEther(totalCost)} MON, Balance: ${formatEther(balance)} MON. Claim testnet tokens at testnet.monad.xyz`
    );
  }

  const txHash = (await sendProviderRequest({
    method: "eth_sendTransaction",
    params: [
      {
        from,
        to: ACTIVE_CONTRACT_ADDRESS,
        data: calldata,
        gas: `0x${gasLimit.toString(16)}`,
      },
    ],
  })) as Hash;

  console.log(`[AURA] Tx submitted: ${txHash}. Waiting for Monad receipt...`);

  const receipt = await publicClient.waitForTransactionReceipt({
    hash: txHash,
    confirmations: 1,
    timeout: 60000,
  });

  if (receipt.status !== "success") {
    throw new Error(`Transaction reverted on Monad Testnet (Block #${receipt.blockNumber})`);
  }

  return { hash: txHash, blockNumber: receipt.blockNumber };
}

/**
 * Executes real payForAccess() on Monad Testnet with 0.0001 MON
 */
export async function executePayForAccessOnChain(
  memoryId: `0x${string}`,
  feeMon: string = "0.0001"
): Promise<{ hash: Hash; blockNumber: bigint }> {
  const from = await connectUserWallet();
  await ensureMonadNetwork();

  const feeWei = parseEther(feeMon);

  const calldata = encodeFunctionData({
    abi: AuraConnectABI,
    functionName: "payForAccess",
    args: [memoryId],
  });

  // Calculate gas limit with tight buffer as per Monad gas documentation
  let gasLimit = 48000n;
  try {
    const estimated = await publicClient.estimateGas({
      account: from,
      to: ACTIVE_CONTRACT_ADDRESS,
      data: calldata,
      value: feeWei,
    });
    gasLimit = estimated + estimated / 10n; // 10% tight buffer
  } catch (e) {
    gasLimit = 48000n;
  }

  const gasPrice = await publicClient.getGasPrice();
  const balance = await publicClient.getBalance({ address: from });
  const totalCost = feeWei + gasLimit * gasPrice;

  console.log("==========================================");
  console.log("[AURA DEBUG] payForAccess Pre-flight:");
  console.log("Wallet:", from);
  console.log("Balance:", formatEther(balance), "MON");
  console.log("Chain ID:", MONAD_CHAIN_ID_DEC);
  console.log("Contract:", ACTIVE_CONTRACT_ADDRESS);
  console.log("Function: payForAccess");
  console.log("Value:", feeMon, "MON");
  console.log("Gas Limit:", gasLimit.toString());
  console.log("Gas Price:", formatGwei(gasPrice), "Gwei");
  console.log("Estimated Total Cost:", formatEther(totalCost), "MON");
  console.log("==========================================");

  if (balance < totalCost) {
    throw new Error(
      `Insufficient MON for access fee + gas. Required: ~${formatEther(totalCost)} MON, Balance: ${formatEther(balance)} MON. Claim testnet tokens at testnet.monad.xyz`
    );
  }

  const txHash = (await sendProviderRequest({
    method: "eth_sendTransaction",
    params: [
      {
        from,
        to: ACTIVE_CONTRACT_ADDRESS,
        data: calldata,
        value: `0x${feeWei.toString(16)}`,
        gas: `0x${gasLimit.toString(16)}`,
      },
    ],
  })) as Hash;

  console.log(`[AURA] Payment submitted: ${txHash}. Waiting for Monad confirmation...`);

  const receipt = await publicClient.waitForTransactionReceipt({
    hash: txHash,
    confirmations: 1,
    timeout: 60000,
  });

  if (receipt.status !== "success") {
    throw new Error(`Payment transaction reverted on Monad Testnet (Block #${receipt.blockNumber})`);
  }

  // Verify on-chain access state
  const hasAccess = await checkHasAccessOnChain(memoryId, from);
  console.log(`[AURA] Verified on-chain hasAccess: ${hasAccess}`);

  return { hash: txHash, blockNumber: receipt.blockNumber };
}

/**
 * Executes real revokeAccess() on Monad Testnet
 */
export async function executeRevokeAccessOnChain(
  memoryId: `0x${string}`,
  consumerAddress: Address
): Promise<{ hash: Hash; blockNumber: bigint }> {
  const from = await connectUserWallet();
  await ensureMonadNetwork();

  const calldata = encodeFunctionData({
    abi: AuraConnectABI,
    functionName: "revokeAccess",
    args: [memoryId, consumerAddress],
  });

  let gasLimit = 38000n;
  try {
    const estimated = await publicClient.estimateGas({
      account: from,
      to: ACTIVE_CONTRACT_ADDRESS,
      data: calldata,
    });
    gasLimit = estimated + estimated / 10n;
  } catch (e) {
    gasLimit = 38000n;
  }

  const gasPrice = await publicClient.getGasPrice();
  const balance = await publicClient.getBalance({ address: from });
  const totalCost = gasLimit * gasPrice;

  console.log("==========================================");
  console.log("[AURA DEBUG] revokeAccess Pre-flight:");
  console.log("Wallet:", from);
  console.log("Balance:", formatEther(balance), "MON");
  console.log("Contract:", ACTIVE_CONTRACT_ADDRESS);
  console.log("Consumer to Revoke:", consumerAddress);
  console.log("Gas Limit:", gasLimit.toString());
  console.log("Estimated Gas Fee:", formatEther(totalCost), "MON");
  console.log("==========================================");

  if (balance < totalCost) {
    throw new Error(
      `Insufficient MON for gas fee. Required: ~${formatEther(totalCost)} MON, Balance: ${formatEther(balance)} MON.`
    );
  }

  const txHash = (await sendProviderRequest({
    method: "eth_sendTransaction",
    params: [
      {
        from,
        to: ACTIVE_CONTRACT_ADDRESS,
        data: calldata,
        gas: `0x${gasLimit.toString(16)}`,
      },
    ],
  })) as Hash;

  console.log(`[AURA] Revocation tx submitted: ${txHash}. Waiting for Monad receipt...`);

  const receipt = await publicClient.waitForTransactionReceipt({
    hash: txHash,
    confirmations: 1,
    timeout: 60000,
  });

  if (receipt.status !== "success") {
    throw new Error(`Revocation reverted on Monad Testnet (Block #${receipt.blockNumber})`);
  }

  return { hash: txHash, blockNumber: receipt.blockNumber };
}

/**
 * Queries hasAccess() on AuraConnect contract
 */
export async function checkHasAccessOnChain(
  memoryId: `0x${string}`,
  consumerAddress: Address
): Promise<boolean> {
  try {
    const hasAccess = await publicClient.readContract({
      address: ACTIVE_CONTRACT_ADDRESS,
      abi: AuraConnectABI,
      functionName: "hasAccess",
      args: [memoryId, consumerAddress],
    });
    return Boolean(hasAccess);
  } catch (err) {
    return false;
  }
}

/**
 * Reads memory record from contract
 */
export async function getMemoryRecordOnChain(memoryId: `0x${string}`) {
  try {
    const record = await publicClient.readContract({
      address: ACTIVE_CONTRACT_ADDRESS,
      abi: AuraConnectABI,
      functionName: "getMemory",
      args: [memoryId],
    });
    return record;
  } catch (err) {
    return null;
  }
}

// Export globally for browser sidepanel
if (typeof window !== "undefined") {
  (window as any).AuraWeb3 = {
    publicClient,
    sendProviderRequest,
    getConnectedAccount,
    getCurrentChainId,
    getWalletBalance,
    checkContractDeployed,
    deployAuraConnectContract,
    ensureMonadNetwork,
    connectUserWallet,
    executeCreateMemoryOnChain,
    executePayForAccessOnChain,
    executeRevokeAccessOnChain,
    checkHasAccessOnChain,
    getMemoryRecordOnChain,
    setActiveContractAddress,
    DEFAULT_CONTRACT_ADDRESS,
    ACTIVE_CONTRACT_ADDRESS,
    MONAD_CHAIN_ID_DEC,
    MONAD_EXPLORER_URL,
    keccak256,
    stringToBytes,
  };
}
