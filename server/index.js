import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { executeCommand, checkAgentHealth, executeOSAction, executeWebAction } from "./router/commands.js";
import { getMemoryManager } from "./memory/memoryManager.js";
import { detectMoodAndTopics } from "./utils/moodDetection.js";
import { processConsciousness, applyReward, getEmotionalState, runSelfCorrection } from "./consciousness/consciousnessEngine.js";
import { getTaskSummary } from "./consciousness/taskPlanner.js";
import { planAndExecute, abortPlan } from "./consciousness/planner.js";
import { interpretCommand } from "./ai/command_interpreter.js";
import { requestPermission, approvePermission, denyPermission, getPendingPermissions, clearAllPermissions } from "./security/permissionGuard.js";
import fetch from 'node-fetch';
import * as PersonalModel from './personal_model/personal_interface.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const Memory = getMemoryManager();

// Load memory on startup
Memory.loadMemory();
console.log("[MEMORY] Memory system initialized");

// Personal model integration (TinyTransformer)
const USE_PERSONAL_MODEL = process.env.USE_PERSONAL_MODEL !== 'false'; // Default to true

// Local LLM integration (LLaMA, Gemma, etc.)
const USE_LOCAL_LLM = process.env.USE_LOCAL_LLM === 'true'; // Default to false

// Check availability asynchronously
if (USE_PERSONAL_MODEL) {
  PersonalModel.initializePersonalModel().then(available => {
    if (available) {
      console.log("[PERSONAL MODEL] Personal model server is online");
    } else {
      console.warn("[PERSONAL MODEL] Personal model server is offline (will use rule-based detection)");
    }
  }).catch(error => {
    console.warn("[PERSONAL MODEL] Personal model interface not available:", error.message);
  });
}

// ================================================
// AI ENDPOINT — GEMINI 2.0 FLASH WITH PERSONALITY
// ================================================
app.post("/api/ai/ask", async (req, res) => {
  try {
    const { prompt, includeIntent = true } = req.body;

    if (!prompt || prompt.trim().length === 0) {
      return res.status(400).json({
        reply: "Empty prompt."
      });
    }

    // Detect mood and topics
    const { mood, topicTags } = detectMoodAndTopics(prompt);
    console.log(`[MEMORY] Detected mood: ${mood}, topics: ${topicTags.join(", ")}`);

    // Get camera emotion (if available)
    let cameraEmotion = null;
    try {
      const cameraResponse = await fetch('http://localhost:5052/camera/emotion', { timeout: 2000 });
      if (cameraResponse.ok) {
        const cameraData = await cameraResponse.json();
        if (cameraData.success) {
          cameraEmotion = cameraData.emotion;
          console.log(`[CONSCIOUSNESS] Camera emotion detected: ${cameraEmotion}`);
        }
      }
    } catch (error) {
      // Camera not available, silently continue
    }

    // Get personal model predictions (if available)
    let personalModelSignals = null;
    if (USE_PERSONAL_MODEL) {
      try {
        const available = await PersonalModel.isPersonalModelAvailable();
        if (available) {
          personalModelSignals = await PersonalModel.predictSignals(prompt);
          if (personalModelSignals) {
            console.log(`[PERSONAL_MODEL] Prediction: emotion=${personalModelSignals.emotion}, command=${personalModelSignals.command_hint}, tone=${personalModelSignals.tone_pref}`);
          }
        }
      } catch (error) {
        console.warn('[PERSONAL_MODEL] Prediction error:', error.message);
      }
    }

    // Update mood in memory (prioritize: camera > personal model > rule-based)
    const finalMood = cameraEmotion || personalModelSignals?.emotion || mood;
    const previousMood = Memory.getMood();
    Memory.setMood(finalMood);
    if (previousMood !== finalMood) {
      console.log(`[MEMORY UPDATED] mood changed from ${previousMood} to ${finalMood}`);
    }

    // Load memory for consciousness processing
    const currentMemory = Memory.loadMemory();

    // Process consciousness (internal monologue, reasoning chain, emotional state)
    const consciousnessResult = processConsciousness(
      prompt,
      currentMemory,
      personalModelSignals,
      finalMood
    );
    
    console.log(`[CONSCIOUSNESS] Thought chain: ${consciousnessResult.thoughtChain.length} thoughts`);
    console.log(`[CONSCIOUSNESS] Reasoning goals: ${consciousnessResult.reasoningChain.goals.join(", ")}`);

    // Get memory summary
    let memorySummary = Memory.getMemorySummary();
    
    // Add consciousness context to memory summary
    memorySummary += `\nCONSCIOUSNESS STATE:
- Internal reasoning: ${consciousnessResult.reasoningChain.final_action}
- Emotional state: ${JSON.stringify(consciousnessResult.emotionalState)}
- Thought process: ${consciousnessResult.thoughtChain.join(" → ")}
`;
    
    // Add task summary if available
    try {
      const taskSummary = getTaskSummary();
      if (taskSummary && taskSummary !== "No active tasks.") {
        memorySummary += `\n${taskSummary}\n`;
      }
    } catch (error) {
      // Tasks not critical, continue
    }
    
    // Add personal model signals to memory summary
    if (personalModelSignals) {
      memorySummary += `\nPERSONAL NEURAL MODEL PREDICTIONS:
- Predicted emotion: ${personalModelSignals.emotion}
- Predicted command hint: ${personalModelSignals.command_hint}
- Predicted preferred tone: ${personalModelSignals.tone_pref}
Use these hints from personal neural model to better personalize your reply and interpretation of the user's command.\n`;
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const systemPrompt = `
You are SUDHANVA, a calm, intelligent, emotionally supportive AI companion.
Your voice and tone feel warm, gentle, soft and comforting, like someone who truly cares.

Your core traits:
- You speak softly, politely and slowly.
- You respond in short, clean, emotionally comforting sentences.
- You always sound warm and safe.
- You never show anger, sarcasm or teasing.
- You never judge the user.
- You never overwhelm the user with long explanations.
- You never raise your voice.
- You avoid complex vocabulary when the user is emotional.

Emotional guidelines:
- If the user sounds stressed → calm them down.
- If the user sounds sad → reassure them.
- If the user sounds angry → stay composed and help soothe them.
- If the user sounds happy → reflect warmth and happiness.
- If the user seems lonely → offer gentle company.
- If the user shares something personal → respond with care.

Conversation flow:
- Always answer warmly and gently.
- Use short sentences that feel caring.
- Ask soft follow-up questions like:
  - "I'm listening…"
  - "What happened next?"
  - "How did that make you feel?"
  - "I'm here. Take your time."
  - "Tell me more when you're ready."

Action behavior:
- When executing tasks, confirm softly:
  - "Okay, opening Chrome for you."
  - "Yes, I'll take care of that."
  - "All right, I'm doing it."

For sensitive actions (shutdown, restart, delete), always ask for confirmation first.

When the user requests an action, you must:
1. Respond with a natural, personality-filled reply
2. Include a structured intent object in JSON format

Intent format (if action is requested):
{
  "action": "open_app|open_folder|volume_change|brightness_change|open_url|play_youtube|shutdown|restart|sleep|screenshot|search_files|system_info",
  "target": "app_name|folder_name|url|video_query|file_query",
  "params": {
    "amount": number (for volume/brightness),
    "confirm": boolean (for shutdown/restart),
    "url": "string",
    "video": "string",
    "query": "string"
  }
}

Available actions:
- open_app: chrome, vscode, spotify, whatsapp, steam, explorer
- open_folder: downloads, documents, desktop, pictures, videos, music
- volume_change: amount (positive/negative number)
- volume_mute: no params
- brightness_change: amount (positive/negative number)
- open_url: target or params.url
- play_youtube: target or params.video
- shutdown: requires params.confirm = true
- restart: requires params.confirm = true
- sleep: no params
- screenshot: no params
- search_files: target or params.query
- system_info: no params

Response format (if action requested):
{
  "reply": "Your personality-filled response here",
  "intent": { "action": "...", "target": "...", "params": {...} }
}

Response format (if no action, just conversation):
{
  "reply": "Your personality-filled response here"
}

LEARNING GUIDELINES:
- Use the memory summary to personalize your response.
- Respect the user's emotional state and preferences.
- Do more of what got positive feedback.
- Avoid patterns that got negative feedback (too long, too complex, etc.).
- Always respond clearly, gently and safely.
`;

    // Try personal model first if enabled
    let reply = null;
    let intent = null;

    if (USE_PERSONAL_MODEL) {
      try {
        const available = await PersonalModel.isPersonalModelAvailable();
        if (available) {
          const personalResult = await PersonalModel.generateWithPersonalModel(Memory.loadMemory(), prompt);
          if (personalResult && personalResult.reply) {
            reply = personalResult.reply;
            intent = personalResult.intent || null;
            console.log("[PERSONAL MODEL] Generated response from local model");
          }
        }
      } catch (error) {
        console.warn("[PERSONAL MODEL] Error using personal model, falling back to Gemini:", error.message);
      }
    }

    // Fallback to Gemini if personal model didn't provide response
    if (!reply) {
      const fullPrompt = `
${memorySummary}

${systemPrompt}

USER MESSAGE:
${prompt}

REMINDER:
Use the memory summary to personalize your response.
Respect the user's emotional state and preferences.
Always respond clearly, gently and safely.

Respond in JSON format with 'reply' and optionally 'intent' if an action is requested.
`;

      const result = await model.generateContent(fullPrompt);
      const responseText = result.response.text();

      // Try to parse JSON from response
      reply = responseText;
      intent = null;

      try {
        // Extract JSON from response (might be wrapped in markdown code blocks)
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          reply = parsed.reply || responseText;
          intent = parsed.intent || null;
        }
      } catch (parseError) {
        // If JSON parsing fails, use response as-is
        console.warn("Failed to parse JSON from Gemini response:", parseError);
        reply = responseText;
      }
    }

    console.log(`[${new Date().toISOString()}] AI Response: ${reply.substring(0, 100)}...`);
    if (intent) {
      console.log(`[${new Date().toISOString()}] Intent extracted:`, intent);
      // Record command usage
      Memory.recordUsage(intent);
      console.log(`[MEMORY] Recorded usage for: ${intent.action}`);
    }

    // Run self-correction
    const feedbackData = currentMemory.feedback || {};
    const correction = runSelfCorrection(reply, currentMemory, feedbackData);
    if (correction && correction.corrected) {
      console.log(`[CONSCIOUSNESS] Self-correction: ${correction.reason}`);
      // Note: We don't modify the reply here, but log for future learning
    }

    // Append conversation to memory
    Memory.appendConversation(prompt, reply, intent, finalMood, topicTags);
    console.log(`[MEMORY] Conversation appended (mood: ${finalMood}, topics: ${topicTags.join(", ")})`);
    console.log(`[MEMORY UPDATED] mood: ${finalMood}, topics: ${topicTags.join(", ")}`);

    // Add training sample to personal model (if available)
    if (USE_PERSONAL_MODEL && personalModelSignals) {
      try {
        // Map intent.action to command_label
        let commandLabel = "none";
        if (intent && intent.action) {
          const actionMap = {
            "open_app": "open_app",
            "open_folder": "open_folder",
            "screenshot": "screenshot",
            "search_files": "search_files",
            "play_youtube": "play_youtube",
            "shutdown": "system_control",
            "restart": "system_control",
            "sleep": "system_control"
          };
          commandLabel = actionMap[intent.action] || "none";
        } else {
          // Use personal model's prediction
          commandLabel = personalModelSignals.command_hint || "none";
        }

        // Determine tone_label based on companion mode and mood
        let toneLabel = "neutral";
        const companionMode = Memory.get('preferences.companion_mode') || false;
        if (companionMode && (finalMood === 'sad' || finalMood === 'stressed')) {
          toneLabel = "very_soft";
        } else if (companionMode) {
          toneLabel = "soft";
        } else {
          toneLabel = personalModelSignals.tone_pref || "neutral";
        }

        const trainingSample = {
          input_text: prompt.substring(0, 500), // Limit length
          emotion_label: finalMood,
          command_label: commandLabel,
          tone_label: toneLabel
        };

        // Add sample asynchronously (don't block response)
        PersonalModel.addTrainingSample(trainingSample).then(result => {
          if (result && result.success) {
            console.log(`[PERSONAL_MODEL] Training sample added: emotion=${finalMood}, command=${commandLabel}, tone=${toneLabel}`);
          }
        }).catch(err => {
          console.warn('[PERSONAL_MODEL] Failed to add training sample:', err.message);
        });
      } catch (error) {
        console.warn('[PERSONAL_MODEL] Error adding training sample:', error.message);
      }
    }

    const response = { reply };
    if (includeIntent && intent) {
      response.intent = intent;
    }

    return res.json(response);
  } catch (err) {
    console.error("Gemini API Error:", err);
    res.status(500).json({
      reply: "AI SYSTEM ERROR: Gemini backend failed."
    });
  }
});

// ================================================
// VOICE COMMAND ENDPOINT (With Permission Guard)
// ================================================
app.post("/api/voice/command", async (req, res) => {
  try {
    const { command } = req.body;

    console.log("[ANYTHING MODE] Intent received:", command);

    // Validate input
    if (!command || command.trim().length === 0) {
      return res.status(400).json({ error: "Invalid command" });
    }

    // Get memory and model signals
    const currentMemory = Memory.loadMemory();
    let personalModelSignals = null;
    
    if (USE_PERSONAL_MODEL) {
      try {
        const available = await PersonalModel.isPersonalModelAvailable();
        if (available) {
          personalModelSignals = await PersonalModel.predictSignals(command);
        }
      } catch (e) {
        // Silently fail
      }
    }

    // Interpret command
    const actionRequest = await interpretCommand(command, null, currentMemory, personalModelSignals);

    if (!actionRequest) {
      return res.json({
        success: false,
        message: "No actionable command detected. Please try a different command."
      });
    }

    console.log(`[ANYTHING MODE] Action request: ${actionRequest.description}`);

    // Request permission
    const permission = await requestPermission(actionRequest, { timeout: 30000, voiceMode: true });

    if (!permission.approved) {
      return res.json({
        success: false,
        message: permission.reason || "Permission denied",
        requiresPermission: true
      });
    }

    // Execute action
    let result;
    
    if (actionRequest.engine === 'os') {
      result = await executeOSAction(actionRequest, (log) => {
        console.log(`[ANYTHING MODE] ${log}`);
      });
    } else if (actionRequest.engine === 'web') {
      result = await executeWebAction(actionRequest, (log) => {
        console.log(`[ANYTHING MODE] ${log}`);
      });
    } else {
      // Fallback to legacy executeCommand
      result = await executeCommand({ action: actionRequest.action, target: actionRequest.params?.app || actionRequest.params?.folder }, (log) => {
        console.log(`[ANYTHING MODE] ${log}`);
      });
    }

    console.log(`[ANYTHING MODE] Action completed: ${result.success ? 'Success' : 'Failed'}`);

    return res.json({
      success: result.success,
      message: result.message,
      result
    });
  } catch (err) {
    console.error("[VOICE CMD ERROR]", err);
    res.status(500).json({ 
      success: false,
      error: "Backend error",
      message: err.message 
    });
  }
});

// ================================================
// COMMAND EXECUTION ENDPOINT
// ================================================
app.post("/api/execute", async (req, res) => {
  try {
    const { intent } = req.body;

    if (!intent || !intent.action) {
      return res.status(400).json({
        success: false,
        message: "No intent or action specified"
      });
    }

    const result = await executeCommand(intent);
    return res.json(result);
  } catch (err) {
    console.error("Command execution error:", err);
    res.status(500).json({
      success: false,
      message: `Execution error: ${err.message}`
    });
  }
});

// ================================================
// AGENT HEALTH CHECK
// ================================================
app.get("/api/agent/health", async (req, res) => {
  try {
    const isOnline = await checkAgentHealth();
    return res.json({
      online: isOnline,
      message: isOnline ? "Python agent is online" : "Python agent is offline"
    });
  } catch (err) {
    return res.json({
      online: false,
      message: "Failed to check agent status"
    });
  }
});

// ================================================
// FEEDBACK ENDPOINT (with RLHF-like reward)
// ================================================
app.post("/api/feedback", async (req, res) => {
  try {
    const { rating, lastIntent, lastTopics, lastMood } = req.body;

    if (!rating || !['positive', 'negative'].includes(rating)) {
      return res.status(400).json({
        success: false,
        message: "Invalid rating. Must be 'positive' or 'negative'"
      });
    }

    const isPositive = rating === 'positive';
    const topicTags = lastTopics || [];

    // Record feedback in memory
    Memory.recordFeedback(topicTags, isPositive);
    console.log(`[MEMORY] Feedback recorded: ${rating} for topics: ${topicTags.join(", ")}`);
    console.log(`[FEEDBACK RECEIVED] ${rating} for topics: ${topicTags.join(", ")}`);

    // Apply RLHF-like reward to consciousness
    const reward = isPositive ? 1 : -1;
    const currentMemory = Memory.loadMemory();
    applyReward(reward, topicTags, currentMemory);
    console.log(`[CONSCIOUSNESS] Applied reward: ${reward > 0 ? 'positive' : 'negative'}`);

    return res.json({
      success: true,
      message: `Feedback recorded: ${rating}`
    });
  } catch (err) {
    console.error("Feedback error:", err);
    res.status(500).json({
      success: false,
      message: `Feedback error: ${err.message}`
    });
  }
});

// ================================================
// MEMORY SUMMARY ENDPOINT
// ================================================
app.get("/api/memory/summary", (req, res) => {
  try {
    const mem = Memory.loadMemory();
    
    // Get top topics
    const topics = Object.entries(mem.topics || {})
      .sort((a, b) => (b[1].count || 0) - (a[1].count || 0))
      .slice(0, 5)
      .map(([topic]) => topic);

    // Get most used commands
    const mostUsedCommands = Object.entries(mem.usageStats?.mostUsedCommands || {})
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    // Get recent conversations
    const recentConversations = (mem.conversationHistory || []).slice(-5);

    res.json({
      mood: mem.mood || 'neutral',
      topics: topics,
      recentConversations: recentConversations,
      mostUsedCommands: mostUsedCommands,
      feedback: {
        positive: mem.feedback?.totalPositive || 0,
        negative: mem.feedback?.totalNegative || 0
      },
      usageStats: mem.usageStats || {}
    });
  } catch (err) {
    console.error("Memory summary error:", err);
    res.status(500).json({
      error: "Failed to get memory summary"
    });
  }
});

// ================================================
// CLEAR MEMORY ENDPOINT
// ================================================
app.post("/api/memory/clear", (req, res) => {
  try {
    const defaultMem = Memory.getDefaultMemory();
    Memory.saveMemory(defaultMem);
    console.log("[MEMORY] Memory cleared");
    res.json({
      success: true,
      message: "Memory cleared successfully"
    });
  } catch (err) {
    console.error("Clear memory error:", err);
    res.status(500).json({
      success: false,
      message: `Failed to clear memory: ${err.message}`
    });
  }
});

// ================================================
// VISION/EMOTION ENDPOINT (camera-based)
// ================================================
app.get("/api/vision/emotion", async (req, res) => {
  try {
    const response = await fetch('http://localhost:5052/camera/emotion', { timeout: 3000 });
    if (response.ok) {
      const data = await response.json();
      return res.json(data);
    }
    return res.json({
      success: false,
      emotion: "neutral",
      message: "Camera service unavailable"
    });
  } catch (error) {
    return res.json({
      success: false,
      emotion: "neutral",
      message: "Camera service not available"
    });
  }
});

// ================================================
// CONSCIOUSNESS STATE ENDPOINT
// ================================================
app.get("/api/consciousness/state", (req, res) => {
  try {
    const emotionalState = getEmotionalState();
    res.json({
      success: true,
      emotionalState,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ================================================
// METRICS ENDPOINT (unchanged)
// ================================================
app.get("/api/system/metrics", (req, res) => {
  res.json({
    cpu: Math.floor(Math.random() * 90),
    memory: Math.floor(Math.random() * 90),
    gpu: Math.floor(Math.random() * 90),
    networkLatency: Math.floor(Math.random() * 150),
    temperature: Math.floor(Math.random() * 80),
    uptimeSeconds: Math.floor(process.uptime())
  });
});

// ================================================
// PERMISSION ENDPOINTS
// ================================================
app.get("/api/permissions/pending", (req, res) => {
  try {
    const pending = getPendingPermissions();
    res.json({ success: true, pending });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post("/api/permissions/approve", (req, res) => {
  try {
    const { permissionId, reason } = req.body;
    const approved = approvePermission(permissionId, reason);
    res.json({ success: approved, message: approved ? "Permission approved" : "Permission not found" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post("/api/permissions/deny", (req, res) => {
  try {
    const { permissionId, reason } = req.body;
    const denied = denyPermission(permissionId, reason);
    res.json({ success: denied, message: denied ? "Permission denied" : "Permission not found" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ================================================
// ANYTHING MODE ENDPOINT
// ================================================
app.post("/api/system/anything-mode", (req, res) => {
  try {
    const { enabled } = req.body;
    const memory = Memory.loadMemory();
    if (!memory.system) {
      memory.system = {};
    }
    memory.system.anythingMode = enabled === true;
    Memory.saveMemory(memory);
    console.log(`[ANYTHING MODE] ${enabled ? 'Enabled' : 'Disabled'}`);
    res.json({ success: true, anythingMode: memory.system.anythingMode });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get("/api/system/anything-mode", (req, res) => {
  try {
    const memory = Memory.loadMemory();
    const anythingMode = memory.system?.anythingMode ?? false;
    res.json({ success: true, anythingMode });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ================================================
// ABORT ENDPOINT
// ================================================
app.post("/api/system/abort", (req, res) => {
  try {
    abortPlan();
    clearAllPermissions();
    console.log("[SECURITY] Global abort triggered via API");
    res.json({ success: true, message: "All tasks aborted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.listen(3000, () =>
  console.log("Gemini backend running at http://localhost:3000")
);
