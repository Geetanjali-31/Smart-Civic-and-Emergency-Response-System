/**
 * Complaint ID Generator
 * Format: [Category Code]-[Year]-[3-digit Number]
 * Examples:
 * GB-2026-001 (Garbage)
 * WL-2026-002 (Water Leakage)
 * EL-2026-003 (Electricity / Streetlight)
 * FD-2026-004 (Fire)
 * SW-2026-005 (Sewage)
 * RD-2026-006 (Road Damage / Pothole)
 */

export const CATEGORY_CODES = {
  // Civic categories
  garbage: 'GB',
  water: 'WL',
  water_leakage: 'WL',
  electricity: 'EL',
  streetlight: 'EL',
  fire: 'FD',
  fire_rescue: 'FD',
  sewage: 'SW',
  pothole: 'RD',
  road_damage: 'RD',
  
  // Emergency categories
  medical: 'MD',
  police: 'PD',
  hazard: 'HZ',
  
  // Default fallback
  other: 'CV'
};

/**
 * Returns the 2-letter Category Code based on category string
 */
export function getCategoryCode(category = '') {
  if (!category) return 'CV';
  const key = String(category).toLowerCase().trim();

  if (CATEGORY_CODES[key]) return CATEGORY_CODES[key];
  if (key.includes('garb')) return 'GB';
  if (key.includes('water')) return 'WL';
  if (key.includes('electr') || key.includes('light')) return 'EL';
  if (key.includes('fire')) return 'FD';
  if (key.includes('sewag') || key.includes('drain')) return 'SW';
  if (key.includes('pothol') || key.includes('road')) return 'RD';
  if (key.includes('medic') || key.includes('health')) return 'MD';
  if (key.includes('polic') || key.includes('crime')) return 'PD';
  if (key.includes('hazar')) return 'HZ';

  return 'CV';
}

/**
 * Generates a formatted Complaint ID: [Category Code]-[Year]-[3-digit Number]
 * @param {string} category Category name (e.g. 'garbage', 'pothole', 'fire')
 * @param {number|string} [numId] Optional database sequential ID or counter
 * @returns {string} Formatted ID, e.g., "GB-2026-001"
 */
export function generateComplaintId(category, numId = null) {
  const code = getCategoryCode(category);
  const year = new Date().getFullYear();

  let serialStr = '';

  if (numId !== null && numId !== undefined && numId !== '') {
    const parsedNum = typeof numId === 'number' ? numId : parseInt(numId, 10);
    if (!isNaN(parsedNum) && parsedNum > 0 && parsedNum < 100000) {
      // If it's a normal database auto-increment ID
      const num = ((parsedNum - 1) % 999) + 1;
      serialStr = String(num).padStart(3, '0');
    }
  }

  // If no database numeric ID was provided, use localStorage auto-increment counter per category & year
  if (!serialStr) {
    const counterKey = `complaint_counter_${code}_${year}`;
    const currentCount = (parseInt(localStorage.getItem(counterKey) || '0', 10) % 999) + 1;
    localStorage.setItem(counterKey, currentCount.toString());
    serialStr = String(currentCount).padStart(3, '0');
  }

  return `${code}-${year}-${serialStr}`;
}
