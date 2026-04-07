/**
 * Autonomous Multi-Step Planner
 * Breaks complex tasks into ordered steps and executes them with permission
 */

import { requestPermission, clearAllPermissions } from '../security/permissionGuard.js';
import fetch from 'node-fetch';

const PYTHON_AGENT_URL = 'http://127.0.0.1:5050';
let activePlan = null;
let shouldAbort = false;

/**
 * Plan and execute a multi-step task
 * @param {string} taskDescription - High-level task description
 * @param {Object} context - Context including memory, mood, model signals
 * @returns {Promise<Object>} - Execution result
 */
export async function planAndExecute(taskDescription, context = {}) {
  console.log(`[PLANNER] New task: ${taskDescription}`);

  // Reset abort flag
  shouldAbort = false;

  // Break task into steps
  const steps = await breakIntoSteps(taskDescription, context);
  
  if (!steps || steps.length === 0) {
    return {
      success: false,
      message: 'Could not break task into steps'
    };
  }

  console.log(`[PLANNER] Task broken into ${steps.length} step(s)`);

  // Create plan
  activePlan = {
    description: taskDescription,
    steps,
    currentStep: 0,
    results: [],
    startTime: Date.now()
  };

  // Execute steps sequentially
  for (let i = 0; i < steps.length; i++) {
    if (shouldAbort) {
      console.log(`[PLANNER] Task aborted by user`);
      clearAllPermissions();
      activePlan = null;
      return {
        success: false,
        message: 'Task aborted by user',
        completedSteps: i,
        totalSteps: steps.length
      };
    }

    const step = steps[i];
    activePlan.currentStep = i + 1;

    console.log(`[PLANNER] Step ${i + 1}/${steps.length}: ${step.description}`);

    // Request permission for step
    const permission = await requestPermission(step, { timeout: 30000 });
    
    if (!permission.approved) {
      console.log(`[PLANNER] Step ${i + 1} denied by user`);
      activePlan = null;
      return {
        success: false,
        message: `Step ${i + 1} denied: ${permission.reason}`,
        completedSteps: i,
        totalSteps: steps.length
      };
    }

    // Execute step
    try {
      const result = await executeStep(step);
      activePlan.results.push(result);

      if (!result.success) {
        // Retry logic for failed steps
        const retryResult = await retryStep(step, result);
        if (!retryResult.success) {
          console.log(`[PLANNER] Step ${i + 1} failed after retry`);
          activePlan = null;
          return {
            success: false,
            message: `Step ${i + 1} failed: ${result.message}`,
            completedSteps: i,
            totalSteps: steps.length
          };
        }
        activePlan.results[i] = retryResult;
      }

      console.log(`[PLANNER] Step ${i + 1} completed: ${result.message}`);
      
      // Small delay between steps
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error(`[PLANNER] Step ${i + 1} error:`, error);
      activePlan = null;
      return {
        success: false,
        message: `Step ${i + 1} error: ${error.message}`,
        completedSteps: i,
        totalSteps: steps.length
      };
    }
  }

  // All steps completed
  const duration = Date.now() - activePlan.startTime;
  console.log(`[PLANNER] Task completed in ${duration}ms`);
  
  const planResult = {
    success: true,
    message: 'Task completed successfully',
    steps: activePlan.results,
    duration
  };

  activePlan = null;
  return planResult;
}

/**
 * Break task into steps
 */
async function breakIntoSteps(taskDescription, context) {
  const text = taskDescription.toLowerCase();
  const steps = [];

  // Example: "Take a screenshot and open the folder"
  if (text.match(/\btake.*screenshot.*(and|then).*open.*folder\b/)) {
    steps.push({
      engine: 'os',
      category: 'system',
      action: 'screenshot',
      params: {},
      isSensitive: false,
      description: 'Take a screenshot'
    });
    steps.push({
      engine: 'os',
      category: 'file',
      action: 'open_folder',
      params: { folder: 'screenshots' },
      isSensitive: false,
      description: 'Open screenshots folder'
    });
    return steps;
  }

  // Example: "Download Chrome and install it"
  if (text.match(/\bdownload.*chrome.*(and|then).*install\b/)) {
    steps.push({
      engine: 'web',
      category: 'web',
      action: 'search_google',
      params: { query: 'download chrome' },
      isSensitive: false,
      description: 'Search for Chrome download'
    });
    // Note: Installation would require additional steps and is sensitive
    steps.push({
      engine: 'os',
      category: 'system',
      action: 'install_app',
      params: { app: 'chrome' },
      isSensitive: true,
      description: 'Install Chrome (requires confirmation)'
    });
    return steps;
  }

  // Example: "Find a Python course and open the best one"
  if (text.match(/\bfind.*python.*course\b/)) {
    steps.push({
      engine: 'web',
      category: 'web',
      action: 'search_google',
      params: { query: 'python course' },
      isSensitive: false,
      description: 'Search Google for Python courses'
    });
    // Note: Opening "best one" would require AI to determine which result
    return steps;
  }

  // Default: treat as single step
  // The command interpreter will handle parsing
  return null;
}

/**
 * Execute a single step
 */
async function executeStep(step) {
  const { engine, action, params } = step;

  try {
    let url, body;

    if (engine === 'os') {
      // Map to OS endpoint
      const endpoint = mapOSActionToEndpoint(action);
      url = `${PYTHON_AGENT_URL}/os/${endpoint}`;
      body = buildOSRequestBody(action, params);
    } else if (engine === 'web') {
      // Map to Web endpoint
      url = `${PYTHON_AGENT_URL}/web/execute`;
      body = buildWebRequestBody(action, params);
    } else {
      return {
        success: false,
        message: `Unknown engine: ${engine}`
      };
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const result = await response.json();
    return result;
  } catch (error) {
    return {
      success: false,
      message: `Execution error: ${error.message}`
    };
  }
}

/**
 * Retry a failed step
 */
async function retryStep(step, previousResult, maxRetries = 2) {
  console.log(`[PLANNER] Retrying step: ${step.description}`);
  
  for (let i = 0; i < maxRetries; i++) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    const result = await executeStep(step);
    
    if (result.success) {
      return result;
    }
  }

  return previousResult;
}

/**
 * Map OS action to endpoint
 */
function mapOSActionToEndpoint(action) {
  const actionMap = {
    'open_app': 'mouse', // Will be handled via /execute
    'open_folder': 'mouse', // Will be handled via /execute
    'screenshot': 'screenshot',
    'volume_up': 'system',
    'volume_down': 'system',
    'volume_mute': 'system',
    'media_play_pause': 'system',
    'media_next': 'system',
    'media_previous': 'system',
    'close_window': 'window',
    'minimize_window': 'window',
    'maximize_window': 'window',
    'switch_window': 'window',
    'lock_screen': 'system',
    'shutdown': 'system',
    'restart': 'system',
    'sleep': 'system'
  };

  return actionMap[action] || 'system';
}

/**
 * Build OS request body
 */
function buildOSRequestBody(action, params) {
  if (action === 'screenshot') {
    return { save_folder: params.save_folder || 'screenshots' };
  }

  if (action === 'open_app' || action === 'open_folder') {
    // Use existing /execute endpoint
    return { command: params.app || params.folder || '' };
  }

  return {
    action: action,
    params: params
  };
}

/**
 * Build Web request body
 */
function buildWebRequestBody(action, params) {
  const commandMap = {
    'open_url': 'open_url',
    'search_google': 'search_google',
    'click': 'click',
    'type': 'type',
    'wait': 'wait',
    'scroll': 'scroll',
    'extract': 'extract'
  };

  return {
    command: commandMap[action] || action,
    params: params
  };
}

/**
 * Abort current plan
 */
export function abortPlan() {
  shouldAbort = true;
  clearAllPermissions();
  console.log(`[PLANNER] Plan aborted`);
}

/**
 * Get current plan status
 */
export function getPlanStatus() {
  if (!activePlan) {
    return null;
  }

  return {
    description: activePlan.description,
    currentStep: activePlan.currentStep,
    totalSteps: activePlan.steps.length,
    results: activePlan.results
  };
}

