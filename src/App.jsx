import React, { useState, useEffect } from 'react'
import HUDCanvas from './components/HUDCanvas'
import TopBar from './components/TopBar'
import LeftWidgets from './components/LeftWidgets'
import RightPanel from './components/RightPanel'
import BottomBar from './components/BottomBar'
import HologramGrid from './components/HologramGrid'
import { fetchSystemMetrics } from './api/aiClient'

function App() {
  const [isActivated, setIsActivated] = useState(false)
  const [demoMode, setDemoMode] = useState(true)
  const [metricsSource, setMetricsSource] = useState('demo')
  const [isAiThinking, setIsAiThinking] = useState(false)
  const [visualizationModes, setVisualizationModes] = useState({
    rings: true,
    particles: true,
    diagnostics: false,
  })
  const [systemData, setSystemData] = useState({
    cpuUsage: 45.2,
    memoryUsage: 67.8,
    gpuLoad: 32.1,
    networkLatency: 12,
    temperature: 42,
    uptimeSeconds: 0,
  })
  const [logs, setLogs] = useState([])
  const [voiceState, setVoiceState] = useState({ isListening: false, isSpeaking: false })

  // Format uptime as HH:MM:SS
  const formatUptime = (seconds) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }

  // Uptime counter
  useEffect(() => {
    const uptimeInterval = setInterval(() => {
      setSystemData(prev => ({
        ...prev,
        uptimeSeconds: prev.uptimeSeconds + 1,
      }))
    }, 1000)
    return () => clearInterval(uptimeInterval)
  }, [])

  // Demo mode data updates
  useEffect(() => {
    if (demoMode && metricsSource === 'demo') {
      const interval = setInterval(() => {
        setSystemData(prev => ({
          ...prev,
          cpuUsage: Math.min(100, Math.max(20, prev.cpuUsage + (Math.random() - 0.5) * 10)),
          memoryUsage: Math.min(100, Math.max(30, prev.memoryUsage + (Math.random() - 0.5) * 8)),
          gpuLoad: Math.min(100, Math.max(10, prev.gpuLoad + (Math.random() - 0.5) * 12)),
          networkLatency: Math.max(5, prev.networkLatency + (Math.random() - 0.5) * 6),
          temperature: Math.min(85, Math.max(35, prev.temperature + (Math.random() - 0.5) * 5)),
        }))
      }, 2000)
      return () => clearInterval(interval)
    }
  }, [demoMode, metricsSource])

  // Live metrics polling
  useEffect(() => {
    if (!demoMode && metricsSource === 'live') {
      const pollMetrics = async () => {
        try {
          const metrics = await fetchSystemMetrics()
          setSystemData(prev => ({
            ...prev,
            cpuUsage: metrics.cpu || prev.cpuUsage,
            memoryUsage: metrics.memory || prev.memoryUsage,
            gpuLoad: metrics.gpu || prev.gpuLoad,
            networkLatency: metrics.networkLatency || prev.networkLatency,
            temperature: metrics.temperature || prev.temperature,
            uptimeSeconds: metrics.uptimeSeconds || prev.uptimeSeconds,
          }))
        } catch (error) {
          console.error('Failed to fetch metrics:', error)
          setMetricsSource('demo')
        }
      }

      pollMetrics()
      const interval = setInterval(pollMetrics, 5000)
      return () => clearInterval(interval)
    }
  }, [demoMode, metricsSource])

  // Add log function
  const addLog = (message) => {
    const now = new Date()
    const time = now.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
    setLogs(prev => [...prev, { time, message }])
  }

  const handleActivate = () => {
    setIsActivated(!isActivated)
    addLog(isActivated ? 'SUDHANVA CORE OFFLINE' : 'SUDHANVA CORE ONLINE')
  }

  const handleAiCommand = async (prompt) => {
    if (!prompt.trim()) return

    setIsAiThinking(true)
    addLog(`COMMAND RECEIVED: "${prompt.substring(0, 30)}${prompt.length > 30 ? '...' : ''}"`)

    try {
      const { askAI, executeCommand } = await import('./api/aiClient')
      const result = await askAI(prompt, true)
      
      // Handle new format: { reply, intent }
      const reply = result.reply || result
      const intent = result.intent || null
      
      // Check if reply is an error message
      if (reply.includes('AI SYSTEM ERROR')) {
        addLog(`AI SYSTEM ERROR: GEMINI BACKEND FAILED`)
        throw new Error(reply)
      }
      
      addLog(`SUDHANVA RESPONSE RECEIVED`)
      addLog(`SUDHANVA RESPONSE: ${reply.substring(0, 80)}${reply.length > 80 ? '...' : ''}`)
      
      // Execute command if intent exists
      if (intent) {
        try {
          addLog(`EXECUTING TASK: ${intent.action}${intent.target ? ` - ${intent.target}` : ''}`)
          const execResult = await executeCommand(intent)
          
          if (execResult.success) {
            addLog(`PYTHON AGENT SUCCESS: ${execResult.message}`)
          } else if (execResult.requires_confirm) {
            addLog(`CONFIRMATION REQUIRED: ${execResult.message}`)
          } else {
            addLog(`PYTHON AGENT ERROR: ${execResult.message}`)
          }
        } catch (execError) {
          addLog(`PYTHON AGENT ERROR: ${execError.message}`)
        }
      }
      
      // Add sarcasm log if reply has personality
      if (reply.includes('?') || reply.includes('!') || reply.includes('…')) {
        addLog(`SARCASM RESPONSE SENT`)
      }
      
      // Return result with executeCommand method
      const resultObj = { reply, intent }
      resultObj.executeCommand = executeCommand
      return resultObj
    } catch (error) {
      const errorMsg = error.message || 'Unknown error'
      if (errorMsg.includes('GEMINI')) {
        addLog(`AI SYSTEM ERROR: GEMINI BACKEND FAILED`)
      } else {
        addLog(`AI SYSTEM ERROR: ${errorMsg}`)
      }
      throw error
    } finally {
      setIsAiThinking(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#01030a] text-white relative overflow-hidden">
      {/* Holographic Background */}
      <HologramGrid />
      
      {/* Top Bar */}
      <TopBar />

      {/* Main Content Area - 3 Column Layout */}
      <div className="flex-1 grid grid-cols-[280px_minmax(0,1fr)_320px] gap-4 px-4 pb-3 pt-2" style={{ height: 'calc(100vh - 82px)' }}>
        {/* Left Widgets */}
        <LeftWidgets 
          systemData={systemData}
          isActivated={isActivated}
          isAiThinking={isAiThinking}
          onAiCommand={handleAiCommand}
          onLog={addLog}
          onVoiceStateChange={setVoiceState}
        />

        {/* Center HUD */}
        <div className="flex items-center justify-center">
          <HUDCanvas
            isActivated={isActivated}
            demoMode={demoMode}
            onActivate={handleActivate}
            visualizationModes={visualizationModes}
            isAiThinking={isAiThinking}
            isListening={voiceState.isListening}
            isSpeaking={voiceState.isSpeaking}
          />
        </div>

        {/* Right Panel */}
        <RightPanel
          isActivated={isActivated}
          isAiThinking={isAiThinking}
          onAiCommand={handleAiCommand}
          onLog={addLog}
          systemData={systemData}
        />
      </div>

      {/* Bottom Bar */}
      <BottomBar systemData={systemData} logs={logs} />
    </div>
  )
}

export default App
