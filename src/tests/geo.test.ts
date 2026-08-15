import { describe, test, expect } from "vitest";
import {
  GEO_CONFIG,
  findNearestCityAndZone,
  getCoordsForZone,
  resolveLocationFromCoords
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
});
