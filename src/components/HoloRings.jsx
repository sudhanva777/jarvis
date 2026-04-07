import React, { useRef, useEffect } from 'react'

const HoloRings = ({ isActivated, isSpeaking, isListening }) => {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    const centerX = canvas.width / 2
    const centerY = canvas.height / 2

    let rotation1 = 0
    let rotation2 = 0
    let rotation3 = 0
    let time = 0

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      time += 0.01

      // Update rotations (independent speeds)
      rotation1 += isActivated ? 0.005 : 0.002
      rotation2 += isActivated ? -0.004 : -0.0015
      rotation3 += isActivated ? 0.003 : 0.001

      // Outer ring (largest)
      ctx.save()
      ctx.translate(centerX, centerY)
      ctx.rotate(rotation1)
      ctx.strokeStyle = '#00f6ff'
      ctx.lineWidth = 2
      ctx.shadowBlur = 15
      ctx.shadowColor = 'rgba(0, 246, 255, 0.8)'
      ctx.beginPath()
      ctx.arc(0, 0, 250, 0, Math.PI * 2)
      ctx.stroke()
      
      // Tick marks on outer ring
      for (let i = 0; i < 60; i++) {
        const angle = (i / 60) * Math.PI * 2
        const x1 = Math.cos(angle) * 250
        const y1 = Math.sin(angle) * 250
        const x2 = Math.cos(angle) * 245
        const y2 = Math.sin(angle) * 245
        
        ctx.beginPath()
        ctx.moveTo(x1, y1)
        ctx.lineTo(x2, y2)
        ctx.stroke()
      }
      ctx.restore()

      // Middle ring
      ctx.save()
      ctx.translate(centerX, centerY)
      ctx.rotate(rotation2)
      ctx.strokeStyle = '#00eaff'
      ctx.lineWidth = 1.5
      ctx.shadowBlur = 12
      ctx.shadowColor = 'rgba(0, 234, 255, 0.6)'
      ctx.beginPath()
      ctx.arc(0, 0, 180, 0, Math.PI * 2)
      ctx.stroke()
      
      // Segments on middle ring
      for (let i = 0; i < 24; i++) {
        const angle = (i / 24) * Math.PI * 2
        const startAngle = angle
        const endAngle = angle + (Math.PI * 2 / 24) * 0.3
        
        ctx.beginPath()
        ctx.arc(0, 0, 180, startAngle, endAngle)
        ctx.stroke()
      }
      ctx.restore()

      // Inner ring (smallest)
      ctx.save()
      ctx.translate(centerX, centerY)
      ctx.rotate(rotation3)
      ctx.strokeStyle = '#16f0ff'
      ctx.lineWidth = 1
      ctx.shadowBlur = 10
      ctx.shadowColor = 'rgba(22, 240, 255, 0.5)'
      ctx.beginPath()
      ctx.arc(0, 0, 120, 0, Math.PI * 2)
      ctx.stroke()
      ctx.restore()

      // Data beams rotating around
      for (let i = 0; i < 6; i++) {
        const beamAngle = (i / 6) * Math.PI * 2 + rotation1 * 2
        const beamX = centerX + Math.cos(beamAngle) * 200
        const beamY = centerY + Math.sin(beamAngle) * 200
        
        ctx.save()
        ctx.translate(beamX, beamY)
        ctx.rotate(beamAngle + Math.PI / 2)
        ctx.fillStyle = 'rgba(0, 246, 255, 0.3)'
        ctx.shadowBlur = 20
        ctx.shadowColor = 'rgba(0, 246, 255, 0.8)'
        ctx.fillRect(-1, -20, 2, 40)
        ctx.restore()
      }

      requestAnimationFrame(animate)
    }

    animate()
  }, [isActivated, isSpeaking, isListening])

  return (
    <canvas
      ref={canvasRef}
      width={600}
      height={600}
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 2 }}
    />
  )
}

export default HoloRings

