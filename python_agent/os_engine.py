"""
OS Automation Engine - Safe mouse, keyboard, window, and system controls
All actions require backend permission before execution
"""

import pyautogui
import subprocess
import os
import platform
import time
from pathlib import Path
import ctypes
from ctypes import wintypes

# Safety settings
pyautogui.PAUSE = 0.5
pyautogui.FAILSAFE = True

# Windows API constants
HWND_BROADCAST = 0xFFFF
WM_SYSCOMMAND = 0x0112
SC_MONITORPOWER = 0xF170
MONITOR_OFF = 2

def move_mouse(x, y, duration=0.5):
    """Move mouse to coordinates"""
    try:
        pyautogui.moveTo(x, y, duration=duration)
        return {"success": True, "message": f"Mouse moved to ({x}, {y})"}
    except Exception as e:
        return {"success": False, "message": f"Failed to move mouse: {str(e)}"}

def click_mouse(button='left', clicks=1, x=None, y=None):
    """Click mouse button"""
    try:
        if x is not None and y is not None:
            pyautogui.click(x, y, clicks=clicks, button=button)
        else:
            pyautogui.click(clicks=clicks, button=button)
        return {"success": True, "message": f"Clicked {button} button {clicks} time(s)"}
    except Exception as e:
        return {"success": False, "message": f"Failed to click: {str(e)}"}

def double_click(x=None, y=None):
    """Double click"""
    return click_mouse(button='left', clicks=2, x=x, y=y)

def right_click(x=None, y=None):
    """Right click"""
    return click_mouse(button='right', x=x, y=y)

def drag_drop(start_x, start_y, end_x, end_y, duration=1.0):
    """Drag and drop"""
    try:
        pyautogui.drag(start_x, start_y, end_x - start_x, end_y - start_y, duration=duration)
        return {"success": True, "message": f"Dragged from ({start_x}, {start_y}) to ({end_x}, {end_y})"}
    except Exception as e:
        return {"success": False, "message": f"Failed to drag: {str(e)}"}

def press_key(key):
    """Press a single key"""
    try:
        pyautogui.press(key)
        return {"success": True, "message": f"Pressed key: {key}"}
    except Exception as e:
        return {"success": False, "message": f"Failed to press key: {str(e)}"}

def hotkey(*keys):
    """Press hotkey combination (e.g., 'ctrl', 'c')"""
    try:
        pyautogui.hotkey(*keys)
        return {"success": True, "message": f"Pressed hotkey: {'+'.join(keys)}"}
    except Exception as e:
        return {"success": False, "message": f"Failed to press hotkey: {str(e)}"}

def type_text(text, interval=0.1):
    """Type text string"""
    try:
        pyautogui.write(text, interval=interval)
        return {"success": True, "message": f"Typed text: {text[:50]}..."}
    except Exception as e:
        return {"success": False, "message": f"Failed to type text: {str(e)}"}

def close_window():
    """Close current window (Alt+F4)"""
    try:
        pyautogui.hotkey('alt', 'f4')
        time.sleep(0.5)
        return {"success": True, "message": "Closed current window"}
    except Exception as e:
        return {"success": False, "message": f"Failed to close window: {str(e)}"}

def minimize_window():
    """Minimize current window (Windows+D or Alt+Space+N)"""
    try:
        pyautogui.hotkey('win', 'd')
        return {"success": True, "message": "Minimized window"}
    except Exception as e:
        return {"success": False, "message": f"Failed to minimize window: {str(e)}"}

def maximize_window():
    """Maximize current window (Alt+Space+X)"""
    try:
        pyautogui.hotkey('alt', 'space')
        time.sleep(0.2)
        pyautogui.press('x')
        return {"success": True, "message": "Maximized window"}
    except Exception as e:
        return {"success": False, "message": f"Failed to maximize window: {str(e)}"}

def switch_window():
    """Switch window (Alt+Tab)"""
    try:
        pyautogui.hotkey('alt', 'tab')
        time.sleep(0.3)
        return {"success": True, "message": "Switched window"}
    except Exception as e:
        return {"success": False, "message": f"Failed to switch window: {str(e)}"}

def volume_up(amount=5):
    """Increase volume"""
    try:
        for _ in range(amount):
            pyautogui.press('volumeup')
        return {"success": True, "message": f"Increased volume by {amount}"}
    except Exception as e:
        return {"success": False, "message": f"Failed to increase volume: {str(e)}"}

def volume_down(amount=5):
    """Decrease volume"""
    try:
        for _ in range(amount):
            pyautogui.press('volumedown')
        return {"success": True, "message": f"Decreased volume by {amount}"}
    except Exception as e:
        return {"success": False, "message": f"Failed to decrease volume: {str(e)}"}

def volume_mute():
    """Toggle mute"""
    try:
        pyautogui.press('volumemute')
        return {"success": True, "message": "Toggled mute"}
    except Exception as e:
        return {"success": False, "message": f"Failed to toggle mute: {str(e)}"}

def media_play_pause():
    """Play/pause media"""
    try:
        pyautogui.press('playpause')
        return {"success": True, "message": "Toggled play/pause"}
    except Exception as e:
        return {"success": False, "message": f"Failed to play/pause: {str(e)}"}

def media_next():
    """Next track"""
    try:
        pyautogui.press('nexttrack')
        return {"success": True, "message": "Next track"}
    except Exception as e:
        return {"success": False, "message": f"Failed to skip track: {str(e)}"}

def media_previous():
    """Previous track"""
    try:
        pyautogui.press('prevtrack')
        return {"success": True, "message": "Previous track"}
    except Exception as e:
        return {"success": False, "message": f"Failed to previous track: {str(e)}"}

def lock_screen():
    """Lock screen (Windows+L)"""
    try:
        pyautogui.hotkey('win', 'l')
        return {"success": True, "message": "Locked screen"}
    except Exception as e:
        return {"success": False, "message": f"Failed to lock screen: {str(e)}"}

def shutdown_system(confirm=False):
    """Shutdown system (requires confirmation)"""
    if not confirm:
        return {"success": False, "message": "Confirmation required for shutdown", "requires_confirm": True}
    try:
        if platform.system() == "Windows":
            subprocess.run(['shutdown', '/s', '/t', '10'], shell=True)
        return {"success": True, "message": "System will shutdown in 10 seconds"}
    except Exception as e:
        return {"success": False, "message": f"Failed to shutdown: {str(e)}"}

def restart_system(confirm=False):
    """Restart system (requires confirmation)"""
    if not confirm:
        return {"success": False, "message": "Confirmation required for restart", "requires_confirm": True}
    try:
        if platform.system() == "Windows":
            subprocess.run(['shutdown', '/r', '/t', '10'], shell=True)
        return {"success": True, "message": "System will restart in 10 seconds"}
    except Exception as e:
        return {"success": False, "message": f"Failed to restart: {str(e)}"}

def sleep_system(confirm=False):
    """Put system to sleep (requires confirmation)"""
    if not confirm:
        return {"success": False, "message": "Confirmation required for sleep", "requires_confirm": True}
    try:
        if platform.system() == "Windows":
            subprocess.run(['rundll32.exe', 'powrprof.dll,SetSuspendState', '0,1,0'], shell=True)
        return {"success": True, "message": "System going to sleep"}
    except Exception as e:
        return {"success": False, "message": f"Failed to sleep: {str(e)}"}

def take_screenshot(save_folder="screenshots"):
    """Take screenshot and save"""
    try:
        screenshot = pyautogui.screenshot()
        Path(save_folder).mkdir(exist_ok=True)
        filename = f"screenshot_{int(time.time())}.png"
        filepath = os.path.join(save_folder, filename)
        screenshot.save(filepath)
        return {"success": True, "message": f"Screenshot saved: {filename}", "filepath": filepath}
    except Exception as e:
        return {"success": False, "message": f"Failed to take screenshot: {str(e)}"}

