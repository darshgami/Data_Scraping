import asyncio
from playwright.sync_api import sync_playwright
import re
import json
import logging

# Setup logging
logger = logging.getLogger(__name__)

def run_playwright_scraper(url, city_filter=None, pincode_filter=None):
    """
    Emergency-Extraction Scraper: Optimized for high-noise directories and fuzzy matching.
    """
    results = []
    city_filter = city_filter.strip() if city_filter else ""
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            viewport={'width': 1920, 'height': 1080}
        )
        page = context.new_page()
        
        try:
            logger.info(f"Targeting: {url} | City: {city_filter}")
            page.goto(url, wait_until="networkidle", timeout=60000)
            page.wait_for_timeout(5000)
            
            # Smart Scrolling
            page.evaluate("window.scrollTo(0, 500)")
            page.wait_for_timeout(1000)
            page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
            page.wait_for_timeout(2000)

            # EMERGENCY EXTRACTION LOGIC
            scraped_items = page.evaluate("""(city) => {
                const results = [];
                const seenNames = new Set();

                // Strategy: Find EVERY block that contains the city name
                const allDivs = document.querySelectorAll('div, section, article, li, .pro_listing, .supplier-info');
                
                allDivs.forEach(el => {
                    const text = el.innerText || "";
                    if (text.length < 50 || text.length > 2000) return;

                    // If city filter exists, the block MUST contain it
                    if (city && !text.toLowerCase().includes(city.toLowerCase().trim())) return;

                    // Extract Name: First Bold/Link/Heading
                    const nameEl = el.querySelector('h1, h2, h3, h4, b, strong, a[href*="company"], .com_nam, .title');
                    let name = nameEl ? nameEl.innerText.trim() : "";
                    
                    if (!name || name.length < 3) {
                        name = text.split('\\n')[0].trim();
                    }

                    if (name.length > 100 || name.toLowerCase().includes('login') || name.toLowerCase().includes('sign up')) return;
                    if (seenNames.has(name)) return;
                    seenNames.add(name);

                    // Extract Address: Look for the line containing the city
                    const lines = text.split('\\n').map(l => l.trim()).filter(l => l.length > 3);
                    let address = "N/A";
                    for (let line of lines) {
                        if (line !== name && city && line.toLowerCase().includes(city.toLowerCase().trim())) {
                            address = line;
                            break;
                        }
                    }
                    if (address === "N/A" && lines.length > 1) address = lines[1];

                    // Contacts
                    const email = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}/)?.[0] || "N/A";
                    const phone = text.match(/\\+?\\d[\\d\\s\\-\\(]{8,}\\d/)?.[0]?.trim() || "N/A";
                    const website = el.querySelector('a[href^="http"]')?.href || "N/A";

                    results.push({
                        "Company Name": name,
                        "Address": address,
                        "Website": website,
                        "Email": email,
                        "Contact": phone
                    });
                });

                return results;
            }""", city_filter)

            logger.info(f"Extracted {len(scraped_items)} matching blocks.")

            # Final Polish
            for item in scraped_items:
                # Clean name
                item["Company Name"] = re.split(r'\\n|·| - ', item["Company Name"])[0].strip()
                results.append(item)

            return results

        except Exception as e:
            logger.error(f"Emergency Scraper Error: {str(e)}")
            return []
        finally:
            browser.close()
