export type ConsentCategory = "essential" | "analytics" | "preferences";

export interface CookieConsentState {
  essential: true;
  analytics: boolean;
  preferences: boolean;
  timestamp: number;
  version: number;
}

export const CONSENT_STORAGE_KEY = "kanpro_cookie_consent";
export const CONSENT_VERSION = 1;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

/**
 * Obtiene el estado actual de consentimiento desde localStorage o cookie.
 * Retorna null si el usuario aún no ha emitido su decisión.
 */
export function getConsentState(): CookieConsentState | null {
  if (typeof window === "undefined") {
    return null;
  }

  // 1. Intenta leer desde localStorage
  try {
    const raw = localStorage.getItem(CONSENT_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.analytics === "boolean" && typeof parsed.preferences === "boolean") {
        return {
          essential: true,
          analytics: Boolean(parsed.analytics),
          preferences: Boolean(parsed.preferences),
          timestamp: Number(parsed.timestamp) || Date.now(),
          version: Number(parsed.version) || CONSENT_VERSION,
        };
      }
    }
  } catch {
    // Continuar a fallback de cookie
  }

  // 2. Fallback a document.cookie
  try {
    const cookieMatch = document.cookie
      .split("; ")
      .find((row) => row.startsWith(`${CONSENT_STORAGE_KEY}=`));

    if (cookieMatch) {
      const value = decodeURIComponent(cookieMatch.split("=")[1] || "");
      const parsed = JSON.parse(value);
      if (parsed && typeof parsed.analytics === "boolean") {
        return {
          essential: true,
          analytics: Boolean(parsed.analytics),
          preferences: Boolean(parsed.preferences),
          timestamp: Number(parsed.timestamp) || Date.now(),
          version: Number(parsed.version) || CONSENT_VERSION,
        };
      }
    }
  } catch {
    // Ignorar errores de parseo
  }

  return null;
}

/**
 * Valida de forma estricta si una categoría tiene consentimiento otorgado.
 * Las cookies esenciales siempre están permitidas.
 * Cualquier categoría no esencial retorna FALSE si el usuario no ha consentido explícitamente.
 */
export function hasConsent(category: ConsentCategory): boolean {
  if (category === "essential") {
    return true;
  }

  const state = getConsentState();
  if (!state) {
    return false;
  }

  return Boolean(state[category]);
}

/**
 * Guarda la decisión del usuario en localStorage y document.cookie,
 * actualiza Google Consent Mode v2 y purga cookies de terceros si se rechazaron.
 */
export function saveConsentState(choices: {
  analytics: boolean;
  preferences: boolean;
}): CookieConsentState {
  const fullState: CookieConsentState = {
    essential: true,
    analytics: Boolean(choices.analytics),
    preferences: Boolean(choices.preferences),
    timestamp: Date.now(),
    version: CONSENT_VERSION,
  };

  if (typeof window !== "undefined") {
    // Guardar en localStorage
    try {
      localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(fullState));
    } catch {
      // Ignorar si está restringido
    }

    // Guardar en document.cookie (1 año de vigencia)
    try {
      const cookieVal = encodeURIComponent(JSON.stringify(fullState));
      const maxAge = 365 * 24 * 60 * 60; // 1 año
      const isSecure = window.location.protocol === "https:" ? "; Secure" : "";
      document.cookie = `${CONSENT_STORAGE_KEY}=${cookieVal}; path=/; max-age=${maxAge}; SameSite=Lax${isSecure}`;
    } catch {
      // Ignorar
    }

    // Sincronizar Google Consent Mode v2
    syncGoogleConsentMode(fullState);

    // Si analíticas fue rechazada, purgar cookies huérfanas
    if (!fullState.analytics) {
      purgeTrackingCookies();
    }

    // Notificar a toda la aplicación
    window.dispatchEvent(
      new CustomEvent("kanpro:consent-updated", { detail: fullState })
    );
  }

  return fullState;
}

/**
 * Sincroniza el estado con el estándar de Google Consent Mode v2
 */
export function syncGoogleConsentMode(consent: CookieConsentState): void {
  if (typeof window === "undefined") return;

  window.dataLayer = window.dataLayer || [];
  function gtag(...args: unknown[]) {
    window.dataLayer?.push(args);
  }

  gtag("consent", "update", {
    analytics_storage: consent.analytics ? "granted" : "denied",
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
    functionality_storage: consent.preferences ? "granted" : "denied",
    personalization_storage: consent.preferences ? "granted" : "denied",
    security_storage: "granted",
  });
}

/**
 * Inicializa el modo de consentimiento por defecto en 'denied' (Zero Tracking by Default).
 * Si el usuario ya consintió previamente, aplica su decisión.
 */
export function initializeConsentMode(): void {
  if (typeof window === "undefined") return;

  window.dataLayer = window.dataLayer || [];
  function gtag(...args: unknown[]) {
    window.dataLayer?.push(args);
  }

  // 1. Establecer 'denied' estricto por defecto
  gtag("consent", "default", {
    analytics_storage: "denied",
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
    functionality_storage: "denied",
    personalization_storage: "denied",
    security_storage: "granted",
    wait_for_update: 500,
  });

  // 2. Si existe consentimiento previo, actualizarlo de inmediato
  const current = getConsentState();
  if (current) {
    syncGoogleConsentMode(current);
  } else {
    // Si no ha consentido, limpiar preventivamente cualquier rastro analítico
    purgeTrackingCookies();
  }
}

/**
 * Elimina cookies no esenciales del navegador si el usuario las rechaza o no ha dado consentimiento.
 */
export function purgeTrackingCookies(): void {
  if (typeof document === "undefined") return;

  const trackingPatterns = [
    /^_ga/,
    /^_gid/,
    /^_gat/,
    /^_gcl/,
    /^_fbp/,
    /^_fbc/,
    /^_clarity/,
    /^mp_/,
    /^ph_/,
    /^ajs_/,
  ];

  try {
    const cookies = document.cookie.split(";");
    const domainParts = window.location.hostname.split(".");

    for (const rawCookie of cookies) {
      const cookieName = rawCookie.split("=")[0]?.trim();
      if (!cookieName) continue;

      const isTracking = trackingPatterns.some((pattern) =>
        pattern.test(cookieName)
      );

      if (isTracking) {
        // Eliminar en la ruta raíz
        document.cookie = `${cookieName}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT; Max-Age=0;`;

        // Eliminar también en dominios padre si aplica
        for (let i = 0; i < domainParts.length - 1; i++) {
          const domain = domainParts.slice(i).join(".");
          document.cookie = `${cookieName}=; Path=/; Domain=.${domain}; Expires=Thu, 01 Jan 1970 00:00:01 GMT; Max-Age=0;`;
        }
      }
    }
  } catch {
    // Ignorar si hay restricciones de navegador
  }
}
