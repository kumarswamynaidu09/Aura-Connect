// AURA CONNECT Background Service Worker

// Enable side panel on extension action click
chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error("Error setting panel behavior:", error));

// Listen for tab switches or updates to notify side panel of active AI app
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  try {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    if (tab && tab.url) {
      chrome.runtime.sendMessage({
        type: "TAB_CHANGED",
        url: tab.url,
        title: tab.title,
      }).catch(() => {
        // Side panel may not be open, safe to ignore
      });
    }
  } catch (err) {
    console.error("Tab activation error:", err);
  }
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.url) {
    chrome.runtime.sendMessage({
      type: "TAB_UPDATED",
      url: tab.url,
      title: tab.title,
    }).catch(() => {});
  }
});
