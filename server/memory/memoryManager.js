// server/memory/memoryManager.js
import fs from "fs";
import path from "path";

const MEMORY_FILE = path.resolve("memory.json");

// -------------------------------
// Load memory from JSON
// -------------------------------
function loadMemory() {
  try {
    if (!fs.existsSync(MEMORY_FILE)) {
      saveMemory(getDefaultMemory());
    }
    const data = fs.readFileSync(MEMORY_FILE, "utf-8");
    return JSON.parse(data);
  } catch (err) {
    console.error("[MEMORY] Failed to load memory:", err);
    return getDefaultMemory();
  }
}

// -------------------------------
// Save memory to JSON
// -------------------------------
function saveMemory(memory) {
  try {
    fs.writeFileSync(MEMORY_FILE, JSON.stringify(memory, null, 2));
  } catch (err) {
    console.error("[MEMORY] Failed to save memory:", err);
  }
}

// -------------------------------
// Default memory structure
// -------------------------------
function getDefaultMemory() {
  return {
    mood: "neutral",
    topics: [],
    conversationHistory: [],
    preferences: {},
    usageStats: {},
    feedback: { positive: 0, negative: 0 },
  };
}

// -------------------------------
// Append conversation
// -------------------------------
function appendConversation(user, ai) {
  const mem = loadMemory();
  mem.conversationHistory.push({ user, ai, ts: Date.now() });

  // Trim history to last 30
  if (mem.conversationHistory.length > 30) {
    mem.conversationHistory = mem.conversationHistory.slice(-30);
  }

  saveMemory(mem);
}

// -------------------------------
// Set mood
// -------------------------------
function setMood(mood) {
  const mem = loadMemory();
  mem.mood = mood;
  saveMemory(mem);
}

// -------------------------------
// Get mood
// -------------------------------
function getMood() {
  const mem = loadMemory();
  return mem.mood || 'neutral';
}

// -------------------------------
// Get value by path
// -------------------------------
function get(pathString) {
  const mem = loadMemory();
  const keys = pathString.split('.');
  let value = mem;
  
  for (const key of keys) {
    if (value && typeof value === 'object' && key in value) {
      value = value[key];
    } else {
      return undefined;
    }
  }
  
  return value;
}

// -------------------------------
// Set value by path
// -------------------------------
function set(pathString, value) {
  const mem = loadMemory();
  const keys = pathString.split('.');
  const lastKey = keys.pop();
  let target = mem;

  for (const key of keys) {
    if (!target[key] || typeof target[key] !== 'object') {
      target[key] = {};
    }
    target = target[key];
  }

  target[lastKey] = value;
  saveMemory(mem);
}

// -------------------------------
// Append conversation (extended)
// -------------------------------
function appendConversationExtended(user, ai, intent = null, mood = "neutral", topicTags = []) {
  const mem = loadMemory();
  
  const entry = {
    timestamp: new Date().toISOString(),
    user: user.substring(0, 500),
    ai: ai.substring(0, 500),
    intent: intent,
    mood: mood,
    topicTags: topicTags
  };

  if (!mem.conversationHistory) {
    mem.conversationHistory = [];
  }
  
  mem.conversationHistory.push(entry);

  // Trim history to last 30
  if (mem.conversationHistory.length > 30) {
    mem.conversationHistory = mem.conversationHistory.slice(-30);
  }

  // Update topics
  if (!mem.topics) {
    mem.topics = {};
  }
  
  topicTags.forEach(topic => {
    if (!mem.topics[topic]) {
      mem.topics[topic] = { count: 0, lastMention: null };
    }
    mem.topics[topic].count++;
    mem.topics[topic].lastMention = new Date().toISOString();
  });

  saveMemory(mem);
}

// -------------------------------
// Record usage
// -------------------------------
function recordUsage(action, target) {
  try {
    // Handle both old intent object format and new (action, target) format
    let actionValue, targetValue;
    
    if (typeof action === 'object' && action !== null) {
      // Old format: recordUsage(intent) - backward compatibility
      const intent = action;
      if (!intent || !intent.action) {
        return;
      }
      actionValue = intent.action;
      targetValue = intent.target || null;
    } else {
      // New format: recordUsage(action, target)
      if (!action) {
        return;
      }
      actionValue = action;
      targetValue = target || null;
    }

    const mem = loadMemory();
    
    // Initialize memory.usage if it doesn't exist
    if (!mem.usage) {
      mem.usage = {};
    }

    // Build the key
    const key = targetValue ? `${actionValue}:${targetValue}` : actionValue;

    // Initialize the usage entry if it doesn't exist
    if (!mem.usage[key]) {
      mem.usage[key] = { count: 0, lastUsed: null };
    }

    // Update usage stats
    mem.usage[key].count++;
    mem.usage[key].lastUsed = new Date().toISOString();

    saveMemory(mem);
  } catch (err) {
    console.error("Memory recording error:", err);
  }
}

// -------------------------------
// Get most used commands
// -------------------------------
function getMostUsedCommands(n = 5) {
  const mem = loadMemory();
  const commands = Object.entries(mem.usageStats?.mostUsedCommands || {});
  commands.sort((a, b) => b[1] - a[1]);
  return commands.slice(0, n);
}

// -------------------------------
// Record feedback
// -------------------------------
function recordFeedback(topicTags = [], isPositive = true) {
  const mem = loadMemory();
  
  if (!mem.feedback) {
    mem.feedback = {
      totalPositive: 0,
      totalNegative: 0,
      perTopic: {}
    };
  }

  if (isPositive) {
    mem.feedback.totalPositive++;
  } else {
    mem.feedback.totalNegative++;
  }

  topicTags.forEach(topic => {
    if (!mem.feedback.perTopic[topic]) {
      mem.feedback.perTopic[topic] = { positive: 0, negative: 0 };
    }
    if (isPositive) {
      mem.feedback.perTopic[topic].positive++;
    } else {
      mem.feedback.perTopic[topic].negative++;
    }
  });

  saveMemory(mem);
}

// -------------------------------
// Get memory summary
// -------------------------------
function getMemorySummary() {
  const mem = loadMemory();
  const mood = mem.mood || 'neutral';
  
  const topics = Object.entries(mem.topics || {})
    .sort((a, b) => (b[1].count || 0) - (a[1].count || 0))
    .slice(0, 3)
    .map(([topic]) => topic);

  const topTopics = topics.length > 0 ? topics.join(", ") : "none";

  const recentConversations = (mem.conversationHistory || [])
    .slice(-3)
    .map(conv => `User: "${(conv.user || '').substring(0, 50)}..." → AI: "${(conv.ai || '').substring(0, 50)}..."`)
    .join("\n");

  const usageStats = mem.usageStats || {};
  const feedback = mem.feedback || {};

  const topCommands = getMostUsedCommands(3)
    .map(([cmd]) => cmd.replace(':', ' '))
    .join(", ");

  const positiveTopics = Object.entries(feedback.perTopic || {})
    .filter(([_, data]) => data.positive > 0)
    .sort((a, b) => b[1].positive - a[1].positive)
    .slice(0, 3)
    .map(([topic]) => topic);

  const negativeTopics = Object.entries(feedback.perTopic || {})
    .filter(([_, data]) => data.negative > 0)
    .slice(0, 3)
    .map(([topic]) => topic);

  let summary = `USER MEMORY SUMMARY:
- Current mood: ${mood}
- Frequent topics: ${topTopics}
- Total interactions: ${usageStats.totalMessages || 0}
- Commands executed: ${usageStats.commandsExecuted || 0}
- Positive feedback: ${feedback.totalPositive || 0}, Negative feedback: ${feedback.totalNegative || 0}
`;

  if (topCommands) {
    summary += `- User frequently uses these commands: ${topCommands}\n`;
  }

  if (positiveTopics.length > 0) {
    summary += `- Topics with highest positive feedback: ${positiveTopics.join(", ")}\n`;
  }

  if (negativeTopics.length > 0) {
    summary += `- Topics with negative feedback: ${negativeTopics.join(", ")}\n`;
  }

  if (recentConversations) {
    summary += `\nRecent conversation context:\n${recentConversations}\n`;
  }

  return summary;
}

// -------------------------------
// Exported interface (IMPORTANT)
// -------------------------------
export function getMemoryManager() {
  return {
    load: loadMemory,
    loadMemory,
    saveMemory,
    getDefaultMemory,
    appendConversation: appendConversationExtended,
    setMood,
    getMood,
    get,
    set,
    recordUsage,
    getMostUsedCommands,
    recordFeedback,
    getMemorySummary,
  };
}
