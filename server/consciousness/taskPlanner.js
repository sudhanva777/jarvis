/**
 * Task Planner - Autonomous task management and scheduling
 * Handles long-term goals, short tasks, deadlines, and auto-reminders
 */

import fs from 'fs';
import path from 'path';

const TASKS_FILE = path.resolve('tasks.json');

// Initialize tasks structure
function initTasks() {
  return {
    tasks: [],
    goals: [],
    lastUpdated: new Date().toISOString()
  };
}

// Load tasks
function loadTasks() {
  try {
    if (!fs.existsSync(TASKS_FILE)) {
      const initial = initTasks();
      saveTasks(initial);
      return initial;
    }
    const data = fs.readFileSync(TASKS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.error('[TASK PLANNER] Failed to load tasks:', err);
    return initTasks();
  }
}

// Save tasks
function saveTasks(tasks) {
  try {
    // Remove completed tasks older than 7 days
    const now = Date.now();
    tasks.tasks = tasks.tasks.filter(task => {
      if (task.status === 'done') {
        const doneTime = new Date(task.completedAt || 0).getTime();
        return (now - doneTime) < (7 * 24 * 60 * 60 * 1000);
      }
      return true;
    });
    
    tasks.lastUpdated = new Date().toISOString();
    fs.writeFileSync(TASKS_FILE, JSON.stringify(tasks, null, 2));
  } catch (err) {
    console.error('[TASK PLANNER] Failed to save tasks:', err);
  }
}

/**
 * Add a new task
 * @param {string} goal - Task description
 * @param {number} priority - Priority level (1-5, 5 = highest)
 * @param {string} dueDate - ISO timestamp for due date (optional)
 * @returns {Object} - Created task
 */
export function addTask(goal, priority = 3, dueDate = null) {
  const tasks = loadTasks();
  
  const newTask = {
    id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    goal,
    priority: Math.max(1, Math.min(5, priority)),
    due: dueDate || null,
    status: 'pending',
    createdAt: new Date().toISOString(),
    completedAt: null
  };
  
  tasks.tasks.push(newTask);
  saveTasks(tasks);
  
  console.log(`[TASK PLANNER] Added task: ${goal} (priority ${priority})`);
  
  return newTask;
}

/**
 * Complete a task
 * @param {string} taskId - Task ID
 * @returns {boolean} - Success status
 */
export function completeTask(taskId) {
  const tasks = loadTasks();
  const task = tasks.tasks.find(t => t.id === taskId);
  
  if (task) {
    task.status = 'done';
    task.completedAt = new Date().toISOString();
    saveTasks(tasks);
    console.log(`[TASK PLANNER] Completed task: ${task.goal}`);
    return true;
  }
  
  return false;
}

/**
 * Get pending tasks
 * @param {number} limit - Maximum number of tasks to return
 * @returns {Array} - Array of pending tasks
 */
export function getPendingTasks(limit = 10) {
  const tasks = loadTasks();
  return tasks.tasks
    .filter(t => t.status === 'pending')
    .sort((a, b) => {
      // Sort by priority (higher first), then by due date
      if (b.priority !== a.priority) {
        return b.priority - a.priority;
      }
      if (a.due && b.due) {
        return new Date(a.due) - new Date(b.due);
      }
      if (a.due) return -1;
      if (b.due) return 1;
      return 0;
    })
    .slice(0, limit);
}

/**
 * Get overdue tasks
 * @returns {Array} - Array of overdue tasks
 */
export function getOverdueTasks() {
  const tasks = loadTasks();
  const now = new Date();
  
  return tasks.tasks.filter(task => {
    if (task.status !== 'pending' || !task.due) return false;
    return new Date(task.due) < now;
  });
}

/**
 * Auto-remind for tasks (check if any tasks need reminders)
 * @returns {Array} - Array of tasks needing reminders
 */
export function checkReminders() {
  const tasks = loadTasks();
  const now = new Date();
  const reminders = [];
  
  tasks.tasks.forEach(task => {
    if (task.status === 'pending' && task.due) {
      const dueDate = new Date(task.due);
      const hoursUntilDue = (dueDate - now) / (1000 * 60 * 60);
      
      // Remind if due within 24 hours
      if (hoursUntilDue > 0 && hoursUntilDue <= 24) {
        reminders.push({
          task,
          hoursUntilDue: Math.round(hoursUntilDue * 10) / 10
        });
      }
    }
  });
  
  return reminders;
}

/**
 * Get task summary for AI prompt
 * @returns {string} - Task summary text
 */
export function getTaskSummary() {
  const pending = getPendingTasks(5);
  const overdue = getOverdueTasks();
  
  if (pending.length === 0 && overdue.length === 0) {
    return "No active tasks.";
  }
  
  let summary = "";
  
  if (overdue.length > 0) {
    summary += `OVERDUE TASKS (${overdue.length}):\n`;
    overdue.forEach(task => {
      summary += `- ${task.goal} (Priority: ${task.priority})\n`;
    });
  }
  
  if (pending.length > 0) {
    summary += `\nPENDING TASKS (${pending.length}):\n`;
    pending.slice(0, 5).forEach(task => {
      const dueText = task.due ? ` (Due: ${new Date(task.due).toLocaleDateString()})` : '';
      summary += `- ${task.goal} (Priority: ${task.priority})${dueText}\n`;
    });
  }
  
  return summary;
}

