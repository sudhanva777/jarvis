/**
 * Consciousness Engine - Deep reasoning, planning, and internal thought
 * Simulates internal monologue, chain-of-thought reasoning, and self-correction
 */

import fs from 'fs';
import path from 'path';

const CONSCIOUSNESS_FILE = path.resolve('consciousness.json');

// Initialize consciousness data structure
function initConsciousness() {
  return {
    thoughts: [],
    reasoningChains: [],
    emotionalState: {
      calm: 0.5,
      happy: 0.3,
      stressed: 0.1,
      sad: 0.05,
      irritated: 0.05
    },
    selfCorrections: [],
    workingMemory: {
      lastThoughts: [],
      lastReasoningChains: []
    },
    rewardHistory: []
  };
}

// Load consciousness state
function loadConsciousness() {
  try {
    if (!fs.existsSync(CONSCIOUSNESS_FILE)) {
      const initial = initConsciousness();
      saveConsciousness(initial);
      return initial;
    }
    const data = fs.readFileSync(CONSCIOUSNESS_FILE, 'utf-8');
    const loaded = JSON.parse(data);
    // Ensure all required fields exist
    return { ...initConsciousness(), ...loaded };
  } catch (err) {
    console.error('[CONSCIOUSNESS] Failed to load:', err);
    return initConsciousness();
  }
}

// Save consciousness state
function saveConsciousness(consciousness) {
  try {
    // Trim working memory to last 10 entries
    if (consciousness.workingMemory) {
      consciousness.workingMemory.lastThoughts = 
        consciousness.workingMemory.lastThoughts.slice(-10);
      consciousness.workingMemory.lastReasoningChains = 
        consciousness.workingMemory.lastReasoningChains.slice(-10);
    }
    
    // Trim thoughts to last 20
    consciousness.thoughts = consciousness.thoughts.slice(-20);
    
    fs.writeFileSync(CONSCIOUSNESS_FILE, JSON.stringify(consciousness, null, 2));
  } catch (err) {
    console.error('[CONSCIOUSNESS] Failed to save:', err);
  }
}

/**
 * Generate internal monologue (thought chain)
 * @param {string} userPrompt - User's message
 * @param {Object} memory - Current memory state
 * @param {Object} personalModelSignals - Personal model predictions
 * @returns {string[]} - Array of thoughts (max 5)
 */
function generateThoughtChain(userPrompt, memory, personalModelSignals = null) {
  const thoughts = [];
  
  // Analyze user intent
  const lowerPrompt = userPrompt.toLowerCase();
  
  if (lowerPrompt.includes('open') || lowerPrompt.includes('launch')) {
    thoughts.push("User wants to open something. Checking available actions.");
  }
  
  if (lowerPrompt.includes('sad') || lowerPrompt.includes('tired') || lowerPrompt.includes('lonely')) {
    thoughts.push("User seems emotional. Need to provide comfort and support.");
  }
  
  if (lowerPrompt.includes('help') || lowerPrompt.includes('how')) {
    thoughts.push("User needs assistance. Preparing helpful response.");
  }
  
  // Consider memory context
  if (memory && memory.mood) {
    thoughts.push(`User's recent mood: ${memory.mood}. Adjusting tone accordingly.`);
  }
  
  // Consider personal model predictions
  if (personalModelSignals) {
    thoughts.push(`Personal model suggests: ${personalModelSignals.emotion} emotion, ${personalModelSignals.command_hint} action.`);
  }
  
  // Final thought
  thoughts.push("Formulating response that balances helpfulness with emotional awareness.");
  
  // Limit to 5 thoughts
  return thoughts.slice(0, 5);
}

/**
 * Generate chain-of-thought reasoning
 * @param {string} userPrompt - User's message
 * @param {Object} memory - Current memory state
 * @returns {Object} - Reasoning chain with goals, steps, corrections, final action
 */
function generateReasoningChain(userPrompt, memory) {
  const reasoning = {
    goals: [],
    reasoning_steps: [],
    self_corrections: [],
    final_action: ""
  };
  
  const lowerPrompt = userPrompt.toLowerCase();
  
  // Identify goals
  if (lowerPrompt.includes('open')) {
    reasoning.goals.push("Execute application/folder opening command");
  }
  if (lowerPrompt.includes('volume') || lowerPrompt.includes('brightness')) {
    reasoning.goals.push("Adjust system settings");
  }
  if (lowerPrompt.includes('screenshot')) {
    reasoning.goals.push("Capture screen image");
  }
  if (!reasoning.goals.length) {
    reasoning.goals.push("Provide helpful conversational response");
  }
  
  // Reasoning steps
  reasoning.reasoning_steps.push("Analyzing user intent from prompt");
  reasoning.reasoning_steps.push("Checking memory for context and preferences");
  reasoning.reasoning_steps.push("Evaluating emotional state");
  reasoning.reasoning_steps.push("Determining appropriate response tone");
  
  // Self-corrections (if needed)
  if (memory && memory.feedback && memory.feedback.totalNegative > 0) {
    reasoning.self_corrections.push("Previous negative feedback detected. Adjusting approach.");
  }
  
  // Final action
  if (lowerPrompt.match(/\b(open|launch|start)\b/)) {
    reasoning.final_action = "Execute system command";
  } else if (lowerPrompt.match(/\b(how|what|why|explain)\b/)) {
    reasoning.final_action = "Provide informative response";
  } else {
    reasoning.final_action = "Engage in supportive conversation";
  }
  
  return reasoning;
}

/**
 * Apply emotional decay (gradual emotion fading)
 * @param {Object} consciousness - Current consciousness state
 * @returns {Object} - Updated emotional state
 */
function applyEmotionalDecay(consciousness) {
  const emotionalState = consciousness.emotionalState || {};
  
  // Decay all emotions by 0.92 (8% reduction)
  Object.keys(emotionalState).forEach(key => {
    emotionalState[key] = Math.max(0, emotionalState[key] * 0.92);
  });
  
  // Normalize to sum to 1.0
  const sum = Object.values(emotionalState).reduce((a, b) => a + b, 0);
  if (sum > 0) {
    Object.keys(emotionalState).forEach(key => {
      emotionalState[key] = emotionalState[key] / sum;
    });
  }
  
  return emotionalState;
}

/**
 * Update emotional state based on interaction
 * @param {Object} consciousness - Current consciousness state
 * @param {string} detectedMood - Detected mood from user
 * @param {number} intensity - Emotional intensity (0-1)
 * @returns {Object} - Updated emotional state
 */
function updateEmotionalState(consciousness, detectedMood, intensity = 0.3) {
  const emotionalState = consciousness.emotionalState || {
    calm: 0.5,
    happy: 0.3,
    stressed: 0.1,
    sad: 0.05,
    irritated: 0.05
  };
  
  // Map detected mood to emotional state
  const moodMap = {
    'happy': 'happy',
    'sad': 'sad',
    'stressed': 'stressed',
    'angry': 'irritated',
    'neutral': 'calm'
  };
  
  const targetEmotion = moodMap[detectedMood] || 'calm';
  
  // Boost target emotion
  emotionalState[targetEmotion] = Math.min(1.0, emotionalState[targetEmotion] + intensity);
  
  // Slightly reduce others
  Object.keys(emotionalState).forEach(key => {
    if (key !== targetEmotion) {
      emotionalState[key] = Math.max(0, emotionalState[key] - (intensity * 0.1));
    }
  });
  
  // Normalize
  const sum = Object.values(emotionalState).reduce((a, b) => a + b, 0);
  if (sum > 0) {
    Object.keys(emotionalState).forEach(key => {
      emotionalState[key] = emotionalState[key] / sum;
    });
  }
  
  return emotionalState;
}

/**
 * Self-correction system
 * @param {string} originalReply - Original AI reply
 * @param {Object} memory - Memory state
 * @param {Object} feedback - Feedback data
 * @returns {Object|null} - Corrected reply or null if no correction needed
 */
function selfCorrect(originalReply, memory, feedback = null) {
  // Check for negative feedback patterns
  if (feedback && feedback.totalNegative > feedback.totalPositive) {
    return {
      corrected: true,
      reason: "Negative feedback pattern detected",
      suggestion: "Use shorter, more direct responses. Avoid being overly verbose."
    };
  }
  
  // Check memory for preferences
  if (memory && memory.feedback && memory.feedback.perTopic) {
    const negativeTopics = Object.entries(memory.feedback.perTopic)
      .filter(([_, data]) => data.negative > data.positive)
      .map(([topic]) => topic);
    
    if (negativeTopics.length > 0) {
      return {
        corrected: true,
        reason: `Negative feedback on topics: ${negativeTopics.join(", ")}`,
        suggestion: "Adjust approach for these topics based on user preferences."
      };
    }
  }
  
  return null;
}

/**
 * Process consciousness for a user prompt
 * @param {string} userPrompt - User's message
 * @param {Object} memory - Memory state
 * @param {Object} personalModelSignals - Personal model predictions
 * @param {string} detectedMood - Detected mood
 * @returns {Object} - Consciousness processing result
 */
export function processConsciousness(userPrompt, memory, personalModelSignals = null, detectedMood = 'neutral') {
  const consciousness = loadConsciousness();
  
  // Generate thought chain (internal monologue)
  const thoughtChain = generateThoughtChain(userPrompt, memory, personalModelSignals);
  
  // Generate reasoning chain
  const reasoningChain = generateReasoningChain(userPrompt, memory);
  
  // Update emotional state
  const updatedEmotionalState = updateEmotionalState(consciousness, detectedMood, 0.3);
  
  // Store in working memory
  consciousness.workingMemory.lastThoughts.push({
    timestamp: new Date().toISOString(),
    thoughts: thoughtChain
  });
  
  consciousness.workingMemory.lastReasoningChains.push({
    timestamp: new Date().toISOString(),
    reasoning: reasoningChain
  });
  
  // Update consciousness state
  consciousness.emotionalState = updatedEmotionalState;
  consciousness.thoughts.push({
    timestamp: new Date().toISOString(),
    prompt: userPrompt.substring(0, 100),
    thoughts: thoughtChain
  });
  
  // Save consciousness
  saveConsciousness(consciousness);
  
  return {
    thoughtChain,
    reasoningChain,
    emotionalState: updatedEmotionalState,
    consciousness
  };
}

/**
 * Apply reward (RLHF-like feedback)
 * @param {number} reward - +1 for positive, -1 for negative
 * @param {string[]} topicTags - Related topics
 * @param {Object} memory - Memory state
 */
export function applyReward(reward, topicTags = [], memory = null) {
  const consciousness = loadConsciousness();
  
  // Record reward
  consciousness.rewardHistory.push({
    timestamp: new Date().toISOString(),
    reward,
    topicTags
  });
  
  // Trim reward history
  consciousness.rewardHistory = consciousness.rewardHistory.slice(-50);
  
  // Update emotional state based on reward
  if (reward > 0) {
    // Positive reward - boost positive emotions
    consciousness.emotionalState.happy = Math.min(1.0, consciousness.emotionalState.happy + 0.1);
    consciousness.emotionalState.calm = Math.min(1.0, consciousness.emotionalState.calm + 0.05);
  } else {
    // Negative reward - increase stress/sadness slightly
    consciousness.emotionalState.stressed = Math.min(1.0, consciousness.emotionalState.stressed + 0.1);
    consciousness.emotionalState.sad = Math.min(1.0, consciousness.emotionalState.sad + 0.05);
  }
  
  // Normalize
  const sum = Object.values(consciousness.emotionalState).reduce((a, b) => a + b, 0);
  if (sum > 0) {
    Object.keys(consciousness.emotionalState).forEach(key => {
      consciousness.emotionalState[key] = consciousness.emotionalState[key] / sum;
    });
  }
  
  saveConsciousness(consciousness);
  
  return consciousness;
}

/**
 * Get current emotional state
 * @returns {Object} - Current emotional state
 */
export function getEmotionalState() {
  const consciousness = loadConsciousness();
  return consciousness.emotionalState;
}

/**
 * Run self-correction on a reply
 * @param {string} reply - AI reply
 * @param {Object} memory - Memory state
 * @param {Object} feedback - Feedback data
 * @returns {Object} - Correction result
 */
export function runSelfCorrection(reply, memory, feedback = null) {
  return selfCorrect(reply, memory, feedback);
}

/**
 * Apply emotional decay (call periodically)
 */
export function decayEmotions() {
  const consciousness = loadConsciousness();
  consciousness.emotionalState = applyEmotionalDecay(consciousness);
  saveConsciousness(consciousness);
}

// Run emotional decay every 10 minutes
setInterval(() => {
  decayEmotions();
}, 10 * 60 * 1000);

