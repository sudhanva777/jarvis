import React, { useState, useEffect } from 'react'
import '../styles/brain.css'
import '../styles/hologram.css'

const BrainSettings = ({ onSettingsChange, onLog }) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('brain_settings')
    return saved ? JSON.parse(saved) : {
      enablePersonalLearning: true,
      enableMemory: true,
      saveConversationHistory: true,
      useCompanionModeTone: false,
      usePersonalModel: true,
      autoTrainAfterInteraction: true
    }
  })

  useEffect(() => {
    localStorage.setItem('brain_settings', JSON.stringify(settings))
    if (onSettingsChange) {
      onSettingsChange(settings)
    }
  }, [settings, onSettingsChange])

  const toggleSetting = (key) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

  const handleClearMemory = async () => {
    if (!window.confirm('Are you sure you want to clear all memory? This cannot be undone.')) {
      return
    }

    try {
      const { clearMemory } = await import('../api/aiClient')
      const result = await clearMemory()
      if (result.success) {
        if (onLog) onLog('MEMORY CLEARED: All memory data has been reset')
        alert('Memory cleared successfully')
      } else {
        alert(`Failed to clear memory: ${result.message}`)
      }
    } catch (error) {
      console.error('Clear memory error:', error)
      alert('Failed to clear memory')
    }
  }

  const handleResetBrain = () => {
    if (!window.confirm('Are you sure you want to reset all brain settings? This will restore defaults.')) {
      return
    }

    const defaults = {
      enablePersonalLearning: true,
      enableMemory: true,
      saveConversationHistory: true,
      useCompanionModeTone: false,
      usePersonalModel: true,
      autoTrainAfterInteraction: true
    }
    setSettings(defaults)
    if (onLog) onLog('BRAIN RESET: All settings restored to defaults')
  }

  const handleExportBrainData = async () => {
    try {
      const { getMemorySummary } = await import('../api/aiClient')
      const summary = await getMemorySummary()
      
      if (summary) {
        const dataStr = JSON.stringify(summary, null, 2)
        const dataBlob = new Blob([dataStr], { type: 'application/json' })
        const url = URL.createObjectURL(dataBlob)
        const link = document.createElement('a')
        link.href = url
        link.download = `sudhanva-brain-${new Date().toISOString().split('T')[0]}.json`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
        if (onLog) onLog('BRAIN DATA EXPORTED: Memory data downloaded')
      } else {
        alert('No brain data available to export')
      }
    } catch (error) {
      console.error('Export error:', error)
      alert('Failed to export brain data')
    }
  }

  return (
    <div className="brain-settings-panel holo-panel">
      <div 
        className="brain-header"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">🧠</span>
          <span className="text-[0.65rem] uppercase tracking-wider text-purple-300 font-orbitron font-semibold neon-text">
            BRAIN SETTINGS
          </span>
          {settings.usePersonalModel && (
            <span className="brain-badge active">ACTIVE</span>
          )}
          {!settings.usePersonalModel && (
            <span className="brain-badge offline">OFFLINE</span>
          )}
        </div>
        <span className="text-purple-300 text-xs">
          {isExpanded ? '▼' : '▶'}
        </span>
      </div>

      {isExpanded && (
        <div className="brain-content">
          <div className="space-y-1">
            <div className="brain-toggle">
              <span className="brain-toggle-label">Enable Personal Learning</span>
              <div
                className={`brain-toggle-switch ${settings.enablePersonalLearning ? 'active' : ''}`}
                onClick={() => toggleSetting('enablePersonalLearning')}
              />
            </div>

            <div className="brain-toggle">
              <span className="brain-toggle-label">Enable Memory</span>
              <div
                className={`brain-toggle-switch ${settings.enableMemory ? 'active' : ''}`}
                onClick={() => toggleSetting('enableMemory')}
              />
            </div>

            <div className="brain-toggle">
              <span className="brain-toggle-label">Save Conversation History</span>
              <div
                className={`brain-toggle-switch ${settings.saveConversationHistory ? 'active' : ''}`}
                onClick={() => toggleSetting('saveConversationHistory')}
              />
            </div>

            <div className="brain-toggle">
              <span className="brain-toggle-label">Use Companion Mode Tone</span>
              <div
                className={`brain-toggle-switch ${settings.useCompanionModeTone ? 'active' : ''}`}
                onClick={() => toggleSetting('useCompanionModeTone')}
              />
            </div>

            <div className="brain-toggle">
              <span className="brain-toggle-label">Use Personal Model (TinyTransformer)</span>
              <div
                className={`brain-toggle-switch ${settings.usePersonalModel ? 'active' : ''}`}
                onClick={() => toggleSetting('usePersonalModel')}
              />
            </div>

            <div className="brain-toggle">
              <span className="brain-toggle-label">Auto-Train After Every Interaction</span>
              <div
                className={`brain-toggle-switch ${settings.autoTrainAfterInteraction ? 'active' : ''}`}
                onClick={() => toggleSetting('autoTrainAfterInteraction')}
              />
            </div>
          </div>

          <div className="mt-3 space-y-2">
            <button
              className="brain-button"
              onClick={handleClearMemory}
            >
              Clear Memory
            </button>
            <button
              className="brain-button"
              onClick={handleResetBrain}
            >
              Reset Brain
            </button>
            <button
              className="brain-button"
              onClick={handleExportBrainData}
            >
              Export Brain Data (JSON)
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default BrainSettings

