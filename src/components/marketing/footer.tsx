"use client";

import React from "react";
import Link from "next/link";
import { KanproIsotype } from "@/components/ui/icons";
import { CtaBanner } from "@/components/marketing/cta-banner";

interface FooterProps {
  showCta?: boolean;
}

export function Footer({ showCta = false }: FooterProps = {}) {
  return (
    <footer
      className={`w-full overflow-hidden bg-transparent text-foreground pb-0 relative flex flex-col items-center ${
        showCta ? "pt-14 sm:pt-20" : "pt-8 sm:pt-12"
      }`}
    >
      <div className="w-full max-w-[1536px] mx-auto px-4 sm:px-8 md:px-12 lg:px-16 xl:px-20 space-y-6 sm:space-y-8 relative">
        {/* ========================================================= */}
        {/* 1. TOP CARD: FLOATING LIGHT CTA BANNER (OPTIONAL)         */}
        {/* ========================================================= */}
        {showCta && (
          <CtaBanner className="pt-0 px-0 sm:px-0 md:px-0 lg:px-0 xl:px-0 max-w-full pb-0" />
        )}

        {/* ========================================================= */}
        {/* 2. BOTTOM CARD: FLOATING SHADCN CARD FOOTER CONTAINER     */}
        {/* ========================================================= */}
        <div className="rounded-[2.5rem] bg-card text-card-foreground border border-border shadow-sm p-8 sm:p-12 lg:p-14 xl:p-16 space-y-10 relative backdrop-blur-md">
          
          {/* Main Content Grid: Colophon on Left + Links on Right */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-10 lg:gap-14 xl:gap-20 text-left">
            
            {/* Left: Brand Identity & Social Icons */}
            <div className="md:col-span-5 lg:col-span-4 xl:col-span-4 space-y-4">
              <Link href="/" className="flex items-center gap-2.5 group w-fit">
                <div className="size-8 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-bold shadow-xs transition-transform group-hover:scale-105">
                  <KanproIsotype className="size-4.5" variant="white" />
                </div>
                <span className="font-bold text-lg tracking-tight text-foreground font-sans">
                  K’anPro
                </span>
              </Link>

              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-sm">
                Plataforma de contratación directa y expediente laboral verificado en el Sureste de México. Operando en Mérida, Cancún y la Riviera Maya.
              </p>

              {/* Social Icons Row */}
              <div className="flex items-center gap-2 pt-2 text-muted-foreground">
                {/* X (Twitter) */}
                <a
                  href="https://x.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="size-9 rounded-xl border border-border/80 bg-muted/40 flex items-center justify-center hover:bg-accent hover:text-accent-foreground transition-colors"
                  aria-label="X (Twitter)"
                >
                  <svg className="size-3.5 fill-current" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </a>

                {/* Instagram */}
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="size-9 rounded-xl border border-border/80 bg-muted/40 flex items-center justify-center hover:bg-accent hover:text-accent-foreground transition-colors"
                  aria-label="Instagram"
                >
                  <svg
                    className="size-3.5 fill-none stroke-current stroke-2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    viewBox="0 0 24 24"
                  >
                    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                  </svg>
                </a>

                {/* LinkedIn */}
                <a
                  href="https://linkedin.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="size-9 rounded-xl border border-border/80 bg-muted/40 flex items-center justify-center hover:bg-accent hover:text-accent-foreground transition-colors"
                  aria-label="LinkedIn"
                >
                  <svg className="size-3.5 fill-current" viewBox="0 0 24 24">
                    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.2V10.9H6.46M7.83 6.22a1.62 1.62 0 1 0 0 3.24 1.62 1.62 0 0 0 0-3.24" />
                  </svg>
                </a>

                {/* GitHub */}
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="size-9 rounded-xl border border-border/80 bg-muted/40 flex items-center justify-center hover:bg-accent hover:text-accent-foreground transition-colors"
                  aria-label="GitHub"
                >
                  <svg className="size-3.5 fill-current" viewBox="0 0 24 24">
                    <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                  </svg>
                </a>
              </div>
            </div>

            {/* Right: Link Columns */}
            <div className="md:col-span-7 lg:col-span-8 xl:col-span-8 grid grid-cols-2 sm:grid-cols-3 gap-8 text-xs sm:text-sm">
              
              {/* Column 1: Producto */}
              <div className="space-y-3">
                <span className="font-semibold text-foreground tracking-tight block">
                  Producto
                </span>
                <ul className="space-y-2.5 text-muted-foreground font-medium">
                  <li>
                    <Link href="/register/company" className="hover:text-foreground transition-colors">
                      Publicar Vacantes
                    </Link>
                  </li>
                  <li>
                    <Link href="#tablon" className="hover:text-foreground transition-colors">
                      Tablón en Vivo
                    </Link>
                  </li>
                  <li>
                    <Link href="#comparativa" className="hover:text-foreground transition-colors">
                      0% Comisiones (Acceso Anticipado)
                    </Link>
                  </li>
                  <li>
                    <Link href="#empresas" className="hover:text-foreground transition-colors">
                      Integración WhatsApp
                    </Link>
                  </li>
                  <li>
                    <Link href="#verificacion" className="hover:text-foreground transition-colors">
                      Auditoría SAT 13 Puntos
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Column 2: Recursos */}
              <div className="space-y-3">
                <span className="font-semibold text-foreground tracking-tight block">
                  Recursos
                </span>
                <ul className="space-y-2.5 text-muted-foreground font-medium">
                  <li>
                    <Link href="/register/candidate" className="hover:text-foreground transition-colors">
                      Crear Expediente
                    </Link>
                  </li>
                  <li>
                    <Link href="#faq" className="hover:text-foreground transition-colors">
                      Preguntas Frecuentes
                    </Link>
                  </li>
                  <li>
                    <Link href="#como-funciona" className="hover:text-foreground transition-colors">
                      Guía de Postulación
                    </Link>
                  </li>
                  <li>
                    <Link href="#zonas" className="hover:text-foreground transition-colors">
                      Corredores del Sureste
                    </Link>
                  </li>
                  <li>
                    <Link href="/help" className="hover:text-foreground transition-colors">
                      Centro de Ayuda
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Column 3: Compañía */}
              <div className="space-y-3">
                <span className="font-semibold text-foreground tracking-tight block">
                  Compañía
                </span>
                <ul className="space-y-2.5 text-muted-foreground font-medium">
                  <li>
                    <Link href="/contact" className="hover:text-foreground transition-colors">
                      Contacto
                    </Link>
                  </li>
                  <li>
                    <Link href="/terms" className="hover:text-foreground transition-colors">
                      Cumplimiento LFT
                    </Link>
                  </li>
                  <li>
                    <Link href="/privacy" className="hover:text-foreground transition-colors">
                      Aviso de Privacidad
                    </Link>
                  </li>
                  <li>
                    <Link href="/terms" className="hover:text-foreground transition-colors">
                      Términos de Servicio
                    </Link>
                  </li>
                  <li>
                    <Link href="/login" className="hover:text-foreground transition-colors">
                      Acceso al Sistema
                    </Link>
                  </li>
                </ul>
              </div>

            </div>

          </div>

          {/* Divider */}
          <div className="border-t border-border" />

          {/* Bottom Copyright & Legal Links */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-muted-foreground font-medium">
            <div>
              {`© 2026 K'anPro. Todos los derechos reservados.`}
            </div>

            <div className="flex flex-wrap items-center gap-6">
              <Link href="/privacy" className="hover:text-foreground transition-colors">
                Aviso de Privacidad
              </Link>
              <Link href="/terms" className="hover:text-foreground transition-colors">
                Términos de Servicio
              </Link>
              <button
                type="button"
                onClick={() => {
                  if (typeof window !== "undefined") {
                    window.dispatchEvent(new Event("kanpro:open-cookies"));
                  }
                }}
                className="hover:text-foreground transition-colors cursor-pointer text-left"
              >
                Configuración de Cookies
              </button>
            </div>
          </div>

        </div>

      </div>

      {/* ========================================================= */}
      {/* 3. HUGE MONUMENTAL WATERMARK (HALF-CROPPED & FADED OVERLAY) */}
      {/* ========================================================= */}
      <div className="relative w-full overflow-hidden select-none pointer-events-none flex justify-center items-start h-[7.5vw] min-h-[55px] max-h-[135px] mt-4 sm:mt-6">
        <span
          className="font-black text-[16vw] sm:text-[15vw] tracking-tighter text-foreground/[0.08] dark:text-foreground/[0.05] leading-[0.72] block select-none"
          style={{
            maskImage: "linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0.5) 45%, rgba(0,0,0,0) 95%)",
            WebkitMaskImage: "linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0.5) 45%, rgba(0,0,0,0) 95%)",
          }}
        >
          K’anPro
        </span>

        {/* Faded overlay difuminado suave */}
        <div
          className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-muted/30 dark:to-background pointer-events-none"
          aria-hidden="true"
        />
      </div>
    </footer>
  );
}
