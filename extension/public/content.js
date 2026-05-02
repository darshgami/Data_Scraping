/**
 * BDS - Business Data Scraper PRO
 * Optimized for Google Search Local Pack and general business directories.
 * Implements pagination and robust data cleaning.
 */

function extractPincode(text) {
    // Look for 6-digit number (India) or 5-digit (US)
    const pinMatch = text.match(/\b\d{5,6}\b/);
    return pinMatch ? pinMatch[0] : null;
}

function scrapeGoogleSearch() {
    const results = [];
    // Google Local Pack containers
    const containers = document.querySelectorAll('div.VkpUv, div.uG67id, .C8t66e, .rllt__details');
    
    containers.forEach(container => {
        // Name selectors
        const nameEl = container.querySelector('.dbg0pd, .OSrXXb, [role="heading"], .VByer');
        
        // Address strategy: Look for elements that aren't ratings or phone numbers
        const divs = container.querySelectorAll('div, span');
        let address = 'N/A';
        
        for (const el of divs) {
            const text = el.innerText.trim();
            // Heuristic for address: contains commas, doesn't start with '·', not a rating
            if (text.length > 10 && text.includes(',') && !text.startsWith('·') && !text.match(/^\d\.\d/)) {
                // Remove the "·" if it's at the end or start
                address = text.split('·')[0].trim();
                break;
            }
        }

        // Fallback
        if (address === 'N/A' || address === '') {
            const addrEl = container.querySelector('.lrzPbe, .address, [class*="address"]');
            if (addrEl) address = addrEl.innerText.trim();
        }

        if (nameEl && nameEl.innerText.trim().length > 1) {
            const name = nameEl.innerText.trim().split('·')[0].trim();
            results.push({
                company_name: name,
                address: address,
                pincode: extractPincode(address) || 'N/A'
            });
        }
    });

    return results;
}

function scrapeUniversalDirectory() {
    const results = [];
    
    // 1. Identify potential repeating containers (cards, rows, items)
    const containerSelectors = [
        'article', 'tr', '.listing', '.item', '.card', '.row', '.product', 
        '[class*="item"]', '[class*="card"]', '[class*="listing"]', '[class*="row"]',
        '[class*="product"]', '.pro_listing', '.com_nam'
    ];
    
    const containers = document.querySelectorAll(containerSelectors.join(', '));
    
    containers.forEach(container => {
        // Find Company Name
        // Logic: Headings or bold text usually contain the name
        const nameEl = container.querySelector('h1, h2, h3, h4, h5, .title, .name, b, strong, [class*="name"], [class*="title"]');
        
        // Find Address
        // Logic: Look for standard classes first, then scan for location patterns
        let addrEl = container.querySelector('.address, .location, .map, [class*="address"], [class*="location"], [class*="addr"]');
        let address = addrEl ? addrEl.innerText.trim() : 'N/A';

        if (address === 'N/A' || address === '') {
            // Scan all text nodes in the container for address-like patterns (comma + length)
            const allTextElements = container.querySelectorAll('span, div, p, font, td');
            for (const el of allTextElements) {
                const text = el.innerText.trim();
                // Avoid capturing the name itself as the address
                if (text === nameEl?.innerText.trim()) continue;
                
                // Heuristic: Min 10 chars, includes comma, not a phone/price
                if (text.length > 8 && text.includes(',') && !text.match(/[₹$]/) && !text.match(/^\+?\d[\d\s-]{8,}/)) {
                    address = text;
                    break; 
                }
            }
        }

        if (nameEl && nameEl.innerText.trim().length > 2) {
            const name = nameEl.innerText.trim();
            // Basic validation to avoid navigation or footer items
            if (name.length < 120 && !name.includes('Menu') && !name.includes('Login') && !name.includes('Account')) {
                results.push({
                    company_name: name,
                    address: address,
                    pincode: extractPincode(address) || 'N/A'
                });
            }
        }
    });

    // 2. Special handling for Tables (if no containers found)
    if (results.length === 0) {
        const rows = document.querySelectorAll('tr');
        rows.forEach(row => {
            const cells = row.querySelectorAll('td');
            if (cells.length >= 2) {
                const name = cells[0].innerText.trim();
                const addr = cells[1].innerText.trim();
                if (name.length > 2 && addr.includes(',') && name.length < 100) {
                    results.push({
                        company_name: name,
                        address: addr,
                        pincode: extractPincode(addr) || 'N/A'
                    });
                }
            }
        });
    }

    return results;
}

function findNextPage() {
    // Common "Next" button selectors
    const nextSelectors = [
        'a#pnnext', // Google
        'a[aria-label="Next"]',
        'a[class*="next"]',
        'button[class*="next"]',
        'li.next a'
    ];
    
    for (const selector of nextSelectors) {
        const el = document.querySelector(selector);
        if (el && el.href) return el.href;
    }
    return null;
}

function scrapeExportersIndia() {
    const results = [];
    const containers = document.querySelectorAll('.supplier-info, .pro_listing, [class*="product-card"]');
    
    containers.forEach(container => {
        const nameEl = container.querySelector('.com_nam, .company-name, [class*="company"]');
        // Address on ExportersIndia is often in a span near the location icon
        const spans = container.querySelectorAll('span');
        let address = 'N/A';
        
        for (const span of spans) {
            const text = span.innerText.trim();
            // Address often contains city names and commas
            if (text.includes(',') && text.length > 5 && !text.includes('Price')) {
                address = text;
                break;
            }
        }

        if (nameEl && nameEl.innerText.trim().length > 1) {
            const name = nameEl.innerText.trim();
            results.push({
                company_name: name,
                address: address,
                pincode: extractPincode(address) || 'N/A'
            });
        }
    });

    return results;
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "scrape") {
        let data = [];
        const hostname = window.location.hostname;

        if (hostname.includes('google')) {
            data = scrapeGoogleSearch();
        } else if (hostname.includes('exportersindia')) {
            data = scrapeExportersIndia();
        }
        
        // If specific scraper failed or site not matched, try universal
        if (data.length === 0) {
            data = scrapeUniversalDirectory();
        }
        
        // Deduplicate
        const uniqueData = [];
        const seen = new Set();
        data.forEach(item => {
            const key = `${item.company_name}|${item.address}`.toLowerCase();
            if (!seen.has(key)) {
                seen.add(key);
                uniqueData.push(item);
            }
        });

        const nextUrl = findNextPage();
        sendResponse({ data: uniqueData, nextUrl: nextUrl });
    }
    return true;
});



