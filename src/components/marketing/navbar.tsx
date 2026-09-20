"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Kanban,
  Briefcase,
  Users,
  CreditCard,
  Compass,
  Sparkles,
  UserCheck,
  ArrowRight,
} from "lucide-react";
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuTrigger,
  NavigationMenuContent,
  NavigationMenuLink,
} from "@/components/ui/navigation-menu";

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        isScrolled
          ? "bg-background/80 backdrop-blur-md border-b border-border/50 shadow-2xs"
          : "bg-transparent border-b border-transparent"
      }`}
    >
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* 1. Identidad de marca (Izquierda): Logo + Nombre con enlace a '/' */}
        <Link
          href="/"
          className="group flex items-center gap-3 transition-opacity hover:opacity-90"
        >
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm transition-transform duration-200 group-hover:scale-105">
            <Kanban className="size-5" />
          </div>
          <span className="font-sans text-xl font-bold tracking-tight text-foreground">
            K’anPro
          </span>
        </Link>

        {/* 2. Menú Central: Navegación por perfil y propuesta de valor */}
        <div className="hidden lg:flex items-center">
          <NavigationMenu align="center">
            <NavigationMenuList className="gap-1">
              {/* Sección: Para Empresas */}
              <NavigationMenuItem>
                <NavigationMenuTrigger className="bg-transparent font-medium text-muted-foreground hover:bg-accent hover:text-foreground focus:bg-accent data-popup-open:text-foreground">
                  Para Empresas
                </NavigationMenuTrigger>
                <NavigationMenuContent className="w-[380px] p-2">
                  <div className="flex flex-col gap-1">
                    {/* Publicación de Vacantes */}
                    <NavigationMenuLink
                      href="/register/company"
                      className="group flex items-start gap-3.5 rounded-xl p-3 text-left transition-colors hover:bg-accent/60"
                    >
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary/20">
                        <Briefcase className="size-4.5" />
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-semibold text-foreground leading-tight">
                          Publicación de Vacantes
                        </span>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          Anuncia tus ofertas y recibe postulaciones filtradas y directas por WhatsApp.
                        </p>
                      </div>
                    </NavigationMenuLink>

                    {/* Búsqueda de Talento */}
                    <NavigationMenuLink
                      href="#candidatos"
                      className="group flex items-start gap-3.5 rounded-xl p-3 text-left transition-colors hover:bg-accent/60"
                    >
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary/20">
                        <Users className="size-4.5" />
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-semibold text-foreground leading-tight">
                          Búsqueda de Talento
                        </span>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          Explora perfiles verificados y disponibles en Mérida y la Riviera Maya.
                        </p>
                      </div>
                    </NavigationMenuLink>

                    {/* 0% Comisiones */}
                    <NavigationMenuLink
                      href="#comparativa"
                      className="group flex items-start gap-3.5 rounded-xl p-3 text-left transition-colors hover:bg-accent/60"
                    >
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary/20">
                        <CreditCard className="size-4.5" />
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-semibold text-foreground leading-tight">
                          0% Comisiones
                        </span>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          Acceso anticipado sin costos ocultos ni comisiones sobre sueldos.
                        </p>
                      </div>
                    </NavigationMenuLink>
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>

              {/* Sección: Para Candidatos */}
              <NavigationMenuItem>
                <NavigationMenuTrigger className="bg-transparent font-medium text-muted-foreground hover:bg-accent hover:text-foreground focus:bg-accent data-popup-open:text-foreground">
                  Para Candidatos
                </NavigationMenuTrigger>
                <NavigationMenuContent className="w-[380px] p-2">
                  <div className="flex flex-col gap-1">
                    {/* Explorar Vacantes */}
                    <NavigationMenuLink
                      href="#vacantes"
                      className="group flex items-start gap-3.5 rounded-xl p-3 text-left transition-colors hover:bg-accent/60"
                    >
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary/20">
                        <Compass className="size-4.5" />
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-semibold text-foreground leading-tight">
                          Explorar Vacantes
                        </span>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          Acceso directo al catálogo público de empleos en Mérida y el Sureste.
                        </p>
                      </div>
                    </NavigationMenuLink>

                    {/* Cómo Funciona la Postulación */}
                    <NavigationMenuLink
                      href="#como-funciona"
                      className="group flex items-start gap-3.5 rounded-xl p-3 text-left transition-colors hover:bg-accent/60"
                    >
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary/20">
                        <Sparkles className="size-4.5" />
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-semibold text-foreground leading-tight">
                          ¿Cómo Postularme?
                        </span>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          Conexión directa por WhatsApp con empresas, sin intermediarios.
                        </p>
                      </div>
                    </NavigationMenuLink>

                    {/* Crear Expediente */}
                    <NavigationMenuLink
                      href="/register/candidate"
                      className="group flex items-start gap-3.5 rounded-xl p-3 text-left transition-colors hover:bg-accent/60"
                    >
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary/20">
                        <UserCheck className="size-4.5" />
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-semibold text-foreground leading-tight">
                          Crear Expediente
                        </span>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          Genera tu perfil digital verificado gratis para postularte en un clic.
                        </p>
                      </div>
                    </NavigationMenuLink>
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>

              {/* Enlace directo: Comparativa */}
              <NavigationMenuItem>
                <NavigationMenuLink
                  href="#comparativa"
                  className="inline-flex h-9 items-center justify-center rounded-2xl px-3 py-1.5 text-sm font-medium text-muted-foreground transition-all hover:bg-accent hover:text-foreground focus:bg-accent focus-visible:outline-none"
                >
                  Comparativa
                </NavigationMenuLink>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        {/* 3. Extremo derecho: Acceso y Conversión (CTAs) */}
        <div className="flex items-center gap-2.5">
          <Link
            href="/login"
            className="inline-flex h-9.5 items-center justify-center rounded-xl px-3.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            Iniciar Sesión
          </Link>
          <Link
            href="/register"
            className="inline-flex h-9.5 items-center justify-center gap-1.5 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 hover:shadow active:scale-[0.98]"
          >
            <span>Registrarse</span>
            <ArrowRight className="size-3.5" />
          </Link>
        </div>
      </div>
    </header>
  );
}
