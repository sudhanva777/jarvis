import React, { useState, useEffect } from 'react'
import BrainSettings from './BrainSettings'
import BrainInspector from './BrainInspector'

const RightPanel = ({ 
  isActivated, 
  isAiThinking, 
  onAiCommand, 
  onLog,
  systemData
}) => {
  const [lastAiResponse, setLastAiResponse] = useState('')
  const [aiError, setAiError] = useState(null)
  const [lastIntent, setLastIntent] = useState(null)
  const [lastTopics, setLastTopics] = useState([])
  const [lastMood, setLastMood] = useState('neutral')
  const [personalModelPrediction, setPersonalModelPrediction] = useState(null)
  const [anythingMode, setAnythingMode] = useState(false)
  const [pendingPermission, setPendingPermission] = useState(null)

  // Load Anything Mode state
  useEffect(() => {
    const loadAnythingMode = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/system/anything-mode');
        const result = await response.json();
        if (result.success) {
          setAnythingMode(result.anythingMode);
        }
      } catch (error) {
        console.error('Failed to load Anything Mode:', error);
      }
    };
    loadAnythingMode();
  }, []);

  // Poll for pending permissions
  useEffect(() => {
    if (!anythingMode) return;

    const pollPermissions = setInterval(async () => {
      try {
        const response = await fetch('http://localhost:3000/api/permissions/pending');
        const result = await response.json();
        if (result.success && result.pending && result.pending.length > 0) {
          setPendingPermission(result.pending[0]);
        } else {
          setPendingPermission(null);
        }
      } catch (error) {
        // Silently fail
      }
    }, 1000);

    return () => clearInterval(pollPermissions);
  }, [anythingMode]);
  
  // Wrap onAiCommand to capture response and handle intents
  const handleAiCommand = async (prompt) => {
    try {
      // Get personal model prediction (optional, non-blocking)
      try {
        const { getPersonalModelPrediction } = await import('../api/aiClient')
        const prediction = await getPersonalModelPrediction(prompt)
        if (prediction) {
          setPersonalModelPrediction(prediction)
        }
      } catch (e) {
        // Silently fail - personal model is optional
      }

      const result = await onAiCommand(prompt)
      
      // Handle new format: { reply, intent }
      const reply = result.reply || result
      const intent = result.intent || null
      
      setLastAiResponse(reply)
      setLastIntent(intent)
      setAiError(null)
      
      // Store for feedback (topics and mood will be detected on backend)
      // We'll extract them from the response if available
      
      // Return both reply and intent
      return { reply, intent }
    } catch (error) {
      setAiError(error.message)
      throw error
    }
  }
  
  // Handle feedback submission
  const handleFeedback = async (rating) => {
    try {
      const { sendFeedback } = await import('../api/aiClient')
      const result = await sendFeedback(rating, lastIntent, lastTopics, lastMood)
      
      if (result.success) {
        if (onLog) {
          onLog(`FEEDBACK RECEIVED: ${rating} for topics (${lastTopics.join(", ")})`)
        }
      } else {
        if (onLog) {
          onLog(`FEEDBACK ERROR: ${result.message}`)
        }
      }
    } catch (error) {
      console.error('Feedback error:', error)
      if (onLog) {
        onLog(`FEEDBACK ERROR: ${error.message}`)
      }
    }
  }
  
  // Add executeCommand method to handleAiCommand
  handleAiCommand.executeCommand = async (intent) => {
    const { executeCommand } = await import('../api/aiClient')
    return await executeCommand(intent)
  }

  const getStatusText = () => {
    if (isAiThinking) return 'PROCESSING'
    if (isActivated) return 'ONLINE'
    return 'IDLE'
  }

  return (
    <div className="right-panel-container">
      {/* AI System Info */}
      <div className="holo-panel p-3 space-y-2">
        <div className="text-[0.65rem] uppercase tracking-wider text-cyan font-orbitron font-semibold neon-text">
          SUDHANVA AI SYSTEM
        </div>
        <div className="space-y-1.5 text-xs">
          <div className="flex justify-between items-center">
            <span className="text-hudSubtle">Mode:</span>
            <span className={`font-semibold ${isActivated ? 'text-cyan' : 'text-hudSubtle'}`}>
              {getStatusText()}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-hudSubtle">OS Version:</span>
            <span className="text-hudText font-mono text-[0.7rem]">v2.0.1</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-hudSubtle">Core Version:</span>
            <span className="text-cyan font-mono text-[0.7rem]">Gemini 2.0</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-hudSubtle">Location:</span>
            <span className="text-hudText text-[0.7rem]">Local Network</span>
          </div>
        </div>
      </div>

      {/* Personal Model Predictions (if available) */}
      {personalModelPrediction && (
        <div className="holo-panel p-3 space-y-2">
          <div className="text-[0.65rem] uppercase tracking-wider text-purple-300 font-orbitron font-semibold neon-text">
            🧠 Personal Brain
          </div>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-hudSubtle">Emotion:</span>
              <span className="text-purple-300 font-semibold">{personalModelPrediction.emotion?.toUpperCase()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-hudSubtle">Action Hint:</span>
              <span className="text-purple-300">{personalModelPrediction.command_hint?.replace('_', ' ')}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-hudSubtle">Tone:</span>
              <span className="text-purple-300">{personalModelPrediction.tone_pref?.replace('_', ' ')}</span>
            </div>
          </div>
        </div>
      )}

      {/* Current Task / Status */}
      <div className="holo-panel p-3 space-y-2">
        <div className="text-[0.65rem] uppercase tracking-wider text-cyan font-orbitron font-semibold neon-text">
          Current Status
        </div>
        <div className="text-xs text-hudText leading-relaxed min-h-[60px]">
          {lastAiResponse ? (
            <div className="space-y-1">
              <div className="text-hudSubtle text-[0.7rem] mb-1">Last Response:</div>
              <div className="text-hudText">{lastAiResponse.substring(0, 200)}{lastAiResponse.length > 200 ? '...' : ''}</div>
              
              {/* Feedback Buttons */}
              <div className="flex items-center gap-2 mt-2 pt-2 border-t border-cyan/20">
                <button
                  onClick={() => handleFeedback('positive')}
                  disabled={!isActivated}
                  className="flex-1 flex items-center justify-center gap-1 px-2 py-1 text-[0.7rem] rounded-md border border-green-500/40 bg-green-500/10 text-green-300 hover:bg-green-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Good response"
                >
                  <span>👍</span>
                  <span>Good</span>
                </button>
                <button
                  onClick={() => handleFeedback('negative')}
                  disabled={!isActivated}
                  className="flex-1 flex items-center justify-center gap-1 px-2 py-1 text-[0.7rem] rounded-md border border-red-500/40 bg-red-500/10 text-red-300 hover:bg-red-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Bad response"
                >
                  <span>👎</span>
                  <span>Bad</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="text-hudSubtle">
              System idle. Activate voice mode to begin.
            </div>
          )}
        </div>
      </div>

      {/* Network / WiFi Block */}
      <div className="holo-panel p-3 space-y-2">
        <div className="text-[0.65rem] uppercase tracking-wider text-cyan font-orbitron font-semibold neon-text">
          Network
        </div>
        <div className="space-y-1.5 text-xs">
          <div className="flex justify-between items-center">
            <span className="text-hudSubtle">WiFi SSID:</span>
            <span className="text-cyan font-semibold">SUDHANVA-NET</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-hudSubtle">IP Address:</span>
            <span className="text-hudText font-mono text-[0.7rem]">192.168.1.100</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-hudSubtle">Upload:</span>
            <span className="text-hudText">45 Mbps</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-hudSubtle">Download:</span>
            <span className="text-cyan font-semibold">125 Mbps</span>
          </div>
        </div>
      </div>

      {/* Music / Now Playing */}
      <div className="holo-panel p-3 space-y-2">
        <div className="text-[0.65rem] uppercase tracking-wider text-cyan font-orbitron font-semibold neon-text">
          Now Playing
        </div>
        <div className="flex items-center gap-2 text-xs text-hudSubtle">
          <div className="w-8 h-8 border border-cyan/40 rounded flex items-center justify-center">
            <span className="text-cyan">♪</span>
          </div>
          <span>No track playing</span>
        </div>
      </div>

      {/* Brain Settings */}
      <BrainSettings 
        onSettingsChange={(settings) => {
          // Note: Companion mode is now managed in LeftWidgets
          // This is kept for brain settings integration
        }}
        onLog={onLog}
      />

      {/* Brain Inspector */}
      <BrainInspector onLog={onLog} />

      {/* Anything Mode Toggle */}
      <div className="holo-panel p-3 space-y-2">
        <div className="text-[0.65rem] uppercase tracking-wider text-cyan font-orbitron font-semibold neon-text">
          Anything Mode (Safe)
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-hudSubtle">
            {anythingMode 
              ? 'OS + Web automation enabled (always requires permission)' 
              : 'Automation disabled - enable to allow system actions'}
          </span>
          <button
            onClick={async () => {
              const newState = !anythingMode;
              try {
                const response = await fetch('http://localhost:3000/api/system/anything-mode', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ enabled: newState })
                });
                const result = await response.json();
                if (result.success) {
                  setAnythingMode(newState);
                  if (onLog) {
                    onLog(`[ANYTHING MODE] ${newState ? 'Enabled' : 'Disabled'}`);
                  }
                }
              } catch (error) {
                console.error('Failed to toggle Anything Mode:', error);
              }
            }}
            disabled={!isActivated}
            className={`px-3 py-1.5 rounded-md text-[0.75rem] font-semibold transition-all ${
              !isActivated
                ? 'bg-hudBgAlt/50 border border-cyan/20 text-hudSubtle cursor-not-allowed'
                : anythingMode
                ? 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-400/50 text-green-300 shadow-[0_0_8px_rgba(34,197,94,0.3)]'
                : 'bg-hudBgAlt/70 border border-cyan/40 text-cyan hover:bg-cyan/10'
            }`}
          >
            {anythingMode ? '✅ ON' : 'OFF'}
          </button>
        </div>
      </div>

      {/* Permission Request Display */}
      {pendingPermission && (
        <div className="holo-panel p-3 space-y-2 border-2 border-yellow-400/50">
          <div className="text-[0.65rem] uppercase tracking-wider text-yellow-400 font-orbitron font-semibold">
            ⚠️ Permission Required
          </div>
          <div className="text-xs text-hudText">
            {pendingPermission.description}
          </div>
          {pendingPermission.isSensitive && (
            <div className="text-[0.7rem] text-red-400">
              ⚠️ This action may affect your system
            </div>
          )}
          <div className="flex gap-2">
            <button
              onClick={async () => {
                try {
                  const response = await fetch('http://localhost:3000/api/permissions/approve', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ permissionId: pendingPermission.id })
                  });
                  if (response.ok) {
                    setPendingPermission(null);
                    if (onLog) {
                      onLog(`[PERMISSION] Approved: ${pendingPermission.description}`);
                    }
                  }
                } catch (error) {
                  console.error('Failed to approve permission:', error);
                }
              }}
              className="flex-1 px-3 py-2 rounded-md bg-green-500/20 border border-green-400/50 text-green-300 hover:bg-green-500/30 transition-all"
            >
              ✅ YES
            </button>
            <button
              onClick={async () => {
                try {
                  const response = await fetch('http://localhost:3000/api/permissions/deny', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ permissionId: pendingPermission.id })
                  });
                  if (response.ok) {
                    setPendingPermission(null);
                    if (onLog) {
                      onLog(`[PERMISSION] Denied: ${pendingPermission.description}`);
                    }
                  }
                } catch (error) {
                  console.error('Failed to deny permission:', error);
                }
              }}
              className="flex-1 px-3 py-2 rounded-md bg-red-500/20 border border-red-400/50 text-red-300 hover:bg-red-500/30 transition-all"
            >
              ❌ NO
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default RightPanel
