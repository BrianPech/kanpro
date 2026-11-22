import { describe, test, expect } from "vitest";
import {
  normalizeDateToISO,
  getMexicoDateISO,
  formatMexicoDateShort,
  formatDateToDisplay,
  normalizePhone,
  formatPhoneDisplay,
  normalizeCurp,
  normalizeRfc,
  normalizeLocation,
  parseLocation,
  normalizeSalary,
  formatSalaryDisplay,
  getPeriodDays,
  calculateDailySalary,
  formatPaymentFrequencyLabel,
  formatPaymentFrequencyAdjective,
  BUSINESS_TIME_ZONE,
  toMonthlyEquivalentSalary,
  fromMonthlyEquivalentSalary,
  calculateDailySalaryFromMonthly,
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

    test("getMexicoDateISO uses America/Mexico_City even past UTC midnight", () => {
      // 2026-11-17T03:30:00Z = 2026-11-16 21:30 America/Mexico_City
      expect(getMexicoDateISO(new Date("2026-11-17T03:30:00.000Z"))).toBe("2026-11-16");
    });

    test("formatMexicoDateShort preserves YYYY-MM-DD day without shifting to previous day", () => {
      const formatted = formatMexicoDateShort("2026-11-16").toLowerCase();
      expect(formatted).toContain("16");
      expect(formatted).toContain("nov");
      expect(formatted).toContain("2026");
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

    test("calculates daily salary according to payment frequency", () => {
      expect(getPeriodDays("quincenal")).toBe(15);
      expect(getPeriodDays("mensual")).toBe(30);
      expect(getPeriodDays("semanal")).toBe(7);
      expect(getPeriodDays("catorcenal")).toBe(14);
      expect(calculateDailySalary(10500, "quincenal")).toBe(700);
      expect(calculateDailySalary(10500, "mensual")).toBe(350);
      expect(calculateDailySalary(3500, "semanal")).toBe(500);
      expect(formatPaymentFrequencyLabel("quincenal")).toBe("Quincenal");
      expect(formatPaymentFrequencyAdjective("quincenal")).toBe("quincenales");
    });

    test("normalizes periodic salaries to monthly equivalents and exposes BUSINESS_TIME_ZONE", () => {
      expect(BUSINESS_TIME_ZONE).toBe("America/Cancun");
      expect(toMonthlyEquivalentSalary(11000, "quincenal")).toBe(22000);
      expect(toMonthlyEquivalentSalary(3500, "semanal")).toBe(15000);
      expect(toMonthlyEquivalentSalary(7000, "catorcenal")).toBe(15000);
      expect(toMonthlyEquivalentSalary(18000, "mensual")).toBe(18000);

      expect(fromMonthlyEquivalentSalary(22000, "quincenal")).toBe(11000);
      expect(fromMonthlyEquivalentSalary(15000, "semanal")).toBe(3500);
      expect(fromMonthlyEquivalentSalary(15000, "catorcenal")).toBe(7000);

      expect(calculateDailySalaryFromMonthly(22000)).toBe(733.33);
      expect(calculateDailySalaryFromMonthly(21000)).toBe(700);
    });
  });
});
