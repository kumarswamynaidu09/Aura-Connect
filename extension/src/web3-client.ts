import {
  createPublicClient,
  http,
  parseEther,
  formatEther,
  encodeFunctionData,
  keccak256,
  stringToBytes,
  type Hash,
  type Address,
} from "viem";
import { monadTestnet } from "../../src/config/monad";
import { AuraConnectABI } from "../../src/contracts/AuraConnectABI";

declare const chrome: any;

export const CONTRACT_ADDRESS = "0x9A48F9c7A6E469bFe351E772877a5b3a8863f695" as Address;
export const MONAD_CHAIN_ID_HEX = "0x279f"; // 10143
export const MONAD_CHAIN_ID_DEC = 10143;
export const MONAD_RPC_URL = "https://testnet-rpc.monad.xyz";
export const MONAD_EXPLORER_URL = "https://testnet.monadscan.com";

// Public RPC Client for reading contract state directly on Monad Testnet
export const publicClient = createPublicClient({
  chain: monadTestnet,
  transport: http(MONAD_RPC_URL),
});

/**
 * Robust Chrome Extension Provider Bridge.
 * Bridges RPC requests from the extension Side Panel to window.ethereum running in the active web tab's MAIN world.
 */
export async function sendProviderRequest(args: { method: string; params?: any[] }): Promise<any> {
  // 1. Direct window.ethereum if available (e.g. in standard web contexts)
  if (typeof window !== "undefined" && (window as any).ethereum && !(window as any).ethereum.__isExtensionBridge) {
    try {
      return await (window as any).ethereum.request(args);
    } catch (err: any) {
      if (err.message && !err.message.includes("not found")) {
        throw err;
      }
    }
  }

  // 2. Extension context: Execute script in active tab's MAIN world where MetaMask is injected
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

    // If active tab is internal (e.g. chrome://extensions), find any open web tab
    if (!targetTabId) {
      try {
        const allTabs = await chrome.tabs.query({});
        const webTab = allTabs.find((t: any) => t.id && t.url && (t.url.startsWith("http://") || t.url.startsWith("https://")));
        if (webTab && webTab.id) {
          targetTabId = webTab.id;
        }
      } catch (e) {}
    }

    // If no web tab exists, open a web tab to host the bridge
    if (!targetTabId) {
      try {
        const newTab = await chrome.tabs.create({ url: "https://chatgpt.com", active: true });
        targetTabId = newTab.id;
        // Wait for tab to load
        await new Promise((resolve) => {
          const listener = (tabId: number, info: any) => {
            if (tabId === targetTabId && info.status === "complete") {
              chrome.tabs.onUpdated.removeListener(listener);
              setTimeout(resolve, 800);
            }
          };
          chrome.tabs.onUpdated.addListener(listener);
          setTimeout(resolve, 3000);
        });
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
          const findProvider = async () => {
            const w = window as any;
            if (w.ethereum) return w.ethereum;
            if (w.rabby) return w.rabby;
            if (w.phantom?.ethereum) return w.phantom.ethereum;
            if (w.coinbaseWalletExtension) return w.coinbaseWalletExtension;

            for (let i = 0; i < 4; i++) {
              await new Promise((r) => setTimeout(r, 200));
              if (w.ethereum) return w.ethereum;
              if (w.rabby) return w.rabby;
              if (w.phantom?.ethereum) return w.phantom.ethereum;
            }
            return null;
          };

          const eth = await findProvider();
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
 * Checks if MetaMask or an EIP-1193 provider is installed/detected
 */
export async function isWalletDetected(): Promise<boolean> {
  try {
    const chainId = await sendProviderRequest({ method: "eth_chainId" });
    return Boolean(chainId);
  } catch (err: any) {
    if (err.message && err.message.includes("not detected")) {
      return false;
    }
    return false;
  }
}

/**
 * Gets currently selected account without prompting (if already authorized)
 */
export async function getConnectedAccount(): Promise<Address | null> {
  try {
    const accounts = (await sendProviderRequest({ method: "eth_accounts" })) as string[];
    if (accounts && accounts.length > 0 && accounts[0]) {
      return accounts[0] as Address;
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

  const accounts = (await sendProviderRequest({
    method: "eth_requestAccounts",
  })) as string[];

  if (!accounts || !accounts[0]) {
    throw new Error("Wallet connection was rejected.");
  }

  return accounts[0] as Address;
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

  console.log(`[AURA] Sending createMemory tx from ${from}...`);

  const txHash = (await sendProviderRequest({
    method: "eth_sendTransaction",
    params: [
      {
        from,
        to: CONTRACT_ADDRESS,
        data: calldata,
        gas: "0x3D090", // 250k gas limit
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

  console.log(`[AURA] Sending payForAccess tx from ${from} for 0.0001 MON...`);

  const txHash = (await sendProviderRequest({
    method: "eth_sendTransaction",
    params: [
      {
        from,
        to: CONTRACT_ADDRESS,
        data: calldata,
        value: `0x${feeWei.toString(16)}`,
        gas: "0x249F0", // 150k gas limit
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

  console.log(`[AURA] Sending revokeAccess for consumer ${consumerAddress}...`);

  const txHash = (await sendProviderRequest({
    method: "eth_sendTransaction",
    params: [
      {
        from,
        to: CONTRACT_ADDRESS,
        data: calldata,
        gas: "0x186A0", // 100k gas limit
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
      address: CONTRACT_ADDRESS,
      abi: AuraConnectABI,
      functionName: "hasAccess",
      args: [memoryId, consumerAddress],
    });
    return Boolean(hasAccess);
  } catch (err) {
    console.error("[AURA] hasAccess query error:", err);
    return false;
  }
}

/**
 * Reads memory record from contract
 */
export async function getMemoryRecordOnChain(memoryId: `0x${string}`) {
  try {
    const record = await publicClient.readContract({
      address: CONTRACT_ADDRESS,
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
    isWalletDetected,
    getConnectedAccount,
    getCurrentChainId,
    ensureMonadNetwork,
    connectUserWallet,
    executeCreateMemoryOnChain,
    executePayForAccessOnChain,
    executeRevokeAccessOnChain,
    checkHasAccessOnChain,
    getMemoryRecordOnChain,
    CONTRACT_ADDRESS,
    MONAD_CHAIN_ID_DEC,
    MONAD_EXPLORER_URL,
    keccak256,
    stringToBytes,
  };
}
