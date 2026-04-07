import React from 'react'

const HologramGrid = () => {
  return (
    <div className="hologram-bg">
      {/* Additional particle fog overlay */}
      <div 
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(circle at 20% 30%, rgba(0, 246, 255, 0.05) 0%, transparent 50%),
            radial-gradient(circle at 80% 70%, rgba(0, 234, 255, 0.05) 0%, transparent 50%),
            radial-gradient(circle at 50% 50%, rgba(162, 73, 255, 0.03) 0%, transparent 50%)
          `,
          pointerEvents: 'none',
          zIndex: 1
        }}
      />
      
      {/* Floating digital debris */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 2 }}>
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="absolute"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: '2px',
              height: '2px',
              background: 'rgba(0, 246, 255, 0.4)',
              boxShadow: '0 0 4px rgba(0, 246, 255, 0.6)',
              animation: `float${i} ${5 + Math.random() * 5}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 2}s`
            }}
          />
        ))}
      </div>
    </div>
  )
}

export default HologramGrid

