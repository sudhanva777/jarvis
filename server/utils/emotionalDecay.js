/**
 * Emotional Decay System
 * Gradually fades emotions over time
 */

/**
 * Apply decay to emotional state
 * @param {Object} emotionalState - Current emotional state
 * @param {number} decayRate - Decay rate (default 0.92 = 8% reduction)
 * @returns {Object} - Decayed emotional state
 */
export function applyEmotionalDecay(emotionalState, decayRate = 0.92) {
  const decayed = { ...emotionalState };
  
  // Apply decay to all emotions
  Object.keys(decayed).forEach(key => {
    decayed[key] = Math.max(0, decayed[key] * decayRate);
  });
  
  // Normalize to sum to 1.0
  const sum = Object.values(decayed).reduce((a, b) => a + b, 0);
  if (sum > 0) {
    Object.keys(decayed).forEach(key => {
      decayed[key] = decayed[key] / sum;
    });
  } else {
    // If all emotions decayed to zero, reset to neutral
    const keys = Object.keys(decayed);
    keys.forEach(key => {
      decayed[key] = 1.0 / keys.length;
    });
  }
  
  return decayed;
}

/**
 * Get dominant emotion from emotional state
 * @param {Object} emotionalState - Emotional state object
 * @returns {string} - Dominant emotion name
 */
export function getDominantEmotion(emotionalState) {
  if (!emotionalState || Object.keys(emotionalState).length === 0) {
    return 'neutral';
  }
  
  const entries = Object.entries(emotionalState);
  entries.sort((a, b) => b[1] - a[1]);
  
  return entries[0][0];
}

/**
 * Calculate emotional intensity
 * @param {Object} emotionalState - Emotional state object
 * @returns {number} - Intensity value (0-1)
 */
export function getEmotionalIntensity(emotionalState) {
  if (!emotionalState) return 0;
  
  const values = Object.values(emotionalState);
  const max = Math.max(...values);
  const min = Math.min(...values);
  
  return max - min; // Higher difference = more intense
}

