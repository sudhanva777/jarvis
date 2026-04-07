import React, { useState, useEffect } from 'react'
import '../styles/brain.css'
import '../styles/hologram.css'

const BrainInspector = ({ onLog }) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [brainData, setBrainData] = useState(null)
  const [personalModelPred, setPersonalModelPred] = useState(null)

  const fetchBrainData = async () => {
    try {
      const { getMemorySummary } = await import('../api/aiClient')
      const summary = await getMemorySummary()
      setBrainData(summary)
    } catch (error) {
      console.error('Failed to fetch brain data:', error)
    }
  }

  const fetchPersonalModelPred = async () => {
    try {
      const { getPersonalModelPrediction } = await import('../api/aiClient')
      // Use last user message if available, or empty string
      const prediction = await getPersonalModelPrediction('')
      setPersonalModelPred(prediction)
    } catch (error) {
      // Silently fail - personal model is optional
    }
  }

  useEffect(() => {
    if (isExpanded) {
      fetchBrainData()
      fetchPersonalModelPred()
      // Refresh every 5 seconds when expanded
      const interval = setInterval(() => {
        fetchBrainData()
        fetchPersonalModelPred()
      }, 5000)
      return () => clearInterval(interval)
    }
  }, [isExpanded])

  return (
    <div className="brain-settings-panel holo-panel p-3">
      <div 
        className="brain-header"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">🔍</span>
          <span className="text-[0.65rem] uppercase tracking-wider text-purple-300 font-orbitron font-semibold">
            BRAIN INSPECTOR
          </span>
        </div>
        <span className="text-purple-300 text-xs">
          {isExpanded ? '▼' : '▶'}
        </span>
      </div>

      {isExpanded && (
        <div className="brain-content">
          {brainData ? (
            <div className="space-y-2">
              {/* Current Mood */}
              <div className="brain-inspector-item">
                <div className="brain-inspector-label">Current Detected Mood</div>
                <div className="brain-inspector-value">
                  {brainData.mood?.toUpperCase() || 'NEUTRAL'}
                </div>
              </div>

              {/* Current Topics */}
              <div className="brain-inspector-item">
                <div className="brain-inspector-label">Current Detected Topics</div>
                <div className="brain-inspector-list">
                  {brainData.topics && brainData.topics.length > 0 ? (
                    brainData.topics.map((topic, idx) => (
                      <div key={idx} className="brain-inspector-list-item">
                        • {topic}
                      </div>
                    ))
                  ) : (
                    <div className="brain-inspector-list-item">None</div>
                  )}
                </div>
              </div>

              {/* Last 5 Conversations */}
              <div className="brain-inspector-item">
                <div className="brain-inspector-label">Last 5 Conversation Memories</div>
                <div className="brain-inspector-list">
                  {brainData.recentConversations && brainData.recentConversations.length > 0 ? (
                    brainData.recentConversations.slice(0, 5).map((conv, idx) => (
                      <div key={idx} className="brain-inspector-list-item text-[0.65rem]">
                        {conv.user?.substring(0, 40)}... → {conv.ai?.substring(0, 30)}...
                      </div>
                    ))
                  ) : (
                    <div className="brain-inspector-list-item">No conversations yet</div>
                  )}
                </div>
              </div>

              {/* Most Used Commands */}
              <div className="brain-inspector-item">
                <div className="brain-inspector-label">Most Used Commands</div>
                <div className="brain-inspector-list">
                  {brainData.mostUsedCommands && brainData.mostUsedCommands.length > 0 ? (
                    brainData.mostUsedCommands.map(([cmd, count], idx) => (
                      <div key={idx} className="brain-inspector-list-item">
                        {cmd.replace(':', ' ')} ({count}x)
                      </div>
                    ))
                  ) : (
                    <div className="brain-inspector-list-item">No commands yet</div>
                  )}
                </div>
              </div>

              {/* Feedback Stats */}
              <div className="brain-inspector-item">
                <div className="brain-inspector-label">Feedback Stats</div>
                <div className="brain-inspector-list">
                  <div className="brain-inspector-list-item">
                    👍 Positive: {brainData.feedback?.positive || 0}
                  </div>
                  <div className="brain-inspector-list-item">
                    👎 Negative: {brainData.feedback?.negative || 0}
                  </div>
                </div>
              </div>

              {/* Personal Model Predictions */}
              {personalModelPred && (
                <div className="brain-inspector-item">
                  <div className="brain-inspector-label">Personal Model Predictions</div>
                  <div className="brain-inspector-list">
                    <div className="brain-inspector-list-item">
                      Emotion: <span className="text-purple-300">{personalModelPred.emotion?.toUpperCase()}</span>
                    </div>
                    <div className="brain-inspector-list-item">
                      Command: <span className="text-purple-300">{personalModelPred.command_hint?.replace('_', ' ')}</span>
                    </div>
                    <div className="brain-inspector-list-item">
                      Tone: <span className="text-purple-300">{personalModelPred.tone_pref?.replace('_', ' ')}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-hudSubtle text-xs text-center py-4">
              Loading brain data...
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default BrainInspector

