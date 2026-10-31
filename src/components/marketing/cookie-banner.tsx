"use client";

import * as React from "react";
import Link from "next/link";
import {
  Cookie,
  X,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
} from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

import {
  getConsentState,
  saveConsentState,
  type CookieConsentState,
} from "@/lib/cookies/consent-manager";

export function CookieBanner() {
  const [isMounted, setIsMounted] = React.useState(false);
  const [isOpen, setIsOpen] = React.useState(false);
  const [showPreferences, setShowPreferences] = React.useState(false);
  const [analyticsConsent, setAnalyticsConsent] = React.useState(false);
  const [preferencesConsent, setPreferencesConsent] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
    const stored = getConsentState();
    if (!stored) {
      // Mostrar con un leve retardo para una transición fluida al entrar a la landing
      const timer = setTimeout(() => setIsOpen(true), 600);
      return () => clearTimeout(timer);
    } else {
      setAnalyticsConsent(stored.analytics);
      setPreferencesConsent(stored.preferences);
    }
  }, []);

  React.useEffect(() => {
    const handleOpenConsent = () => {
      const current = getConsentState();
      if (current) {
        setAnalyticsConsent(current.analytics);
        setPreferencesConsent(current.preferences);
      }
      setIsOpen(true);
      setShowPreferences(true);
    };

    window.addEventListener("kanpro:open-cookies", handleOpenConsent);
    return () => {
      window.removeEventListener("kanpro:open-cookies", handleOpenConsent);
    };
  }, []);

  const handleAcceptAll = () => {
    saveConsentState({
      analytics: true,
      preferences: true,
    });
    setIsOpen(false);
  };

  const handleAcceptNecessary = () => {
    saveConsentState({
      analytics: false,
      preferences: false,
    });
    setIsOpen(false);
  };

  const handleSaveCustom = () => {
    saveConsentState({
      analytics: analyticsConsent,
      preferences: preferencesConsent,
    });
    setIsOpen(false);
  };

  if (!isMounted || !isOpen) {
    return null;
  }

  return (
    <aside
      aria-label="Aviso y configuración de cookies"
      role="dialog"
      aria-modal="false"
      className={cn(
        "fixed bottom-4 inset-x-4 sm:inset-x-auto sm:left-6 md:left-8 sm:right-auto sm:bottom-6 md:bottom-8 sm:max-w-xl md:max-w-2xl w-auto z-50 transition-all duration-300",
        "animate-in fade-in slide-in-from-bottom-6"
      )}
    >
      <div className="rounded-3xl sm:rounded-4xl border border-border/80 bg-card/95 backdrop-blur-md p-5 sm:p-6 shadow-2xl shadow-primary/10 text-card-foreground space-y-4">
        {/* Cabecera: Ícono + Título + Botón de descarte rápido */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-2xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0 shadow-2xs">
              <Cookie className="size-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground tracking-tight">
                Control de Privacidad y Cookies
              </h3>
              <span className="text-[11px] text-muted-foreground font-medium">
                Cumplimiento LFPDPPP & Navegación Segura
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={handleAcceptNecessary}
            aria-label="Cerrar aviso de cookies"
            className="text-muted-foreground hover:text-foreground p-1 rounded-xl hover:bg-muted/60 transition-colors cursor-pointer"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Mensaje descriptivo */}
        <p className="text-xs text-muted-foreground leading-relaxed">
          En K&apos;anPro usamos cookies esenciales para autenticación y seguridad laboral, y cookies analíticas para mejorar la compatibilidad de vacantes en el Sureste. Puedes aceptar todas o personalizar tus preferencias.
        </p>

        {/* Panel Desplegable de Configuración Avanzada */}
        {showPreferences && (
          <div className="space-y-2.5 pt-2 pb-1 border-t border-border/60 text-xs">
            {/* 1. Esenciales (Obligatorias) */}
            <div className="flex items-center justify-between gap-3 p-2.5 rounded-2xl bg-muted/40 border border-border/40">
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5 font-semibold text-foreground">
                  <ShieldCheck className="size-3.5 text-primary" />
                  <span>Cookies Esenciales</span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-tight">
                  Indispensables para inicio de sesión, roles y seguridad NOM-151.
                </p>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 uppercase tracking-wide shrink-0">
                Siempre activas
              </span>
            </div>

            {/* 2. Analíticas */}
            <div className="flex items-center justify-between gap-3 p-2.5 rounded-2xl bg-card border border-border/70">
              <div className="space-y-0.5">
                <span className="font-semibold text-foreground block">
                  Analíticas y Rendimiento
                </span>
                <p className="text-[11px] text-muted-foreground leading-tight">
                  Métricas anónimas para optimizar velocidad y búsqueda de empleos.
                </p>
              </div>
              <Switch
                checked={analyticsConsent}
                onCheckedChange={setAnalyticsConsent}
                aria-label="Activar cookies analíticas"
              />
            </div>

            {/* 3. Preferencias */}
            <div className="flex items-center justify-between gap-3 p-2.5 rounded-2xl bg-card border border-border/70">
              <div className="space-y-0.5">
                <span className="font-semibold text-foreground block">
                  Preferencias y Filtros
                </span>
                <p className="text-[11px] text-muted-foreground leading-tight">
                  Guarda tu zona geográfica y filtros de empleo habituales.
                </p>
              </div>
              <Switch
                checked={preferencesConsent}
                onCheckedChange={setPreferencesConsent}
                aria-label="Activar cookies de preferencias"
              />
            </div>
          </div>
        )}

        {/* Acciones principales */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-1 border-t border-border/60">
          <button
            type="button"
            onClick={() => setShowPreferences(!showPreferences)}
            className="text-xs font-semibold text-muted-foreground hover:text-foreground inline-flex items-center gap-1 justify-center py-1.5 transition-colors cursor-pointer"
          >
            <span>{showPreferences ? "Ocultar ajustes" : "Personalizar"}</span>
            {showPreferences ? (
              <ChevronUp className="size-3.5" />
            ) : (
              <ChevronDown className="size-3.5" />
            )}
          </button>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleAcceptNecessary}
              className="flex-1 sm:flex-initial h-9 px-3.5 rounded-4xl border-border bg-card hover:bg-muted text-foreground font-semibold text-xs"
            >
              Solo necesarias
            </Button>

            <Button
              type="button"
              size="sm"
              onClick={showPreferences ? handleSaveCustom : handleAcceptAll}
              className="flex-1 sm:flex-initial h-9 px-4 rounded-4xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs shadow-xs"
            >
              {showPreferences ? "Guardar selección" : "Aceptar todas"}
            </Button>
          </div>
        </div>

        {/* Enlace al Aviso de Privacidad y Pie */}
        <div className="flex items-center justify-between text-[11px] text-muted-foreground/80 pt-0.5">
          <Link
            href="/privacy"
            className="hover:text-primary transition-colors underline-offset-2 hover:underline"
          >
            Aviso de Privacidad
          </Link>
          <span>K&apos;anPro © 2026</span>
        </div>
      </div>
    </aside>
  );
}
