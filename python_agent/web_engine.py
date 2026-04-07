"""
Web Automation Engine - Browser automation using Playwright
All actions require backend permission before execution
"""

import subprocess
import sys
import time
from pathlib import Path

# Try to import playwright, install if not available
try:
    from playwright.sync_api import sync_playwright, TimeoutError as PlaywrightTimeout
    PLAYWRIGHT_AVAILABLE = True
except ImportError:
    PLAYWRIGHT_AVAILABLE = False
    print("[WEB ENGINE] Playwright not installed. Install with: pip install playwright && playwright install chromium")

# Global browser instance
_browser = None
_page = None
_playwright = None

def ensure_playwright():
    """Ensure Playwright is available"""
    if not PLAYWRIGHT_AVAILABLE:
        return False
    return True

def launch_browser(headless=False):
    """Launch Chromium browser"""
    global _browser, _page, _playwright
    
    if not ensure_playwright():
        return {"success": False, "message": "Playwright not available. Install with: pip install playwright && playwright install chromium"}
    
    try:
        if _browser is None:
            _playwright = sync_playwright().start()
            _browser = _playwright.chromium.launch(headless=headless)
            _page = _browser.new_page()
        return {"success": True, "message": "Browser launched"}
    except Exception as e:
        return {"success": False, "message": f"Failed to launch browser: {str(e)}"}

def close_browser():
    """Close browser"""
    global _browser, _page, _playwright
    
    try:
        if _page:
            _page.close()
        if _browser:
            _browser.close()
        if _playwright:
            _playwright.stop()
        _browser = None
        _page = None
        _playwright = None
        return {"success": True, "message": "Browser closed"}
    except Exception as e:
        return {"success": False, "message": f"Failed to close browser: {str(e)}"}

def open_url(url):
    """Open URL in browser"""
    global _page
    
    if not ensure_playwright():
        return {"success": False, "message": "Playwright not available"}
    
    try:
        if _page is None:
            result = launch_browser()
            if not result["success"]:
                return result
        
        if not url.startswith(('http://', 'https://')):
            url = 'https://' + url
        
        _page.goto(url, timeout=30000)
        return {"success": True, "message": f"Opened URL: {url}"}
    except Exception as e:
        return {"success": False, "message": f"Failed to open URL: {str(e)}"}

def click(selector, timeout=5000):
    """Click element by selector"""
    global _page
    
    if not ensure_playwright():
        return {"success": False, "message": "Playwright not available"}
    
    try:
        if _page is None:
            return {"success": False, "message": "Browser not open. Open a URL first."}
        
        _page.click(selector, timeout=timeout)
        return {"success": True, "message": f"Clicked element: {selector}"}
    except PlaywrightTimeout:
        return {"success": False, "message": f"Element not found or timeout: {selector}"}
    except Exception as e:
        return {"success": False, "message": f"Failed to click: {str(e)}"}

def type_text(selector, text, timeout=5000):
    """Type text into element"""
    global _page
    
    if not ensure_playwright():
        return {"success": False, "message": "Playwright not available"}
    
    try:
        if _page is None:
            return {"success": False, "message": "Browser not open. Open a URL first."}
        
        _page.fill(selector, text, timeout=timeout)
        return {"success": True, "message": f"Typed text into: {selector}"}
    except PlaywrightTimeout:
        return {"success": False, "message": f"Element not found or timeout: {selector}"}
    except Exception as e:
        return {"success": False, "message": f"Failed to type: {str(e)}"}

def wait(selector=None, timeout=5000):
    """Wait for element or timeout"""
    global _page
    
    if not ensure_playwright():
        return {"success": False, "message": "Playwright not available"}
    
    try:
        if _page is None:
            return {"success": False, "message": "Browser not open. Open a URL first."}
        
        if selector:
            _page.wait_for_selector(selector, timeout=timeout)
        else:
            time.sleep(timeout / 1000.0)
        
        return {"success": True, "message": f"Waited for: {selector or f'{timeout}ms'}"}
    except PlaywrightTimeout:
        return {"success": False, "message": f"Timeout waiting for: {selector}"}
    except Exception as e:
        return {"success": False, "message": f"Failed to wait: {str(e)}"}

def scroll(amount=None, to_bottom=False):
    """Scroll page"""
    global _page
    
    if not ensure_playwright():
        return {"success": False, "message": "Playwright not available"}
    
    try:
        if _page is None:
            return {"success": False, "message": "Browser not open. Open a URL first."}
        
        if to_bottom:
            _page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
            return {"success": True, "message": "Scrolled to bottom"}
        elif amount:
            _page.evaluate(f"window.scrollBy(0, {amount})")
            return {"success": True, "message": f"Scrolled by {amount}px"}
        else:
            _page.evaluate("window.scrollBy(0, 500)")
            return {"success": True, "message": "Scrolled down 500px"}
    except Exception as e:
        return {"success": False, "message": f"Failed to scroll: {str(e)}"}

def extract(selector, attribute=None):
    """Extract text or attribute from element"""
    global _page
    
    if not ensure_playwright():
        return {"success": False, "message": "Playwright not available"}
    
    try:
        if _page is None:
            return {"success": False, "message": "Browser not open. Open a URL first."}
        
        if attribute:
            value = _page.get_attribute(selector, attribute)
        else:
            value = _page.text_content(selector)
        
        return {"success": True, "message": f"Extracted from: {selector}", "data": value}
    except Exception as e:
        return {"success": False, "message": f"Failed to extract: {str(e)}"}

def search_google(query):
    """Search Google"""
    try:
        url = f"https://www.google.com/search?q={query.replace(' ', '+')}"
        return open_url(url)
    except Exception as e:
        return {"success": False, "message": f"Failed to search Google: {str(e)}"}

