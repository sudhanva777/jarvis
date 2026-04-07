/**
 * Personal Model Interface
 * 
 * Interface for TinyTransformer personal model running on Python server
 */

const PERSONAL_MODEL_URL = process.env.PERSONAL_MODEL_URL || 'http://localhost:5051';

/**
 * Check if personal model server is available
 * @returns {Promise<boolean>}
 */
async function isPersonalModelAvailable() {
  try {
    const fetch = (await import('node-fetch')).default;
    const response = await fetch(`${PERSONAL_MODEL_URL}/personal_model/health`, {
      method: 'GET',
      timeout: 2000
    });
    return response.ok;
  } catch (error) {
    return false;
  }
}

/**
 * Predict signals from text using personal model
 * @param {string} text - User's message
 * @returns {Promise<{emotion: string, command_hint: string, tone_pref: string, raw: Object}|null>}
 */
async function predictSignals(text) {
  try {
    const fetch = (await import('node-fetch')).default;
    const response = await fetch(`${PERSONAL_MODEL_URL}/personal_model/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
      timeout: 5000
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    if (data.success) {
      return {
        emotion: data.emotion,
        command_hint: data.command_hint,
        tone_pref: data.tone_pref,
        raw: data.raw
      };
    }
    return null;
  } catch (error) {
    console.warn('[PERSONAL_MODEL] Prediction error:', error.message);
    return null;
  }
}

/**
 * Add training sample to personal model
 * @param {Object} sample - {input_text, emotion_label, command_label, tone_label}
 * @returns {Promise<boolean>}
 */
async function addTrainingSample(sample) {
  try {
    const fetch = (await import('node-fetch')).default;
    const response = await fetch(`${PERSONAL_MODEL_URL}/personal_model/add_sample`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sample),
      timeout: 3000
    });

    return response.ok;
  } catch (error) {
    console.warn('[PERSONAL_MODEL] Add sample error:', error.message);
    return false;
  }
}

/**
 * Generate response using personal fine-tuned model
 * (Not used - personal model only provides signals, not full responses)
 * @param {Object} memory - Current memory snapshot
 * @param {string} userMessage - User's message
 * @returns {Promise<{reply: string, intent: Object|null}|null>} - Always null, use Gemini
 */
async function generateWithPersonalModel(memory, userMessage) {
  // Personal model only provides signals, not full responses
  // Always use Gemini for actual responses
  return null;
}

/**
 * Initialize personal model (check availability)
 * @returns {Promise<boolean>} - Success status
 */
async function initializePersonalModel() {
  const available = await isPersonalModelAvailable();
  if (available) {
    console.log('[PERSONAL_MODEL] Personal model server is available');
  } else {
    console.warn('[PERSONAL_MODEL] Personal model server is not available');
  }
  return available;
}

module.exports = {
  generateWithPersonalModel,
  isPersonalModelAvailable,
  initializePersonalModel,
  predictSignals,
  addTrainingSample
};

