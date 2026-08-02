/**
 * Intelligent Smart Routing & Verification Engine for Seva Setu
 * 
 * 1. Maps complaint categories to appropriate departments.
 * 2. Scans complaint title & description for keyword fingerprints to detect Category Mismatches.
 * 3. Detects incident Priority (Critical, High, Medium, Low).
 * 4. Determines whether to Fast-Track directly to Department (Critical) or flag for Controller Review (Mismatch).
 */

export const DEFAULT_DEPARTMENTS = {
  municipal: { code: 'municipal', name: 'Municipal Corporation', slaHours: { critical: 2, high: 12, medium: 24, low: 48 } },
  water: { code: 'water', name: 'Water Supply Department', slaHours: { critical: 2, high: 12, medium: 24, low: 48 } },
  electricity: { code: 'electricity', name: 'Electricity Board & Streetlights', slaHours: { critical: 2, high: 12, medium: 24, low: 48 } },
  fire: { code: 'fire', name: 'Fire & Rescue Department', slaHours: { critical: 1, high: 4, medium: 12, low: 24 } },
  health: { code: 'health', name: 'Health & Medical Services', slaHours: { critical: 1, high: 6, medium: 12, low: 24 } },
  pwd: { code: 'pwd', name: 'Public Works Department (PWD)', slaHours: { critical: 2, high: 12, medium: 24, low: 48 } },
  police: { code: 'police', name: 'Police Department', slaHours: { critical: 1, high: 4, medium: 12, low: 24 } }
};

export const CATEGORY_DEPARTMENT_MAP = {
  garbage: 'municipal',
  sewage: 'municipal',
  litter: 'municipal',
  sanitation: 'municipal',
  water: 'water',
  water_leakage: 'water',
  pipe_burst: 'water',
  drainage: 'water',
  electricity: 'electricity',
  streetlight: 'electricity',
  power: 'electricity',
  wire: 'electricity',
  fire: 'fire',
  fire_rescue: 'fire',
  gas_leak: 'fire',
  medical: 'health',
  ambulance: 'health',
  injury: 'health',
  pothole: 'pwd',
  road_damage: 'pwd',
  bridge: 'pwd',
  hazard: 'pwd',
  police: 'police',
  crime: 'police',
  other: 'municipal'
};

const KEYWORD_FINGERPRINTS = {
  fire: ['fire', 'gas leak', 'explosion', 'flame', 'smoke', 'cylinder', 'short circuit fire'],
  health: ['ambulance', 'bleeding', 'accident', 'unconscious', 'heart attack', 'hospital', 'injury', 'doctor'],
  electricity: ['electric', 'short circuit', 'sparking', 'pole', 'transformer', 'wire', 'power outage', 'streetlight', 'current'],
  water: ['water leakage', 'pipe burst', 'no water', 'contamination', 'water tank', 'main pipeline'],
  pwd: ['pothole', 'road damage', 'bridge', 'wall collapse', 'landslide', 'pavement', 'asphalt'],
  municipal: ['garbage', 'waste', 'dumping', 'sewage overflow', 'smell', 'stink', 'trash', 'dustbin'],
  police: ['theft', 'crime', 'robbery', 'fight', 'violence', 'suspicious']
};

const PRIORITY_KEYWORDS = {
  Critical: ['accident', 'ambulance', 'bleeding', 'fire', 'gas leak', 'explosion', 'building collapse', 'unconscious', 'heart attack', 'short circuit fire'],
  High: ['short circuit', 'sparking', 'downed wire', 'flood', 'pipe burst', 'person trapped', 'crime in progress', 'theft', 'sewage overflow'],
  Medium: ['pothole', 'garbage', 'streetlight', 'water leakage', 'road damage', 'no water'],
  Low: ['litter', 'noise', 'dumping', 'other']
};

/**
 * Analyzes a complaint and computes dynamic routing metadata
 */
export function analyzeAndRouteComplaint(category, title = '', description = '') {
  const text = `${title} ${description}`.toLowerCase();
  
  // 1. Initial Department Resolution
  const selectedCat = (category || 'other').toLowerCase().trim();
  let selectedDept = CATEGORY_DEPARTMENT_MAP[selectedCat] || 'municipal';
  
  // 2. Keyword Fingerprint Scan for Category Verification
  let highestMatchDept = selectedDept;
  let highestMatchCount = 0;
  
  Object.entries(KEYWORD_FINGERPRINTS).forEach(([dept, keywords]) => {
    let matchCount = 0;
    keywords.forEach(kw => {
      if (text.includes(kw)) matchCount++;
    });
    if (matchCount > highestMatchCount) {
      highestMatchCount = matchCount;
      highestMatchDept = dept;
    }
  });

  const isCategoryMismatch = highestMatchCount >= 1 && highestMatchDept !== selectedDept;
  const suggestedDept = isCategoryMismatch ? highestMatchDept : selectedDept;

  // 3. Priority Detection
  let detectedPriority = 'Medium';
  for (const [priorityLevel, keywords] of Object.entries(PRIORITY_KEYWORDS)) {
    if (keywords.some(kw => text.includes(kw))) {
      detectedPriority = priorityLevel;
      break;
    }
  }

  // Override priority if category is emergency
  if (selectedCat === 'fire' || selectedCat === 'medical' || selectedCat === 'police' || selectedCat === 'emergency') {
    if (detectedPriority !== 'Critical') detectedPriority = 'High';
  }

  // 4. Fast-Track vs Controller Gating
  const isCritical = detectedPriority === 'Critical';
  const requiresControllerReview = isCategoryMismatch && !isCritical;
  const targetDepartment = isCritical ? (isCategoryMismatch ? suggestedDept : selectedDept) : (requiresControllerReview ? selectedDept : suggestedDept);

  return {
    category: selectedCat,
    department: targetDepartment,
    suggestedDepartment: suggestedDept,
    priority: detectedPriority,
    isCategoryMismatch,
    requiresControllerReview,
    isFastTracked: isCritical,
    notifyParallel: isCritical // Parallel alert to Controller & Admin
  };
}
