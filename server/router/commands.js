/**
 * Command Router - Maps natural language intents to Python Agent actions
 * Converts AI-generated intents into structured JSON commands
 */

import fetch from 'node-fetch';

const PYTHON_AGENT_URL = 'http://127.0.0.1:5050';

/**
 * Map intent action to Python agent command
 */
function mapIntentToCommand(intent) {
  const { action, target, params = {} } = intent;

  // Application opening
  if (action === 'open_app') {
    const appMap = {
      'chrome': 'chrome',
      'google chrome': 'chrome',
      'browser': 'chrome',
      'vscode': 'vscode',
      'visual studio code': 'vscode',
      'code': 'vscode',
      'spotify': 'spotify',
      'whatsapp': 'whatsapp',
      'steam': 'steam',
      'file explorer': 'explorer',
      'explorer': 'explorer',
    };

    const normalizedTarget = target?.toLowerCase() || '';
    const mappedApp = appMap[normalizedTarget] || normalizedTarget;

    return {
      action: 'open_app',
      target: mappedApp,
    };
  }

  // Folder opening
  if (action === 'open_folder') {
    const folderMap = {
      'downloads': 'downloads',
      'documents': 'documents',
      'desktop': 'desktop',
      'pictures': 'pictures',
      'videos': 'videos',
      'music': 'music',
    };

    const normalizedTarget = target?.toLowerCase() || '';
    const mappedFolder = folderMap[normalizedTarget] || normalizedTarget;

    return {
      action: 'open_folder',
      target: mappedFolder,
    };
  }

  // Volume control
  if (action === 'volume_change') {
    return {
      action: 'volume_change',
      params: {
        amount: params.amount || 10,
      },
    };
  }

  if (action === 'volume_mute') {
    return {
      action: 'volume_mute',
    };
  }

  // Brightness control
  if (action === 'brightness_change') {
    return {
      action: 'brightness_change',
      params: {
        amount: params.amount || 10,
      },
    };
  }

  // Web/URL opening
  if (action === 'open_url') {
    return {
      action: 'open_url',
      target: target || params.url,
    };
  }

  // YouTube
  if (action === 'play_youtube') {
    return {
      action: 'play_youtube',
      target: target || params.video,
    };
  }

  // System commands
  if (action === 'shutdown') {
    return {
      action: 'shutdown',
      params: {
        confirm: params.confirm || false,
      },
    };
  }

  if (action === 'restart') {
    return {
      action: 'restart',
      params: {
        confirm: params.confirm || false,
      },
    };
  }

  if (action === 'sleep') {
    return {
      action: 'sleep',
    };
  }

  // Automation
  if (action === 'screenshot') {
    return {
      action: 'screenshot',
    };
  }

  if (action === 'search_files') {
    return {
      action: 'search_files',
      target: target || params.query,
    };
  }

  // System info
  if (action === 'system_info') {
    return {
      action: 'system_info',
    };
  }

  // Default: pass through as-is
  return {
    action,
    target,
    params,
  };
}

/**
 * Execute command on Python agent (legacy - uses /execute endpoint)
 */
async function executeCommand(intent, onLog = null) {
  try {
    const command = mapIntentToCommand(intent);

    if (onLog) {
      onLog(`EXECUTING TASK: ${command.action}${command.target ? ` - ${command.target}` : ''}`);
    }

    const response = await fetch(`${PYTHON_AGENT_URL}/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(command),
    });

    const result = await response.json();

    if (result.success || result.status) {
      if (onLog) {
        onLog(`PYTHON AGENT SUCCESS: ${result.message || result.status}`);
      }
      return {
        success: true,
        message: result.message || result.status,
        data: result.data,
      };
    } else {
      // Check if confirmation is required
      if (result.requires_confirm) {
        if (onLog) {
          onLog(`CONFIRMATION REQUIRED: ${result.message}`);
        }
        return {
          success: false,
          requires_confirm: true,
          message: result.message,
        };
      }

      if (onLog) {
        onLog(`PYTHON AGENT ERROR: ${result.message || result.status}`);
      }
      return {
        success: false,
        message: result.message || result.status,
      };
    }
  } catch (error) {
    const errorMsg = error.message || 'Unknown error';
    if (onLog) {
      onLog(`PYTHON AGENT ERROR: ${errorMsg}`);
    }
    return {
      success: false,
      message: `Failed to execute command: ${errorMsg}`,
    };
  }
}

/**
 * Execute OS automation action
 * @param {Object} actionRequest - Structured action request
 * @param {Function} onLog - Optional logging function
 * @returns {Promise<Object>} - Execution result
 */
async function executeOSAction(actionRequest, onLog = null) {
  try {
    const { action, params } = actionRequest;
    
    if (onLog) {
      onLog(`[OS ACTION] Executing: ${action}`);
    }

    // Map action to endpoint
    let endpoint = 'system';
    let body = { action, params };

    if (action === 'screenshot') {
      endpoint = 'screenshot';
      body = { save_folder: params.save_folder || 'screenshots' };
    } else if (['close_window', 'minimize_window', 'maximize_window', 'switch_window'].includes(action)) {
      endpoint = 'window';
      body = { action };
    } else if (['volume_up', 'volume_down', 'volume_mute', 'media_play_pause', 'media_next', 'media_previous', 'lock_screen', 'shutdown', 'restart', 'sleep'].includes(action)) {
      endpoint = 'system';
      body = { action, params };
    } else if (['open_app', 'open_folder'].includes(action)) {
      // Use legacy /execute endpoint for these
      return await executeCommand({ action, target: params.app || params.folder }, onLog);
    }

    const response = await fetch(`${PYTHON_AGENT_URL}/os/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const result = await response.json();

    if (result.success || result.status) {
      if (onLog) {
        onLog(`[OS ACTION] Success: ${result.message || result.status}`);
      }
      return {
        success: true,
        message: result.message || result.status,
        data: result.data
      };
    } else {
      if (onLog) {
        onLog(`[OS ACTION] Error: ${result.message || result.status}`);
      }
      return {
        success: false,
        message: result.message || result.status
      };
    }
  } catch (error) {
    const errorMsg = error.message || 'Unknown error';
    if (onLog) {
      onLog(`[OS ACTION] Error: ${errorMsg}`);
    }
    return {
      success: false,
      message: `Failed to execute OS action: ${errorMsg}`
    };
  }
}

/**
 * Execute Web automation action
 * @param {Object} actionRequest - Structured action request
 * @param {Function} onLog - Optional logging function
 * @returns {Promise<Object>} - Execution result
 */
async function executeWebAction(actionRequest, onLog = null) {
  try {
    const { action, params } = actionRequest;
    
    if (onLog) {
      onLog(`[WEB ACTION] Executing: ${action}`);
    }

    const commandMap = {
      'open_url': 'open_url',
      'search_google': 'search_google',
      'click': 'click',
      'type': 'type',
      'wait': 'wait',
      'scroll': 'scroll',
      'extract': 'extract'
    };

    const command = commandMap[action] || action;

    const response = await fetch(`${PYTHON_AGENT_URL}/web/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        command,
        params
      })
    });

    const result = await response.json();

    if (result.success || result.status) {
      if (onLog) {
        onLog(`[WEB ACTION] Success: ${result.message || result.status}`);
      }
      return {
        success: true,
        message: result.message || result.status,
        data: result.data
      };
    } else {
      if (onLog) {
        onLog(`[WEB ACTION] Error: ${result.message || result.status}`);
      }
      return {
        success: false,
        message: result.message || result.status
      };
    }
  } catch (error) {
    const errorMsg = error.message || 'Unknown error';
    if (onLog) {
      onLog(`[WEB ACTION] Error: ${errorMsg}`);
    }
    return {
      success: false,
      message: `Failed to execute web action: ${errorMsg}`
    };
  }
}

/**
 * Check if Python agent is online
 */
async function checkAgentHealth() {
  try {
    const response = await fetch('http://127.0.0.1:5050/health', {
      method: 'GET',
    });
    const result = await response.json();
    return result.status === 'online';
  } catch (error) {
    return false;
  }
}

export {
  executeCommand,
  checkAgentHealth,
  mapIntentToCommand,
  executeOSAction,
  executeWebAction,
};

