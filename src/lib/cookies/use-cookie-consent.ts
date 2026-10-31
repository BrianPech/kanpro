"use client";

import * as React from "react";
import {
  getConsentState,
  saveConsentState,
  hasConsent,
  purgeTrackingCookies,
  type CookieConsentState,
  type ConsentCategory,
} from "./consent-manager";

export function useCookieConsent() {
  const [consent, setConsent] = React.useState<CookieConsentState | null>(null);
  const [isLoaded, setIsLoaded] = React.useState(false);

  React.useEffect(() => {
    // Carga inicial
    setConsent(getConsentState());
    setIsLoaded(true);

    // Escucha actualizaciones emitidas desde el banner o ajustes
    const handleUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<CookieConsentState>;
      setConsent(customEvent.detail || getConsentState());
    };

    window.addEventListener("kanpro:consent-updated", handleUpdate);
    return () => {
      window.removeEventListener("kanpro:consent-updated", handleUpdate);
    };
  }, []);

  const updateConsent = React.useCallback(
    (choices: { analytics: boolean; preferences: boolean }) => {
      const updated = saveConsentState(choices);
      setConsent(updated);
      return updated;
    },
    []
  );

  const resetConsent = React.useCallback(() => {
    try {
      localStorage.removeItem("kanpro_cookie_consent");
      document.cookie =
        "kanpro_cookie_consent=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT; Max-Age=0;";
      purgeTrackingCookies();
    } catch {
      // Ignorar
    }
    setConsent(null);
    window.dispatchEvent(new Event("kanpro:open-cookies"));
  }, []);

  const canCollect = React.useCallback(
    (category: ConsentCategory) => {
      if (category === "essential") return true;
      if (!consent) return false;
      return Boolean(consent[category]);
    },
    [consent]
  );

  return {
    consent,
    isLoaded,
    hasGivenConsent: consent !== null,
    canCollect,
    updateConsent,
    resetConsent,
  };
}
