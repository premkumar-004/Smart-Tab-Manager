// background.js

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "consolidateTabs") {
        chrome.tabs.query({ currentWindow: true }, (tabs) => {
            if (tabs.length <= 1) {
                sendResponse({ status: "No tabs to consolidate." });
                return;
            }

            const tabsToSave = [];
            const tabIdsToRemove = [];

            tabs.forEach(tab => {
                if (tab.url !== "chrome://newtab/") {
                    tabsToSave.push({
                        title: tab.title,
                        url: tab.url,
                        favIconUrl: tab.favIconUrl
                    });
                    tabIdsToRemove.push(tab.id);
                }
            });

            // *** THE KEY CHANGE IS HERE ***
            // We now use Date.now() to create a unique key for every consolidation.
            const uniqueKey = `savedTabs_${Date.now()}`;

            chrome.storage.local.set({ [uniqueKey]: tabsToSave }, () => {
                chrome.tabs.create({ url: chrome.runtime.getURL("manager/manager.html") });
                chrome.tabs.remove(tabIdsToRemove);
                sendResponse({ status: "Success", count: tabsToSave.length });
            });
        });
        return true;
    }
});