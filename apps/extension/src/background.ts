declare const chrome: any;

chrome.action.onClicked.addListener(() => {
    const targetUrl = chrome.runtime.getURL('index.html');

    chrome.tabs.query({ url: targetUrl }, (tabs) => {
        const existingTab = tabs.find((tab) => typeof tab.id === 'number');

        if (existingTab?.id) {
            chrome.tabs.update(existingTab.id, { active: true });
            chrome.windows.update(existingTab.windowId, { focused: true });
            return;
        }

        chrome.tabs.create({ url: targetUrl });
    });
});

