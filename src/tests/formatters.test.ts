import { describe, test, expect } from "vitest";
import {
  normalizeDateToISO,
  formatDateToDisplay,
  normalizePhone,
  formatPhoneDisplay,
  normalizeCurp,
  normalizeRfc,
  normalizeLocation,
  parseLocation,
  normalizeSalary,
  formatSalaryDisplay
} from "@/lib/formatters";

describe("Centralized Formatters & Data Normalizers", () => {
  describe("Date Normalization", () => {
    test("converts DD/MM/YYYY to YYYY-MM-DD", () => {
      expect(normalizeDateToISO("05/11/2007")).toBe("2007-11-05");
      expect(normalizeDateToISO("25/12/1999")).toBe("1999-12-25");
      expect(normalizeDateToISO("1/2/2000")).toBe("2000-02-01");
    });

    test("preserves valid ISO strings", () => {
      expect(normalizeDateToISO("2007-11-05")).toBe("2007-11-05");
    });

    test("formats ISO date to Mexican display DD/MM/AAAA", () => {
      expect(formatDateToDisplay("2007-11-05")).toBe("05/11/2007");
    });
  });

  describe("Phone & WhatsApp Normalization", () => {
    test("prefixes 10-digit Mexican numbers with +52", () => {
      expect(normalizePhone("9991234567")).toBe("+529991234567");
      expect(normalizePhone("(999) 123-4567")).toBe("+529991234567");
    });

    test("formats phone for display mask", () => {
      expect(formatPhoneDisplay("+529991234567")).toBe("+52 (999) 123-4567");
    });
  });

  describe("CURP & RFC Normalization", () => {
    test("transforms CURP to uppercase and trims to 18 chars", () => {
      expect(normalizeCurp("hesa950412hdfrr090extra")).toBe("HESA950412HDFRR090");
    });

    test("transforms RFC to uppercase and trims", () => {
      expect(normalizeRfc("xaxx010101000")).toBe("XAXX010101000");
    });
  });

  describe("Location Normalization", () => {
    test("normalizes and parses composite location strings", () => {
      const loc = normalizeLocation("Mérida", "Altabrisa");
      expect(loc).toBe("Mérida - Altabrisa");

      const parsed = parseLocation("Mérida - Altabrisa");
      expect(parsed.city).toBe("Mérida");
      expect(parsed.zone).toBe("Altabrisa");
    });
  });

  describe("Salary Formatting", () => {
    test("normalizes monetary strings to numbers", () => {
      expect(normalizeSalary("$18,500.00")).toBe(18500);
      expect(normalizeSalary("15000")).toBe(15000);
    });

    test("formats number to Mexican currency display", () => {
      expect(formatSalaryDisplay(15000)).toContain("15,000");
    });
  });
});
