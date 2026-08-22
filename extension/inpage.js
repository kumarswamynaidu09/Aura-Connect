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
