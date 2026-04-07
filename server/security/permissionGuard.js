/**
 * Permission Guard - Central safety layer
 * All automation actions must pass through this guard
 */

import { getMemoryManager } from '../memory/memoryManager.js';

const Memory = getMemoryManager();

// In-memory store for pending permissions
const pendingPermissions = new Map();
let permissionIdCounter = 0;

/**
 * Request permission for an action
 * @param {Object} actionRequest - Structured action request from interpreter
 * @param {Object} options - Options for permission request
 * @returns {Promise<Object>} - { approved: boolean, decision: string, reason: string }
 */
export async function requestPermission(actionRequest, options = {}) {
  const { timeout = 30000, voiceMode = false } = options;

  console.log(`[PERMISSION] Requesting permission for: ${actionRequest.description}`);

  // Check if Anything Mode is enabled
  const memory = Memory.loadMemory();
  const anythingMode = memory.system?.anythingMode ?? false;

  if (!anythingMode) {
    console.log(`[PERMISSION] Denied - Anything Mode is disabled`);
    return {
      approved: false,
      decision: 'denied',
      reason: 'Anything Mode is disabled. Please enable it in settings to allow automation.'
    };
  }

  // Check for hard-blocked actions
  if (isHardBlocked(actionRequest)) {
    console.log(`[SECURITY] Hard-blocked action: ${actionRequest.action}`);
    return {
      approved: false,
      decision: 'blocked',
      reason: 'For safety, I\'m not allowed to do that.'
    };
  }

  // Check for abort command
  if (actionRequest.action === 'abort_all') {
    // Clear all pending permissions
    pendingPermissions.clear();
    console.log(`[SECURITY] Global abort triggered by user`);
    return {
      approved: true,
      decision: 'approved',
      reason: 'All tasks aborted'
    };
  }

  // Create pending permission
  const permissionId = `perm_${++permissionIdCounter}_${Date.now()}`;
  const pendingPermission = {
    id: permissionId,
    actionRequest,
    timestamp: Date.now(),
    status: 'pending',
    isSensitive: actionRequest.isSensitive || false
  };

  pendingPermissions.set(permissionId, pendingPermission);

  // If sensitive action, add extra warning
  let description = actionRequest.description;
  if (actionRequest.isSensitive) {
    description = `⚠️ WARNING: ${description}. This may affect your system. Do you want to continue?`;
    console.log(`[SECURITY] Sensitive action requested: ${actionRequest.description}`);
  }

  // Request permission via frontend
  // The frontend will poll /api/permissions/pending or we can use WebSocket/SSE
  // For now, we'll use a polling mechanism

  // Wait for permission response
  const startTime = Date.now();
  while (Date.now() - startTime < timeout) {
    const pending = pendingPermissions.get(permissionId);
    
    if (pending && pending.status !== 'pending') {
      const approved = pending.status === 'approved';
      const decision = pending.status;
      const reason = pending.reason || (approved ? 'User approved' : 'User denied');

      // Clean up
      pendingPermissions.delete(permissionId);

      if (approved) {
        console.log(`[PERMISSION] Approved: ${actionRequest.description}`);
        if (actionRequest.isSensitive) {
          console.log(`[SECURITY] User confirmed sensitive action: ${actionRequest.description}`);
        }
      } else {
        console.log(`[PERMISSION] Denied: ${actionRequest.description}`);
        if (actionRequest.isSensitive) {
          console.log(`[SECURITY] User denied sensitive action: ${actionRequest.description}`);
        }
      }

      return { approved, decision, reason };
    }

    // Wait a bit before checking again
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Timeout - default to deny
  pendingPermissions.delete(permissionId);
  console.log(`[PERMISSION] Timeout - denied by default: ${actionRequest.description}`);
  
  return {
    approved: false,
    decision: 'timeout',
    reason: 'Permission request timed out. Defaulting to deny for safety.'
  };
}

/**
 * Approve a pending permission
 * @param {string} permissionId - Permission ID
 * @param {string} reason - Optional reason
 */
export function approvePermission(permissionId, reason = '') {
  const pending = pendingPermissions.get(permissionId);
  if (pending) {
    pending.status = 'approved';
    pending.reason = reason;
    console.log(`[PERMISSION] Approved: ${permissionId} - ${pending.actionRequest.description}`);
    return true;
  }
  return false;
}

/**
 * Deny a pending permission
 * @param {string} permissionId - Permission ID
 * @param {string} reason - Optional reason
 */
export function denyPermission(permissionId, reason = '') {
  const pending = pendingPermissions.get(permissionId);
  if (pending) {
    pending.status = 'denied';
    pending.reason = reason;
    console.log(`[PERMISSION] Denied: ${permissionId} - ${pending.actionRequest.description}`);
    return true;
  }
  return false;
}

/**
 * Get pending permissions
 * @returns {Array} - Array of pending permission objects
 */
export function getPendingPermissions() {
  return Array.from(pendingPermissions.values())
    .filter(p => p.status === 'pending')
    .map(p => ({
      id: p.id,
      description: p.actionRequest.description,
      isSensitive: p.isSensitive,
      timestamp: p.timestamp
    }));
}

/**
 * Check if action is hard-blocked
 */
function isHardBlocked(actionRequest) {
  const { action, params } = actionRequest;
  const actionLower = action.toLowerCase();

  // Hard-blocked actions
  const blockedActions = [
    'format',
    'delete_system',
    'modify_registry',
    'disable_antivirus',
    'disable_firewall',
    'bypass_security'
  ];

  // Check action name
  if (blockedActions.some(blocked => actionLower.includes(blocked))) {
    return true;
  }

  // Check for system32 paths
  if (params && typeof params === 'object') {
    const paramsStr = JSON.stringify(params).toLowerCase();
    if (paramsStr.includes('system32') || paramsStr.includes('c:\\windows\\system32')) {
      return true;
    }
  }

  return false;
}

/**
 * Clear all pending permissions (for abort)
 */
export function clearAllPermissions() {
  pendingPermissions.clear();
  console.log(`[SECURITY] All pending permissions cleared`);
}

