import React from 'react'

const BottomBar = ({ systemData, logs }) => {
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
  const currentTime = new Date().toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
  })

  // App icons (placeholder)
  const apps = [
    { name: 'Chrome', icon: '🌐' },
    { name: 'Terminal', icon: '💻' },
    { name: 'Editor', icon: '📝' },
    { name: 'Settings', icon: '⚙️' },
  ]

  return (
    <div className="w-full h-12 holo-panel border-t border-[#00f6ff]/30 flex items-center justify-between px-6 text-xs font-orbitron z-20 neon-text">
      {/* Left: Trash / Power Info */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <span className="text-hudSubtle">Trash:</span>
          <span className="text-hudText">4 items</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-hudSubtle">Source:</span>
          <span className="text-cyan">AC Line</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-hudSubtle">Power:</span>
          <span className="text-cyan font-semibold">96%</span>
        </div>
      </div>

      {/* Center: App Icons */}
      <div className="flex items-center gap-3">
        {apps.map((app, index) => (
          <div
            key={index}
            className="w-8 h-8 rounded border border-cyan/30 flex items-center justify-center text-base hover:border-cyan hover:bg-cyan/10 transition-all cursor-pointer"
            title={app.name}
          >
            {app.icon}
          </div>
        ))}
      </div>

      {/* Right: Time, Date, System Info */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <span className="text-hudSubtle">CPU:</span>
          <div className="w-16 h-1.5 bg-hudBg rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan to-blueAccent transition-all duration-500"
              style={{ width: `${systemData.cpuUsage}%` }}
            ></div>
          </div>
          <span className="text-cyan text-[0.7rem] w-8 text-right">{systemData.cpuUsage.toFixed(0)}%</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-hudSubtle">GPU:</span>
          <div className="w-16 h-1.5 bg-hudBg rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan to-blueAccent transition-all duration-500"
              style={{ width: `${systemData.gpuLoad}%` }}
            ></div>
          </div>
          <span className="text-cyan text-[0.7rem] w-8 text-right">{systemData.gpuLoad.toFixed(0)}%</span>
        </div>
        <div className="text-hudText font-mono">{currentTime}</div>
        <div className="text-hudSubtle">{currentDate}</div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-cyan"></div>
          <span className="text-cyan text-[0.7rem]">Online</span>
        </div>
      </div>
    </div>
  )
}

export default BottomBar

