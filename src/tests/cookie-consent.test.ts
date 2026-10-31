import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  getConsentState,
  hasConsent,
  saveConsentState,
  purgeTrackingCookies,
  CONSENT_STORAGE_KEY,
} from "@/lib/cookies/consent-manager";

describe("Cookie Consent & Zero Tracking Invariants", () => {
  let localStorageStore: Record<string, string> = {};
  let cookieJar = "";

  beforeEach(() => {
    localStorageStore = {};
    cookieJar = "";

    // Mock localStorage
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => localStorageStore[key] || null,
      setItem: (key: string, val: string) => {
        localStorageStore[key] = val;
      },
      removeItem: (key: string) => {
        delete localStorageStore[key];
      },
      clear: () => {
        localStorageStore = {};
      },
    });

    // Mock document.cookie
    Object.defineProperty(global, "document", {
      value: {
        get cookie() {
          return cookieJar;
        },
        set cookie(val: string) {
          const [nameValue] = val.split(";");
          const [name, value] = nameValue.split("=");
          if (val.includes("Max-Age=0") || val.includes("Expires=")) {
            // Delete cookie
            const parts = cookieJar.split("; ").filter((p) => !p.startsWith(`${name}=`));
            cookieJar = parts.join("; ");
          } else {
            // Add/update cookie
            const parts = cookieJar.split("; ").filter((p) => p && !p.startsWith(`${name}=`));
            parts.push(`${name}=${value}`);
            cookieJar = parts.join("; ");
          }
        },
      },
      writable: true,
      configurable: true,
    });

    // Mock window & location
    vi.stubGlobal("window", {
      location: {
        hostname: "kanpro.mx",
        protocol: "https:",
      },
      dispatchEvent: vi.fn(),
      dataLayer: [],
    });
  });

  it("should enforce that Essential cookies are ALWAYS permitted", () => {
    expect(hasConsent("essential")).toBe(true);
  });

  it("should BLOCK analytics and preferences cookies by default when no consent is given", () => {
    expect(getConsentState()).toBeNull();
    expect(hasConsent("analytics")).toBe(false);
    expect(hasConsent("preferences")).toBe(false);
  });

  it("should record full consent and grant analytics when user accepts all", () => {
    saveConsentState({ analytics: true, preferences: true });

    expect(hasConsent("essential")).toBe(true);
    expect(hasConsent("analytics")).toBe(true);
    expect(hasConsent("preferences")).toBe(true);

    const saved = getConsentState();
    expect(saved).not.toBeNull();
    expect(saved?.analytics).toBe(true);
    expect(saved?.preferences).toBe(true);
  });

  it("should reject analytics and purge tracking cookies when user selects 'Solo necesarias'", () => {
    // Simulate stray tracking cookies existing before
    cookieJar = "_ga=GA1.2.12345; _gid=GA1.2.6789; _fbp=fb.1.999; session_id=abc";

    saveConsentState({ analytics: false, preferences: false });

    expect(hasConsent("analytics")).toBe(false);
    expect(hasConsent("preferences")).toBe(false);

    // Verify tracking cookies were purged and session_id was preserved
    expect(cookieJar).not.toContain("_ga");
    expect(cookieJar).not.toContain("_gid");
    expect(cookieJar).not.toContain("_fbp");
    expect(cookieJar).toContain("session_id=abc");
    expect(cookieJar).toContain(CONSENT_STORAGE_KEY);
  });

  it("should allow granular consent (e.g. preferences without analytics)", () => {
    saveConsentState({ analytics: false, preferences: true });

    expect(hasConsent("analytics")).toBe(false);
    expect(hasConsent("preferences")).toBe(true);
  });
});
