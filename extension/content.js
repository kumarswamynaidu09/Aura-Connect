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

  if (request.type === "GET_AI_CONTEXT" || request.type === "EXTRACT_CONTEXT") {
    const ctx = extractUserContextSummary();
    sendResponse({
      platform: ctx.platform,
      url: window.location.href,
      selectedText: window.getSelection()?.toString() || "",
      extractedContext: ctx,
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

// Extract conversation messages from the current AI platform
function extractConversationContext() {
  const platform = detectAIPlatform();
  let messages = [];
  
  if (platform === 'ChatGPT') {
    // ChatGPT uses article elements with data-message-author-role
    const msgEls = document.querySelectorAll('[data-message-author-role]');
    msgEls.forEach(el => {
      const role = el.getAttribute('data-message-author-role');
      const text = el.innerText?.trim();
      if (text && text.length > 10) {
        messages.push({ role, text: text.substring(0, 500) });
      }
    });
    // Fallback: try the main content area
    if (messages.length === 0) {
      const turns = document.querySelectorAll('div[class*="markdown"], div[class*="message"]');
      turns.forEach(el => {
        const text = el.innerText?.trim();
        if (text && text.length > 20) {
          messages.push({ role: 'unknown', text: text.substring(0, 500) });
        }
      });
    }
  } else if (platform === 'Claude') {
    // Claude uses specific message containers
    const humanMsgs = document.querySelectorAll('[data-testid*="human"], div[class*="human-turn"], div.font-user-message');
    const aiMsgs = document.querySelectorAll('[data-testid*="assistant"], div[class*="assistant-turn"], div.font-claude-message');
    humanMsgs.forEach(el => {
      const text = el.innerText?.trim();
      if (text && text.length > 10) messages.push({ role: 'user', text: text.substring(0, 500) });
    });
    aiMsgs.forEach(el => {
      const text = el.innerText?.trim();
      if (text && text.length > 10) messages.push({ role: 'assistant', text: text.substring(0, 500) });
    });
    // Broader fallback for Claude
    if (messages.length === 0) {
      const allBlocks = document.querySelectorAll('[class*="Message"], [class*="message"], [data-is-streaming]');
      allBlocks.forEach(el => {
        const text = el.innerText?.trim();
        if (text && text.length > 20) messages.push({ role: 'unknown', text: text.substring(0, 500) });
      });
    }
  } else {
    // Generic: look for any conversation-like structure
    const blocks = document.querySelectorAll('[role="log"] > *, [class*="message"], [class*="chat"], article');
    blocks.forEach(el => {
      const text = el.innerText?.trim();
      if (text && text.length > 20 && text.length < 2000) {
        messages.push({ role: 'unknown', text: text.substring(0, 500) });
      }
    });
  }
  
  return messages;
}

// Extract a useful context summary from the last few user messages
function extractUserContextSummary() {
  const messages = extractConversationContext();
  const userMessages = messages.filter(m => m.role === 'user' || m.role === 'human');
  
  // Get the last 3 user messages
  const recent = userMessages.slice(-3);
  if (recent.length === 0) {
    // Fall back to any messages
    const anyRecent = messages.slice(-3);
    return {
      platform: detectAIPlatform(),
      messageCount: messages.length,
      summary: anyRecent.map(m => m.text).join(' | '),
      lastUserMessage: anyRecent.length > 0 ? anyRecent[anyRecent.length - 1].text : '',
      hasContent: anyRecent.length > 0,
    };
  }
  
  return {
    platform: detectAIPlatform(),
    messageCount: messages.length,
    summary: recent.map(m => m.text).join(' | '),
    lastUserMessage: recent[recent.length - 1].text,
    hasContent: recent.length > 0,
  };
}

// Watch for new conversation messages
let lastMessageCount = 0;
const observer = new MutationObserver(() => {
  const ctx = extractUserContextSummary();
  if (ctx.messageCount > lastMessageCount && ctx.hasContent) {
    lastMessageCount = ctx.messageCount;
    // Notify the extension that new context is available
    try {
      chrome.runtime.sendMessage({
        type: 'AURA_NEW_CONTEXT',
        context: ctx
      });
    } catch (e) {}
  }
});

// Start observing after a short delay to let the page load
setTimeout(() => {
  const target = document.querySelector('main') || document.querySelector('#__next') || document.body;
  if (target) {
    observer.observe(target, { childList: true, subtree: true });
  }
}, 2000);
