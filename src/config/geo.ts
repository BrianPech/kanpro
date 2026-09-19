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
  state: "Quintana Roo" | "Yucatán" | "Campeche" | "Nacional";
  coords: GeoCoordinate;
  zones: Record<string, ZoneInfo>;
}

export const GEO_CONFIG: Record<string, CityInfo> = {
  // ==========================================
  // QUINTANA ROO (All 11 Municipalities & Hubs)
  // ==========================================
  "Felipe Carrillo Puerto": {
    name: "Felipe Carrillo Puerto",
    state: "Quintana Roo",
    coords: { lat: 19.5775, lng: -88.0454 },
    zones: {
      "Centro": { name: "Centro", coords: { lat: 19.5775, lng: -88.0454 } },
      "Cecilio Chi": { name: "Cecilio Chi", coords: { lat: 19.5850, lng: -88.0400 } },
      "Leona Vicario": { name: "Leona Vicario", coords: { lat: 19.5710, lng: -88.0510 } },
      "Tihosuco": { name: "Tihosuco", coords: { lat: 20.1983, lng: -88.3739 } },
      "Señor": { name: "Señor", coords: { lat: 19.7833, lng: -88.1167 } },
      "Tepich": { name: "Tepich", coords: { lat: 20.2400, lng: -88.2567 } },
      "Chunhuhub": { name: "Chunhuhub", coords: { lat: 19.5833, lng: -88.5833 } },
      "Noh-Bec": { name: "Noh-Bec", coords: { lat: 19.1233, lng: -88.1700 } },
    }
  },
  "Playa del Carmen": {
    name: "Playa del Carmen",
    state: "Quintana Roo",
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
    state: "Quintana Roo",
    coords: { lat: 21.1619, lng: -86.8515 },
    zones: {
      "Centro": { name: "Centro", coords: { lat: 21.1619, lng: -86.8515 } },
      "Zona Hotelera": { name: "Zona Hotelera", coords: { lat: 21.1378, lng: -86.7486 } },
      "Puerto Cancún": { name: "Puerto Cancún", coords: { lat: 21.1603, lng: -86.8122 } },
      "Huayacán": { name: "Huayacán", coords: { lat: 21.1128, lng: -86.8486 } },
      "Alfredo V. Bonfil": { name: "Alfredo V. Bonfil", coords: { lat: 21.0858, lng: -86.8453 } },
      "Prado Norte": { name: "Prado Norte", coords: { lat: 21.1969, lng: -86.9142 } },
      "Álamos": { name: "Álamos", coords: { lat: 21.1183, lng: -86.8361 } },
      "Villas Otoch": { name: "Villas Otoch", coords: { lat: 21.1890, lng: -86.8850 } },
    }
  },
  "Tulum": {
    name: "Tulum",
    state: "Quintana Roo",
    coords: { lat: 20.2114, lng: -87.4654 },
    zones: {
      "Centro": { name: "Centro", coords: { lat: 20.2114, lng: -87.4654 } },
      "La Veleta": { name: "La Veleta", coords: { lat: 20.2019, lng: -87.4786 } },
      "Aldea Zama": { name: "Aldea Zama", coords: { lat: 20.2064, lng: -87.4528 } },
      "Zona Costera": { name: "Zona Costera", coords: { lat: 20.1989, lng: -87.4356 } },
      "Akumal": { name: "Akumal", coords: { lat: 20.3967, lng: -87.3150 } },
      "Chemuyil": { name: "Chemuyil", coords: { lat: 20.3500, lng: -87.3500 } },
    }
  },
  "Chetumal": {
    name: "Chetumal",
    state: "Quintana Roo",
    coords: { lat: 18.5002, lng: -88.2961 },
    zones: {
      "Centro": { name: "Centro", coords: { lat: 18.5002, lng: -88.2961 } },
      "Calderitas": { name: "Calderitas", coords: { lat: 18.5564, lng: -88.2561 } },
      "Payo Obispo": { name: "Payo Obispo", coords: { lat: 18.5140, lng: -88.3120 } },
      "Mahahual": { name: "Mahahual", coords: { lat: 18.7139, lng: -87.7089 } },
    }
  },
  "Bacalar": {
    name: "Bacalar",
    state: "Quintana Roo",
    coords: { lat: 18.6779, lng: -88.3934 },
    zones: {
      "Centro": { name: "Centro", coords: { lat: 18.6779, lng: -88.3934 } },
      "Costera Bacalar": { name: "Costera Bacalar", coords: { lat: 18.6820, lng: -88.3880 } },
      "Mario Villanueva": { name: "Mario Villanueva", coords: { lat: 18.6710, lng: -88.4020 } },
      "Magisterial": { name: "Magisterial", coords: { lat: 18.6850, lng: -88.3990 } },
    }
  },
  "Cozumel": {
    name: "Cozumel",
    state: "Quintana Roo",
    coords: { lat: 20.5083, lng: -86.9458 },
    zones: {
      "Centro": { name: "Centro", coords: { lat: 20.5083, lng: -86.9458 } },
      "Corpus Christi": { name: "Corpus Christi", coords: { lat: 20.4980, lng: -86.9520 } },
      "San Miguel": { name: "San Miguel", coords: { lat: 20.5120, lng: -86.9410 } },
      "Zona Hotelera Norte": { name: "Zona Hotelera Norte", coords: { lat: 20.5450, lng: -86.9180 } },
      "Zona Hotelera Sur": { name: "Zona Hotelera Sur", coords: { lat: 20.4450, lng: -86.9950 } },
    }
  },
  "Puerto Morelos": {
    name: "Puerto Morelos",
    state: "Quintana Roo",
    coords: { lat: 20.8493, lng: -86.8778 },
    zones: {
      "Centro / Puerto": { name: "Centro / Puerto", coords: { lat: 20.8493, lng: -86.8778 } },
      "Colonia Cetina Gasca": { name: "Colonia Cetina Gasca", coords: { lat: 20.8620, lng: -86.8980 } },
      "Ruta de los Cenotes": { name: "Ruta de los Cenotes", coords: { lat: 20.8750, lng: -86.9550 } },
      "Leona Vicario": { name: "Leona Vicario", coords: { lat: 20.9850, lng: -87.1850 } },
    }
  },
  "Isla Mujeres": {
    name: "Isla Mujeres",
    state: "Quintana Roo",
    coords: { lat: 21.2319, lng: -86.7314 },
    zones: {
      "Centro": { name: "Centro", coords: { lat: 21.2319, lng: -86.7314 } },
      "Playa Norte": { name: "Playa Norte", coords: { lat: 21.2580, lng: -86.7510 } },
      "Punta Sur": { name: "Punta Sur", coords: { lat: 21.2050, lng: -86.7110 } },
      "Zona Continental / Playa Mujeres": { name: "Zona Continental / Playa Mujeres", coords: { lat: 21.2450, lng: -86.8080 } },
    }
  },
  "José María Morelos": {
    name: "José María Morelos",
    state: "Quintana Roo",
    coords: { lat: 19.7472, lng: -88.7092 },
    zones: {
      "Centro": { name: "Centro", coords: { lat: 19.7472, lng: -88.7092 } },
      "Vicente Guerrero": { name: "Vicente Guerrero", coords: { lat: 19.7520, lng: -88.7020 } },
      "Miraflores": { name: "Miraflores", coords: { lat: 19.7410, lng: -88.7150 } },
      "Dziuché": { name: "Dziuché", coords: { lat: 19.9100, lng: -88.8050 } },
    }
  },
  "Lázaro Cárdenas": {
    name: "Lázaro Cárdenas",
    state: "Quintana Roo",
    coords: { lat: 21.1983, lng: -87.4900 },
    zones: {
      "Kantunilkín": { name: "Kantunilkín", coords: { lat: 21.1983, lng: -87.4900 } },
      "Isla Holbox": { name: "Isla Holbox", coords: { lat: 21.5283, lng: -87.3789 } },
      "Chiquilá": { name: "Chiquilá", coords: { lat: 21.4333, lng: -87.4167 } },
      "Solferino": { name: "Solferino", coords: { lat: 21.3500, lng: -87.4500 } },
    }
  },

  // ==========================================
  // YUCATÁN (Key Cities & Municipalities)
  // ==========================================
  "Mérida": {
    name: "Mérida",
    state: "Yucatán",
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
      "Paseo de Montejo": { name: "Paseo de Montejo", coords: { lat: 20.9882, lng: -89.6171 } },
    }
  },
  "Kanasín": {
    name: "Kanasín",
    state: "Yucatán",
    coords: { lat: 20.9328, lng: -89.5583 },
    zones: {
      "Centro": { name: "Centro", coords: { lat: 20.9328, lng: -89.5583 } },
      "San Camilo": { name: "San Camilo", coords: { lat: 20.9450, lng: -89.5700 } },
      "Villas de Oriente": { name: "Villas de Oriente", coords: { lat: 20.9520, lng: -89.5510 } },
      "Santa Isabel": { name: "Santa Isabel", coords: { lat: 20.9250, lng: -89.5620 } },
    }
  },
  "Umán": {
    name: "Umán",
    state: "Yucatán",
    coords: { lat: 20.8828, lng: -89.7467 },
    zones: {
      "Centro": { name: "Centro", coords: { lat: 20.8828, lng: -89.7467 } },
      "San Lorenzo": { name: "San Lorenzo", coords: { lat: 20.8750, lng: -89.7390 } },
      "Zona Industrial": { name: "Zona Industrial", coords: { lat: 20.9010, lng: -89.7210 } },
      "Itzimná": { name: "Itzimná", coords: { lat: 20.8920, lng: -89.7530 } },
    }
  },
  "Valladolid": {
    name: "Valladolid",
    state: "Yucatán",
    coords: { lat: 20.6897, lng: -88.2017 },
    zones: {
      "Centro": { name: "Centro", coords: { lat: 20.6897, lng: -88.2017 } },
      "Sisal": { name: "Sisal", coords: { lat: 20.6853, lng: -88.2089 } },
      "Bacalar": { name: "Bacalar", coords: { lat: 20.6936, lng: -88.1964 } },
      "San Juan": { name: "San Juan", coords: { lat: 20.6980, lng: -88.2050 } },
      "Chichén Itzá / Pisté": { name: "Chichén Itzá / Pisté", coords: { lat: 20.6830, lng: -88.5830 } },
    }
  },
  "Progreso": {
    name: "Progreso",
    state: "Yucatán",
    coords: { lat: 21.2828, lng: -89.6644 },
    zones: {
      "Centro": { name: "Centro", coords: { lat: 21.2828, lng: -89.6644 } },
      "Chicxulub Puerto": { name: "Chicxulub Puerto", coords: { lat: 21.2981, lng: -89.6058 } },
      "Chelem": { name: "Chelem", coords: { lat: 21.2708, lng: -89.7486 } },
      "Chuburná Puerto": { name: "Chuburná Puerto", coords: { lat: 21.2580, lng: -89.8320 } },
    }
  },
  "Tizimín": {
    name: "Tizimín",
    state: "Yucatán",
    coords: { lat: 21.1428, lng: -88.1506 },
    zones: {
      "Centro": { name: "Centro", coords: { lat: 21.1428, lng: -88.1506 } },
      "Santa Cruz": { name: "Santa Cruz", coords: { lat: 21.1490, lng: -88.1420 } },
      "San Martín": { name: "San Martín", coords: { lat: 21.1350, lng: -88.1580 } },
      "El Palmar": { name: "El Palmar", coords: { lat: 21.1520, lng: -88.1610 } },
    }
  },
  "Motul": {
    name: "Motul",
    state: "Yucatán",
    coords: { lat: 21.0967, lng: -89.2828 },
    zones: {
      "Centro": { name: "Centro", coords: { lat: 21.0967, lng: -89.2828 } },
      "Felipe Carrillo Puerto": { name: "Felipe Carrillo Puerto", coords: { lat: 21.1020, lng: -89.2750 } },
      "San Román": { name: "San Román", coords: { lat: 21.0910, lng: -89.2910 } },
    }
  },
  "Ticul": {
    name: "Ticul",
    state: "Yucatán",
    coords: { lat: 20.3986, lng: -89.5333 },
    zones: {
      "Centro": { name: "Centro", coords: { lat: 20.3986, lng: -89.5333 } },
      "San Enrique": { name: "San Enrique", coords: { lat: 20.4050, lng: -89.5280 } },
      "Mejorada": { name: "Mejorada", coords: { lat: 20.3920, lng: -89.5390 } },
    }
  },
  "Tekax": {
    name: "Tekax",
    state: "Yucatán",
    coords: { lat: 20.2033, lng: -89.2858 },
    zones: {
      "Centro": { name: "Centro", coords: { lat: 20.2033, lng: -89.2858 } },
      "San Francisco": { name: "San Francisco", coords: { lat: 20.2090, lng: -89.2810 } },
      "Lázaro Cárdenas": { name: "Lázaro Cárdenas", coords: { lat: 20.1980, lng: -89.2920 } },
    }
  },
  "Izamal": {
    name: "Izamal",
    state: "Yucatán",
    coords: { lat: 20.9347, lng: -89.0194 },
    zones: {
      "Centro Histórico": { name: "Centro Histórico", coords: { lat: 20.9347, lng: -89.0194 } },
      "San Ildefonso": { name: "San Ildefonso", coords: { lat: 20.9410, lng: -89.0120 } },
      "Santo Domingo": { name: "Santo Domingo", coords: { lat: 20.9280, lng: -89.0250 } },
    }
  },
  "Hunucmá": {
    name: "Hunucmá",
    state: "Yucatán",
    coords: { lat: 21.0167, lng: -89.8667 },
    zones: {
      "Centro": { name: "Centro", coords: { lat: 21.0167, lng: -89.8667 } },
      "Sisal Puerto": { name: "Sisal Puerto", coords: { lat: 21.1642, lng: -90.0336 } },
      "San Vicente": { name: "San Vicente", coords: { lat: 21.0100, lng: -89.8750 } },
    }
  },
  "Oxkutzcab": {
    name: "Oxkutzcab",
    state: "Yucatán",
    coords: { lat: 20.3067, lng: -89.4189 },
    zones: {
      "Centro": { name: "Centro", coords: { lat: 20.3067, lng: -89.4189 } },
      "San Antonio": { name: "San Antonio", coords: { lat: 20.3120, lng: -89.4120 } },
      "Santuario": { name: "Santuario", coords: { lat: 20.3010, lng: -89.4250 } },
    }
  },
  "Maxcanú": {
    name: "Maxcanú",
    state: "Yucatán",
    coords: { lat: 20.5833, lng: -89.9989 },
    zones: {
      "Centro": { name: "Centro", coords: { lat: 20.5833, lng: -89.9989 } },
      "Zaragoza": { name: "Zaragoza", coords: { lat: 20.5890, lng: -89.9920 } },
    }
  },
  "Peto": {
    name: "Peto",
    state: "Yucatán",
    coords: { lat: 20.1250, lng: -88.9222 },
    zones: {
      "Centro": { name: "Centro", coords: { lat: 20.1250, lng: -88.9222 } },
      "Francisco Sarabia": { name: "Francisco Sarabia", coords: { lat: 20.1310, lng: -88.9160 } },
    }
  },

  // ==========================================
  // CAMPECHE & METROPOLITAN
  // ==========================================
  "Campeche": {
    name: "Campeche",
    state: "Campeche",
    coords: { lat: 19.8301, lng: -90.5349 },
    zones: {
      "Centro Histórico": { name: "Centro Histórico", coords: { lat: 19.8453, lng: -90.5372 } },
      "San Román": { name: "San Román", coords: { lat: 19.8386, lng: -90.5431 } },
      "Samulá": { name: "Samulá", coords: { lat: 19.8156, lng: -90.5286 } },
    }
  },
  "Ciudad del Carmen": {
    name: "Ciudad del Carmen",
    state: "Campeche",
    coords: { lat: 18.6433, lng: -91.8292 },
    zones: {
      "Centro": { name: "Centro", coords: { lat: 18.6433, lng: -91.8292 } },
      "Playa Norte": { name: "Playa Norte", coords: { lat: 18.6610, lng: -91.8150 } },
      "Isla de Tris": { name: "Isla de Tris", coords: { lat: 18.6520, lng: -91.7850 } },
    }
  },
  "Ciudad de México": {
    name: "Ciudad de México",
    state: "Nacional",
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
    state: "Nacional",
    coords: { lat: 20.6597, lng: -103.3496 },
    zones: {
      "Centro": { name: "Centro", coords: { lat: 20.6770, lng: -103.3470 } },
      "Zapopan": { name: "Zapopan", coords: { lat: 20.7214, lng: -103.3918 } },
      "Providencia": { name: "Providencia", coords: { lat: 20.6975, lng: -103.3814 } },
    }
  },
  "Monterrey": {
    name: "Monterrey",
    state: "Nacional",
    coords: { lat: 25.6866, lng: -100.3161 },
    zones: {
      "Centro": { name: "Centro", coords: { lat: 25.6690, lng: -100.3100 } },
      "San Pedro": { name: "San Pedro", coords: { lat: 25.6572, lng: -100.4025 } },
      "Cumbres": { name: "Cumbres", coords: { lat: 25.7231, lng: -100.3872 } },
    }
  }
};

/**
 * Calculates distance in km between two coordinates using the Haversine formula
 */
export function haversineDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
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
 * Finds coordinates for a given location or zone string by doing a smart partial match.
 */
export function getCoordsForZone(locationStr: string | null | undefined): GeoCoordinate | null {
  if (!locationStr) return null;
  const lowerLoc = locationStr.toLowerCase().trim();

  // 1. Direct structured match "City - Zone"
  for (const [cityKey, cityInfo] of Object.entries(GEO_CONFIG)) {
    const lowerCity = cityKey.toLowerCase();
    if (lowerLoc.includes(lowerCity)) {
      // Find matching zone in this specific city
      for (const [zoneKey, zoneInfo] of Object.entries(cityInfo.zones)) {
        if (lowerLoc.includes(zoneKey.toLowerCase())) {
          return zoneInfo.coords;
        }
      }
      // If city matches but no specific zone, return city coords
      return cityInfo.coords;
    }
  }

  // 2. Fallback: match by specific unique zone name across cities
  for (const cityInfo of Object.values(GEO_CONFIG)) {
    for (const [zoneKey, zoneInfo] of Object.entries(cityInfo.zones)) {
      if (lowerLoc === zoneKey.toLowerCase() || lowerLoc === zoneInfo.name.toLowerCase()) {
        return zoneInfo.coords;
      }
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
 * Resolves precise real-world City and Zone/Neighborhood from coordinates.
 */
export async function resolveLocationFromCoords(
  lat: number,
  lng: number
): Promise<{ city: string; zone: string; displayLocation: string }> {
  // 1. Try OpenStreetMap Nominatim with high zoom
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
          addr.village ||
          addr.hamlet ||
          addr.state_district ||
          "";

        const rawZone =
          addr.suburb ||
          addr.neighbourhood ||
          addr.quarter ||
          addr.residential ||
          addr.city_district ||
          addr.road ||
          "";

        // Check if rawCity matches any known GEO_CONFIG city (e.g. Felipe Carrillo Puerto, Mérida, Cancún, etc.)
        const matchedCityKey = Object.keys(GEO_CONFIG).find((k) =>
          rawCity.toLowerCase().includes(k.toLowerCase()) || k.toLowerCase().includes(rawCity.toLowerCase())
        );

        if (matchedCityKey && GEO_CONFIG[matchedCityKey]) {
          let finalZone = Object.keys(GEO_CONFIG[matchedCityKey].zones)[0] || "Centro";
          
          if (rawZone) {
            const matchedZoneKey = Object.keys(GEO_CONFIG[matchedCityKey].zones).find((zk) =>
              rawZone.toLowerCase().includes(zk.toLowerCase()) || zk.toLowerCase().includes(rawZone.toLowerCase())
            );
            if (matchedZoneKey) {
              finalZone = matchedZoneKey;
            } else {
              finalZone = rawZone;
            }
          }

          return {
            city: matchedCityKey,
            zone: finalZone,
            displayLocation: `${matchedCityKey} - ${finalZone}`
          };
        } else if (rawCity) {
          // Dynamic city in Quintana Roo or Yucatán
          const finalZone = rawZone || "Centro";
          return {
            city: rawCity,
            zone: finalZone,
            displayLocation: `${rawCity} - ${finalZone}`
          };
        }
      }
    }
  } catch (e) {
    // Nominatim failed or timed out, try secondary fallback
  }

  // 2. Try BigDataCloud Client-side Reverse Geocoder
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

      if (matchedCityKey && GEO_CONFIG[matchedCityKey]) {
        let finalZone = Object.keys(GEO_CONFIG[matchedCityKey].zones)[0] || "Centro";
        if (rawZone) {
          const matchedZoneKey = Object.keys(GEO_CONFIG[matchedCityKey].zones).find((zk) =>
            rawZone.toLowerCase().includes(zk.toLowerCase()) || zk.toLowerCase().includes(rawZone.toLowerCase())
          );
          if (matchedZoneKey) {
            finalZone = matchedZoneKey;
          } else {
            finalZone = rawZone;
          }
        }

        return {
          city: matchedCityKey,
          zone: finalZone,
          displayLocation: `${matchedCityKey} - ${finalZone}`
        };
      } else if (rawCity) {
        return {
          city: rawCity,
          zone: rawZone || "Centro",
          displayLocation: `${rawCity} - ${rawZone || "Centro"}`
        };
      }
    }
  } catch (e) {
    // Fallback to geometric nearest
  }

  // 3. Fallback: geometric nearest city and zone in Southeast Mexico
  const nearest = findNearestCityAndZone(lat, lng);
  return {
    city: nearest.city,
    zone: nearest.zone,
    displayLocation: `${nearest.city} - ${nearest.zone}`
  };
}

export interface CityOption {
  name: string;
  state: "Quintana Roo" | "Yucatán" | "Campeche" | "Nacional";
  label: string;
}

/**
 * Returns all structured cities/municipalities grouped and formatted for Select components.
 */
export function getCitiesList(): CityOption[] {
  return Object.entries(GEO_CONFIG).map(([cityName, info]) => {
    const stateAbbr =
      info.state === "Quintana Roo"
        ? "Q. Roo"
        : info.state === "Yucatán"
        ? "Yucatán"
        : info.state === "Campeche"
        ? "Campeche"
        : info.state;

    return {
      name: cityName,
      state: info.state,
      label: `${cityName}, ${stateAbbr}`,
    };
  });
}

/**
 * Returns dynamic zone list for a given city from GEO_CONFIG with fallback.
 */
export function getZonesForCity(cityName: string | null | undefined): string[] {
  if (!cityName) {
    return Object.keys(GEO_CONFIG["Mérida"].zones);
  }

  const clean = cityName.trim();

  // 1. Direct match
  if (GEO_CONFIG[clean]) {
    return Object.keys(GEO_CONFIG[clean].zones);
  }

  // 2. Case-insensitive or partial match
  const lower = clean.toLowerCase();
  for (const [key, info] of Object.entries(GEO_CONFIG)) {
    if (lower.includes(key.toLowerCase()) || key.toLowerCase().includes(lower)) {
      return Object.keys(info.zones);
    }
  }

  // 3. Fallback for custom or unlisted city
  return [
    "Centro",
    "Zona Norte",
    "Zona Sur",
    "Zona Oriente",
    "Zona Poniente",
    "Zona Industrial",
    "Otra Zona",
  ];
}

/**
 * Cleans messy or street-polluted location strings to extract the valid City name.
 * If raw is "Calle 10, Playa del Carmen", returns "Playa del Carmen".
 * If raw is "Calle 68" (no city), returns "Mérida".
 */
export function cleanCityName(rawLoc: string | null | undefined): string {
  if (!rawLoc) return "Mérida";
  const trimmed = rawLoc.trim();

  // If it's composite "City - Zone"
  if (trimmed.includes(" - ")) {
    const parts = trimmed.split(" - ");
    return cleanCityName(parts[0]);
  }

  // If it's "City, State"
  if (trimmed.includes(",")) {
    const parts = trimmed.split(",");
    const cityPart = parts[0].trim();
    const matched = Object.keys(GEO_CONFIG).find(
      (c) => c.toLowerCase() === cityPart.toLowerCase()
    );
    if (matched) return matched;
  }

  const lower = trimmed.toLowerCase();

  // Alias detection for regional municipalities
  if (lower.includes("carrillo") || lower.includes("fcp")) {
    return "Felipe Carrillo Puerto";
  }
  if (lower.includes("playa del carmen") || lower === "playa" || lower === "pdc") {
    return "Playa del Carmen";
  }
  if (lower.includes("puerto morelos")) {
    return "Puerto Morelos";
  }
  if (lower.includes("isla mujeres")) {
    return "Isla Mujeres";
  }

  // 1. Exact match against known GEO_CONFIG cities
  for (const key of Object.keys(GEO_CONFIG)) {
    if (lower === key.toLowerCase()) {
      return key;
    }
  }

  // 2. Substring search for all known cities (sorted by longest name first)
  const sortedCityKeys = Object.keys(GEO_CONFIG).sort((a, b) => b.length - a.length);
  for (const key of sortedCityKeys) {
    const lowerKey = key.toLowerCase();
    // Match as word or substring
    if (lower.includes(lowerKey)) {
      return key;
    }
  }

  // 3. If it looks like a street address without a known city (starts with Calle, Av, etc.), fallback to Mérida
  if (/^(calle|av\.|avenida|carretera|carr\.|diag\.|diagonal|sm\b|mz\b|lote|c\.)/i.test(lower)) {
    return "Mérida";
  }

  return trimmed;
}



