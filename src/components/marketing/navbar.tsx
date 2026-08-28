"use client";

import React from "react";
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
  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-md transition-all">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* 1. Identidad de marca (Izquierda): Logo + Nombre con enlace a '/' */}
        <Link
          href="/"
          className="group flex items-center gap-3 transition-opacity hover:opacity-90"
        >
          <div className="flex size-10 items-center justify-center rounded-xl bg-slate-900 text-white shadow-sm transition-transform duration-200 group-hover:scale-105">
            <Kanban className="size-5" />
          </div>
          <span className="font-sans text-xl font-bold tracking-tight text-slate-900">
            K’anPro
          </span>
        </Link>

        {/* 2. Menú Central: Navegación por perfil y propuesta de valor */}
        <div className="hidden lg:flex items-center">
          <NavigationMenu align="center">
            <NavigationMenuList className="gap-1">
              {/* Sección: Para Empresas */}
              <NavigationMenuItem>
                <NavigationMenuTrigger className="bg-transparent font-medium text-slate-700 hover:bg-slate-900/5 hover:text-slate-950 focus:bg-slate-900/5">
                  Para Empresas
                </NavigationMenuTrigger>
                <NavigationMenuContent className="w-[380px] p-2">
                  <div className="flex flex-col gap-1">
                    {/* Publicación de Vacantes */}
                    <NavigationMenuLink
                      href="/register/company"
                      className="group flex items-start gap-3.5 rounded-xl p-3 text-left transition-colors hover:bg-slate-100/90"
                    >
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition-colors group-hover:bg-blue-100">
                        <Briefcase className="size-4.5" />
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-semibold text-slate-900 leading-tight">
                          Publicación de Vacantes
                        </span>
                        <p className="text-xs text-slate-500 leading-relaxed">
                          Anuncia tus ofertas y recibe postulaciones filtradas y directas por WhatsApp.
                        </p>
                      </div>
                    </NavigationMenuLink>

                    {/* Búsqueda de Talento */}
                    <NavigationMenuLink
                      href="#candidatos"
                      className="group flex items-start gap-3.5 rounded-xl p-3 text-left transition-colors hover:bg-slate-100/90"
                    >
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 transition-colors group-hover:bg-emerald-100">
                        <Users className="size-4.5" />
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-semibold text-slate-900 leading-tight">
                          Búsqueda de Talento
                        </span>
                        <p className="text-xs text-slate-500 leading-relaxed">
                          Explora perfiles verificados y disponibles en Mérida y la Riviera Maya.
                        </p>
                      </div>
                    </NavigationMenuLink>

                    {/* Planes y Tarifas */}
                    <NavigationMenuLink
                      href="#planes"
                      className="group flex items-start gap-3.5 rounded-xl p-3 text-left transition-colors hover:bg-slate-100/90"
                    >
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600 transition-colors group-hover:bg-amber-100">
                        <CreditCard className="size-4.5" />
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-semibold text-slate-900 leading-tight">
                          Planes y Tarifas
                        </span>
                        <p className="text-xs text-slate-500 leading-relaxed">
                          Tarifas claras sin comisiones por contratación ni cobros ocultos.
                        </p>
                      </div>
                    </NavigationMenuLink>
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>

              {/* Sección: Para Candidatos */}
              <NavigationMenuItem>
                <NavigationMenuTrigger className="bg-transparent font-medium text-slate-700 hover:bg-slate-900/5 hover:text-slate-950 focus:bg-slate-900/5">
                  Para Candidatos
                </NavigationMenuTrigger>
                <NavigationMenuContent className="w-[380px] p-2">
                  <div className="flex flex-col gap-1">
                    {/* Explorar Vacantes */}
                    <NavigationMenuLink
                      href="#vacantes"
                      className="group flex items-start gap-3.5 rounded-xl p-3 text-left transition-colors hover:bg-slate-100/90"
                    >
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 transition-colors group-hover:bg-indigo-100">
                        <Compass className="size-4.5" />
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-semibold text-slate-900 leading-tight">
                          Explorar Vacantes
                        </span>
                        <p className="text-xs text-slate-500 leading-relaxed">
                          Acceso directo al catálogo público de empleos en Mérida y el Sureste.
                        </p>
                      </div>
                    </NavigationMenuLink>

                    {/* Cómo Funciona la Postulación */}
                    <NavigationMenuLink
                      href="#como-funciona"
                      className="group flex items-start gap-3.5 rounded-xl p-3 text-left transition-colors hover:bg-slate-100/90"
                    >
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-600 transition-colors group-hover:bg-teal-100">
                        <Sparkles className="size-4.5" />
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-semibold text-slate-900 leading-tight">
                          ¿Cómo Postularme?
                        </span>
                        <p className="text-xs text-slate-500 leading-relaxed">
                          Conexión directa por WhatsApp con empresas, sin intermediarios.
                        </p>
                      </div>
                    </NavigationMenuLink>

                    {/* Crear Expediente */}
                    <NavigationMenuLink
                      href="/register/candidate"
                      className="group flex items-start gap-3.5 rounded-xl p-3 text-left transition-colors hover:bg-slate-100/90"
                    >
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-purple-50 text-purple-600 transition-colors group-hover:bg-purple-100">
                        <UserCheck className="size-4.5" />
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-semibold text-slate-900 leading-tight">
                          Crear Expediente
                        </span>
                        <p className="text-xs text-slate-500 leading-relaxed">
                          Genera tu perfil digital verificado gratis para postularte en un clic.
                        </p>
                      </div>
                    </NavigationMenuLink>
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>

              {/* Enlace directo: Precios */}
              <NavigationMenuItem>
                <NavigationMenuLink
                  href="#planes"
                  className="inline-flex h-9 items-center justify-center rounded-2xl px-3 py-1.5 text-sm font-medium text-slate-700 transition-all hover:bg-slate-900/5 hover:text-slate-950 focus:bg-slate-900/5 focus-visible:outline-none"
                >
                  Precios
                </NavigationMenuLink>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        {/* 3. Extremo derecho: Acceso y Conversión (CTAs) */}
        <div className="flex items-center gap-2.5">
          <Link
            href="/login"
            className="inline-flex h-9.5 items-center justify-center rounded-xl px-3.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-900/5 hover:text-slate-950"
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
