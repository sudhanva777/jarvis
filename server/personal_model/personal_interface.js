// personal_interface.js (ESM version)

import fetch from "node-fetch";

const PERSONAL_MODEL_URL = "http://127.0.0.1:5051";

export async function isPersonalModelAvailable() {
  try {
    const res = await fetch(`${PERSONAL_MODEL_URL}/personal_model/health`);
    const data = await res.json();
    return data.status === "online";
  } catch (err) {
    return false;
  }
}

export async function predictSignals(text) {
  try {
    const res = await fetch(`${PERSONAL_MODEL_URL}/personal_model/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    return await res.json();
  } catch (err) {
    return { emotion: null, command_hint: null, tone_pref: null };
  }
}

export async function addTrainingSample(sample) {
  try {
    const res = await fetch(`${PERSONAL_MODEL_URL}/personal_model/add_sample`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(sample),
    });
    return await res.json();
  } catch (err) {
    return { success: false };
  }
}

export async function initializePersonalModel() {
  try {
    const available = await isPersonalModelAvailable();
    return available;
  } catch (err) {
    return false;
  }
}

export async function generateWithPersonalModel(memory, prompt) {
  // This is a placeholder - the personal model server should handle generation
  // For now, return null to fall back to Gemini
  return null;
}

