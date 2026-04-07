import { useState, useEffect, useRef } from 'react'

/**
 * Custom hook for soft Indian Female Text-to-Speech
 * Uses SpeechSynthesis API with Indian female voice selection
 */
export function useIndianFemaleTTS() {
  const [isSupported, setIsSupported] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [availableVoices, setAvailableVoices] = useState([])
  const [selectedVoice, setSelectedVoice] = useState(null)
  const utteranceRef = useRef(null)
  const onStartRef = useRef(null)
  const onEndRef = useRef(null)

  useEffect(() => {
    if ('speechSynthesis' in window) {
      setIsSupported(true)

      const loadVoices = () => {
        const voices = window.speechSynthesis.getVoices()
        setAvailableVoices(voices)
        
        if (voices.length > 0 && !selectedVoice) {
          // Prefer Indian female voices
          const preferredNames = [
            'Google हिन्दी (hi-IN)',
            'Google हिंदी महिला',
            'Microsoft Heera - Hindi (India)',
            'Microsoft Neerja - Hindi (India)',
            'Microsoft Priya Online (Natural)',
            'Microsoft Swara Online (Natural)',
            'Microsoft Asha Online (Natural)',
          ]
          
          // Try to find preferred voice
          let voice = voices.find(v => 
            preferredNames.some(name => 
              v.name.includes(name) || 
              (v.name.includes('hi-IN') && v.name.toLowerCase().includes('female')) ||
              (v.name.includes('Hindi') && v.name.toLowerCase().includes('female')) ||
              (v.name.includes('India') && v.name.toLowerCase().includes('female'))
            )
          )
          
          // Fallback: First voice with hi-IN or en-IN lang
          if (!voice) {
            voice = voices.find(v => 
              v.lang === 'hi-IN' || v.lang.startsWith('en-IN')
            )
          }
          
          // Final fallback: first available voice
          if (!voice) {
            voice = voices[0]
          }
          
          setSelectedVoice(voice)
        }
      }

      loadVoices()
      window.speechSynthesis.onvoiceschanged = loadVoices

      return () => {
        window.speechSynthesis.onvoiceschanged = null
      }
    } else {
      setIsSupported(false)
    }
  }, [selectedVoice])

  const speak = (text, options = {}) => {
    if (!isSupported || !selectedVoice || !text) {
      console.warn('TTS not supported, no voice selected, or no text to speak.')
      return Promise.resolve()
    }

    // Stop any current speech
    if (isSpeaking) {
      stop()
    }

    return new Promise((resolve, reject) => {
      utteranceRef.current = new SpeechSynthesisUtterance(text)
      utteranceRef.current.voice = selectedVoice
      utteranceRef.current.rate = options.rate || 0.92  // Comforting, slower pace
      utteranceRef.current.pitch = options.pitch || 1.18  // Warm, soft, comforting female pitch
      utteranceRef.current.volume = options.volume || 1.0

      utteranceRef.current.onstart = () => {
        setIsSpeaking(true)
        if (onStartRef.current) {
          onStartRef.current()
        }
      }

      utteranceRef.current.onend = () => {
        setIsSpeaking(false)
        if (onEndRef.current) {
          onEndRef.current()
        }
        resolve()
      }

      utteranceRef.current.onerror = (event) => {
        console.error('TTS error:', event.error)
        setIsSpeaking(false)
        reject(event.error)
      }

      window.speechSynthesis.speak(utteranceRef.current)
    })
  }

  const stop = () => {
    if (isSupported && isSpeaking) {
      window.speechSynthesis.cancel()
      setIsSpeaking(false)
    }
  }

  const setOnStart = (callback) => {
    onStartRef.current = callback
  }

  const setOnEnd = (callback) => {
    onEndRef.current = callback
  }

  return {
    isSupported,
    isSpeaking,
    availableVoices,
    selectedVoice,
    speak,
    stop,
    setOnStart,
    setOnEnd,
  }
}

