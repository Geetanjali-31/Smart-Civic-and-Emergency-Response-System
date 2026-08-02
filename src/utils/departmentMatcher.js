/**
 * departmentMatcher.js
 * 
 * Centralized utility that maps ANY department name string to
 * a canonical key, and filters complaints to match a department.
 * Supports: municipal, water, electricity, fire, health/medical,
 * pwd/roads, police/law, environment, etc.
 */

export const DEPT_LABELS = {
  all: 'All Departments',
  municipal: '🧹 Municipal Corporation',
  water: '💧 Water Supply',
  electricity: '⚡ Electricity Board',
  fire: '🚒 Fire & Rescue',
  health: '🏥 Health & Medical',
  pwd: '🛣️ Public Works (PWD)',
  police: '🚔 Police & Law Enforcement',
  environment: '🌿 Environment & Sanitation',
};

/**
 * Normalize any department string to a canonical dept key.
 * Returns 'all' if unknown (superadmin / unconstrained).
 */
export function normalizeDepartment(dept) {
  if (!dept) return 'all';
  const d = dept.toLowerCase().trim();

  if (d === 'all' || d === 'admin' || d === 'superadmin' || d === 'system') return 'all';
  if (d.includes('munic') || d.includes('sanit') || d.includes('garb') || d.includes('waste')) return 'municipal';
  if (d.includes('water') || d.includes('sewag') || d.includes('drain')) return 'water';
  if (d.includes('electr') || d.includes('power') || d.includes('light')) return 'electricity';
  if (d.includes('fire') || d.includes('rescue') || d.includes('emerg')) return 'fire';
  if (d.includes('health') || d.includes('medic') || d.includes('hospital') || d.includes('ambu')) return 'health';
  if (d.includes('road') || d.includes('pwd') || d.includes('public work') || d.includes('pothol') || d.includes('infra')) return 'pwd';
  if (d.includes('polic') || d.includes('law') || d.includes('crime') || d.includes('security')) return 'police';
  if (d.includes('environ') || d.includes('pollut') || d.includes('green') || d.includes('park')) return 'environment';

  return 'all'; // unknown department = see all (safety fallback)
}

/**
 * Check if a complaint issue matches the given canonical department key.
 */
export function issueMatchesDepartment(issue, deptKey) {
  if (!deptKey || deptKey === 'all') return true;

  const issueDept = (issue.department || '').toLowerCase().trim();
  const cat = (issue.category || '').toLowerCase();
  const subCat = (issue.sub_category || '').toLowerCase();
  const title = (issue.title || '').toLowerCase();
  const desc = (issue.description || '').toLowerCase();

  switch (deptKey) {
    case 'health':
      return (
        issueDept === 'health' ||
        cat.includes('medic') || cat.includes('health') || cat.includes('hospital') || cat.includes('ambu') ||
        subCat.includes('medic') || subCat.includes('health') ||
        title.includes('medic') || title.includes('health') || title.includes('hospital') || title.includes('ambu') ||
        desc.includes('medic') || desc.includes('hospital')
      );

    case 'water':
      return (
        issueDept === 'water' ||
        cat.includes('water') || cat.includes('sewag') || cat.includes('drain') ||
        subCat.includes('water') || subCat.includes('sewag') ||
        title.includes('water') || title.includes('sewag') || title.includes('pipeline') || title.includes('drain')
      );

    case 'electricity':
      return (
        issueDept === 'electricity' ||
        cat.includes('electr') || cat.includes('power') || cat.includes('light') || cat.includes('wire') ||
        subCat.includes('electr') || subCat.includes('light') ||
        title.includes('electr') || title.includes('power') || title.includes('light') || title.includes('wire')
      );

    case 'fire':
      return (
        issueDept === 'fire' ||
        cat.includes('fire') || cat.includes('rescue') ||
        subCat.includes('fire') ||
        title.includes('fire') || title.includes('rescue') || title.includes('burning')
      );

    case 'pwd':
      return (
        issueDept === 'pwd' ||
        cat.includes('road') || cat.includes('pothol') || cat.includes('infra') || cat.includes('bridge') || cat.includes('footpath') ||
        subCat.includes('road') || subCat.includes('pothol') ||
        title.includes('road') || title.includes('pothol') || title.includes('bridge') || title.includes('footpath')
      );

    case 'municipal':
      return (
        issueDept === 'municipal' ||
        cat.includes('garb') || cat.includes('waste') || cat.includes('clean') || cat.includes('civic') || cat.includes('sewag') ||
        subCat.includes('garb') || subCat.includes('waste') ||
        title.includes('garb') || title.includes('waste') || title.includes('clean')
      );

    case 'police':
      return (
        issueDept === 'police' ||
        cat.includes('polic') || cat.includes('crime') || cat.includes('law') || cat.includes('security') || cat.includes('theft') || cat.includes('accident') ||
        subCat.includes('polic') || subCat.includes('crime') ||
        title.includes('polic') || title.includes('crime') || title.includes('theft') || title.includes('accident') || title.includes('law')
      );

    case 'environment':
      return (
        issueDept === 'environment' ||
        cat.includes('environ') || cat.includes('pollut') || cat.includes('green') || cat.includes('park') || cat.includes('tree') ||
        title.includes('environ') || title.includes('pollut') || title.includes('park') || title.includes('tree')
      );

    default:
      // Generic fallback - match by exact dept code
      return issueDept === deptKey;
  }
}

/**
 * Filter an array of issues by department key.
 */
export function filterIssuesByDepartment(issues, deptKey) {
  if (!deptKey || deptKey === 'all') return issues;
  return (issues || []).filter(issue => issueMatchesDepartment(issue, deptKey));
}
