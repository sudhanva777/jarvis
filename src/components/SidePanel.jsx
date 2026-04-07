import React, { useState, useEffect } from 'react'
import { useVoiceInput } from '../hooks/useVoiceInput'

const SidePanel = ({ 
  position, 
  title, 
  type, 
  data, 
  isActivated, 
  demoMode, 
  visualizationModes,
  isAiThinking,
  onActivate, 
  onDemoMode,
  onVisualizationMode,
  onAiCommand,
  onLog
}) => {
  const isLeft = position === 'left'
  const [aiPrompt, setAiPrompt] = useState('')
  const [lastAiResponse, setLastAiResponse] = useState('')
  const [aiError, setAiError] = useState(null)
  const { isSupported: voiceSupported, isListening, transcript, startListening, stopListening, resetTranscript } = useVoiceInput()

  // Auto-fill prompt from voice transcript
  useEffect(() => {
    if (transcript && !isListening) {
      setAiPrompt(transcript)
      resetTranscript()
    }
  }, [transcript, isListening, resetTranscript])

  // Handle voice start/stop logging
  useEffect(() => {
    if (isListening && onLog) {
      onLog('VOICE INPUT STARTED')
    } else if (!isListening && transcript && onLog) {
      onLog('VOICE INPUT CAPTURED')
    }
  }, [isListening, transcript, onLog])

  const handleSendAiCommand = async () => {
    if (!aiPrompt.trim() || isAiThinking || !onAiCommand) return

    setAiError(null)
    try {
      const response = await onAiCommand(aiPrompt)
      setLastAiResponse(response)
      setAiPrompt('') // Clear input after sending
    } catch (error) {
      setAiError(error.message)
      // Error already logged by onAiCommand
    }
  }

  const handleVoiceToggle = () => {
    if (isListening) {
      stopListening()
    } else {
      resetTranscript()
      startListening()
    }
  }

  // Progress bar component
  const ProgressBar = ({ value, max = 100, label, unit = '%' }) => {
    const percentage = Math.min(100, Math.max(0, (value / max) * 100))
    const isHigh = percentage > 75
    const isMedium = percentage > 50
    
    return (
      <div className="space-y-1">
        <div className="flex justify-between items-center text-xs">
          <span className="text-hudSubtle font-medium">{label}:</span>
          <span
            className={`font-semibold ${
              isHigh ? 'text-hudError' : isMedium ? 'text-neonPink' : 'text-neonBlue'
            }`}
            style={{
              textShadow: isHigh
                ? '0 0 8px rgba(255, 92, 92, 0.8)'
                : isMedium
                ? '0 0 8px rgba(255, 75, 218, 0.6)'
                : '0 0 8px rgba(51, 214, 255, 0.6)',
            }}
          >
            {value.toFixed(1)}{unit}
          </span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-hudBgAlt/70 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-neonPurple via-neonPink to-neonBlue transition-all duration-500 rounded-full"
            style={{
              width: `${percentage}%`,
              boxShadow: '0 0 18px rgba(255, 75, 218, 0.8)',
            }}
          />
        </div>
      </div>
    )
  }

  // Mini gauge component
  const MiniGauge = ({ value, max = 100, label, unit = '' }) => {
    const percentage = Math.min(100, Math.max(0, (value / max) * 100))
    const angle = (percentage / 100) * 180 - 90 // -90 to 90 degrees
    const isHigh = percentage > 75
    const gaugeColor = isHigh ? '#FF4BDA' : '#33D6FF'
    
    return (
      <div className="space-y-1">
        <div className="flex justify-between items-center text-xs">
          <span className="text-hudSubtle font-medium">{label}:</span>
          <span
            className="font-semibold text-neonBlue"
            style={{ textShadow: '0 0 8px rgba(51, 214, 255, 0.6)' }}
          >
            {value}{unit}
          </span>
        </div>
        <div className="relative h-8 flex items-center justify-center">
          <svg width="60" height="30" className="overflow-visible">
            <path
              d="M 10 25 A 20 20 0 0 1 50 25"
              fill="none"
              stroke="rgba(255, 255, 255, 0.07)"
              strokeWidth="3"
            />
            <path
              d={`M 10 25 A 20 20 0 ${angle > 0 ? '1' : '0'} 1 ${50 + Math.cos((angle * Math.PI) / 180) * 20} ${25 - Math.sin((angle * Math.PI) / 180) * 20}`}
              fill="none"
              stroke={gaugeColor}
              strokeWidth="3"
              strokeLinecap="round"
              style={{
                filter: `drop-shadow(0 0 4px ${gaugeColor}80)`,
                transition: 'all 0.5s ease',
              }}
            />
          </svg>
        </div>
      </div>
    )
  }

  const statusMetrics = [
    { 
      type: 'progress', 
      label: 'CPU USAGE', 
      value: data?.cpuUsage || 45.2, 
      max: 100, 
      unit: '%' 
    },
    { 
      type: 'progress', 
      label: 'MEMORY', 
      value: data?.memoryUsage || 67.8, 
      max: 100, 
      unit: '%' 
    },
    { 
      type: 'progress', 
      label: 'GPU LOAD', 
      value: data?.gpuLoad || 32.1, 
      max: 100, 
      unit: '%' 
    },
    { 
      type: 'gauge', 
      label: 'NETWORK', 
      value: data?.networkLatency || 12, 
      max: 50, 
      unit: 'ms' 
    },
    { 
      type: 'gauge', 
      label: 'TEMPERATURE', 
      value: data?.temperature || 42, 
      max: 100, 
      unit: '°C' 
    },
    { 
      type: 'text', 
      label: 'UPTIME', 
      value: data?.uptime || '2d 14h 32m' 
    },
  ]

  return (
    <div
      className={`fixed top-1/2 -translate-y-1/2 w-[300px] p-5 rounded-3xl bg-hudBgAlt/80 border border-neonPurple/50 backdrop-blur-md z-10 transition-all duration-500 ${
        isLeft ? 'left-8' : 'right-8'
      }`}
      style={{
        boxShadow: isActivated
          ? '0 0 30px rgba(196, 60, 255, 0.35), inset 0 0 30px rgba(196, 60, 255, 0.1)'
          : '0 0 20px rgba(196, 60, 255, 0.2), inset 0 0 20px rgba(196, 60, 255, 0.05)',
        animation: 'pulseGlow 3s ease-in-out infinite',
      }}
    >
      <div className="font-orbitron text-sm font-bold text-neonBlue text-center pb-4 border-b border-neonPurple/30 mb-4 tracking-wider">
        {title}
      </div>

      <div className="flex flex-col gap-4">
        {type === 'status' ? (
          statusMetrics.map((metric, index) => (
            <div key={index}>
              {metric.type === 'progress' && (
                <ProgressBar
                  value={metric.value}
                  max={metric.max}
                  label={metric.label}
                  unit={metric.unit}
                />
              )}
              {metric.type === 'gauge' && (
                <MiniGauge
                  value={metric.value}
                  max={metric.max}
                  label={metric.label}
                  unit={metric.unit}
                />
              )}
              {metric.type === 'text' && (
                <div className="flex justify-between items-center py-2 text-xs font-rajdhani">
                  <span className="text-hudSubtle font-medium">{metric.label}:</span>
                  <span
                    className="font-semibold text-neonBlue font-mono"
                    style={{ textShadow: '0 0 8px rgba(51, 214, 255, 0.6)' }}
                  >
                    {metric.value}
                  </span>
                </div>
              )}
            </div>
          ))
        ) : (
          <>
            <div className="flex flex-col gap-3">
              <button
                onClick={onActivate}
                className={`w-full py-3 rounded-xl font-semibold tracking-widest uppercase text-sm transition-all duration-200 ${
                  isActivated
                    ? 'bg-gradient-to-r from-neonPurple to-neonBlue shadow-[0_0_25px_rgba(196,60,255,0.8)] text-white'
                    : 'bg-hudBgAlt/70 border border-neonPurple/40 text-hudSubtle hover:border-neonBlue hover:text-neonBlue'
                } hover:scale-[1.02] active:scale-100`}
              >
                {isActivated ? 'AI ONLINE' : 'AI OFFLINE'}
              </button>

              <button
                onClick={onDemoMode}
                className={`w-full py-3 rounded-xl font-semibold tracking-widest uppercase text-sm transition-all duration-200 ${
                  demoMode
                    ? 'bg-gradient-to-r from-neonPurple to-neonBlue shadow-[0_0_25px_rgba(196,60,255,0.8)] text-white'
                    : 'bg-hudBgAlt/70 border border-neonPurple/40 text-hudSubtle hover:border-neonBlue hover:text-neonBlue'
                } hover:scale-[1.02] active:scale-100`}
              >
                {demoMode ? 'STOP DEMO' : 'DEMO MODE'}
              </button>

              <div className="pt-2 border-t border-neonPurple/20">
                <div className="text-xs font-orbitron text-neonBlue mb-2 tracking-wider">
                  VISUALIZATION
                </div>
                <div className="space-y-2">
                  {['rings', 'particles', 'diagnostics'].map((mode) => {
                    const isOn = visualizationModes[mode]
                    return (
                      <div key={mode} className="flex items-center justify-between text-xs uppercase tracking-[0.15em]">
                        <span className="text-hudSubtle">
                          {mode === 'rings' ? 'RINGS' : mode === 'particles' ? 'PARTICLES' : 'DIAGNOSTICS'}
                        </span>
                        <button
                          onClick={() => onVisualizationMode(mode)}
                          className={`px-3 py-1 rounded-full border text-[0.7rem] transition-all ${
                            isOn
                              ? 'border-neonBlue bg-neonBlue/20 text-neonBlue shadow-[0_0_14px_rgba(51,214,255,0.7)]'
                              : 'border-hudSubtle/40 text-hudSubtle hover:border-neonPurple hover:text-neonPurple'
                          }`}
                        >
                          {isOn ? 'ON' : 'OFF'}
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="pt-2 border-t border-neonPurple/20">
                <div className="flex justify-between items-center py-2 text-xs font-rajdhani">
                  <span className="text-hudSubtle font-medium">AUTO SCAN:</span>
                  <span
                    className="font-semibold text-neonBlue cursor-pointer transition-colors hover:text-neonPurple"
                    style={{ textShadow: '0 0 10px rgba(51, 214, 255, 0.8)' }}
                  >
                    ON
                  </span>
                </div>

                <div className="flex justify-between items-center py-2 text-xs font-rajdhani">
                  <span className="text-hudSubtle font-medium">ENHANCED:</span>
                  <span
                    className={`font-semibold cursor-pointer transition-colors hover:text-neonPurple ${
                      isActivated ? 'text-neonBlue' : 'text-hudSubtle/50'
                    }`}
                    style={{
                      textShadow: isActivated
                        ? '0 0 10px rgba(51, 214, 255, 0.8)'
                        : 'none',
                    }}
                  >
                    {isActivated ? 'ON' : 'OFF'}
                  </span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default SidePanel
