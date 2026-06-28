"use client";

import React from "react";
import Link from "next/link";
import { Kanban } from "lucide-react";

export function Footer() {
  const companyColumns = [
    {
      title: "Para Empresas",
      links: [
        { label: "Cómo publicar", href: "/discovery" },
        { label: "Catálogo de candidatos", href: "/discovery" },
        { label: "Sello de Calidad", href: "/discovery" },
        { label: "Zonas de cobertura", href: "#features" },
        { label: "Planes locales", href: "#pricing" },
      ],
    },
    {
      title: "Para Candidatos",
      links: [
        { label: "Crear CV Digital", href: "/register/candidate" },
        { label: "Buscar ofertas", href: "/discovery" },
        { label: "Control de Privacidad", href: "#features" },
        { label: "Preguntas Frecuentes", href: "#" },
      ],
    },
    {
      title: "Soporte",
      links: [
        { label: "Centro de Ayuda", href: "#" },
        { label: "Validación Humana", href: "#" },
        { label: "Reportar Vacante", href: "#" },
        { label: "Contacto Directo", href: "/contact" },
      ],
    },
    {
      title: "K'anPro",
      links: [
        { label: "Sobre Nosotros", href: "#" },
        { label: "Empleo en Carrillo", href: "#" },
        { label: "Términos locales", href: "/terms" },
        { label: "Aviso de Privacidad", href: "/privacy" },
      ],
    },
  ];

  return (
    <footer className="container mx-auto px-6 py-12 relative z-10 bg-background">
      <div className="relative rounded-[20px] bg-muted/30 text-foreground border border-border/80 dark:border-border/10 p-6 sm:p-12 space-y-12 overflow-hidden">
        
        {/* Subtle Ambient Brand Glow */}
        <div className="absolute -bottom-20 -left-20 size-[320px] rounded-full bg-primary/5 dark:bg-primary/10 blur-[80px] pointer-events-none" />

        {/* Columns Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 relative z-10">
          {companyColumns.map((col, idx) => (
            <div key={idx} className="space-y-4 text-left">
              <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest block">
                {col.title}
              </h4>
              <ul className="flex flex-col gap-2.5">
                {col.links.map((link, lIdx) => (
                  <li key={lIdx}>
                    <Link
                      href={link.href}
                      className="text-[14px] font-normal leading-[1.43] text-muted-foreground hover:text-foreground transition-colors duration-200"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Socials & Apps Bar */}
        <div className="border-t border-border/60 dark:border-border/10 pt-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          
          {/* Social Networks */}
          <div className="flex flex-wrap items-center gap-4">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest block">Síguenos</span>
            <div className="flex items-center gap-2">
              <Link 
                href="#" 
                className="size-8 rounded-full bg-card border border-border hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-all duration-200"
              >
                {/* Facebook SVG */}
                <svg className="size-4 fill-current" viewBox="0 0 24 24">
                  <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c4.56-.93 8-4.96 8-9.75z"/>
                </svg>
              </Link>
              <Link 
                href="#" 
                className="size-8 rounded-full bg-card border border-border hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-all duration-200"
              >
                {/* LinkedIn SVG */}
                <svg className="size-4 fill-current" viewBox="0 0 24 24">
                  <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1 2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/>
                </svg>
              </Link>
              <Link 
                href="#" 
                className="size-8 rounded-full bg-card border border-border hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-all duration-200"
              >
                {/* Custom X SVG */}
                <svg className="size-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </Link>
              <Link 
                href="#" 
                className="size-8 rounded-full bg-card border border-border hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-all duration-200"
              >
                {/* YouTube SVG */}
                <svg className="size-4 fill-current" viewBox="0 0 24 24">
                  <path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.108C19.524 3.53 12 3.53 12 3.53s-7.524 0-9.388.525a3.003 3.003 0 0 0-2.11 2.108C0 8.029 0 12 0 12s0 3.971.502 5.837a3.003 3.003 0 0 0 2.11 2.108c1.864.525 9.388.525 9.388.525s7.524 0 9.388-.525a3.003 3.003 0 0 0 2.11-2.108C24 15.971 24 12 24 12s0-3.971-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
              </Link>
              <Link 
                href="#" 
                className="size-8 rounded-full bg-card border border-border hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-all duration-200"
              >
                {/* Instagram SVG */}
                <svg className="size-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051C.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/>
                </svg>
              </Link>
            </div>
          </div>

          {/* App Stores */}
          <div className="flex flex-wrap items-center gap-4">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest block">App Móvil</span>
            <div className="flex items-center gap-2">
              <Link 
                href="#" 
                className="size-8 rounded-full bg-card border border-border hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-all duration-200"
                title="App Store"
              >
                {/* Apple SVG */}
                <svg className="size-4 fill-current" viewBox="0 0 24 24">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-1 .04-2.21.67-2.93 1.49-.62.69-1.16 1.84-1.01 2.96 1.12.09 2.27-.57 2.95-1.39z"/>
                </svg>
              </Link>
              <Link 
                href="#" 
                className="size-8 rounded-full bg-card border border-border hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-all duration-200"
                title="Google Play"
              >
                {/* Google Play / Android SVG */}
                <svg className="size-4 fill-current ml-0.5" viewBox="0 0 24 24">
                  <path d="M3.609 1.814L13.784 12 3.609 22.186c-.461-.462-.718-1.096-.718-1.761V3.575c0-.665.257-1.299.718-1.761zm11.597 8.78L19.46 12l-4.254 1.406-2.072-2.072 2.072-2.072zM4.73 2.533L13.14 10.94l-2.072 2.072L3.109 4.73C3.513 3.518 4.417 2.846 4.73 2.533zm8.41 16.82l-8.41 8.409c-.313-.313-1.217-.985-1.621-2.197l7.959-8.284 2.072 2.072z"/>
                </svg>
              </Link>
            </div>
          </div>
        </div>

        {/* Legal bottom row */}
        <div className="border-t border-border/60 dark:border-border/10 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-muted-foreground relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="size-5 rounded-[6px] bg-primary flex items-center justify-center text-primary-foreground shrink-0">
              <Kanban className="size-3" />
            </div>
            <span className="font-sans font-bold text-xs text-foreground">
              K&apos;anPro
            </span>
            <span className="mx-1 text-muted-foreground">|</span>
            <span className="text-[13px] font-normal leading-[1.4] text-muted-foreground">K&apos;anPro - El motor de empleo más rápido de Felipe Carrillo Puerto.</span>
          </div>

          <div className="flex flex-wrap gap-x-4 gap-y-1 justify-center sm:justify-end">
            <Link href="/terms" className="text-muted-foreground hover:text-foreground transition-colors duration-200">Términos de Servicio</Link>
            <Link href="/privacy" className="text-muted-foreground hover:text-foreground transition-colors duration-200">Política de Privacidad</Link>
            <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors duration-200">Accesibilidad</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
