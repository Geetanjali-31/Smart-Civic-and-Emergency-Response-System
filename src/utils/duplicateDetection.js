/**
 * Duplicate Complaint Detection Engine
 * Uses Haversine distance & category matching to prevent redundant ticket creation.
 */

function calculateDistance(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return Infinity;
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
}

/**
 * Finds potential duplicate complaints within a 500m radius (0.5km) with matching category
 */
export function findPotentialDuplicates(newCategory, lat, lng, existingServices = []) {
  if (!lat || !lng || !existingServices || existingServices.length === 0) {
    return [];
  }

  const newCat = (newCategory || '').toLowerCase();
  const radiusKm = 0.5; // 500 meters

  return existingServices.filter((service) => {
    // Only check unresolved complaints
    if (['resolved', 'completed', 'closed'].includes((service.status || '').toLowerCase())) {
      return false;
    }

    // Match category
    const sCat = (service.sub_category || service.category || '').toLowerCase();
    const isCatMatch = sCat === newCat || newCat.includes(sCat) || sCat.includes(newCat);
    if (!isCatMatch) return false;

    // Check distance
    const sLat = parseFloat(service.latitude || service.lat);
    const sLng = parseFloat(service.longitude || service.lng);
    const dist = calculateDistance(lat, lng, sLat, sLng);

    return dist <= radiusKm;
  }).map(service => ({
    ...service,
    distanceMeters: Math.round(calculateDistance(lat, lng, parseFloat(service.latitude || service.lat), parseFloat(service.longitude || service.lng)) * 1000)
  }));
}
