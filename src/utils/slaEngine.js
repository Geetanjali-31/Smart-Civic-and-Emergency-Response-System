/**
 * SLA & Escalation Engine for Seva Setu
 */

export const SLA_HOURS = {
  Critical: 2,
  High: 12,
  Medium: 24,
  Low: 48
};

/**
 * Calculates the SLA due date timestamp based on priority and created_at date
 */
export function calculateSlaDueDate(createdDateStr, priority = 'Medium') {
  const created = createdDateStr ? new Date(createdDateStr) : new Date();
  const hours = SLA_HOURS[priority] || 24;
  const dueDate = new Date(created.getTime() + hours * 60 * 60 * 1000);
  return dueDate.toISOString();
}

/**
 * Evaluates the SLA status and escalation level of a request
 */
export function getSlaStatus(request) {
  if (['resolved', 'completed', 'closed'].includes((request.status || '').toLowerCase())) {
    return {
      status: 'RESOLVED',
      isBreached: false,
      remainingMinutes: 0,
      escalationLevel: request.escalation_level || 'none'
    };
  }

  const dueDate = request.sla_due_at 
    ? new Date(request.sla_due_at) 
    : new Date(calculateSlaDueDate(request.created_at, request.priority));
    
  const now = new Date();
  const remainingMs = dueDate.getTime() - now.getTime();
  const remainingMinutes = Math.floor(remainingMs / (1000 * 60));

  let status = 'ON_TIME';
  let isBreached = false;
  let escalationLevel = 'none';

  if (remainingMinutes <= 0) {
    status = 'BREACHED';
    isBreached = true;
    
    // Multi-tier escalation path based on overdue time
    const overdueHours = Math.abs(remainingMinutes) / 60;
    if (overdueHours > 12) {
      escalationLevel = 'admin';
    } else if (overdueHours > 4) {
      escalationLevel = 'controller';
    } else {
      escalationLevel = 'dept_head';
    }
  } else if (remainingMinutes < 60) {
    status = 'NEAR_BREACH';
  }

  return {
    status,
    isBreached,
    remainingMinutes,
    dueDate: dueDate.toISOString(),
    escalationLevel
  };
}
