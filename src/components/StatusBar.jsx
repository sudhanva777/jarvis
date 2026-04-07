import React, { useState, useEffect, useRef } from 'react'

const StatusBar = ({ demoMode, isActivated, visualizationModes, customLogs = [] }) => {
  const [logs, setLogs] = useState([
    { time: getCurrentTime(), message: 'System initialized. HUD interface ready.' },
  ])
  const logContainerRef = useRef(null)
  const prevModesRef = useRef(visualizationModes)

  function getCurrentTime() {
    const now = new Date()
    return now.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }

  useEffect(() => {
    if (isActivated) {
      const newLog = {
        time: getCurrentTime(),
        message: 'SUDHANVA CORE ONLINE',
      }
      setLogs(prev => {
        const updated = [...prev, newLog]
        return updated.slice(-15)
      })
    } else {
      const newLog = {
        time: getCurrentTime(),
        message: 'SUDHANVA CORE OFFLINE',
      }
      setLogs(prev => {
        const updated = [...prev, newLog]
        return updated.slice(-15)
      })
    }
  }, [isActivated])

  // Log visualization mode changes
  useEffect(() => {
    if (visualizationModes && prevModesRef.current) {
      if (visualizationModes.particles && !prevModesRef.current.particles) {
        setLogs(prev => {
          const updated = [...prev, { time: getCurrentTime(), message: 'PARTICLE FIELD CALIBRATED' }]
          return updated.slice(-15)
        })
      }
      if (visualizationModes.diagnostics && !prevModesRef.current.diagnostics) {
        setLogs(prev => {
          const updated = [...prev, { time: getCurrentTime(), message: 'DIAGNOSTIC WAVE DISPATCHED' }]
          return updated.slice(-15)
        })
      }
      if (visualizationModes.rings && !prevModesRef.current.rings) {
        setLogs(prev => {
          const updated = [...prev, { time: getCurrentTime(), message: 'RING SYNCHRONIZATION COMPLETE' }]
          return updated.slice(-15)
        })
      }
    }
    prevModesRef.current = visualizationModes
  }, [visualizationModes])

  useEffect(() => {
    if (demoMode) {
      const demoMessages = [
        'SUDHANVA CORE ONLINE',
        'SCAN PULSE EMITTED',
        'SYSTEM STATUS: STABLE',
        'WAVEFORM CASCADE INITIATED',
        'PARTICLE FIELD CALIBRATED',
        'DIAGNOSTIC WAVE DISPATCHED',
        'Processing neural patterns...',
        'Analyzing system parameters...',
        'Energy flow optimized.',
        'Scanning environment...',
        'Data synchronization complete.',
        'Core temperature stable.',
        'Neural pathways active.',
        'System performance: optimal.',
        'Link established with mainframe.',
        'Quantum processing engaged.',
        'Network latency: optimal',
        'GPU acceleration: enabled',
        'Memory allocation: optimized',
        'Ring synchronization complete.',
        'Particle field active.',
        'Diagnostic scan initiated.',
      ]

      const interval = setInterval(() => {
        const randomMessage = demoMessages[Math.floor(Math.random() * demoMessages.length)]
        const newLog = {
          time: getCurrentTime(),
          message: randomMessage,
        }
        setLogs(prev => {
          const updated = [...prev, newLog]
          // Keep only last 15 logs for better visibility
          return updated.slice(-15)
        })
      }, 3000)

      return () => clearInterval(interval)
    }
  }, [demoMode])

  // Merge custom logs from props (only new ones)
  const prevCustomLogsRef = useRef([])
  useEffect(() => {
    if (customLogs && customLogs.length > 0) {
      const newLogs = customLogs.filter(log => 
        !prevCustomLogsRef.current.some(prevLog => 
          prevLog.time === log.time && prevLog.message === log.message
        )
      )
      if (newLogs.length > 0) {
        setLogs(prev => {
          const merged = [...prev, ...newLogs]
          return merged.slice(-20) // Keep last 20 logs
        })
        prevCustomLogsRef.current = customLogs
      }
    }
  }, [customLogs])

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight
    }
  }, [logs])

  return (
    <div className="fixed bottom-0 left-0 w-full h-[55px] bg-hudBgAlt/80 border-t border-neonPurple/40 shadow-[0_-4px_25px_rgba(196,60,255,0.3)] backdrop-blur-md flex items-center px-8 z-10">
      <div
        ref={logContainerRef}
        className="status-log-container flex-1 overflow-y-auto overflow-x-hidden flex items-center gap-6 font-orbitron text-[0.7rem] text-hudSubtle"
        style={{ maxHeight: '55px', scrollBehavior: 'smooth' }}
      >
        {logs.map((log, index) => {
          const isSpecial = log.message.includes('SUDHANVA CORE') || 
                           log.message.includes('SUDHANVA RESPONSE') ||
                           log.message.includes('VOICE MODE') ||
                           log.message.includes('USER SPOKE') ||
                           log.message.includes('SPEAKING')
          const isVoiceLog = log.message.includes('VOICE') || 
                            log.message.includes('LISTENING') ||
                            log.message.includes('SPEAKING') ||
                            log.message.includes('USER SPOKE') ||
                            log.message.includes('PROCESSING QUERY')
          const isCommandLog = log.message.includes('COMMAND RECEIVED') ||
                              log.message.includes('EXECUTING TASK') ||
                              log.message.includes('PYTHON AGENT') ||
                              log.message.includes('CONFIRMATION REQUIRED') ||
                              log.message.includes('SARCASM RESPONSE')
          return (
            <div key={index} className="flex items-center gap-3 whitespace-nowrap">
              <span className="text-hudSubtle/60 font-medium font-mono">[{log.time}]</span>
              <span
                className={`font-semibold ${
                  isSpecial ? 'text-cyan' : 
                  isVoiceLog ? 'text-cyan/80' : 
                  isCommandLog ? 'text-cyan/90' : 
                  'text-hudSubtle'
                }`}
                style={{ 
                  textShadow: isSpecial ? '0 0 8px rgba(0, 229, 255, 0.5)' : 
                           isVoiceLog || isCommandLog ? '0 0 6px rgba(0, 229, 255, 0.3)' : 
                           'none',
                  letterSpacing: '0.5px',
                  fontFamily: 'Orbitron, monospace',
                }}
              >
                {log.message}
              </span>
              {index < logs.length - 1 && (
                <span className="text-cyan/30 mx-1 text-lg">|</span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default StatusBar

