import React from 'react'
import HoloCore from './HoloCore'
import HoloRings from './HoloRings'
import ParticleField from './ParticleField'

const HUDCanvas = ({ isActivated, demoMode, onActivate, visualizationModes, isAiThinking = false, isListening = false, isSpeaking = false }) => {
  return (
    <div className="relative w-[600px] h-[600px] flex items-center justify-center">
      <ParticleField count={30} />
      <HoloRings 
        isActivated={isActivated}
        isSpeaking={isSpeaking}
        isListening={isListening}
      />
      <HoloCore
        isActivated={isActivated}
        isSpeaking={isSpeaking}
        isListening={isListening}
        onActivate={onActivate}
      />
    </div>
  )
}

export default HUDCanvas
