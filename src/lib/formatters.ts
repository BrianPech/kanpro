/**
 * Centralized formatting and data normalization utilities for K'anPro.
 * Enforces unified data contracts across database storage and UI display.
 */

import { GEO_CONFIG, cleanCityName } from "@/config/geo";
export { cleanCityName };



// ==========================================
// 1. DATE NORMALIZATION & FORMATTING
// ==========================================

/**
 * Normalizes any date representation (DD/MM/YYYY, ISO, timestamp, Date object)
 * to standard database ISO format `YYYY-MM-DD`.
 */
export function normalizeDateToISO(dateStr: string | Date | null | undefined): string | null {
  if (!dateStr) return null;

  if (dateStr instanceof Date) {
    if (isNaN(dateStr.getTime())) return null;
    const year = dateStr.getUTCFullYear();
    const month = String(dateStr.getUTCMonth() + 1).padStart(2, "0");
    const day = String(dateStr.getUTCDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  const trimmed = dateStr.trim();
  if (!trimmed) return null;

  // Already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }

  // DD/MM/YYYY or DD-MM-YYYY
  const ddmmyyyy = trimmed.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (ddmmyyyy) {
    const day = ddmmyyyy[1].padStart(2, "0");
    const month = ddmmyyyy[2].padStart(2, "0");
    const year = ddmmyyyy[3];
    return `${year}-${month}-${day}`;
  }

  // MM/DD/YYYY fallback (if month is valid)
  const mmddyyyy = trimmed.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (mmddyyyy) {
    const p1 = parseInt(mmddyyyy[1], 10);
    const p2 = parseInt(mmddyyyy[2], 10);
    if (p1 > 12 && p2 <= 12) {
      // It's definitely DD/MM/YYYY
      return `${mmddyyyy[3]}-${String(p2).padStart(2, "0")}-${String(p1).padStart(2, "0")}`;
    }
  }

  // Timestamp or generic Date parsing
  const timestamp = Date.parse(trimmed);
  if (!isNaN(timestamp)) {
    const d = new Date(timestamp);
    const year = d.getUTCFullYear();
    const month = String(d.getUTCMonth() + 1).padStart(2, "0");
    const day = String(d.getUTCDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  return null;
}

/**
 * Formats a `YYYY-MM-DD` ISO date string into standard Mexican visual representation `DD/MM/AAAA`.
 */
export function formatDateToDisplay(isoStr: string | null | undefined): string {
  if (!isoStr) return "";
  const iso = normalizeDateToISO(isoStr);
  if (!iso) return isoStr || "";

  const [year, month, day] = iso.split("-");
  if (year && month && day) {
    return `${day}/${month}/${year}`;
  }
  return iso;
}

// ==========================================
// 2. PHONE / WHATSAPP NORMALIZATION
// ==========================================

/**
 * Normalizes phone inputs to standard E.164-compatible clean representation `+529991234567`.
 * Assumes Mexico (+52) if no international country code is explicitly provided.
 */
export function normalizePhone(phoneStr: string | null | undefined): string {
  if (!phoneStr) return "";
  const cleaned = phoneStr.replace(/[^0-9+]/g, "");
  if (!cleaned) return "";

  // If already starts with +521 and 10 national digits (total 14 chars: +521XXXXXXXXXX)
  if (cleaned.startsWith("+521") && cleaned.length === 14) {
    return `+52${cleaned.substring(4)}`;
  }

  // If 13 digits starting with 521 (e.g. 5219991234567)
  if (cleaned.length === 13 && cleaned.startsWith("521")) {
    return `+52${cleaned.substring(3)}`;
  }

  if (cleaned.startsWith("+")) {
    return cleaned;
  }

  // If 10 digits (standard Mexican mobile number), prefix with +52
  if (cleaned.length === 10) {
    return `+52${cleaned}`;
  }

  // If 12 digits starting with 52
  if (cleaned.length === 12 && cleaned.startsWith("52")) {
    return `+${cleaned}`;
  }

  // For partial inputs (e.g. 1-9 digits), preserve raw digits without prepending bogus '+'
  return cleaned;
}

/**
 * Formats a raw phone string into user-friendly national/international visual mask `+52 (999) 123-4567`.
 */
export function formatPhoneDisplay(phoneStr: string | null | undefined): string {
  if (!phoneStr) return "";
  const clean = normalizePhone(phoneStr);
  if (!clean) return "";

  // Mexican standard: +52XXXXXXXXXX
  if (clean.startsWith("+52") && clean.length === 13) {
    const area = clean.substring(3, 6);
    const part1 = clean.substring(6, 9);
    const part2 = clean.substring(9, 13);
    return `+52 (${area}) ${part1}-${part2}`;
  }

  // 10 digits without country code
  const digitsOnly = clean.replace(/[^0-9]/g, "");
  if (digitsOnly.length === 10) {
    const area = digitsOnly.substring(0, 3);
    const part1 = digitsOnly.substring(3, 6);
    const part2 = digitsOnly.substring(6, 10);
    return `(${area}) ${part1}-${part2}`;
  }

  return phoneStr;
}

// ==========================================
// 3. CURP & RFC NORMALIZATION
// ==========================================

/**
 * Cleans and transforms CURP into uppercase 18-character string.
 */
export function normalizeCurp(curpStr: string | null | undefined): string {
  if (!curpStr) return "";
  return curpStr
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .substring(0, 18);
}

/**
 * Cleans and transforms RFC into uppercase 12-13 character string.
 */
export function normalizeRfc(rfcStr: string | null | undefined): string {
  if (!rfcStr) return "";
  return rfcStr
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .substring(0, 13);
}

// ==========================================
// 4. GEOGRAPHIC LOCATION NORMALIZATION
// ==========================================

/**
 * Standardizes City and Zone into composite format `Ciudad - Zona`.
 */
export function normalizeLocation(city: string | null | undefined, zone: string | null | undefined): string {
  const cleanCity = city?.trim() || "Mérida";
  const cleanZone = zone?.trim() || "Centro Mérida";
  return `${cleanCity} - ${cleanZone}`;
}


/**
 * Parses composite location string `Ciudad - Zona` into structured `{ city, zone }`.
 */
export function parseLocation(locationStr: string | null | undefined): { city: string; zone: string } {
  if (!locationStr) {
    return { city: "Mérida", zone: "Centro Mérida" };
  }

  const trimmed = locationStr.trim();

  if (trimmed.includes(" - ")) {
    const parts = trimmed.split(" - ");
    const rawCity = parts[0].trim();
    const rawZone = parts.slice(1).join(" - ").trim();
    const city = cleanCityName(rawCity);
    const availableZones = Object.keys(GEO_CONFIG[city]?.zones || {});
    const defaultZone = availableZones[0] || (city === "Mérida" ? "Centro Mérida" : "Centro");
    return {
      city,
      zone: rawZone || defaultZone,
    };
  }

  const city = cleanCityName(trimmed);
  const availableZones = Object.keys(GEO_CONFIG[city]?.zones || {});
  const defaultZone = availableZones[0] || (city === "Mérida" ? "Centro Mérida" : "Centro");

  return {
    city,
    zone: defaultZone,
  };
}


// ==========================================
// 5. SALARY & CURRENCY FORMATTING
// ==========================================

/**
 * Converts user input (e.g. "$18,500.00", "18500") into clean numeric integer or float.
 */
export function normalizeSalary(val: number | string | null | undefined): number | null {
  if (val === null || val === undefined) return null;
  if (typeof val === "number") return isNaN(val) ? null : val;

  const cleaned = val.replace(/[^0-9.]/g, "");
  if (!cleaned) return null;

  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? null : parsed;
}

/**
 * Formats a raw number into Mexican currency representation `$XX,XXX MXN`.
 */
export function formatSalaryDisplay(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) return "";
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0
  }).format(amount);
}
