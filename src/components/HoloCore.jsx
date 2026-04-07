import React, { useRef, useEffect, useState } from 'react'

const HoloCore = ({ isActivated, isSpeaking, isListening, onActivate }) => {
  const canvasRef = useRef(null)
  const [hovered, setHovered] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    const centerX = canvas.width / 2
    const centerY = canvas.height / 2

    let time = 0
    let pulsePhase = 0

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      time += 0.02
      pulsePhase += 0.05

      // Core radius with breathing animation
      const baseRadius = 50
      const breathing = Math.sin(pulsePhase) * 5 + 5
      const coreRadius = baseRadius + breathing

      // Glow intensity
      const glowIntensity = isActivated 
        ? 0.8 + Math.sin(time * 2) * 0.2 
        : 0.4 + Math.sin(time) * 0.2

      if (isSpeaking) {
        // Soft pink/purple glow when speaking
        const warmGlow = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, coreRadius * 2)
        warmGlow.addColorStop(0, 'rgba(255, 192, 203, 0.6)')
        warmGlow.addColorStop(0.4, 'rgba(221, 160, 221, 0.4)')
        warmGlow.addColorStop(1, 'rgba(1, 3, 10, 0.2)')
        ctx.fillStyle = warmGlow
        ctx.shadowBlur = 30 * glowIntensity
        ctx.shadowColor = 'rgba(255, 192, 203, 0.5)'
      } else {
        // Cyan energy core
        const coreGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, coreRadius * 2)
        coreGradient.addColorStop(0, '#00f6ff')
        coreGradient.addColorStop(0.3, '#00eaff')
        coreGradient.addColorStop(0.6, '#16f0ff')
        coreGradient.addColorStop(1, 'rgba(1, 3, 10, 0.4)')
        ctx.fillStyle = coreGradient
        ctx.shadowBlur = 40 * glowIntensity
        ctx.shadowColor = 'rgba(0, 246, 255, 0.8)'
      }

      ctx.fillRect(centerX - coreRadius * 2, centerY - coreRadius * 2, coreRadius * 4, coreRadius * 4)

      // Inner core circle
      ctx.beginPath()
      ctx.arc(centerX, centerY, coreRadius, 0, Math.PI * 2)
      if (isSpeaking) {
        ctx.fillStyle = 'rgba(255, 192, 203, 0.8)'
      } else {
        ctx.fillStyle = '#00f6ff'
      }
      ctx.shadowBlur = 20
      ctx.shadowColor = isSpeaking ? 'rgba(255, 192, 203, 0.6)' : 'rgba(0, 246, 255, 0.9)'
      ctx.fill()

      // Energy pulses
      for (let i = 0; i < 3; i++) {
        const pulseProgress = (time * 1.5 + i * 0.5) % 1
        const pulseRadius = coreRadius + pulseProgress * 80
        const pulseOpacity = (1 - pulseProgress) * 0.3

        ctx.beginPath()
        ctx.arc(centerX, centerY, pulseRadius, 0, Math.PI * 2)
        ctx.strokeStyle = isSpeaking 
          ? `rgba(255, 192, 203, ${pulseOpacity})`
          : `rgba(0, 246, 255, ${pulseOpacity})`
        ctx.lineWidth = 2
        ctx.shadowBlur = 15
        ctx.shadowColor = isSpeaking 
          ? `rgba(255, 192, 203, ${pulseOpacity * 0.8})`
          : `rgba(0, 246, 255, ${pulseOpacity * 0.8})`
        ctx.stroke()
      }

      // Flicker effect
      if (Math.random() > 0.95) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)'
        ctx.fillRect(centerX - 5, centerY - 5, 10, 10)
      }

      requestAnimationFrame(animate)
    }

    animate()
  }, [isActivated, isSpeaking, isListening])

  return (
    <div className="relative w-[600px] h-[600px] flex items-center justify-center">
      <canvas
        ref={canvasRef}
        width={600}
        height={600}
        className="absolute inset-0"
        style={{ zIndex: 3 }}
      />
      <div
        className={`relative w-[140px] h-[140px] flex items-center justify-center cursor-pointer transition-all duration-300 z-10 ${
          hovered ? 'scale-110' : 'scale-100'
        }`}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={onActivate}
      >
        <div
          className={`absolute w-full h-full rounded-full ${
            isActivated ? 'pulse-glow breathing' : ''
          }`}
          style={{
            background: isActivated
              ? 'radial-gradient(circle, rgba(0,246,255,0.8) 0%, rgba(0,234,255,0.4) 50%, transparent 100%)'
              : 'radial-gradient(circle, rgba(0,246,255,0.4) 0%, rgba(0,234,255,0.2) 50%, transparent 100%)',
            boxShadow: isActivated
              ? hovered
                ? '0 0 80px rgba(0, 246, 255, 1), 0 0 120px rgba(0, 234, 255, 0.8)'
                : '0 0 60px rgba(0, 246, 255, 0.9), 0 0 90px rgba(0, 234, 255, 0.7)'
              : hovered
              ? '0 0 60px rgba(0, 246, 255, 0.8), 0 0 80px rgba(0, 234, 255, 0.6)'
              : '0 0 40px rgba(0, 246, 255, 0.6), 0 0 60px rgba(0, 234, 255, 0.4)',
            transition: 'box-shadow 0.3s ease',
          }}
        />
        <div
          className={`relative font-orbitron text-2xl font-black neon-text z-10 ${
            isActivated ? 'pulse-glow' : ''
          }`}
          style={{
            textShadow: isActivated
              ? hovered
                ? '0 0 25px rgba(0, 246, 255, 1), 0 0 50px rgba(0, 234, 255, 1), 0 0 75px rgba(0, 246, 255, 0.8)'
                : '0 0 20px rgba(0, 246, 255, 1), 0 0 40px rgba(0, 234, 255, 0.9), 0 0 60px rgba(0, 246, 255, 0.7)'
              : hovered
              ? '0 0 15px rgba(0, 246, 255, 1), 0 0 30px rgba(0, 234, 255, 0.8), 0 0 45px rgba(0, 246, 255, 0.6)'
              : '0 0 10px rgba(0, 246, 255, 0.8), 0 0 20px rgba(0, 234, 255, 0.6), 0 0 30px rgba(0, 246, 255, 0.4)',
            letterSpacing: '4px',
            transition: 'text-shadow 0.3s ease',
          }}
        >
          SUDHANVA
        </div>
      </div>
      
      {/* Circular text labels */}
      {[
        { label: "CORE", angle: -Math.PI / 2 },
        { label: "SYSTEM", angle: -Math.PI / 2 + Math.PI / 3 },
        { label: "CACHE", angle: -Math.PI / 2 + (2 * Math.PI) / 3 },
        { label: "NET", angle: Math.PI / 2 },
        { label: "AI", angle: Math.PI / 2 + Math.PI / 3 },
        { label: "DATA", angle: Math.PI / 2 + (2 * Math.PI) / 3 },
      ].map((item, index) => (
        <div
          key={index}
          className="absolute text-[#00f6ff] text-[0.6rem] font-orbitron uppercase tracking-widest"
          style={{
            transform: `rotate(${item.angle}rad) translate(0, -260px) rotate(-${item.angle}rad)`,
            transformOrigin: 'center',
            left: '50%',
            top: '50%',
            marginLeft: '-30px',
            marginTop: '-8px',
            width: '60px',
            textAlign: 'center',
            textShadow: '0 0 10px rgba(0, 246, 255, 0.8)',
            zIndex: 4
          }}
        >
          {item.label}
        </div>
      ))}
    </div>
  )
}

export default HoloCore

