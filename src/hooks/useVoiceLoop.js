import { useState, useEffect, useRef } from 'react'
import { useIndianFemaleTTS } from './useIndianFemaleTTS'

/**
 * Custom hook for continuous voice conversation loop with Companion Mode
 * Press mic → speak → AI responds → speaks back → auto-restart listening
 */
export function useVoiceLoop(onAiCommand, onLog, companionMode = false) {
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [isVoiceModeActive, setIsVoiceModeActive] = useState(false)
  const [detectedEmotion, setDetectedEmotion] = useState(null)
  const [awaitingPermission, setAwaitingPermission] = useState(null) // { id, description, isSensitive }
  const recognitionRef = useRef(null)
  const followUpTimeoutRef = useRef(null)
  const permissionCheckIntervalRef = useRef(null)
  const { speak, stop, isSpeaking: ttsIsSpeaking, setOnStart, setOnEnd } = useIndianFemaleTTS()

  // Gentle follow-up prompts for companion mode
  const followUpPrompts = [
    "I'm here.",
    "Tell me more.",
    "I'm listening.",
    "It's okay, take your time.",
    "What happened next?",
    "How did that make you feel?",
    "I'm here. Take your time.",
    "Tell me more when you're ready."
  ]

  // Basic emotion detection
  const detectEmotion = (text) => {
    const lowerText = text.toLowerCase()
    
    if (lowerText.includes('sad') || lowerText.includes('upset') || 
        lowerText.includes('tired') || lowerText.includes('worried') || 
        lowerText.includes('alone') || lowerText.includes('lonely')) {
      return 'sad'
    }
    if (lowerText.includes('angry') || lowerText.includes('irritated') || 
        lowerText.includes('frustrated') || lowerText.includes('mad')) {
      return 'angry'
    }
    if (lowerText.includes('haha') || lowerText.includes('lol') || 
        lowerText.includes('laugh') || lowerText.includes('happy') || 
        lowerText.includes('joy')) {
      return 'happy'
    }
    if (lowerText.includes('stressed') || lowerText.includes('anxious') || 
        lowerText.includes('nervous')) {
      return 'stressed'
    }
    
    return null
  }

  // Detect yes/no response for permission confirmation
  const detectPermissionResponse = (text) => {
    const lowerText = text.toLowerCase().trim()
    
    // Yes indicators
    const yesPatterns = [
      /\b(yes|yeah|yep|yup|sure|okay|ok|alright|all right|go ahead|do it|proceed|confirm|approved|approve)\b/,
      /\b(haan|han|ha|hmm|hmm hmm)\b/, // Hindi yes
      /\b(correct|right|exactly|absolutely|definitely|of course)\b/
    ]
    
    // No indicators
    const noPatterns = [
      /\b(no|nope|nah|don't|dont|stop|cancel|abort|deny|denied|reject|rejected|never|not)\b/,
      /\b(na|nahi|nhi|mat|mat karo)\b/, // Hindi no
      /\b(wrong|incorrect|bad idea|don't do|dont do)\b/
    ]
    
    // Check for yes
    for (const pattern of yesPatterns) {
      if (pattern.test(lowerText)) {
        return 'yes'
      }
    }
    
    // Check for no
    for (const pattern of noPatterns) {
      if (pattern.test(lowerText)) {
        return 'no'
      }
    }
    
    // Default to no for safety (fuzzy/unclear responses)
    return 'no'
  }

  // Sync TTS speaking state
  useEffect(() => {
    setIsSpeaking(ttsIsSpeaking)
  }, [ttsIsSpeaking])

  // Setup TTS callbacks
  useEffect(() => {
    const onStartCallback = () => {
      if (onLog) onLog('SPEAKING (Indian Female Voice Activated)')
    }
    
    const onEndCallback = () => {
      if (onLog) onLog('SPEAKING ENDED')
      // Auto-restart listening after speaking ends
      if (isVoiceModeActive) {
        // Clear any existing follow-up timeout
        if (followUpTimeoutRef.current) {
          clearTimeout(followUpTimeoutRef.current)
        }
        
        // Wait 1.5s then auto-restart listening (longer delay for companion mode)
        followUpTimeoutRef.current = setTimeout(() => {
          if (isVoiceModeActive && recognitionRef.current && !isListening) {
            try {
              recognitionRef.current.start()
              if (onLog && companionMode) {
                // Optionally speak a gentle follow-up in companion mode
                // This is handled by the conversation flow, not here
              }
            } catch (e) {
              // Ignore errors
            }
          }
        }, companionMode ? 1500 : 500) // Longer delay in companion mode
      }
    }
    
    setOnStart(onStartCallback)
    setOnEnd(onEndCallback)
  }, [isVoiceModeActive, isListening, onLog, companionMode, setOnStart, setOnEnd])

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    
    if (!SpeechRecognition) {
      console.warn('Speech recognition not supported')
      return
    }

            const recognition = new SpeechRecognition()
            recognition.continuous = true
            recognition.interimResults = false
            recognition.lang = 'en-US'
            
            // Voice recognition improvements
            // Add noise filtering (browser handles this, but we can set sensitivity)
            if (recognition.grammars) {
              // Use grammar for better accuracy if available
            }
            
            // Improve accent normalization (browser-dependent)
            // Sentence smoothing happens in onresult handler

    recognition.onstart = () => {
      setIsListening(true)
      setTranscript('')
    }

            recognition.onresult = async (event) => {
              let finalTranscript = ''

              for (let i = event.resultIndex; i < event.results.length; i++) {
                if (event.results[i].isFinal) {
                  let text = event.results[i][0].transcript
                  
                  // Sentence smoothing: capitalize first letter, add period if missing
                  text = text.trim()
                  if (text.length > 0) {
                    text = text.charAt(0).toUpperCase() + text.slice(1)
                    if (!text.match(/[.!?]$/)) {
                      text += '.'
                    }
                  }
                  
                  finalTranscript += text + ' '
                }
              }

              // Clean up transcript (remove extra spaces, normalize)
              finalTranscript = finalTranscript.trim().replace(/\s+/g, ' ')

              if (finalTranscript.trim()) {
                setTranscript(finalTranscript)
        
        // Check if we're awaiting permission confirmation
        if (awaitingPermission) {
          const response = detectPermissionResponse(finalTranscript)
          
          if (onLog) {
            onLog(`PERMISSION RESPONSE DETECTED: ${response.toUpperCase()}`)
          }
          
          try {
            const { approvePermission, denyPermission } = await import('../api/aiClient')
            
            if (response === 'yes') {
              const result = await approvePermission(awaitingPermission.id, 'Voice confirmation: yes')
              if (result.success) {
                await speak('Permission approved. Executing action.')
                if (onLog) {
                  onLog(`[PERMISSION] Approved via voice: ${awaitingPermission.description}`)
                }
              } else {
                await speak('Failed to approve. Please try again.')
              }
            } else {
              const result = await denyPermission(awaitingPermission.id, 'Voice confirmation: no')
              if (result.success) {
                await speak('Permission denied. Action cancelled.')
                if (onLog) {
                  onLog(`[PERMISSION] Denied via voice: ${awaitingPermission.description}`)
                }
              }
            }
            
            setAwaitingPermission(null)
            // Continue listening
            if (isVoiceModeActive && !isSpeaking) {
              setTimeout(() => {
                if (recognitionRef.current && !isListening) {
                  try {
                    recognitionRef.current.start()
                  } catch (e) {
                    // Ignore errors
                  }
                }
              }, 1000)
            }
          } catch (error) {
            console.error('Permission response error:', error)
            setAwaitingPermission(null)
          }
          
          return // Don't process as regular command
        }
        
        // Emotion detection (companion mode)
        if (companionMode) {
          const emotion = detectEmotion(finalTranscript)
          setDetectedEmotion(emotion)
          if (emotion && onLog) {
            onLog(`EMOTION DETECTED: ${emotion.toUpperCase()}`)
          }
        }
        
        if (onLog) {
          const time = new Date().toLocaleTimeString('en-US', {
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          })
          onLog(`USER SPOKE: ${finalTranscript}`)
        }

        // Stop listening while processing
        stopListening()

        // Send to AI
        if (onAiCommand) {
          try {
            if (onLog) onLog('PROCESSING QUERY…')
            const result = await onAiCommand(finalTranscript)
            
            // Handle new format: { reply, intent }
            const reply = result.reply || result
            const intent = result.intent || null
            
            if (reply && !reply.includes('AI SYSTEM ERROR')) {
              // Execute command if intent exists
              if (intent && onAiCommand.executeCommand) {
                try {
                  const execResult = await onAiCommand.executeCommand(intent)
                  if (execResult && execResult.requires_confirm) {
                    // Handle confirmation requirement
                    await speak("This action requires confirmation. Please confirm to proceed.")
                    if (onLog) onLog('CONFIRMATION REQUIRED')
                  }
                } catch (execError) {
                  console.error('Command execution error:', execError)
                }
              }
              
              // Speak the reply
              await speak(reply)
              
              // Detect feedback in voice commands
              const lowerTranscript = finalTranscript.toLowerCase()
              if (lowerTranscript.includes('that was good') || 
                  lowerTranscript.includes('that was great') ||
                  lowerTranscript.includes('good response') ||
                  lowerTranscript.includes('thanks') ||
                  lowerTranscript.includes('perfect')) {
                // Treat as positive feedback
                try {
                  const { sendFeedback } = await import('../api/aiClient')
                  await sendFeedback('positive', intent, [], detectedEmotion || 'neutral')
                  if (onLog) onLog('FEEDBACK RECEIVED: positive (voice command)')
                } catch (e) {
                  console.error('Feedback error:', e)
                }
              } else if (lowerTranscript.includes('that was bad') ||
                         lowerTranscript.includes('that was wrong') ||
                         lowerTranscript.includes('bad response') ||
                         lowerTranscript.includes('not good')) {
                // Treat as negative feedback
                try {
                  const { sendFeedback } = await import('../api/aiClient')
                  await sendFeedback('negative', intent, [], detectedEmotion || 'neutral')
                  if (onLog) onLog('FEEDBACK RECEIVED: negative (voice command)')
                } catch (e) {
                  console.error('Feedback error:', e)
                }
              }
              
              // In companion mode, optionally add a gentle follow-up after a pause
              if (companionMode && !intent) {
                // Follow-up is handled by the auto-restart listening mechanism
                // The AI personality will naturally ask follow-up questions
              }
            }
          } catch (error) {
            console.error('Voice loop error:', error)
            if (onLog) onLog('ERROR: Failed to process voice command')
          }
        }
      }
    }

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error)
      setIsListening(false)
      
      if (event.error === 'no-speech') {
        // Auto-restart if no speech detected (after a delay)
        if (isVoiceModeActive) {
          setTimeout(() => {
            if (!isSpeaking) {
              startListening()
            }
          }, 2000)
        }
      }
    }

    recognition.onend = () => {
      setIsListening(false)
      // Auto-restart if voice mode is still active and not speaking
      if (isVoiceModeActive && !isSpeaking) {
        setTimeout(() => {
          if (recognitionRef.current && !isListening) {
            try {
              recognitionRef.current.start()
            } catch (e) {
              // Ignore errors
            }
          }
        }, companionMode ? 1000 : 500) // Longer delay in companion mode
      }
    }

    recognitionRef.current = recognition

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop()
        } catch (e) {
          // Ignore errors when stopping
        }
      }
    }
  }, [onAiCommand, onLog, isVoiceModeActive, isSpeaking, companionMode])

  const startVoiceMode = async () => {
    setIsVoiceModeActive(true)
    if (onLog) onLog('VOICE MODE ACTIVATED')
    
    // Speak activation message
    await speak('Voice activated. You may speak to me.')
    
    // Start listening
    startListening()
  }

  const stopVoiceMode = async () => {
    setIsVoiceModeActive(false)
    stopListening()
    stop()
    
    // Speak deactivation message
    await speak('Voice deactivated.')
    
    if (onLog) onLog('VOICE MODE DEACTIVATED')
  }

  const startListening = () => {
    if (recognitionRef.current && !isListening && !isSpeaking) {
      try {
        recognitionRef.current.start()
        if (onLog && isVoiceModeActive) onLog('LISTENING…')
      } catch (error) {
        console.error('Error starting speech recognition:', error)
        setIsListening(false)
      }
    }
  }

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      try {
        recognitionRef.current.stop()
      } catch (error) {
        console.error('Error stopping speech recognition:', error)
      }
    }
  }

  // Auto-stop voice mode when AI goes offline
  useEffect(() => {
    // This will be controlled by parent component passing isActivated prop
  }, [])

  // Poll for pending permissions when voice mode is active
  useEffect(() => {
    if (!isVoiceModeActive) {
      setAwaitingPermission(null)
      if (permissionCheckIntervalRef.current) {
        clearInterval(permissionCheckIntervalRef.current)
        permissionCheckIntervalRef.current = null
      }
      return
    }

    // Check for pending permissions every 2 seconds
    permissionCheckIntervalRef.current = setInterval(async () => {
      try {
        const { getPendingPermissions } = await import('../api/aiClient')
        const result = await getPendingPermissions()
        
        if (result.success && result.pending && result.pending.length > 0) {
          const pending = result.pending[0]
          
          // Only set if we don't already have this permission (check current state)
          setAwaitingPermission(prev => {
            if (prev && prev.id === pending.id) {
              return prev // Already set, don't re-speak
            }
            
            // New permission request
            // Speak permission request
            let permissionMessage = `Bhai, do you want me to: ${pending.description}?`
            if (pending.isSensitive) {
              permissionMessage = `Bhai, this may affect your system. Do you want me to: ${pending.description}? Please say yes or no.`
            } else {
              permissionMessage = `Bhai, do you want me to: ${pending.description}? Please say yes or no.`
            }
            
            speak(permissionMessage).catch(err => {
              console.error('Failed to speak permission request:', err)
            })
            
            if (onLog) {
              onLog(`[PERMISSION] Asking via voice: ${pending.description}`)
            }
            
            // Ensure we're listening for the response
            if (recognitionRef.current && !isListening) {
              try {
                recognitionRef.current.start()
              } catch (e) {
                // Ignore errors
              }
            }
            
            return pending
          })
        } else {
          // No pending permissions
          setAwaitingPermission(prev => {
            if (prev) {
              return null // Clear if we had one
            }
            return prev
          })
        }
      } catch (error) {
        // Silently fail - permission checking is optional
      }
    }, 2000)

    return () => {
      if (permissionCheckIntervalRef.current) {
        clearInterval(permissionCheckIntervalRef.current)
        permissionCheckIntervalRef.current = null
      }
    }
  }, [isVoiceModeActive, isListening, onLog, speak])

  // Cleanup follow-up timeout on unmount
  useEffect(() => {
    return () => {
      if (followUpTimeoutRef.current) {
        clearTimeout(followUpTimeoutRef.current)
      }
      if (permissionCheckIntervalRef.current) {
        clearInterval(permissionCheckIntervalRef.current)
      }
    }
  }, [])

  return {
    isListening,
    isSpeaking,
    isVoiceModeActive,
    transcript,
    detectedEmotion,
    awaitingPermission, // Export for UI display
    startVoiceMode,
    stopVoiceMode,
    startListening,
    stopListening,
  }
}

