/**
 * Complaint Audit Log Utility for Seva Setu
 */

export function createAuditEntry(action, actorName = 'System', actorRole = 'system', comments = '') {
  return {
    id: `audit_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    action,
    actor_name: actorName,
    actor_role: actorRole,
    comments,
    timestamp: new Date().toISOString()
  };
}

export function appendAuditLog(existingLogs = [], newEntry) {
  const logs = Array.isArray(existingLogs) ? existingLogs : [];
  return [newEntry, ...logs];
}
