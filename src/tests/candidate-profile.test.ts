import { describe, test, expect } from "vitest";
import {
  formatCandidateAddress,
  getCandidateInitials,
  normalizeDateToISO,
} from "@/modules/candidate/services/candidate-profile";

describe("Candidate Profile & Date Normalization", () => {
  test("normalizeDateToISO handles DD/MM/YYYY format", () => {
    expect(normalizeDateToISO("05/11/2007")).toBe("2007-11-05");
    expect(normalizeDateToISO("15/01/1998")).toBe("1998-01-15");
    expect(normalizeDateToISO("1/5/2000")).toBe("2000-05-01");
  });

  test("normalizeDateToISO handles ISO YYYY-MM-DD format", () => {
    expect(normalizeDateToISO("2007-11-05")).toBe("2007-11-05");
    expect(normalizeDateToISO("1995-12-31")).toBe("1995-12-31");
  });

  test("normalizeDateToISO handles empty and null inputs safely", () => {
    expect(normalizeDateToISO(null)).toBeNull();
    expect(normalizeDateToISO("")).toBeNull();
    expect(normalizeDateToISO(undefined)).toBeNull();
  });

  test("formatCandidateAddress formats full INE address into two lines", () => {
    expect(
      formatCandidateAddress({
        address_street: "Av. Ejemplo",
        address_exterior_number: "123",
        address_interior_number: "4B",
        address_neighborhood: "Centro",
        address_postal_code: "77500",
        address_municipality: "Benito Juárez",
        address_state: "Quintana Roo",
        location: null,
      })
    ).toEqual({
      line1: "Av. Ejemplo 123, interior 4B · Centro",
      line2: "77500 · Benito Juárez, Quintana Roo",
    });
  });

  test("formatCandidateAddress falls back to location when structured address is empty", () => {
    expect(
      formatCandidateAddress({
        location: "Mérida - Norte",
      })
    ).toEqual({
      line1: "Mérida - Norte",
      line2: null,
    });
  });

  test("getCandidateInitials extracts two-letter initials with email fallback", () => {
    expect(getCandidateInitials("Ana Martínez López")).toBe("AM");
    expect(getCandidateInitials("Ana")).toBe("AN");
    expect(getCandidateInitials(null, "ana@correo.com")).toBe("A");
    expect(getCandidateInitials(null, null)).toBe("KP");
  });
});
