import { describe, test, expect } from "vitest";
import { normalizeDateToISO } from "@/modules/candidate/services/candidate-profile";

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
});
