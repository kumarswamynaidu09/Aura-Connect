// AURA CONNECT Content Script with In-Page Web3 Bridge
console.log("⚡ AURA CONNECT content script active on:", window.location.hostname);

// 1. Inject in-page bridge to communicate directly with window.ethereum in webpage DOM context
function injectInpageBridge() {
  try {
    const script = document.createElement("script");
    script.textContent = `
      (function() {
        window.addEventListener("message", async function(event) {
          if (event.source !== window || !event.data || event.data.target !== "AURA_INPAGE_REQUEST") return;
          
          const { id, method, params } = event.data;
          
          function getInjectedProvider() {
            const w = window;
            if (w.ethereum) return w.ethereum;
            if (w.rabby) return w.rabby;
            if (w.phantom && w.phantom.ethereum) return w.phantom.ethereum;
            if (w.coinbaseWalletExtension) return w.coinbaseWalletExtension;
            return null;
          }

          let eth = getInjectedProvider();
          if (!eth) {
            // Poll briefly for delayed injection
            for (let i = 0; i < 5; i++) {
              await new Promise(r => setTimeout(r, 150));
              eth = getInjectedProvider();
              if (eth) break;
            }
          }

          if (!eth) {
            window.postMessage({
              target: "AURA_INPAGE_RESPONSE",
              id: id,
              error: "METAMASK_NOT_DETECTED"
            }, "*");
            return;
          }

          try {
            const result = await eth.request({ method: method, params: params });
            window.postMessage({
              target: "AURA_INPAGE_RESPONSE",
              id: id,
              result: result
            }, "*");
          } catch (err) {
            window.postMessage({
              target: "AURA_INPAGE_RESPONSE",
              id: id,
              error: err && err.message ? err.message : String(err),
              code: err && err.code ? err.code : undefined
            }, "*");
          }
        });
      })();
    `;
    (document.head || document.documentElement).appendChild(script);
    script.remove();
  } catch (e) {
    console.warn("AURA inpage bridge injection:", e);
  }
}

injectInpageBridge();

// Detect active AI platform
function detectAIPlatform() {
  const host = window.location.hostname.toLowerCase();
  if (host.includes("chatgpt") || host.includes("openai")) return "ChatGPT";
  if (host.includes("claude")) return "Claude";
  if (host.includes("perplexity")) return "Perplexity";
  if (host.includes("cursor")) return "Cursor";
  if (host.includes("localhost")) return "Local AI";
  return "AI Assistant";
}

// Listen for messages from AURA Side Panel
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // Web3 Provider Bridge Request
  if (request.type === "AURA_ETH_REQUEST") {
    const reqId = Math.random().toString(36).slice(2) + Date.now();
    
    const responseHandler = (event) => {
      if (event.data && event.data.target === "AURA_INPAGE_RESPONSE" && event.data.id === reqId) {
        window.removeEventListener("message", responseHandler);
        sendResponse(event.data);
      }
    };

    window.addEventListener("message", responseHandler);
    window.postMessage({
      target: "AURA_INPAGE_REQUEST",
      id: reqId,
      method: request.method,
      params: request.params
    }, "*");

    // Timeout safety
    setTimeout(() => {
      window.removeEventListener("message", responseHandler);
    }, 60000);

    return true; // Keep message channel open for async response
  }

  if (request.type === "GET_AI_CONTEXT") {
    sendResponse({
      platform: detectAIPlatform(),
      url: window.location.href,
      selectedText: window.getSelection()?.toString() || "",
    });
    return true;
  }

  if (request.type === "INJECT_CONTEXT") {
    const injected = injectContextIntoActiveInput(request.context);
    sendResponse({ success: injected });
    return true;
  }
});

// Injects authorized context into ChatGPT / Claude / standard inputs
function injectContextIntoActiveInput(contextText) {
  try {
    let inputEl = document.querySelector("#prompt-textarea");
    
    if (!inputEl) {
      inputEl = document.querySelector('div[contenteditable="true"]');
    }

    if (!inputEl) {
      inputEl = document.querySelector('textarea');
    }

    if (inputEl) {
      if (inputEl.isContentEditable) {
        inputEl.focus();
        document.execCommand('insertText', false, contextText);
      } else {
        inputEl.focus();
        const start = inputEl.selectionStart || 0;
        const end = inputEl.selectionEnd || 0;
        const currentVal = inputEl.value;
        inputEl.value = currentVal.substring(0, start) + contextText + currentVal.substring(end);
        inputEl.dispatchEvent(new Event('input', { bubbles: true }));
        inputEl.dispatchEvent(new Event('change', { bubbles: true }));
      }

      showFloatingToast("⚡ AURA Context Injected into " + detectAIPlatform());
      return true;
    } else {
      navigator.clipboard.writeText(contextText);
      showFloatingToast("📋 Context copied to clipboard for " + detectAIPlatform());
      return true;
    }
  } catch (err) {
    console.error("AURA Context injection failed:", err);
    return false;
  }
}

function showFloatingToast(message) {
  const toast = document.createElement("div");
  toast.innerText = message;
  toast.style.position = "fixed";
  toast.style.bottom = "24px";
  toast.style.right = "24px";
  toast.style.backgroundColor = "#111116";
  toast.style.color = "#FFB000";
  toast.style.padding = "10px 18px";
  toast.style.borderRadius = "999px";
  toast.style.border = "1px solid rgba(255, 176, 0, 0.4)";
  toast.style.boxShadow = "0 8px 25px rgba(0,0,0,0.7), 0 0 15px rgba(255, 157, 0, 0.2)";
  toast.style.fontFamily = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  toast.style.fontSize = "12px";
  toast.style.fontWeight = "600";
  toast.style.zIndex = "999999";
  toast.style.transition = "all 0.3s ease";
  
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(10px)";
    setTimeout(() => toast.remove(), 300);
  }, 2800);
}
