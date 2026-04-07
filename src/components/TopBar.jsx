import React from 'react'

const TopBar = () => {
  const currentTime = new Date().toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <div className="w-full h-10 holo-panel border-b border-[#00f6ff]/30 flex items-center justify-between px-6 text-xs font-orbitron z-20 neon-text">
      {/* Left: System Info */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <span className="text-hudSubtle">Battery:</span>
          <span className="text-cyan font-semibold">96%</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-hudSubtle">WiFi:</span>
          <span className="text-cyan font-semibold">Connected</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-hudSubtle">Host:</span>
          <span className="text-hudText font-mono">SUDHANVA-PC</span>
        </div>
        <div className="text-hudText font-mono">{currentTime}</div>
      </div>

      {/* Center: IP / Bandwidth */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-hudSubtle">IP:</span>
          <span className="text-cyan font-mono">192.168.1.100</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-hudSubtle">↓</span>
          <span className="text-hudText">125 Mbps</span>
        </div>
      </div>

      {/* Right: Icons */}
      <div className="flex items-center gap-4">
        <div className="w-5 h-5 rounded border border-cyan/40 flex items-center justify-center">
          <div className="w-2 h-2 rounded-full bg-cyan"></div>
        </div>
        <div className="w-5 h-5 rounded border border-cyan/40 flex items-center justify-center">
          <div className="w-3 h-3 border border-cyan/60"></div>
        </div>
      </div>
    </div>
  )
}

export default TopBar

