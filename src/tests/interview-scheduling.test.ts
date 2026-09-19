import { describe, test, expect } from "vitest";

function getQuickDateIso(offsetDays: number | "nextMonday", baseDate = new Date()): string {
  const d = new Date(baseDate);
  if (offsetDays === "nextMonday") {
    const day = d.getDay(); // 0 is Sunday, 1 is Monday
    const diff = (8 - day) % 7 || 7;
    d.setDate(d.getDate() + diff);
  } else {
    d.setDate(d.getDate() + offsetDays);
  }
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

describe("Interview Scheduling Date Helpers", () => {
  test("getQuickDateIso generates correct ISO date for today and offsets", () => {
    const base = new Date(2026, 8, 5); // 2026-09-05 (Saturday)
    expect(getQuickDateIso(0, base)).toBe("2026-09-05");
    expect(getQuickDateIso(1, base)).toBe("2026-09-06");
    expect(getQuickDateIso(2, base)).toBe("2026-09-07");
  });

  test("getQuickDateIso calculates next Monday correctly", () => {
    const saturday = new Date(2026, 8, 5); // Saturday
    expect(getQuickDateIso("nextMonday", saturday)).toBe("2026-09-07");

    const sunday = new Date(2026, 8, 6); // Sunday
    expect(getQuickDateIso("nextMonday", sunday)).toBe("2026-09-07");

    const monday = new Date(2026, 8, 7); // Monday
    expect(getQuickDateIso("nextMonday", monday)).toBe("2026-09-14");
  });

  test("Interview modality defaults appropriately", () => {
    const presencialLoc = "Instalaciones de la empresa / Sucursal";
    const virtualLoc = "https://meet.google.com/new";

    expect(presencialLoc).toContain("Sucursal");
    expect(virtualLoc).toContain("meet.google.com");
  });
});
