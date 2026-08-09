export interface GeoCoordinate {
  lat: number;
  lng: number;
}

export interface ZoneInfo {
  name: string;
  coords: GeoCoordinate;
}

export interface CityInfo {
  name: string;
  coords: GeoCoordinate;
  zones: Record<string, ZoneInfo>;
}

export const GEO_CONFIG: Record<string, CityInfo> = {
  "Mérida": {
    name: "Mérida",
    coords: { lat: 20.9676, lng: -89.6241 },
    zones: {
      "Centro Mérida": { name: "Centro Mérida", coords: { lat: 20.9676, lng: -89.6241 } },
      "Altabrisa": { name: "Altabrisa", coords: { lat: 21.0163, lng: -89.5888 } },
      "Caucel": { name: "Caucel", coords: { lat: 20.9996, lng: -89.7022 } },
      "Las Américas": { name: "Las Américas", coords: { lat: 21.0664, lng: -89.6406 } },
      "Francisco de Montejo": { name: "Francisco de Montejo", coords: { lat: 21.0264, lng: -89.6335 } },
      "Kanasín": { name: "Kanasín", coords: { lat: 20.9328, lng: -89.5583 } },
      "Paseo de Montejo": { name: "Paseo de Montejo", coords: { lat: 20.9882, lng: -89.6171 } },
    }
  },
  "Playa del Carmen": {
    name: "Playa del Carmen",
    coords: { lat: 20.6296, lng: -87.0739 },
    zones: {
      "Centro": { name: "Centro", coords: { lat: 20.6296, lng: -87.0739 } },
      "Villas del Sol": { name: "Villas del Sol", coords: { lat: 20.6625, lng: -87.1147 } },
      "Playacar": { name: "Playacar", coords: { lat: 20.6125, lng: -87.0858 } },
      "Ejido": { name: "Ejido", coords: { lat: 20.6394, lng: -87.0942 } },
      "Gonzalitos": { name: "Gonzalitos", coords: { lat: 20.6450, lng: -87.0680 } },
    }
  }
};

/**
 * Finds coordinates for a given location or zone string by doing a simple partial match.
 * Falls back to city center coordinates if no zone matches, or null if city doesn't match either.
 */
export function getCoordsForZone(locationStr: string | null | undefined): GeoCoordinate | null {
  if (!locationStr) return null;
  const lowerLoc = locationStr.toLowerCase();

  // Search in zones first
  for (const cityKey of Object.keys(GEO_CONFIG)) {
    const city = GEO_CONFIG[cityKey];
    for (const zoneKey of Object.keys(city.zones)) {
      const zone = city.zones[zoneKey];
      if (lowerLoc.includes(zone.name.toLowerCase()) || zone.name.toLowerCase().includes(lowerLoc)) {
        return zone.coords;
      }
    }
  }

  // If no zone match, try matching the city name
  for (const cityKey of Object.keys(GEO_CONFIG)) {
    const city = GEO_CONFIG[cityKey];
    if (lowerLoc.includes(city.name.toLowerCase())) {
      return city.coords;
    }
  }

  return null;
}

/**
 * Finds the nearest city and zone from GEO_CONFIG given lat/lng coordinates.
 */
export function findNearestCityAndZone(lat: number, lng: number): { city: string; zone: string } {
  let minDistance = Infinity;
  let bestCity = "Mérida";
  let bestZone = "Centro Mérida";

  for (const [cityName, cityInfo] of Object.entries(GEO_CONFIG)) {
    for (const [zoneName, zoneInfo] of Object.entries(cityInfo.zones)) {
      const dLat = zoneInfo.coords.lat - lat;
      const dLng = zoneInfo.coords.lng - lng;
      const dist = dLat * dLat + dLng * dLng;
      if (dist < minDistance) {
        minDistance = dist;
        bestCity = cityName;
        bestZone = zoneName;
      }
    }
  }

  return { city: bestCity, zone: bestZone };
}
