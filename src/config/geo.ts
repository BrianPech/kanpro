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
      "Cholul": { name: "Cholul", coords: { lat: 21.0369, lng: -89.5539 } },
      "Dzityá": { name: "Dzityá", coords: { lat: 21.0544, lng: -89.6883 } },
      "Temozón Norte": { name: "Temozón Norte", coords: { lat: 21.0583, lng: -89.6106 } },
      "Montebello": { name: "Montebello", coords: { lat: 21.0235, lng: -89.5986 } },
      "Chuburná": { name: "Chuburná", coords: { lat: 21.0125, lng: -89.6458 } },
      "García Ginerés": { name: "García Ginerés", coords: { lat: 20.9886, lng: -89.6394 } },
      "Itzimná": { name: "Itzimná", coords: { lat: 20.9989, lng: -89.6108 } },
      "Los Héroes": { name: "Los Héroes", coords: { lat: 20.9781, lng: -89.5447 } },
      "Pensiones": { name: "Pensiones", coords: { lat: 20.9856, lng: -89.6644 } },
      "Kanasín": { name: "Kanasín", coords: { lat: 20.9328, lng: -89.5583 } },
      "Umán": { name: "Umán", coords: { lat: 20.8828, lng: -89.7467 } },
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
      "Puerto Aventuras": { name: "Puerto Aventuras", coords: { lat: 20.5019, lng: -87.2289 } },
      "Guadalupana": { name: "Guadalupana", coords: { lat: 20.6681, lng: -87.0894 } },
      "Colosio": { name: "Colosio", coords: { lat: 20.6486, lng: -87.0617 } },
    }
  },
  "Cancún": {
    name: "Cancún",
    coords: { lat: 21.1619, lng: -86.8515 },
    zones: {
      "Centro": { name: "Centro", coords: { lat: 21.1619, lng: -86.8515 } },
      "Zona Hotelera": { name: "Zona Hotelera", coords: { lat: 21.1378, lng: -86.7486 } },
      "Puerto Cancún": { name: "Puerto Cancún", coords: { lat: 21.1603, lng: -86.8122 } },
      "Huayacán": { name: "Huayacán", coords: { lat: 21.1128, lng: -86.8486 } },
      "Alfredo V. Bonfil": { name: "Alfredo V. Bonfil", coords: { lat: 21.0858, lng: -86.8453 } },
      "Prado Norte": { name: "Prado Norte", coords: { lat: 21.1969, lng: -86.9142 } },
      "Álamos": { name: "Álamos", coords: { lat: 21.1183, lng: -86.8361 } },
    }
  },
  "Tulum": {
    name: "Tulum",
    coords: { lat: 20.2114, lng: -87.4654 },
    zones: {
      "Centro": { name: "Centro", coords: { lat: 20.2114, lng: -87.4654 } },
      "La Veleta": { name: "La Veleta", coords: { lat: 20.2019, lng: -87.4786 } },
      "Aldea Zama": { name: "Aldea Zama", coords: { lat: 20.2064, lng: -87.4528 } },
      "Zona Costera": { name: "Zona Costera", coords: { lat: 20.1989, lng: -87.4356 } },
    }
  },
  "Valladolid": {
    name: "Valladolid",
    coords: { lat: 20.6897, lng: -88.2017 },
    zones: {
      "Centro": { name: "Centro", coords: { lat: 20.6897, lng: -88.2017 } },
      "Sisal": { name: "Sisal", coords: { lat: 20.6853, lng: -88.2089 } },
      "Bacalar": { name: "Bacalar", coords: { lat: 20.6936, lng: -88.1964 } },
    }
  },
  "Progreso": {
    name: "Progreso",
    coords: { lat: 21.2828, lng: -89.6644 },
    zones: {
      "Centro": { name: "Centro", coords: { lat: 21.2828, lng: -89.6644 } },
      "Chicxulub Puerto": { name: "Chicxulub Puerto", coords: { lat: 21.2981, lng: -89.6058 } },
      "Chelem": { name: "Chelem", coords: { lat: 21.2708, lng: -89.7486 } },
    }
  },
  "Campeche": {
    name: "Campeche",
    coords: { lat: 19.8301, lng: -90.5349 },
    zones: {
      "Centro Histórico": { name: "Centro Histórico", coords: { lat: 19.8453, lng: -90.5372 } },
      "San Román": { name: "San Román", coords: { lat: 19.8386, lng: -90.5431 } },
      "Samulá": { name: "Samulá", coords: { lat: 19.8156, lng: -90.5286 } },
    }
  },
  "Chetumal": {
    name: "Chetumal",
    coords: { lat: 18.5002, lng: -88.2961 },
    zones: {
      "Centro": { name: "Centro", coords: { lat: 18.5002, lng: -88.2961 } },
      "Calderitas": { name: "Calderitas", coords: { lat: 18.5564, lng: -88.2561 } },
    }
  },
  "Ciudad de México": {
    name: "Ciudad de México",
    coords: { lat: 19.4326, lng: -99.1332 },
    zones: {
      "Cuauhtémoc": { name: "Cuauhtémoc", coords: { lat: 19.4326, lng: -99.1532 } },
      "Polanco": { name: "Polanco", coords: { lat: 19.4336, lng: -99.1914 } },
      "Roma / Condesa": { name: "Roma / Condesa", coords: { lat: 19.4147, lng: -99.1672 } },
      "Benito Juárez": { name: "Benito Juárez", coords: { lat: 19.3800, lng: -99.1600 } },
      "Santa Fe": { name: "Santa Fe", coords: { lat: 19.3608, lng: -99.2589 } },
    }
  },
  "Guadalajara": {
    name: "Guadalajara",
    coords: { lat: 20.6597, lng: -103.3496 },
    zones: {
      "Centro": { name: "Centro", coords: { lat: 20.6770, lng: -103.3470 } },
      "Zapopan": { name: "Zapopan", coords: { lat: 20.7214, lng: -103.3918 } },
      "Providencia": { name: "Providencia", coords: { lat: 20.6975, lng: -103.3814 } },
    }
  },
  "Monterrey": {
    name: "Monterrey",
    coords: { lat: 25.6866, lng: -100.3161 },
    zones: {
      "Centro": { name: "Centro", coords: { lat: 25.6690, lng: -100.3100 } },
      "San Pedro": { name: "San Pedro", coords: { lat: 25.6572, lng: -100.4025 } },
      "Cumbres": { name: "Cumbres", coords: { lat: 25.7231, lng: -100.3872 } },
    }
  }
};

/**
 * Calculates distance in km between two GPS coordinates using the Haversine formula
 */
function haversineDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Finds coordinates for a given location or zone string by doing a simple partial match.
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
    if (lowerLoc.includes(city.name.toLowerCase()) || city.name.toLowerCase().includes(lowerLoc)) {
      return city.coords;
    }
  }

  return null;
}

/**
 * Finds the nearest city and zone from GEO_CONFIG given lat/lng coordinates using Haversine.
 */
export function findNearestCityAndZone(lat: number, lng: number): { city: string; zone: string } {
  let minDistance = Infinity;
  let bestCity = "Mérida";
  let bestZone = "Centro Mérida";

  for (const [cityName, cityInfo] of Object.entries(GEO_CONFIG)) {
    for (const [zoneName, zoneInfo] of Object.entries(cityInfo.zones)) {
      const dist = haversineDistanceKm(lat, lng, zoneInfo.coords.lat, zoneInfo.coords.lng);
      if (dist < minDistance) {
        minDistance = dist;
        bestCity = cityName;
        bestZone = zoneName;
      }
    }
  }

  return { city: bestCity, zone: bestZone };
}

/**
 * Accurate Reverse Geocoding with multi-provider fallback.
 * Resolves precise real-world City and Zone/Neighborhood from GPS coordinates.
 */
export async function resolveLocationFromCoords(
  lat: number,
  lng: number
): Promise<{ city: string; zone: string; displayLocation: string }> {
  // 1. Try OpenStreetMap Nominatim
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      {
        signal: controller.signal,
        headers: { "Accept-Language": "es" }
      }
    );
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data && data.address) {
        const addr = data.address;
        const rawCity =
          addr.city ||
          addr.town ||
          addr.municipality ||
          addr.county ||
          addr.state_district ||
          addr.state ||
          "";

        const rawZone =
          addr.suburb ||
          addr.neighbourhood ||
          addr.quarter ||
          addr.residential ||
          addr.city_district ||
          addr.road ||
          "";

        // Check if rawCity matches any known GEO_CONFIG city
        const matchedCityKey = Object.keys(GEO_CONFIG).find((k) =>
          rawCity.toLowerCase().includes(k.toLowerCase()) || k.toLowerCase().includes(rawCity.toLowerCase())
        );

        const finalCity = matchedCityKey || rawCity || "Mérida";
        let finalZone = rawZone;

        if (!finalZone && matchedCityKey && GEO_CONFIG[matchedCityKey]) {
          // If no specific suburb found, pick the closest zone in that city
          let closestZone = Object.keys(GEO_CONFIG[matchedCityKey].zones)[0] || "Centro";
          let closestDist = Infinity;
          for (const [zName, zInfo] of Object.entries(GEO_CONFIG[matchedCityKey].zones)) {
            const d = haversineDistanceKm(lat, lng, zInfo.coords.lat, zInfo.coords.lng);
            if (d < closestDist) {
              closestDist = d;
              closestZone = zName;
            }
          }
          finalZone = closestZone;
        } else if (!finalZone) {
          finalZone = "Centro";
        }

        return {
          city: finalCity,
          zone: finalZone,
          displayLocation: `${finalCity} - ${finalZone}`
        };
      }
    }
  } catch (e) {
    // Nominatim failed or timed out, try secondary fallback
  }

  // 2. Try BigDataCloud Client-side Reverse Geocoder (fast, free, no auth)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const bdcRes = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=es`,
      { signal: controller.signal }
    );
    clearTimeout(timeoutId);

    if (bdcRes.ok) {
      const bdcData = await bdcRes.json();
      const rawCity = bdcData.city || bdcData.locality || bdcData.principalSubdivision || "";
      const rawZone = bdcData.localityInfo?.administrative?.[3]?.name || bdcData.localityInfo?.informative?.[0]?.name || "";

      const matchedCityKey = Object.keys(GEO_CONFIG).find((k) =>
        rawCity.toLowerCase().includes(k.toLowerCase()) || k.toLowerCase().includes(rawCity.toLowerCase())
      );

      const finalCity = matchedCityKey || rawCity || "Mérida";
      const finalZone = rawZone || "Centro";

      return {
        city: finalCity,
        zone: finalZone,
        displayLocation: `${finalCity} - ${finalZone}`
      };
    }
  } catch (e) {
    // Fallback to geometric nearest
  }

  // 3. Fallback: geometric nearest city and zone using Haversine
  const nearest = findNearestCityAndZone(lat, lng);
  return {
    city: nearest.city,
    zone: nearest.zone,
    displayLocation: `${nearest.city} - ${nearest.zone}`
  };
}
