export async function askAI(prompt, includeIntent = true) {
  try {
    const controller = new AbortController();

    const timeout = setTimeout(() => controller.abort(), 15000);

    const response = await fetch("http://localhost:3000/api/ai/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, includeIntent }),
      signal: controller.signal
    });

    clearTimeout(timeout);

    if (!response.ok) {
      return { reply: "AI SYSTEM ERROR: Backend error", intent: null };
    }

    const data = await response.json();
    return {
      reply: data.reply || "No reply received.",
      intent: data.intent || null
    };
  } catch (err) {
    return { reply: "AI SYSTEM ERROR: Unable to reach Gemini backend.", intent: null };
  }
}

/**
 * Execute a command via the command router
 */
export async function executeCommand(intent) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const response = await fetch("http://localhost:3000/api/execute", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ intent }),
      signal: controller.signal
    });

    clearTimeout(timeout);

    if (!response.ok) {
      return { success: false, message: "Backend error" };
    }

    return await response.json();
  } catch (err) {
    return { success: false, message: `Failed to execute: ${err.message}` };
  }
}

/**
 * Get memory summary from backend
 * @returns {Promise<Object|null>} - Memory summary or null
 */
export async function getMemorySummary() {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const response = await fetch("http://localhost:3000/api/memory/summary", {
      method: "GET",
      signal: controller.signal
    });

    clearTimeout(timeout);

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch (err) {
    return null;
  }
}

/**
 * Clear memory on backend
 * @returns {Promise<Object>} - Result of clear operation
 */
export async function clearMemory() {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const response = await fetch("http://localhost:3000/api/memory/clear", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal
    });

    clearTimeout(timeout);

    if (!response.ok) {
      return { success: false, message: "Backend error" };
    }

    return await response.json();
  } catch (err) {
    return { success: false, message: `Failed to clear memory: ${err.message}` };
  }
}

/**
 * Get personal model predictions
 * @param {string} text - Text to predict from
 * @returns {Promise<Object|null>} - Prediction result or null
 */
export async function getPersonalModelPrediction(text) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);

    const response = await fetch("http://localhost:5051/personal_model/predict", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
      signal: controller.signal
    });

    clearTimeout(timeout);

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.success ? data : null;
  } catch (err) {
    // Silently fail - personal model is optional
    return null;
  }
}

/**
 * Send feedback to the backend
 * @param {string} rating - "positive" or "negative"
 * @param {Object} lastIntent - Last intent object (optional)
 * @param {string[]} lastTopics - Last topic tags (optional)
 * @param {string} lastMood - Last detected mood (optional)
 * @returns {Promise<Object>} - Result of feedback submission
 */
export async function sendFeedback(rating, lastIntent = null, lastTopics = [], lastMood = "neutral") {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const response = await fetch("http://localhost:3000/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating, lastIntent, lastTopics, lastMood }),
      signal: controller.signal
    });

    clearTimeout(timeout);

    if (!response.ok) {
      return { success: false, message: "Backend error" };
    }

    return await response.json();
  } catch (err) {
    return { success: false, message: `Failed to send feedback: ${err.message}` };
  }
}

/**
 * Fetch system metrics from the backend
 * @returns {Promise<Object>} - System metrics object
 */
export async function fetchSystemMetrics() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch("http://localhost:3000/api/system/metrics", {
      method: "GET",
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error("Metrics request timed out.");
    }
    if (error.message.includes("Failed to fetch") || error.message.includes("NetworkError")) {
      throw new Error("Backend server unreachable.");
    }
    throw error;
  }
}

/**
 * Get pending permissions from the backend.
 * @returns {Promise<Object>} - Pending permissions.
 */
export async function getPendingPermissions() {
  try {
    const response = await fetch("http://localhost:3000/api/permissions/pending");
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching pending permissions:", error);
    return { success: false, pending: [] };
  }
}

/**
 * Approve a permission request.
 * @param {string} permissionId - Permission ID.
 * @param {string} reason - Optional reason.
 * @returns {Promise<Object>} - Result of approval.
 */
export async function approvePermission(permissionId, reason = '') {
  try {
    const response = await fetch("http://localhost:3000/api/permissions/approve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ permissionId, reason }),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error approving permission:", error);
    return { success: false, message: `Failed to approve permission: ${error.message}` };
  }
}

/**
 * Deny a permission request.
 * @param {string} permissionId - Permission ID.
 * @param {string} reason - Optional reason.
 * @returns {Promise<Object>} - Result of denial.
 */
export async function denyPermission(permissionId, reason = '') {
  try {
    const response = await fetch("http://localhost:3000/api/permissions/deny", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ permissionId, reason }),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error denying permission:", error);
    return { success: false, message: `Failed to deny permission: ${error.message}` };
  }
}
