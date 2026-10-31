"use client";

import * as React from "react";
import { initializeConsentMode } from "@/lib/cookies/consent-manager";

export function CookieConsentProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  React.useEffect(() => {
    // Inicialización inmediata al montar en el cliente
    initializeConsentMode();
  }, []);

  return <>{children}</>;
}
