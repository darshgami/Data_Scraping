/**
 * Background Service Worker
 */

chrome.runtime.onInstalled.addListener(() => {
    console.log("BDS - Business Data Scraper installed.");
});

// Handle communication between content script and popup if needed
// Or handle long running tasks (though Django handles enrichment here)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "log") {
        console.log("LOG:", request.message);
    }
    return true;
});
