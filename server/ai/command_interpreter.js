/**
 * Universal Command Interpreter
 * Parses natural language commands into structured action requests
 */

/**
 * Interpret natural language command into structured action request
 * @param {string} naturalLanguage - Raw user transcript
 * @param {Object|null} geminiIntent - Optional structured intent from Gemini
 * @param {Object} memory - Memory object
 * @param {Object|null} modelSignals - Personal model signals
 * @returns {Promise<Object|null>} - Structured action request or null if no action
 */
export async function interpretCommand(naturalLanguage, geminiIntent = null, memory = {}, modelSignals = null) {
  if (!naturalLanguage || typeof naturalLanguage !== 'string') {
    return null;
  }

  const text = naturalLanguage.toLowerCase().trim();
  console.log(`[COMMAND INTERPRETER] Interpreting: "${text}"`);

  // Check for exit/abort commands
  if (text.match(/\b(stop everything|cancel all|abort|stop all tasks)\b/)) {
    return {
      engine: 'os',
      category: 'system',
      action: 'abort_all',
      params: {},
      isSensitive: false,
      description: 'Stop all pending tasks'
    };
  }

  // Parse using Gemini intent if available
  if (geminiIntent && geminiIntent.action) {
    return parseStructuredIntent(geminiIntent, text);
  }

  // Fallback to rule-based parsing
  return parseNaturalLanguage(text);
}

/**
 * Parse structured intent from Gemini
 */
function parseStructuredIntent(intent, originalText) {
  const { action, target, params = {} } = intent;
  
  let engine = 'os';
  let category = 'app';
  let isSensitive = false;
  let description = originalText;

  // Map Gemini actions to our system
  switch (action) {
    case 'open_app':
      engine = 'os';
      category = 'app';
      description = `Open ${target || 'application'}`;
      break;
    
    case 'open_folder':
      engine = 'os';
      category = 'file';
      description = `Open ${target || 'folder'}`;
      break;
    
    case 'screenshot':
      engine = 'os';
      category = 'system';
      description = 'Take a screenshot';
      break;
    
    case 'volume_change':
      engine = 'os';
      category = 'media';
      description = `Change volume by ${params.amount || 10}`;
      break;
    
    case 'volume_mute':
      engine = 'os';
      category = 'media';
      description = 'Toggle mute';
      break;
    
    case 'brightness_change':
      engine = 'os';
      category = 'system';
      description = `Change brightness by ${params.amount || 10}`;
      break;
    
    case 'open_url':
      engine = 'web';
      category = 'web';
      description = `Open ${target || params.url || 'URL'}`;
      break;
    
    case 'play_youtube':
      engine = 'web';
      category = 'web';
      description = `Search YouTube for ${target || params.video || 'video'}`;
      break;
    
    case 'shutdown':
    case 'restart':
    case 'sleep':
      engine = 'os';
      category = 'system';
      isSensitive = true;
      description = `${action} system`;
      break;
    
    case 'search_files':
      engine = 'os';
      category = 'file';
      description = `Search for ${target || params.query || 'files'}`;
      break;
    
    case 'system_info':
      engine = 'os';
      category = 'system';
      description = 'Get system information';
      break;
    
    default:
      return null;
  }

  // Mark sensitive actions
  if (['shutdown', 'restart', 'sleep', 'delete', 'move', 'rename', 'overwrite', 'install'].includes(action)) {
    isSensitive = true;
  }

  return {
    engine,
    category,
    action: mapActionToEngineAction(action, target, params),
    params: buildParams(action, target, params),
    isSensitive,
    description
  };
}

/**
 * Parse natural language using rule-based matching
 */
function parseNaturalLanguage(text) {
  // Applications
  if (text.match(/\b(open|launch|start)\s+(chrome|browser)\b/)) {
    return {
      engine: 'os',
      category: 'app',
      action: 'open_app',
      params: { app: 'chrome' },
      isSensitive: false,
      description: 'Open Chrome browser'
    };
  }

  if (text.match(/\b(open|launch|start)\s+(vscode|code|visual studio code)\b/)) {
    return {
      engine: 'os',
      category: 'app',
      action: 'open_app',
      params: { app: 'vscode' },
      isSensitive: false,
      description: 'Open Visual Studio Code'
    };
  }

  if (text.match(/\b(open|launch|start)\s+(spotify)\b/)) {
    return {
      engine: 'os',
      category: 'app',
      action: 'open_app',
      params: { app: 'spotify' },
      isSensitive: false,
      description: 'Open Spotify'
    };
  }

  if (text.match(/\b(open|launch|start)\s+(file|explorer|file manager)\b/)) {
    return {
      engine: 'os',
      category: 'app',
      action: 'open_app',
      params: { app: 'explorer' },
      isSensitive: false,
      description: 'Open File Explorer'
    };
  }

  if (text.match(/\b(close|exit)\s+(chrome|browser|spotify|vscode|code|app|window)\b/)) {
    return {
      engine: 'os',
      category: 'window',
      action: 'close_window',
      params: {},
      isSensitive: false,
      description: 'Close current window'
    };
  }

  // Folders
  if (text.match(/\b(open)\s+(downloads|documents|desktop|pictures|photos|videos|music)\b/)) {
    const folder = text.match(/\b(downloads|documents|desktop|pictures|photos|videos|music)\b/)[1];
    return {
      engine: 'os',
      category: 'file',
      action: 'open_folder',
      params: { folder: folder === 'photos' ? 'pictures' : folder },
      isSensitive: false,
      description: `Open ${folder} folder`
    };
  }

  // Screenshot
  if (text.match(/\b(take|capture)\s+(a\s+)?screenshot\b/)) {
    return {
      engine: 'os',
      category: 'system',
      action: 'screenshot',
      params: {},
      isSensitive: false,
      description: 'Take a screenshot'
    };
  }

  // Volume
  if (text.match(/\b(increase|raise|turn up|volume up)\s+volume\b/)) {
    return {
      engine: 'os',
      category: 'media',
      action: 'volume_up',
      params: { amount: 5 },
      isSensitive: false,
      description: 'Increase volume'
    };
  }

  if (text.match(/\b(decrease|lower|turn down|volume down)\s+volume\b/)) {
    return {
      engine: 'os',
      category: 'media',
      action: 'volume_down',
      params: { amount: 5 },
      isSensitive: false,
      description: 'Decrease volume'
    };
  }

  if (text.match(/\b(mute|unmute)\s*(audio|sound|volume)?\b/)) {
    return {
      engine: 'os',
      category: 'media',
      action: 'volume_mute',
      params: {},
      isSensitive: false,
      description: 'Toggle mute'
    };
  }

  // Media controls
  if (text.match(/\b(play|pause|play pause)\s*(music|media|audio)?\b/)) {
    return {
      engine: 'os',
      category: 'media',
      action: 'media_play_pause',
      params: {},
      isSensitive: false,
      description: 'Play/pause media'
    };
  }

  if (text.match(/\b(next|skip)\s*(track|song)?\b/)) {
    return {
      engine: 'os',
      category: 'media',
      action: 'media_next',
      params: {},
      isSensitive: false,
      description: 'Next track'
    };
  }

  if (text.match(/\b(previous|previous track|back)\s*(track|song)?\b/)) {
    return {
      engine: 'os',
      category: 'media',
      action: 'media_previous',
      params: {},
      isSensitive: false,
      description: 'Previous track'
    };
  }

  // Web search
  if (text.match(/\b(search|google|find)\s+(for\s+)?(.+)/)) {
    const query = text.replace(/\b(search|google|find)\s+(for\s+)?/i, '').trim();
    return {
      engine: 'web',
      category: 'web',
      action: 'search_google',
      params: { query },
      isSensitive: false,
      description: `Search Google for: ${query}`
    };
  }

  // System actions (sensitive)
  if (text.match(/\b(shut down|shutdown|turn off)\s*(the\s+)?(computer|pc|system)\b/)) {
    return {
      engine: 'os',
      category: 'system',
      action: 'shutdown',
      params: { confirm: false },
      isSensitive: true,
      description: 'Shutdown system'
    };
  }

  if (text.match(/\b(restart|reboot)\s*(the\s+)?(computer|pc|system)\b/)) {
    return {
      engine: 'os',
      category: 'system',
      action: 'restart',
      params: { confirm: false },
      isSensitive: true,
      description: 'Restart system'
    };
  }

  if (text.match(/\b(sleep|put to sleep)\s*(the\s+)?(computer|pc|system)\b/)) {
    return {
      engine: 'os',
      category: 'system',
      action: 'sleep',
      params: { confirm: false },
      isSensitive: true,
      description: 'Put system to sleep'
    };
  }

  // Lock screen
  if (text.match(/\b(lock|lock screen)\s*(the\s+)?(screen|computer|pc)\b/)) {
    return {
      engine: 'os',
      category: 'system',
      action: 'lock_screen',
      params: {},
      isSensitive: false,
      description: 'Lock screen'
    };
  }

  // No action found
  return null;
}

/**
 * Map Gemini action to engine-specific action
 */
function mapActionToEngineAction(action, target, params) {
  const actionMap = {
    'open_app': 'open_app',
    'open_folder': 'open_folder',
    'screenshot': 'screenshot',
    'volume_change': params.amount > 0 ? 'volume_up' : 'volume_down',
    'volume_mute': 'volume_mute',
    'open_url': 'open_url',
    'play_youtube': 'search_google',
    'shutdown': 'shutdown',
    'restart': 'restart',
    'sleep': 'sleep',
    'system_info': 'system_info'
  };

  return actionMap[action] || action;
}

/**
 * Build params object for engine
 */
function buildParams(action, target, params) {
  switch (action) {
    case 'open_app':
      return { app: target || 'chrome' };
    
    case 'open_folder':
      return { folder: target || 'downloads' };
    
    case 'volume_change':
      return { amount: Math.abs(params.amount || 10) };
    
    case 'open_url':
      return { url: target || params.url || '' };
    
    case 'play_youtube':
      return { query: target || params.video || '' };
    
    case 'shutdown':
    case 'restart':
    case 'sleep':
      return { confirm: params.confirm || false };
    
    default:
      return params;
  }
}

