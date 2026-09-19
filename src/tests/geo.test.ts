import { describe, test, expect } from "vitest";
import {
  GEO_CONFIG,
  findNearestCityAndZone,
  getCoordsForZone,
  resolveLocationFromCoords,
  getCitiesList,
  getZonesForCity,
  cleanCityName,
} from "@/config/geo";

describe("Geographical Configuration & Coordinate Resolvers", () => {
  test("getCoordsForZone resolves coordinates accurately for Quintana Roo and Yucatán", () => {
    const meridaCentro = getCoordsForZone("Mérida - Centro Mérida");
    expect(meridaCentro).not.toBeNull();
    expect(meridaCentro?.lat).toBeCloseTo(20.9676, 2);
    expect(meridaCentro?.lng).toBeCloseTo(-89.6241, 2);

    const fcpCentro = getCoordsForZone("Felipe Carrillo Puerto - Centro");
    expect(fcpCentro).not.toBeNull();
    expect(fcpCentro?.lat).toBeCloseTo(19.5775, 2);
    expect(fcpCentro?.lng).toBeCloseTo(-88.0454, 2);

    const playaCentro = getCoordsForZone("Playa del Carmen - Centro");
    expect(playaCentro).not.toBeNull();
    expect(playaCentro?.lat).toBeCloseTo(20.6296, 2);

    const cancunHotelera = getCoordsForZone("Cancún - Zona Hotelera");
    expect(cancunHotelera).not.toBeNull();
    expect(cancunHotelera?.lat).toBeCloseTo(21.1378, 2);

    const bacalarCentro = getCoordsForZone("Bacalar - Centro");
    expect(bacalarCentro).not.toBeNull();
    expect(bacalarCentro?.lat).toBeCloseTo(18.6779, 2);
  });

  test("findNearestCityAndZone selects the closest geographic city and zone accurately", () => {
    // Felipe Carrillo Puerto coordinates
    const nearestFcp = findNearestCityAndZone(19.5775, -88.0454);
    expect(nearestFcp.city).toBe("Felipe Carrillo Puerto");
    expect(nearestFcp.zone).toBe("Centro");

    // Altabrisa area in Merida (lat 21.016, lng -89.588)
    const nearestMerida = findNearestCityAndZone(21.0163, -89.5888);
    expect(nearestMerida.city).toBe("Mérida");
    expect(nearestMerida.zone).toBe("Altabrisa");

    // Playa del Carmen area
    const nearestPlaya = findNearestCityAndZone(20.6296, -87.0739);
    expect(nearestPlaya.city).toBe("Playa del Carmen");
    expect(nearestPlaya.zone).toBe("Centro");

    // Tulum area
    const nearestTulum = findNearestCityAndZone(20.2114, -87.4654);
    expect(nearestTulum.city).toBe("Tulum");

    // Bacalar area
    const nearestBacalar = findNearestCityAndZone(18.6779, -88.3934);
    expect(nearestBacalar.city).toBe("Bacalar");
  });

  test("resolveLocationFromCoords returns valid city and zone structure for Felipe Carrillo Puerto", async () => {
    const result = await resolveLocationFromCoords(19.5775, -88.0454);
    expect(result).toBeDefined();
    expect(result.city).toBe("Felipe Carrillo Puerto");
    expect(result.displayLocation).toContain("Felipe Carrillo Puerto");
  });

  test("getCitiesList returns properly structured list of cities across states", () => {
    const list = getCitiesList();
    expect(list.length).toBeGreaterThan(15);
    const cancun = list.find((c) => c.name === "Cancún");
    expect(cancun).toBeDefined();
    expect(cancun?.state).toBe("Quintana Roo");
    expect(cancun?.label).toContain("Cancún, Q. Roo");

    const merida = list.find((c) => c.name === "Mérida");
    expect(merida).toBeDefined();
    expect(merida?.state).toBe("Yucatán");
  });

  test("getZonesForCity dynamically returns zones for each specific municipality", () => {
    const meridaZones = getZonesForCity("Mérida");
    expect(meridaZones).toContain("Centro Mérida");
    expect(meridaZones).toContain("Altabrisa");
    expect(meridaZones).toContain("Caucel");

    const cancunZones = getZonesForCity("Cancún");
    expect(cancunZones).toContain("Centro");
    expect(cancunZones).toContain("Zona Hotelera");
    expect(cancunZones).toContain("Puerto Cancún");

    const playaZones = getZonesForCity("Playa del Carmen");
    expect(playaZones).toContain("Centro");
    expect(playaZones).toContain("Playacar");
    expect(playaZones).toContain("Villas del Sol");

    const customZones = getZonesForCity("Ciudad Desconocida");
    expect(customZones).toContain("Centro");
    expect(customZones).toContain("Zona Norte");
  });

  test("cleanCityName extracts valid city and sanitizes dirty/street addresses", () => {
    expect(cleanCityName("Mérida, Yucatán")).toBe("Mérida");
    expect(cleanCityName("Playa del Carmen, Q. Roo")).toBe("Playa del Carmen");
    expect(cleanCityName("Cancún - Zona Hotelera")).toBe("Cancún");
    expect(cleanCityName("Calle 10 Norte, Playa del Carmen, Q. Roo")).toBe("Playa del Carmen");
    expect(cleanCityName("Av. Bonampak SM 4, Cancún")).toBe("Cancún");
    expect(cleanCityName("Calle 68 #123 x 45 y 47")).toBe("Mérida");
    expect(cleanCityName("Calle 68")).toBe("Mérida");
    expect(cleanCityName("Tulum, Quintana Roo")).toBe("Tulum");
    expect(cleanCityName("Valladolid - Sisal")).toBe("Valladolid");
  });
});

