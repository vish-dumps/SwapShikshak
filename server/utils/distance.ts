/**
 * Calculate the distance between two points using the Haversine formula
 * @param lat1 Latitude of first point
 * @param lon1 Longitude of first point
 * @param lat2 Latitude of second point
 * @param lon2 Longitude of second point
 * @returns Distance in kilometers
 */
export function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Get approximate coordinates for Bihar districts
 * In a real application, this would be fetched from a geocoding service
 */
export const districtCoordinates: Record<string, { lat: number; lng: number }> = {
  patna: { lat: 25.5941, lng: 85.1376 },
  gaya: { lat: 24.7955, lng: 85.0002 },
  muzaffarpur: { lat: 26.1209, lng: 85.3647 },
  darbhanga: { lat: 26.1542, lng: 85.8918 },
  bhagalpur: { lat: 25.2425, lng: 86.9842 },
  saharsa: { lat: 25.8781, lng: 86.5975 },
  purnia: { lat: 25.7776, lng: 87.4753 },
  katihar: { lat: 25.5386, lng: 87.5819 },
  begusarai: { lat: 25.4182, lng: 86.1272 },
  samastipur: { lat: 25.8538, lng: 85.7800 },
  chapra: { lat: 25.7805, lng: 84.7477 },
  sitamarhi: { lat: 26.5947, lng: 85.4897 },
  madhubani: { lat: 26.3489, lng: 86.0644 },
  supaul: { lat: 26.1266, lng: 86.6025 },
  araria: { lat: 26.1477, lng: 87.5081 },
  kishanganj: { lat: 26.1086, lng: 87.9542 },
  aurangabad: { lat: 24.7521, lng: 84.3742 },
  jehanabad: { lat: 25.2078, lng: 84.9869 },
  nalanda: { lat: 25.1372, lng: 85.4441 },
  nawada: { lat: 24.8813, lng: 85.5431 },
  rohtas: { lat: 24.9565, lng: 84.0134 },
  buxar: { lat: 25.5621, lng: 83.9730 },
  kaimur: { lat: 25.0408, lng: 83.6122 },
  gopalganj: { lat: 26.4676, lng: 84.4358 },
  siwan: { lat: 26.2194, lng: 84.3608 },
  saran: { lat: 25.9222, lng: 84.7411 },
  vaishali: { lat: 25.7207, lng: 85.1303 },
  east_champaran: { lat: 26.6447, lng: 84.9259 },
  west_champaran: { lat: 27.2307, lng: 84.2595 },
  sheohar: { lat: 26.5189, lng: 85.2961 },
  madhepura: { lat: 25.9215, lng: 86.7906 },
  khagaria: { lat: 25.5017, lng: 86.4751 },
  munger: { lat: 25.3766, lng: 86.4731 },
  lakhisarai: { lat: 25.1726, lng: 86.0920 },
  sheikhpura: { lat: 25.1394, lng: 85.8500 },
  jamui: { lat: 24.9267, lng: 86.2264 },
  banka: { lat: 24.8881, lng: 86.9219 },
  arwal: { lat: 25.2520, lng: 84.6819 },
};

export function getDistrictCoordinates(district: string): { lat: number; lng: number } | null {
  const normalized = district.toLowerCase().replace(/\s+/g, '_');
  return districtCoordinates[normalized] || null;
}
