/**
 * Memory Manager - Handles persistent memory for SUDHANVA AI
 * Supports both localStorage (frontend) and JSON file (backend)
 */

const DEFAULT_MEMORY = {
  preferences: {
    companion_mode: false,
    visual_mode: "NEURAL_MODE"
  },
  conversationHistory: [],
  mood: "neutral",
  topics: {},
  usageStats: {
    totalMessages: 0,
    commandsExecuted: 0,
    mostUsedCommands: {},
    timeOfDayUsage: {
      morning: 0,
      afternoon: 0,
      evening: 0,
      night: 0
    }
  },
  feedback: {
    totalPositive: 0,
    totalNegative: 0,
    perTopic: {}
  }
};

class MemoryManager {
  constructor() {
    this.memory = null;
    this.isBackend = typeof window === 'undefined';
    this.maxConversationHistory = 30;
  }

  /**
   * Load memory from storage
   */
  load() {
    try {
      if (this.isBackend) {
        // Backend: Load from memory.json file
        const fs = require('fs');
        const path = require('path');
        const memoryPath = path.join(process.cwd(), 'memory.json');
        
        if (fs.existsSync(memoryPath)) {
          const data = fs.readFileSync(memoryPath, 'utf8');
          this.memory = JSON.parse(data);
        } else {
          this.memory = JSON.parse(JSON.stringify(DEFAULT_MEMORY));
          this.save();
        }
      } else {
        // Frontend: Load from localStorage
        const stored = localStorage.getItem('sudhanva_memory');
        if (stored) {
          this.memory = JSON.parse(stored);
        } else {
          this.memory = JSON.parse(JSON.stringify(DEFAULT_MEMORY));
          this.save();
        }
      }
      
      // Ensure all required fields exist
      this.memory = { ...DEFAULT_MEMORY, ...this.memory };
      this.memory.conversationHistory = this.memory.conversationHistory || [];
      this.memory.topics = this.memory.topics || {};
      this.memory.usageStats = { ...DEFAULT_MEMORY.usageStats, ...this.memory.usageStats };
      this.memory.feedback = { ...DEFAULT_MEMORY.feedback, ...this.memory.feedback };
      
      return this.memory;
    } catch (error) {
      console.error('Error loading memory:', error);
      this.memory = JSON.parse(JSON.stringify(DEFAULT_MEMORY));
      return this.memory;
    }
  }

  /**
   * Save memory to storage
   */
  save() {
    try {
      if (!this.memory) {
        this.load();
      }

      // Trim conversation history to max size
      if (this.memory.conversationHistory.length > this.maxConversationHistory) {
        this.memory.conversationHistory = this.memory.conversationHistory.slice(-this.maxConversationHistory);
      }

      if (this.isBackend) {
        // Backend: Save to memory.json file
        const fs = require('fs');
        const path = require('path');
        const memoryPath = path.join(process.cwd(), 'memory.json');
        fs.writeFileSync(memoryPath, JSON.stringify(this.memory, null, 2), 'utf8');
      } else {
        // Frontend: Save to localStorage
        localStorage.setItem('sudhanva_memory', JSON.stringify(this.memory));
      }
      
      return true;
    } catch (error) {
      console.error('Error saving memory:', error);
      return false;
    }
  }

  /**
   * Get value from memory using dot-notation path
   * @param {string} pathString - e.g., "preferences.companion_mode"
   * @returns {any}
   */
  get(pathString) {
    if (!this.memory) {
      this.load();
    }

    const keys = pathString.split('.');
    let value = this.memory;
    
    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key];
      } else {
        return undefined;
      }
    }
    
    return value;
  }

  /**
   * Set value in memory using dot-notation path
   * @param {string} pathString - e.g., "preferences.companion_mode"
   * @param {any} value
   */
  set(pathString, value) {
    if (!this.memory) {
      this.load();
    }

    const keys = pathString.split('.');
    const lastKey = keys.pop();
    let target = this.memory;

    for (const key of keys) {
      if (!target[key] || typeof target[key] !== 'object') {
        target[key] = {};
      }
      target = target[key];
    }

    target[lastKey] = value;
    this.save();
  }

  /**
   * Append conversation to history
   * @param {string} user - User message
   * @param {string} ai - AI response
   * @param {Object|null} intent - Intent object if action was taken
   * @param {string} mood - Detected mood
   * @param {string[]} topicTags - Array of topic tags
   */
  appendConversation(user, ai, intent = null, mood = "neutral", topicTags = []) {
    if (!this.memory) {
      this.load();
    }

    const entry = {
      timestamp: new Date().toISOString(),
      user: user.substring(0, 500), // Limit length
      ai: ai.substring(0, 500),
      intent: intent,
      mood: mood,
      topicTags: topicTags
    };

    this.memory.conversationHistory.push(entry);
    
    // Trim to max size
    if (this.memory.conversationHistory.length > this.maxConversationHistory) {
      this.memory.conversationHistory = this.memory.conversationHistory.slice(-this.maxConversationHistory);
    }

    // Update topics
    topicTags.forEach(topic => {
      if (!this.memory.topics[topic]) {
        this.memory.topics[topic] = { count: 0, lastMention: null };
      }
      this.memory.topics[topic].count++;
      this.memory.topics[topic].lastMention = new Date().toISOString();
    });

    this.save();
  }

  /**
   * Set current mood
   * @param {string} mood
   */
  setMood(mood) {
    this.set('mood', mood);
  }

  /**
   * Get current mood
   * @returns {string}
   */
  getMood() {
    return this.get('mood') || 'neutral';
  }

  /**
   * Record command usage
   * @param {Object} intent - Intent object with action and target
   */
  recordUsage(intent) {
    if (!this.memory) {
      this.load();
    }

    if (!intent || !intent.action) {
      return;
    }

    this.memory.usageStats.totalMessages++;
    this.memory.usageStats.commandsExecuted++;

    const commandKey = intent.target 
      ? `${intent.action}:${intent.target}` 
      : intent.action;

    if (!this.memory.usageStats.mostUsedCommands[commandKey]) {
      this.memory.usageStats.mostUsedCommands[commandKey] = 0;
    }
    this.memory.usageStats.mostUsedCommands[commandKey]++;

    // Track time of day
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 12) {
      this.memory.usageStats.timeOfDayUsage.morning++;
    } else if (hour >= 12 && hour < 17) {
      this.memory.usageStats.timeOfDayUsage.afternoon++;
    } else if (hour >= 17 && hour < 22) {
      this.memory.usageStats.timeOfDayUsage.evening++;
    } else {
      this.memory.usageStats.timeOfDayUsage.night++;
    }

    this.save();
  }

  /**
   * Get most used commands
   * @param {number} n - Number of commands to return
   * @returns {Array} Array of [command, count] pairs
   */
  getMostUsedCommands(n = 5) {
    if (!this.memory) {
      this.load();
    }

    const commands = Object.entries(this.memory.usageStats.mostUsedCommands);
    commands.sort((a, b) => b[1] - a[1]);
    return commands.slice(0, n);
  }

  /**
   * Record feedback
   * @param {string[]} topicTags - Topics related to the feedback
   * @param {boolean} isPositive - True for positive, false for negative
   */
  recordFeedback(topicTags = [], isPositive = true) {
    if (!this.memory) {
      this.load();
    }

    if (isPositive) {
      this.memory.feedback.totalPositive++;
    } else {
      this.memory.feedback.totalNegative++;
    }

    topicTags.forEach(topic => {
      if (!this.memory.feedback.perTopic[topic]) {
        this.memory.feedback.perTopic[topic] = { positive: 0, negative: 0 };
      }
      if (isPositive) {
        this.memory.feedback.perTopic[topic].positive++;
      } else {
        this.memory.feedback.perTopic[topic].negative++;
      }
    });

    this.save();
  }

  /**
   * Clear all memory (reset to defaults)
   */
  clear() {
    this.memory = JSON.parse(JSON.stringify(DEFAULT_MEMORY));
    this.save();
  }

  /**
   * Get memory summary for AI prompt
   * @returns {string}
   */
  getMemorySummary() {
    if (!this.memory) {
      this.load();
    }

    const mood = this.memory.mood || 'neutral';
    
    // Get top 3 topics by count
    const topics = Object.entries(this.memory.topics || {})
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 3)
      .map(([topic]) => topic);

    const topTopics = topics.length > 0 ? topics.join(", ") : "none";

    // Get recent conversation summaries (last 3)
    const recentConversations = this.memory.conversationHistory
      .slice(-3)
      .map(conv => `User: "${conv.user.substring(0, 50)}..." → AI: "${conv.ai.substring(0, 50)}..."`)
      .join("\n");

    const usageStats = this.memory.usageStats || {};
    const feedback = this.memory.feedback || {};

    // Get top commands
    const topCommands = this.getMostUsedCommands(3)
      .map(([cmd]) => cmd.replace(':', ' '))
      .join(", ");

    // Get topics with feedback
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
}

// Export singleton instance
let memoryManagerInstance = null;

export function getMemoryManager() {
  if (!memoryManagerInstance) {
    memoryManagerInstance = new MemoryManager();
    memoryManagerInstance.load();
  }
  return memoryManagerInstance;
}

// For backend use (Node.js)
export default MemoryManager;

