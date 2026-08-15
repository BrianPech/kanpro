import { describe, test, expect } from "vitest";
import {
  GEO_CONFIG,
  findNearestCityAndZone,
  getCoordsForZone,
  resolveLocationFromCoords
} from "@/config/geo";

describe("Geographical Configuration & Coordinate Resolvers", () => {
  test("getCoordsForZone resolves coordinates accurately for known zones", () => {
    const meridaCentro = getCoordsForZone("Mérida - Centro Mérida");
    expect(meridaCentro).not.toBeNull();
    expect(meridaCentro?.lat).toBeCloseTo(20.9676, 2);
    expect(meridaCentro?.lng).toBeCloseTo(-89.6241, 2);

    const playaCentro = getCoordsForZone("Playa del Carmen - Centro");
    expect(playaCentro).not.toBeNull();
    expect(playaCentro?.lat).toBeCloseTo(20.6296, 2);

    const cancunHotelera = getCoordsForZone("Cancún - Zona Hotelera");
    expect(cancunHotelera).not.toBeNull();
    expect(cancunHotelera?.lat).toBeCloseTo(21.1378, 2);
  });

  test("findNearestCityAndZone selects the closest geographic city and zone", () => {
    // Altabrisa area in Merida (lat 21.016, lng -89.588)
    const nearestMerida = findNearestCityAndZone(21.0163, -89.5888);
    expect(nearestMerida.city).toBe("Mérida");
    expect(nearestMerida.zone).toBe("Altabrisa");

    // Playa del Carmen area
    const nearestPlaya = findNearestCityAndZone(20.6296, -87.0739);
    expect(nearestPlaya.city).toBe("Playa del Carmen");
    expect(nearestPlaya.zone).toBe("Centro");

    // Cancun area
    const nearestCancun = findNearestCityAndZone(21.1619, -86.8515);
    expect(nearestCancun.city).toBe("Cancún");
  });

  test("resolveLocationFromCoords returns valid city and zone structure", async () => {
    const result = await resolveLocationFromCoords(20.9676, -89.6241);
    expect(result).toBeDefined();
    expect(result.city).toBeTruthy();
    expect(result.zone).toBeTruthy();
    expect(result.displayLocation).toContain(" - ");
  });
});
