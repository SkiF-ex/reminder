chrome.runtime.onInstalled.addListener(() => {
    chrome.tabs.query({ url: "https://*/*" }, (tabs) => {
        for (const { id } of tabs) {
            chrome.scripting.executeScript({
                target: { tabId: id },
                files: [chrome.runtime.getManifest().content_scripts[0].js[0], chrome.runtime.getManifest().content_scripts[1].js[0]]
            });
        }
    });
});
