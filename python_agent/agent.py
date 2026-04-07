"""
Sudhanva Python Agent - Full OS Control
HTTP server for executing system commands and PC automation
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import subprocess
import os
import platform
import pyautogui
import psutil
import webbrowser
from pathlib import Path
import json
import time

# Import OS and Web engines
from os_engine import (
    move_mouse, click_mouse, double_click, right_click, drag_drop,
    press_key, hotkey, type_text as os_type_text,
    close_window, minimize_window, maximize_window, switch_window,
    volume_up, volume_down, volume_mute,
    media_play_pause, media_next, media_previous,
    lock_screen, shutdown_system, restart_system, sleep_system,
    take_screenshot
)
from web_engine import (
    launch_browser, close_browser, open_url, click, type_text as web_type_text,
    wait, scroll, extract, search_google
)

app = Flask(__name__)
CORS(app)

# Safety: Add delay between pyautogui actions
pyautogui.PAUSE = 0.5
pyautogui.FAILSAFE = True

# Application paths (Windows)
APP_PATHS = {
    "chrome": r"C:\Program Files\Google\Chrome\Application\chrome.exe",
    "vscode": r"C:\Users\{}\AppData\Local\Programs\Microsoft VS Code\Code.exe".format(os.getenv('USERNAME')),
    "spotify": r"C:\Users\{}\AppData\Roaming\Spotify\Spotify.exe".format(os.getenv('USERNAME')),
    "whatsapp": r"C:\Users\{}\AppData\Local\WhatsApp\WhatsApp.exe".format(os.getenv('USERNAME')),
    "steam": r"C:\Program Files (x86)\Steam\steam.exe",
    "explorer": "explorer",
}

# Folder paths
FOLDER_PATHS = {
    "downloads": os.path.join(os.path.expanduser("~"), "Downloads"),
    "documents": os.path.join(os.path.expanduser("~"), "Documents"),
    "desktop": os.path.join(os.path.expanduser("~"), "Desktop"),
    "pictures": os.path.join(os.path.expanduser("~"), "Pictures"),
    "videos": os.path.join(os.path.expanduser("~"), "Videos"),
    "music": os.path.join(os.path.expanduser("~"), "Music"),
}

def get_system_info():
    """Get current system information"""
    try:
        battery = psutil.sensors_battery()
        return {
            "cpu_percent": psutil.cpu_percent(interval=1),
            "memory_percent": psutil.virtual_memory().percent,
            "memory_available_gb": round(psutil.virtual_memory().available / (1024**3), 2),
            "battery_percent": battery.percent if battery else None,
            "battery_plugged": battery.power_plugged if battery else None,
            "uptime_seconds": int(time.time() - psutil.boot_time()),
        }
    except Exception as e:
        return {"error": str(e)}

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({"status": "online", "platform": platform.system()})

def open_path(path_str):
    """Helper to safely open a path."""
    normalized = os.path.normpath(path_str)
    if os.path.exists(normalized):
        os.startfile(normalized)
        return True
    return False

@app.route('/execute', methods=['POST'])
def execute():
    data = request.get_json()
    
    # Check for simple command string (new format)
    cmd = data.get("command", "").lower().strip() if data.get("command") else None
    
    # If no simple command, check for structured intent (old format) and convert
    if not cmd:
        action = data.get('action')
        target = data.get('target', '')
        
        if action == "open_app":
            cmd = target.lower() if target else ""
        elif action == "open_folder":
            cmd = target.lower() if target else ""
        elif action == "screenshot":
            cmd = "screenshot"
        elif action == "system_info":
            cmd = "system info"
        else:
            # For other actions, fall back to old structured format
            return handle_structured_action(data)
    
    print("[AGENT RECEIVED COMMAND]:", cmd)

    # -----------------------------
    # APPLICATIONS
    # -----------------------------
    
    if "chrome" in cmd or "browser" in cmd:
        chrome_paths = [
            r"C:\Program Files\Google\Chrome\Application\chrome.exe",
            r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"
        ]
        for p in chrome_paths:
            if os.path.exists(p):
                os.startfile(p)
                return jsonify({"status": "opened chrome"})
        return jsonify({"status": "chrome not found"})

    if "vscode" in cmd or "code" in cmd:
        vscode = r"C:\Users\%USERNAME%\AppData\Local\Programs\Microsoft VS Code\Code.exe"
        vscode = os.path.expandvars(vscode)
        if os.path.exists(vscode):
            os.startfile(vscode)
            return jsonify({"status": "opened vscode"})
        return jsonify({"status": "vscode not found"})

    if "file" in cmd or "explorer" in cmd or "file manager" in cmd:
        os.startfile("explorer")
        return jsonify({"status": "opened explorer"})

    if "spotify" in cmd:
        spotify_path = r"C:\Users\%USERNAME%\AppData\Roaming\Spotify\Spotify.exe"
        spotify_path = os.path.expandvars(spotify_path)
        if os.path.exists(spotify_path):
            os.startfile(spotify_path)
            return jsonify({"status": "opened spotify"})
        return jsonify({"status": "spotify not found"})

    if "whatsapp" in cmd:
        whatsapp_path = r"C:\Users\%USERNAME%\AppData\Local\WhatsApp\WhatsApp.exe"
        whatsapp_path = os.path.expandvars(whatsapp_path)
        if os.path.exists(whatsapp_path):
            os.startfile(whatsapp_path)
            return jsonify({"status": "opened whatsapp"})
        return jsonify({"status": "whatsapp not found"})

    # -----------------------------
    # FOLDERS
    # -----------------------------

    user = Path.home()

    if "downloads" in cmd:
        os.startfile(user / "Downloads")
        return jsonify({"status": "opened downloads"})

    if "documents" in cmd:
        os.startfile(user / "Documents")
        return jsonify({"status": "opened documents"})

    if "desktop" in cmd:
        os.startfile(user / "Desktop")
        return jsonify({"status": "opened desktop"})

    if "pictures" in cmd or "photos" in cmd:
        os.startfile(user / "Pictures")
        return jsonify({"status": "opened pictures"})

    if "videos" in cmd:
        os.startfile(user / "Videos")
        return jsonify({"status": "opened videos"})

    if "music" in cmd:
        os.startfile(user / "Music")
        return jsonify({"status": "opened music"})

    # -----------------------------
    # SYSTEM ACTIONS
    # -----------------------------

    if "screenshot" in cmd:
        subprocess.run("snippingtool /clip", shell=True)
        return jsonify({"status": "screenshot taken"})

    if "system info" in cmd:
        info = platform.platform()
        return jsonify({"status": "system info", "details": info})

    return jsonify({"status": "unknown command", "cmd": cmd})

def handle_structured_action(data):
    """Handle structured intent format for backward compatibility with old API"""
    try:
        action = data.get('action')
        target = data.get('target')
        params = data.get('params', {})
        
        if action == "open_app":
            result = open_application(target)
        elif action == "open_folder":
            result = open_folder(target)
        elif action == "volume_change":
            amount = params.get('amount', 10)
            result = change_volume(amount)
        elif action == "volume_mute":
            result = toggle_mute()
        elif action == "brightness_change":
            amount = params.get('amount', 10)
            result = change_brightness(amount)
        elif action == "open_url":
            url = target or params.get('url')
            result = open_url(url)
        elif action == "play_youtube":
            video = target or params.get('video')
            result = play_youtube(video)
        elif action == "shutdown":
            result = shutdown_system(params.get('confirm', False))
        elif action == "restart":
            result = restart_system(params.get('confirm', False))
        elif action == "sleep":
            result = sleep_system()
        elif action == "search_files":
            query = target or params.get('query')
            result = search_files(query)
        elif action == "system_info":
            result = {"success": True, "data": get_system_info()}
        else:
            return jsonify({"success": False, "message": f"Unknown action: {action}"}), 400
        
        return jsonify(result)
    except Exception as e:
        return jsonify({"success": False, "message": f"Error: {str(e)}"}), 500

def open_application(app_name):
    """Open an application"""
    try:
        app_lower = app_name.lower()
        
        # Check if app is in predefined paths
        if app_lower in APP_PATHS:
            app_path = APP_PATHS[app_lower]
            if app_lower == "explorer":
                subprocess.Popen([app_path])
            else:
                subprocess.Popen([app_path])
            return {"success": True, "message": f"{app_name} opened successfully."}
        
        # Try to find .exe in common locations
        elif app_lower.endswith('.exe'):
            if os.path.exists(app_name):
                subprocess.Popen([app_name])
                return {"success": True, "message": f"Application opened successfully."}
            else:
                return {"success": False, "message": f"Application not found: {app_name}"}
        
        # Try Windows start command
        else:
            subprocess.Popen(f'start {app_lower}', shell=True)
            return {"success": True, "message": f"{app_name} opened successfully."}
    
    except Exception as e:
        return {"success": False, "message": f"Failed to open {app_name}: {str(e)}"}

def open_folder(folder_name):
    """Open a folder"""
    try:
        folder_lower = folder_name.lower()
        
        if folder_lower in FOLDER_PATHS:
            folder_path = FOLDER_PATHS[folder_lower]
            subprocess.Popen(f'explorer "{folder_path}"', shell=True)
            return {"success": True, "message": f"{folder_name} folder opened."}
        
        # Custom path
        elif os.path.exists(folder_name):
            subprocess.Popen(f'explorer "{folder_name}"', shell=True)
            return {"success": True, "message": f"Folder opened: {folder_name}"}
        
        else:
            return {"success": False, "message": f"Folder not found: {folder_name}"}
    
    except Exception as e:
        return {"success": False, "message": f"Failed to open folder: {str(e)}"}

def change_volume(amount):
    """Change system volume"""
    try:
        # Use nircmd or PowerShell for volume control
        # For now, using a simple approach with Windows API via subprocess
        if amount > 0:
            # Increase volume
            for _ in range(abs(amount) // 2):
                pyautogui.press('volumeup')
        else:
            # Decrease volume
            for _ in range(abs(amount) // 2):
                pyautogui.press('volumedown')
        
        return {"success": True, "message": f"Volume changed by {amount}%."}
    
    except Exception as e:
        return {"success": False, "message": f"Failed to change volume: {str(e)}"}

def toggle_mute():
    """Toggle mute"""
    try:
        pyautogui.press('volumemute')
        return {"success": True, "message": "Volume muted/unmuted."}
    
    except Exception as e:
        return {"success": False, "message": f"Failed to toggle mute: {str(e)}"}

def change_brightness(amount):
    """Change screen brightness"""
    try:
        # Windows brightness control via PowerShell
        current = subprocess.run(
            ['powershell', '-Command', '(Get-WmiObject -Namespace root/WMI -Class WmiMonitorBrightness).CurrentBrightness'],
            capture_output=True, text=True
        )
        
        # For simplicity, use keyboard shortcuts
        if amount > 0:
            pyautogui.press('brightnessup')
        else:
            pyautogui.press('brightnessdown')
        
        return {"success": True, "message": f"Brightness adjusted."}
    
    except Exception as e:
        return {"success": False, "message": f"Failed to change brightness: {str(e)}"}

def open_url(url):
    """Open URL in browser"""
    try:
        if not url.startswith(('http://', 'https://')):
            url = 'https://' + url
        
        webbrowser.open(url)
        return {"success": True, "message": f"Opened {url}"}
    
    except Exception as e:
        return {"success": False, "message": f"Failed to open URL: {str(e)}"}

def play_youtube(video_query):
    """Play YouTube video"""
    try:
        url = f"https://www.youtube.com/results?search_query={video_query.replace(' ', '+')}"
        webbrowser.open(url)
        return {"success": True, "message": f"Searching YouTube for: {video_query}"}
    
    except Exception as e:
        return {"success": False, "message": f"Failed to play YouTube: {str(e)}"}

def shutdown_system(confirm=False):
    """Shutdown system (requires confirmation)"""
    if not confirm:
        return {"success": False, "message": "Confirmation required for shutdown", "requires_confirm": True}
    
    try:
        subprocess.run(['shutdown', '/s', '/t', '10'], shell=True)
        return {"success": True, "message": "System will shutdown in 10 seconds."}
    
    except Exception as e:
        return {"success": False, "message": f"Failed to shutdown: {str(e)}"}

def restart_system(confirm=False):
    """Restart system (requires confirmation)"""
    if not confirm:
        return {"success": False, "message": "Confirmation required for restart", "requires_confirm": True}
    
    try:
        subprocess.run(['shutdown', '/r', '/t', '10'], shell=True)
        return {"success": True, "message": "System will restart in 10 seconds."}
    
    except Exception as e:
        return {"success": False, "message": f"Failed to restart: {str(e)}"}

def sleep_system():
    """Put system to sleep"""
    try:
        subprocess.run(['rundll32.exe', 'powrprof.dll,SetSuspendState', '0,1,0'], shell=True)
        return {"success": True, "message": "System going to sleep."}
    
    except Exception as e:
        return {"success": False, "message": f"Failed to sleep: {str(e)}"}

def take_screenshot():
    """Take a screenshot"""
    try:
        screenshot = pyautogui.screenshot()
        filename = f"screenshot_{int(time.time())}.png"
        filepath = os.path.join(FOLDER_PATHS["desktop"], filename)
        screenshot.save(filepath)
        return {"success": True, "message": f"Screenshot saved: {filename}", "filepath": filepath}
    
    except Exception as e:
        return {"success": False, "message": f"Failed to take screenshot: {str(e)}"}

def search_files(query):
    """Search for files"""
    try:
        # Use Windows search via File Explorer
        subprocess.Popen(f'explorer "search-ms:query={query}"', shell=True)
        return {"success": True, "message": f"Searching for: {query}"}
    
    except Exception as e:
        return {"success": False, "message": f"Failed to search files: {str(e)}"}

# ================================================
# OS AUTOMATION ROUTES
# ================================================

@app.route('/os/mouse', methods=['POST'])
def os_mouse():
    """Mouse control endpoint"""
    try:
        data = request.get_json()
        action = data.get('action')
        params = data.get('params', {})
        
        if action == 'move':
            return jsonify(move_mouse(params.get('x', 0), params.get('y', 0), params.get('duration', 0.5)))
        elif action == 'click':
            return jsonify(click_mouse(params.get('button', 'left'), params.get('clicks', 1), params.get('x'), params.get('y')))
        elif action == 'double_click':
            return jsonify(double_click(params.get('x'), params.get('y')))
        elif action == 'right_click':
            return jsonify(right_click(params.get('x'), params.get('y')))
        elif action == 'drag_drop':
            return jsonify(drag_drop(
                params.get('start_x', 0), params.get('start_y', 0),
                params.get('end_x', 0), params.get('end_y', 0),
                params.get('duration', 1.0)
            ))
        else:
            return jsonify({"success": False, "message": f"Unknown mouse action: {action}"}), 400
    except Exception as e:
        return jsonify({"success": False, "message": f"Error: {str(e)}"}), 500

@app.route('/os/keyboard', methods=['POST'])
def os_keyboard():
    """Keyboard control endpoint"""
    try:
        data = request.get_json()
        action = data.get('action')
        params = data.get('params', {})
        
        if action == 'press':
            return jsonify(press_key(params.get('key')))
        elif action == 'hotkey':
            keys = params.get('keys', [])
            return jsonify(hotkey(*keys))
        elif action == 'type':
            return jsonify(type_text(params.get('text', ''), params.get('interval', 0.1)))
        else:
            return jsonify({"success": False, "message": f"Unknown keyboard action: {action}"}), 400
    except Exception as e:
        return jsonify({"success": False, "message": f"Error: {str(e)}"}), 500

@app.route('/os/window', methods=['POST'])
def os_window():
    """Window control endpoint"""
    try:
        data = request.get_json()
        action = data.get('action')
        
        if action == 'close':
            return jsonify(close_window())
        elif action == 'minimize':
            return jsonify(minimize_window())
        elif action == 'maximize':
            return jsonify(maximize_window())
        elif action == 'switch':
            return jsonify(switch_window())
        else:
            return jsonify({"success": False, "message": f"Unknown window action: {action}"}), 400
    except Exception as e:
        return jsonify({"success": False, "message": f"Error: {str(e)}"}), 500

@app.route('/os/system', methods=['POST'])
def os_system():
    """System control endpoint"""
    try:
        data = request.get_json()
        action = data.get('action')
        params = data.get('params', {})
        
        if action == 'volume_up':
            return jsonify(volume_up(params.get('amount', 5)))
        elif action == 'volume_down':
            return jsonify(volume_down(params.get('amount', 5)))
        elif action == 'volume_mute':
            return jsonify(volume_mute())
        elif action == 'media_play_pause':
            return jsonify(media_play_pause())
        elif action == 'media_next':
            return jsonify(media_next())
        elif action == 'media_previous':
            return jsonify(media_previous())
        elif action == 'lock_screen':
            return jsonify(lock_screen())
        elif action == 'shutdown':
            return jsonify(shutdown_system(params.get('confirm', False)))
        elif action == 'restart':
            return jsonify(restart_system(params.get('confirm', False)))
        elif action == 'sleep':
            return jsonify(sleep_system(params.get('confirm', False)))
        else:
            return jsonify({"success": False, "message": f"Unknown system action: {action}"}), 400
    except Exception as e:
        return jsonify({"success": False, "message": f"Error: {str(e)}"}), 500

@app.route('/os/screenshot', methods=['POST'])
def os_screenshot():
    """Screenshot endpoint"""
    try:
        data = request.get_json()
        save_folder = data.get('save_folder', 'screenshots')
        return jsonify(take_screenshot(save_folder))
    except Exception as e:
        return jsonify({"success": False, "message": f"Error: {str(e)}"}), 500

# ================================================
# WEB AUTOMATION ROUTES
# ================================================

@app.route('/web/execute', methods=['POST'])
def web_execute():
    """Web automation endpoint"""
    try:
        data = request.get_json()
        command = data.get('command')
        params = data.get('params', {})
        
        if command == 'launch_browser':
            return jsonify(launch_browser(params.get('headless', False)))
        elif command == 'close_browser':
            return jsonify(close_browser())
        elif command == 'open_url':
            return jsonify(open_url(params.get('url', '')))
        elif command == 'click':
            return jsonify(click(params.get('selector', ''), params.get('timeout', 5000)))
        elif command == 'type':
            return jsonify(web_type_text(params.get('selector', ''), params.get('text', ''), params.get('timeout', 5000)))
        elif command == 'wait':
            return jsonify(wait(params.get('selector'), params.get('timeout', 5000)))
        elif command == 'scroll':
            return jsonify(scroll(params.get('amount'), params.get('to_bottom', False)))
        elif command == 'extract':
            return jsonify(extract(params.get('selector', ''), params.get('attribute')))
        elif command == 'search_google':
            return jsonify(search_google(params.get('query', '')))
        else:
            return jsonify({"success": False, "message": f"Unknown web command: {command}"}), 400
    except Exception as e:
        return jsonify({"success": False, "message": f"Error: {str(e)}"}), 500

if __name__ == '__main__':
    print("🚀 Sudhanva Python Agent starting on http://127.0.0.1:5050")
    print("📡 Ready to receive commands...")
    app.run(host='127.0.0.1', port=5050, debug=False)

