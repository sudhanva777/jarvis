import React, { useState, useEffect } from 'react'
import { useVoiceLoop } from '../hooks/useVoiceLoop'

const LeftWidgets = ({ 
  systemData,
  isActivated,
  isAiThinking,
  onAiCommand,
  onLog,
  onVoiceStateChange
}) => {
  const [aiError, setAiError] = useState(null)
  
  // Companion Mode state (stored in localStorage)
  const [companionMode, setCompanionMode] = useState(() => {
    const saved = localStorage.getItem('companion_mode')
    return saved ? JSON.parse(saved) : false
  })
  
  // Save companion mode to localStorage
  useEffect(() => {
    localStorage.setItem('companion_mode', JSON.stringify(companionMode))
    if (onLog) {
      onLog(`COMPANION MODE: ${companionMode ? 'ON' : 'OFF'}`)
    }
  }, [companionMode, onLog])

  // Wrap onAiCommand to handle errors
  const handleAiCommand = async (prompt) => {
    try {
      const result = await onAiCommand(prompt)
      setAiError(null)
      return result
    } catch (error) {
      setAiError(error.message)
      throw error
    }
  }

  // Add executeCommand method to handleAiCommand
  handleAiCommand.executeCommand = async (intent) => {
    const { executeCommand } = await import('../api/aiClient')
    return await executeCommand(intent)
  }

  const {
    isListening,
    isSpeaking,
    isVoiceModeActive,
    transcript,
    detectedEmotion,
    awaitingPermission,
    startVoiceMode,
    stopVoiceMode,
  } = useVoiceLoop(handleAiCommand, onLog, companionMode)

  // Auto-stop voice mode when AI goes offline
  useEffect(() => {
    if (!isActivated && isVoiceModeActive) {
      stopVoiceMode()
    }
  }, [isActivated, isVoiceModeActive, stopVoiceMode])

  // Notify parent of voice state changes
  useEffect(() => {
    if (onVoiceStateChange) {
      onVoiceStateChange({ isListening, isSpeaking })
    }
  }, [isListening, isSpeaking, onVoiceStateChange])

  return (
    <div className="left-panel-container">
      {/* TODO / Tasks Card */}
      <div className="holo-panel p-3 space-y-2">
        <div className="text-[0.65rem] uppercase tracking-wider text-cyan font-orbitron font-semibold neon-text">
          Tasks
        </div>
        <div className="space-y-1.5 text-xs text-hudSubtle">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan"></span>
            <span>Backup scheduled</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan"></span>
            <span>3 incoming emails</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-blueSubtle"></span>
            <span>System update pending</span>
          </div>
        </div>
      </div>

      {/* System Stats Card */}
      <div className="holo-panel p-3 space-y-2">
        <div className="text-[0.65rem] uppercase tracking-wider text-cyan font-orbitron font-semibold neon-text">
          System
        </div>
        <div className="space-y-1.5 text-xs">
          <div className="flex justify-between items-center">
            <span className="text-hudSubtle">Disk Usage:</span>
            <span className="text-cyan font-semibold">{(100 - systemData.memoryUsage).toFixed(0)}%</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-hudSubtle">Last Login:</span>
            <span className="text-hudText font-mono text-[0.7rem]">2h ago</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-hudSubtle">IP Address:</span>
            <span className="text-cyan font-mono text-[0.7rem]">192.168.1.100</span>
          </div>
        </div>
      </div>

      {/* Memory / Trash Card */}
      <div className="holo-panel p-3 space-y-2">
        <div className="text-[0.65rem] uppercase tracking-wider text-cyan font-orbitron font-semibold neon-text">
          Storage
        </div>
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-xs">
            <span className="text-hudSubtle">Memory:</span>
            <span className="text-cyan font-semibold">{systemData.memoryUsage.toFixed(1)}%</span>
          </div>
          <div className="h-1.5 bg-hudBg rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan to-blueAccent transition-all duration-500"
              style={{ width: `${systemData.memoryUsage}%` }}
            ></div>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-hudSubtle">Trash:</span>
            <span className="text-hudText">4 items</span>
          </div>
        </div>
      </div>

      {/* Companion Mode Toggle */}
      <div className="holo-panel p-3 space-y-2">
        <div className="text-[0.65rem] uppercase tracking-wider text-cyan font-orbitron font-semibold neon-text">
          Companion Mode
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-hudSubtle">
            {companionMode 
              ? 'Emotional support & continuous conversation active' 
              : 'Standard assistant mode'}
          </span>
          <button
            onClick={() => setCompanionMode(!companionMode)}
            disabled={!isActivated}
            className={`px-3 py-1.5 rounded-md text-[0.75rem] font-semibold transition-all ${
              !isActivated
                ? 'bg-hudBgAlt/50 border border-cyan/20 text-hudSubtle cursor-not-allowed'
                : companionMode
                ? 'bg-gradient-to-r from-pink-500/20 to-purple-500/20 border border-pink-400/50 text-pink-300 shadow-[0_0_8px_rgba(255,192,203,0.3)]'
                : 'bg-hudBgAlt/70 border border-cyan/40 text-cyan hover:bg-cyan/10'
            }`}
          >
            {companionMode ? '💖 ON' : 'OFF'}
          </button>
        </div>
        {companionMode && detectedEmotion && (
          <div className="text-[0.7rem] text-pink-300/80 mt-1">
            Emotion: {detectedEmotion.toUpperCase()}
          </div>
        )}
      </div>

      {/* Voice Mode Console */}
      <div className="holo-panel p-3 space-y-2">
        <header className="flex items-center justify-between text-[0.7rem] tracking-[0.2em] uppercase">
          <span className="text-cyan neon-text">Voice Mode</span>
          <span className="text-hudSubtle">SUDHANVA</span>
        </header>

        {/* Voice Status Display */}
        {isVoiceModeActive && (
          <div className="text-xs text-cyan/80 font-mono py-2 px-2 bg-black/40 rounded border border-cyan/20">
            {awaitingPermission && (
              <div className="text-yellow-400 animate-pulse mb-2">
                ⚠️ Awaiting permission: {awaitingPermission.description}
                <div className="text-[0.65rem] text-yellow-300 mt-1">Say "yes" or "no"</div>
              </div>
            )}
            {isListening && !awaitingPermission && <div className="animate-pulse">🎤 Listening...</div>}
            {isSpeaking && <div>🔊 Speaking...</div>}
            {isAiThinking && <div>⚙️ Processing...</div>}
            {transcript && !isListening && !isSpeaking && !awaitingPermission && (
              <div className="text-hudSubtle text-[0.7rem] mt-1">Last: {transcript}</div>
            )}
          </div>
        )}

        {aiError && (
          <div className="text-[0.7rem] text-hudError">{aiError}</div>
        )}

        {/* Voice Mode Toggle Button */}
        <button
          onClick={isVoiceModeActive ? stopVoiceMode : startVoiceMode}
          disabled={!isActivated}
          className={`w-full text-[0.8rem] font-semibold uppercase tracking-[0.15em] px-3 py-2 rounded-md transition-all ${
            !isActivated
              ? 'bg-hudBgAlt/50 border border-cyan/20 text-hudSubtle cursor-not-allowed'
              : isVoiceModeActive
              ? 'bg-gradient-to-r from-cyan to-blueAccent text-black shadow-cyan-glow hover:shadow-[0_0_18px_rgba(0,229,255,0.9)] animate-pulse'
              : 'bg-hudBgAlt/70 border border-cyan/40 text-cyan hover:bg-cyan/10 hover:border-cyan hover:shadow-cyan-soft'
          }`}
        >
          {isVoiceModeActive ? '🎤 VOICE MODE: ON' : '🎤 VOICE MODE: OFF'}
        </button>

        {!isActivated && (
          <div className="text-[0.65rem] text-hudSubtle text-center">
            Activate AI to enable voice mode
          </div>
        )}
      </div>
    </div>
  )
}

export default LeftWidgets

