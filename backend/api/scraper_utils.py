import asyncio
from playwright.sync_api import sync_playwright
import re
import json

def extract_pincode(text):
    if not text: return "N/A"
    # Look for 6-digit number (India) or 5-digit (US)
    pin_match = re.search(r'\b\d{5,6}\b', text)
    return pin_match.group(0) if pin_match else "N/A"

def run_playwright_scraper(url, city_filter=None, pincode_filter=None):
    """
    Scrapes business data from a given URL using Playwright.
    Uses robust heuristics ported from successful frontend scraping logic.
    """
    results = []
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36"
        )
        page = context.new_page()
        
        try:
            # Navigate and wait for network idle
            page.goto(url, wait_until="networkidle", timeout=60000)
            
            # Scroll to load dynamic content
            page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
            page.wait_for_timeout(2000)
            
            # Use the page.evaluate to run complex heuristic logic in the browser context
            # This allows us to use DOM APIs which are more powerful for this task.
            scraped_items = page.evaluate("""(cityFilter, pincodeFilter) => {
                const results = [];
                
                function extractPincode(text) {
                    const pinMatch = text.match(/\\b\\d{5,6}\\b/);
                    return pinMatch ? pinMatch[0] : null;
                }

                // 1. Try JSON-LD first
                const scripts = document.querySelectorAll('script[type="application/ld+json"]');
                scripts.forEach(script => {
                    try {
                        const data = JSON.parse(script.innerText);
                        const items = Array.isArray(data) ? data : [data];
                        items.forEach(item => {
                            if (item['@type'] === 'LocalBusiness' || item['@type'] === 'Organization') {
                                results.push({
                                    company_name: item.name || 'N/A',
                                    address: typeof item.address === 'string' ? item.address : (item.address?.streetAddress || item.address?.description || 'N/A')
                                });
                            }
                            if (item['@graph']) {
                                item['@graph'].forEach(g => {
                                    if (g['@type'] === 'LocalBusiness') {
                                        results.push({ company_name: g.name || 'N/A', address: g.address?.streetAddress || 'N/A' });
                                    }
                                });
                            }
                        });
                    } catch(e) {}
                });

                // 2. Universal Heuristic (Cards, Rows, Items)
                const containerSelectors = [
                    'article', '.listing', '.item', '.card', '.row', '.product', 
                    '[class*="item"]', '[class*="card"]', '[class*="listing"]', 
                    '.supplier-info', '.pro_listing', '.com_nam', '.dbg0pd', '.OSrXXb'
                ];
                
                const containers = document.querySelectorAll(containerSelectors.join(', '));
                
                containers.forEach(container => {
                    const nameEl = container.querySelector('h1, h2, h3, h4, h5, .title, .name, b, strong, [class*="name"], [class*="title"]');
                    if (!nameEl) return;
                    
                    const name = nameEl.innerText.trim();
                    if (name.length < 2 || name.length > 150) return;

                    let address = 'N/A';
                    // Look for address-like patterns in siblings or parents
                    const allTextElements = container.querySelectorAll('span, div, p, td');
                    for (const el of allTextElements) {
                        const text = el.innerText.trim();
                        if (text === name) continue;
                        // Heuristic: contains comma, has numbers, length > 8
                        if (text.length > 8 && text.includes(',') && /[0-9]/.test(text) && !text.includes('Price') && !text.includes('INR')) {
                            address = text.split('\\n')[0].trim();
                            break; 
                        }
                    }

                    results.push({ company_name: name, address: address });
                });

                // 3. Table Fallback
                if (results.length < 5) {
                    const rows = document.querySelectorAll('tr');
                    rows.forEach(row => {
                        const cells = row.querySelectorAll('td');
                        if (cells.length >= 2) {
                            const n = cells[0].innerText.trim();
                            const a = cells[1].innerText.trim();
                            if (n.length > 2 && a.includes(',') && n.length < 100) {
                                results.push({ company_name: n, address: a });
                            }
                        }
                    });
                }

                return results;
            }""", city_filter, pincode_filter)

            results.extend(scraped_items)

            # Final Filtering and Cleaning on Python side
            seen = set()
            unique_results = []
            
            for res in results:
                name = res.get('company_name', 'N/A').strip() or 'N/A'
                address = res.get('address', 'N/A').strip() or 'N/A'
                
                if name == 'N/A' or len(name) < 2:
                    continue
                
                # Duplicate check
                key = f"{name}|{address}".lower()
                if key in seen:
                    continue
                seen.add(key)
                
                # City/Pincode Filter
                match_city = True
                if city_filter:
                    match_city = city_filter.lower() in address.lower() or city_filter.lower() in name.lower()
                
                match_pincode = True
                if pincode_filter:
                    match_pincode = pincode_filter.lower() in address.lower()
                
                if match_city and match_pincode:
                    unique_results.append({
                        'Company Name': name,
                        'Address': address
                    })
            
            return unique_results
            
        except Exception as e:
            print(f"Scraping error: {e}")
            return []
        finally:
            browser.close()
