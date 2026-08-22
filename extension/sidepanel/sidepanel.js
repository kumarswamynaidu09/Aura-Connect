// AURA CONNECT — Real Monad Web3 Extension Integration
const MONAD_EXPLORER = "https://testnet.monadscan.com";
const CONTRACT_ADDRESS = "0x9A48F9c7A6E469bFe351E772877a5b3a8863f695";
const MONAD_CHAIN_ID = 10143;

// Application State — derived from real wallet connection
let userAddress = null; // Real connected address (e.g. 0xfA508...33531)
let currentChainId = null; // Real connected chain ID (10143)
let currentAppName = "Claude";
let currentAppDomain = "claude.ai";

// Primary Context Item
const PRIMARY_MEMORY_ID = "0x5d8a2ea76c1759869ad00ac00e4a13b1a140f5d9473834a5f63c9774f9da9c3b";
const CLAUDE_CONSUMER_ADDRESS = "0x829100000000000000000000000000000000C0DE";

let ownedMemories = [
  {
    id: PRIMARY_MEMORY_ID,
    title: "Frontend & Architecture Preferences",
    summary: "React + TypeScript • Minimalist interface preference",
    content: "You build with React and TypeScript and prefer minimal, clean interfaces without superfluous boilerplate.",
    category: "Technical Preferences",
    sourceApp: "ChatGPT",
    accessFee: "0.0001 MON",
    createdAt: Date.now() - 3600000,
  }
];

let connectedApps = [
  {
    id: "chatgpt",
    name: "ChatGPT",
    role: "Creator / Owner",
    status: "owner",
    address: "0x71FE0000000000000000000000000000000071FE",
    lastAccessed: "Today",
  },
  {
    id: "claude",
    name: "Claude",
    role: "Consumer",
    status: "unauthorized", // 'unauthorized' | 'granted' | 'revoked'
    address: CLAUDE_CONSUMER_ADDRESS,
    lastAccessed: "Just now",
  }
];

let isMemorySavedToMonad = false;
let pendingRevokeAppId = null;

document.addEventListener("DOMContentLoaded", async () => {
  initOnboarding();
  initNavigation();
  initHomeActions();
  initRevokeModal();
  initSettings();
  detectActiveTab();
  loadStateFromStorage();

  // Check real wallet connection on startup
  await syncWalletState();

  // Periodically verify account and chain synchronization
  setInterval(async () => {
    await syncWalletState(true);
  }, 2500);

  updateUI();
});

// ================= 1. REAL WALLET SYNCHRONIZATION =================
async function syncWalletState(silent = false) {
  if (typeof window === "undefined" || !window.AuraWeb3) return;

  try {
    const prevAddress = userAddress;
    const prevChain = currentChainId;

    const account = await window.AuraWeb3.getConnectedAccount();
    const chainId = await window.AuraWeb3.getCurrentChainId();

    userAddress = account;
    currentChainId = chainId;

    // Detect Account or Network Switch
    if (prevAddress !== userAddress || prevChain !== currentChainId) {
      if (userAddress) {
        console.log(`[AURA] Connected account: ${userAddress} on chain: ${currentChainId}`);
        await refreshOnChainState();
      }
      updateUI();
      if (!silent && userAddress) {
        showToast("Connected: " + formatAddress(userAddress));
      }
    }
  } catch (err) {
    if (!silent) console.log("[AURA] Wallet sync:", err);
  }
}

async function connectWallet() {
  if (typeof window === "undefined" || !window.AuraWeb3) {
    throw new Error("Web3 provider bridge not ready. Please refresh extension.");
  }

  showToast("Requesting MetaMask connection...");
  const account = await window.AuraWeb3.connectUserWallet();
  const chainId = await window.AuraWeb3.getCurrentChainId();

  userAddress = account;
  currentChainId = chainId;

  await refreshOnChainState();
  updateUI();
  showToast("MetaMask Connected: " + formatAddress(userAddress));
  return account;
}

// Allow clicking wallet pill to connect / switch
document.addEventListener("DOMContentLoaded", () => {
  const pill = document.getElementById("wallet-identity-pill");
  if (pill) {
    pill.style.cursor = "pointer";
    pill.addEventListener("click", async () => {
      try {
        await connectWallet();
      } catch (err) {
        showToast(err.message || "Connection cancelled");
      }
    });
  }

  // Home Screen Connection Buttons
  const btnConnectHome = document.getElementById("btn-connect-metamask-home");
  if (btnConnectHome) {
    btnConnectHome.addEventListener("click", async () => {
      try {
        await connectWallet();
      } catch (err) {
        showToast(err.message || "Connection cancelled");
      }
    });
  }

  const btnSwitchNet = document.getElementById("btn-switch-monad-network");
  if (btnSwitchNet) {
    btnSwitchNet.addEventListener("click", async () => {
      try {
        await window.AuraWeb3.ensureMonadNetwork();
        await syncWalletState();
        showToast("Switched to Monad Testnet");
      } catch (err) {
        showToast(err.message || "Network switch failed");
      }
    });
  }
});

// ================= 2. ONBOARDING (3-STEP GUIDED FLOW) =================
function initOnboarding() {
  const isCompleted = localStorage.getItem("aura_onboarded_v2");
  const overlay = document.getElementById("onboarding-overlay");

  if (!isCompleted) {
    overlay.style.display = "flex";
    showOnboardStep(1);
  }

  document.getElementById("btn-onboard-step1-next").addEventListener("click", () => {
    showOnboardStep(2);
  });

  document.getElementById("btn-onboard-step2-next").addEventListener("click", () => {
    showOnboardStep(3);
  });

  document.getElementById("btn-onboard-connect-wallet").addEventListener("click", async () => {
    try {
      const addr = await connectWallet();
      document.getElementById("onboard-wallet-unconnected").style.display = "none";
      document.getElementById("onboard-wallet-connected").style.display = "flex";
      document.getElementById("onboard-address-label").innerText = formatAddress(addr);
    } catch (err) {
      showToast(err.message || "Wallet connection error");
    }
  });

  document.getElementById("btn-onboard-finish").addEventListener("click", () => {
    localStorage.setItem("aura_onboarded_v2", "true");
    overlay.style.display = "none";
    showToast("AURA CONNECT Activated on Monad");
  });

  document.getElementById("btn-replay-tutorial").addEventListener("click", () => {
    overlay.style.display = "flex";
    showOnboardStep(1);
  });
}

function showOnboardStep(stepNum) {
  document.querySelectorAll(".onboard-step").forEach((el, idx) => {
    if (idx + 1 === stepNum) {
      el.classList.add("active");
    } else {
      el.classList.remove("active");
    }
  });
}

// ================= 3. NAVIGATION =================
function initNavigation() {
  document.querySelectorAll(".tab-item").forEach((btn) => {
    btn.addEventListener("click", async () => {
      document.querySelectorAll(".tab-item").forEach((b) => b.classList.remove("active"));
      document.querySelectorAll(".view-container").forEach((v) => v.classList.remove("active"));

      btn.classList.add("active");
      const target = btn.getAttribute("data-tab");
      document.getElementById(`tab-${target}-view`).classList.add("active");

      if (target === "vault") {
        await refreshOnChainState();
        renderVault();
      }
    });
  });

  document.getElementById("btn-quick-view-vault").addEventListener("click", () => {
    document.getElementById("tab-vault-btn").click();
  });

  document.getElementById("btn-action-reopen-vault").addEventListener("click", () => {
    document.getElementById("tab-vault-btn").click();
  });
}

// ================= 4. ACTIVE TAB & APP DETECTION =================
async function detectActiveTab() {
  try {
    if (typeof chrome !== "undefined" && chrome.tabs) {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab && tab.url) {
        currentAppDomain = new URL(tab.url).hostname;
        const host = currentAppDomain.toLowerCase();

        if (host.includes("claude")) {
          currentAppName = "Claude";
        } else if (host.includes("chatgpt") || host.includes("openai")) {
          currentAppName = "ChatGPT";
        } else if (host.includes("perplexity")) {
          currentAppName = "Perplexity";
        } else {
          currentAppName = "AI Assistant";
        }
      }
    }
  } catch (err) {
    console.log("Tab detection fallback:", err);
  }

  updateActiveAppBanner();
  updateHomeWorkflow();
}

function updateActiveAppBanner() {
  document.getElementById("active-app-name-display").innerText = currentAppName;
  document.getElementById("request-target-app").innerText = currentAppName;
  document.getElementById("active-target-app").innerText = currentAppName;
}

// ================= 5. ON-CHAIN STATE REFRESH =================
async function refreshOnChainState() {
  if (!userAddress || typeof window === "undefined" || !window.AuraWeb3) return;

  try {
    // 1. Verify primary memory existence on Monad
    const memRecord = await window.AuraWeb3.getMemoryRecordOnChain(PRIMARY_MEMORY_ID);
    if (memRecord && memRecord.owner && memRecord.owner !== "0x0000000000000000000000000000000000000000") {
      isMemorySavedToMonad = true;
    }

    // 2. Query hasAccess for consumer
    const hasAccess = await window.AuraWeb3.checkHasAccessOnChain(PRIMARY_MEMORY_ID, userAddress);
    const claudeApp = connectedApps.find((a) => a.id === "claude");
    if (claudeApp) {
      if (hasAccess) {
        claudeApp.status = "granted";
      } else if (claudeApp.status === "granted") {
        claudeApp.status = "unauthorized";
      }
    }
  } catch (err) {
    console.warn("[AURA] Error querying on-chain state:", err);
  }
}

// ================= 6. HOME STATE PROGRESSION =================
function updateHomeWorkflow() {
  const cardDisconnected = document.getElementById("state-card-disconnected");
  const cardWrongNetwork = document.getElementById("state-card-wrong-network");
  const cardDetected = document.getElementById("state-card-detected");
  const cardRequest = document.getElementById("state-card-request");
  const cardActive = document.getElementById("state-card-active");
  const cardRevoked = document.getElementById("state-card-revoked");
  const cardIdle = document.getElementById("state-card-idle");

  // Reset display
  cardDisconnected.style.display = "none";
  cardWrongNetwork.style.display = "none";
  cardDetected.style.display = "none";
  cardRequest.style.display = "none";
  cardActive.style.display = "none";
  cardRevoked.style.display = "none";
  cardIdle.style.display = "none";

  // Check Connection Preconditions
  if (!userAddress) {
    cardDisconnected.style.display = "flex";
    return;
  }

  if (currentChainId !== MONAD_CHAIN_ID) {
    cardWrongNetwork.style.display = "flex";
    return;
  }

  const claudeApp = connectedApps.find((a) => a.id === "claude");

  if (currentAppName === "ChatGPT") {
    // Creator flow (ChatGPT)
    if (!isMemorySavedToMonad) {
      cardDetected.style.display = "flex";
    } else {
      cardIdle.style.display = "flex";
    }
  } else {
    // Consumer flow (Claude / other AI)
    if (claudeApp.status === "granted") {
      cardActive.style.display = "flex";
    } else if (claudeApp.status === "revoked") {
      cardRevoked.style.display = "flex";
    } else {
      cardRequest.style.display = "flex";
    }
  }

  document.getElementById("home-context-count-badge").innerText = `${ownedMemories.length} memory saved`;
}

// ================= 7. REAL BLOCKCHAIN ACTIONS =================
function initHomeActions() {
  // 1. Save to AURA (REAL createMemory on Monad Testnet)
  document.getElementById("btn-action-save-context").addEventListener("click", async () => {
    if (!userAddress) {
      showToast("Please connect MetaMask first");
      document.getElementById("btn-connect-metamask-home")?.click();
      return;
    }

    showTxInFlight("Confirming createMemory in MetaMask...");

    try {
      const result = await window.AuraWeb3.executeCreateMemoryOnChain(
        PRIMARY_MEMORY_ID,
        "ipfs://aura-context-pref-01",
        "0.0001"
      );

      isMemorySavedToMonad = true;
      showTxCompleted("✓ Memory Ownership Confirmed on Monad!", result.hash);

      saveStateToStorage();
      updateHomeWorkflow();
      showToast("Saved to your AURA on Monad");
    } catch (err) {
      console.error("[AURA] createMemory error:", err);
      hideTxBanner();
      showToast(err?.message || "Transaction rejected or failed");
    }
  });

  // Ignore detected context
  document.getElementById("btn-action-ignore-context").addEventListener("click", () => {
    document.getElementById("state-card-detected").style.display = "none";
    document.getElementById("state-card-idle").style.display = "flex";
  });

  // 2. Allow & Unlock (REAL payForAccess on Monad Testnet — 0.0001 MON)
  document.getElementById("btn-action-allow-unlock").addEventListener("click", async () => {
    if (!userAddress) {
      showToast("Please connect MetaMask first");
      document.getElementById("btn-connect-metamask-home")?.click();
      return;
    }

    showTxInFlight("Confirming 0.0001 MON in MetaMask...");

    try {
      const result = await window.AuraWeb3.executePayForAccessOnChain(
        PRIMARY_MEMORY_ID,
        "0.0001"
      );

      const claudeApp = connectedApps.find((a) => a.id === "claude");
      if (claudeApp) {
        claudeApp.status = "granted";
      }

      showTxCompleted("✓ 0.0001 MON Confirmed! Access Granted", result.hash);
      saveStateToStorage();
      updateHomeWorkflow();
      showToast(`Context Shared with ${currentAppName}`);
    } catch (err) {
      console.error("[AURA] payForAccess error:", err);
      hideTxBanner();
      showToast(err?.message || "Payment rejected or failed");
    }
  });

  // Dismiss Request
  document.getElementById("btn-action-dismiss-request").addEventListener("click", () => {
    document.getElementById("state-card-request").style.display = "none";
    document.getElementById("state-card-idle").style.display = "flex";
  });

  // 3. Inject Context into AI Prompt
  document.getElementById("btn-action-inject-context").addEventListener("click", () => {
    const contextSnippet = `[AURA SOVEREIGN CONTEXT — VERIFIED VIA MONAD]:
- Stack: React + TypeScript
- Interface: Minimalist, clean components, strict typing
- Note: User prefers concise code without superfluous boilerplate.`;

    try {
      if (typeof chrome !== "undefined" && chrome.tabs) {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs && tabs[0]) {
            chrome.tabs.sendMessage(tabs[0].id, {
              type: "INJECT_CONTEXT",
              context: contextSnippet,
            }, (res) => {
              if (res && res.success) {
                showToast(`Context Injected into ${currentAppName}`);
              } else {
                navigator.clipboard.writeText(contextSnippet);
                showToast("Context Copied to Clipboard");
              }
            });
          }
        });
      } else {
        navigator.clipboard.writeText(contextSnippet);
        showToast("Context Copied to Clipboard");
      }
    } catch (err) {
      navigator.clipboard.writeText(contextSnippet);
      showToast("Context Copied to Clipboard");
    }
  });
}

// ================= 8. VAULT & REAL REVOCATION =================
function renderVault() {
  // Render Memories
  const memContainer = document.getElementById("vault-memories-list");
  memContainer.innerHTML = ownedMemories.map((mem) => `
    <div class="vault-card">
      <div class="card-header-row">
        <span class="card-name">${mem.title}</span>
        <span class="status-badge badge-owner">Owner: ${userAddress ? formatAddress(userAddress) : "You"}</span>
      </div>
      <p class="card-desc">${mem.content}</p>
    </div>
  `).join("");

  // Render Connected Apps
  const appsContainer = document.getElementById("vault-apps-list");
  appsContainer.innerHTML = connectedApps.map((app) => {
    let badgeClass = "badge-owner";
    let badgeLabel = "Owner / Creator";

    if (app.status === "granted") {
      badgeClass = "badge-granted";
      badgeLabel = "✓ Access Allowed";
    } else if (app.status === "revoked") {
      badgeClass = "badge-revoked";
      badgeLabel = "🔒 Access Revoked";
    } else if (app.status === "unauthorized") {
      badgeClass = "badge-revoked";
      badgeLabel = "No Access";
    }

    return `
      <div class="vault-card">
        <div class="card-header-row">
          <span class="card-name">${app.name}</span>
          <span class="status-badge ${badgeClass}">${badgeLabel}</span>
        </div>
        <p class="card-desc">Last active: ${app.lastAccessed}</p>
        ${app.status === "granted" ? `
          <button class="btn-revoke-pill" onclick="openRevokeModal('${app.id}', '${app.name}')">Revoke Access</button>
        ` : ""}
      </div>
    `;
  }).join("");
}

function initRevokeModal() {
  document.getElementById("btn-cancel-revoke").addEventListener("click", () => {
    document.getElementById("revoke-modal").style.display = "none";
    pendingRevokeAppId = null;
  });

  document.getElementById("btn-confirm-revoke").addEventListener("click", async () => {
    if (!pendingRevokeAppId) return;

    const targetApp = connectedApps.find((a) => a.id === pendingRevokeAppId);
    document.getElementById("revoke-modal").style.display = "none";

    showTxInFlight(`Confirming revokeAccess in MetaMask...`);

    try {
      const result = await window.AuraWeb3.executeRevokeAccessOnChain(
        PRIMARY_MEMORY_ID,
        targetApp.address
      );

      targetApp.status = "revoked";
      showTxCompleted("✓ Access Revoked on Monad", result.hash);

      saveStateToStorage();
      renderVault();
      updateHomeWorkflow();
      showToast(`${targetApp.name}'s access revoked on Monad`);
    } catch (err) {
      console.error("[AURA] revokeAccess failed:", err);
      hideTxBanner();
      showToast(err?.message || "Revocation cancelled or failed");
    } finally {
      pendingRevokeAppId = null;
    }
  });
}

window.openRevokeModal = function(appId, appName) {
  pendingRevokeAppId = appId;
  document.getElementById("revoke-modal-description").innerText = 
    `${appName} will immediately lose permission to retrieve your AURA context.`;
  document.getElementById("revoke-modal").style.display = "flex";
};

// ================= 9. SETTINGS & DEVELOPER MODE =================
function initSettings() {
  const devToggle = document.getElementById("toggle-developer-mode");
  const devPanel = document.getElementById("dev-tools-panel");

  devToggle.addEventListener("change", (e) => {
    devPanel.style.display = e.target.checked ? "flex" : "none";
  });

  document.getElementById("btn-dev-claude").addEventListener("click", () => {
    currentAppName = "Claude";
    currentAppDomain = "claude.ai";
    document.getElementById("btn-dev-claude").classList.add("active");
    document.getElementById("btn-dev-chatgpt").classList.remove("active");
    updateActiveAppBanner();
    updateHomeWorkflow();
  });

  document.getElementById("btn-dev-chatgpt").addEventListener("click", () => {
    currentAppName = "ChatGPT";
    currentAppDomain = "chatgpt.com";
    document.getElementById("btn-dev-chatgpt").classList.add("active");
    document.getElementById("btn-dev-claude").classList.remove("active");
    updateActiveAppBanner();
    updateHomeWorkflow();
  });

  // Deploy Contract to Monad Testnet
  const deployBtn = document.getElementById("btn-deploy-contract-monad");
  if (deployBtn) {
    deployBtn.addEventListener("click", async () => {
      showTxInFlight("Deploying AuraConnect contract to Monad Testnet...");
      try {
        const res = await window.AuraWeb3.deployAuraConnectContract();
        showTxCompleted(`✓ AuraConnect Deployed!`, res.hash);
        showToast(`Contract deployed at ${formatAddress(res.contractAddress)}`);
        
        // Update contract link in settings
        const contractLink = document.querySelector(".settings-entry a");
        if (contractLink) {
          contractLink.href = `https://testnet.monadscan.com/address/${res.contractAddress}`;
          contractLink.innerText = `${formatAddress(res.contractAddress)} ↗`;
        }
      } catch (err) {
        console.error("Deployment failed:", err);
        hideTxBanner();
        showToast(err?.message || "Deployment failed");
      }
    });
  }

  // Reset Cache
  document.getElementById("btn-reset-cache").addEventListener("click", () => {
    localStorage.clear();
    location.reload();
  });
}

// ================= 10. HELPERS & UI UPDATES =================
function updateUI() {
  const formatted = userAddress ? formatAddress(userAddress) : "Connect Wallet";
  const pillText = document.getElementById("wallet-address-display");
  const vaultText = document.getElementById("vault-wallet-id");
  const dot = document.getElementById("wallet-dot-indicator");

  if (pillText) pillText.innerText = formatted;
  if (vaultText) vaultText.innerText = userAddress ? userAddress : "Not Connected";

  if (dot) {
    if (!userAddress) {
      dot.style.background = "#71717a";
      dot.style.boxShadow = "none";
    } else if (currentChainId !== MONAD_CHAIN_ID) {
      dot.style.background = "#ef4444";
      dot.style.boxShadow = "0 0 6px #ef4444";
    } else {
      dot.style.background = "#10b981";
      dot.style.boxShadow = "0 0 6px #10b981";
    }
  }

  updateActiveAppBanner();
  updateHomeWorkflow();
}

function showTxInFlight(msg) {
  const banner = document.getElementById("tx-progress-banner");
  banner.style.display = "flex";
  document.getElementById("tx-banner-message").innerText = msg;
  document.getElementById("tx-banner-explorer-link").style.display = "none";
}

function showTxCompleted(msg, hash) {
  const banner = document.getElementById("tx-progress-banner");
  banner.style.display = "flex";
  document.getElementById("tx-banner-message").innerText = msg;
  const link = document.getElementById("tx-banner-explorer-link");
  link.href = `${MONAD_EXPLORER}/tx/${hash}`;
  link.style.display = "block";
}

function hideTxBanner() {
  document.getElementById("tx-progress-banner").style.display = "none";
}

function showToast(msg) {
  const toast = document.getElementById("floating-toast");
  document.getElementById("toast-message-label").innerText = msg;
  toast.style.display = "block";
  setTimeout(() => {
    toast.style.display = "none";
  }, 2400);
}

function formatAddress(addr) {
  if (!addr || addr.length < 10) return addr;
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function saveStateToStorage() {
  const state = {
    ownedMemories,
    connectedApps,
    isMemorySavedToMonad,
  };
  localStorage.setItem("aura_persisted_state_v2", JSON.stringify(state));
}

function loadStateFromStorage() {
  const raw = localStorage.getItem("aura_persisted_state_v2");
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (parsed.ownedMemories) ownedMemories = parsed.ownedMemories;
      if (parsed.connectedApps) connectedApps = parsed.connectedApps;
      if (parsed.isMemorySavedToMonad !== undefined) isMemorySavedToMonad = parsed.isMemorySavedToMonad;
    } catch (err) {
      console.warn("Storage restore error:", err);
    }
  }
}
