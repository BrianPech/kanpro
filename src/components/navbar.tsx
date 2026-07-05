"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import {
  Kanban,
  ChevronDown,
  Sun,
  Moon,
  Menu,
  Briefcase,
  Users,
  ShieldCheck,
  ArrowRight,
  PlusCircle,
  Search,
  BrainCircuit,
  TrendingUp,
  X,
  DollarSign
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

export function Navbar() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [openMobile, setOpenMobile] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Avoid hydration mismatch by waiting for mount & handle scroll detection
  useEffect(() => {
    setMounted(true);

    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header className={cn(
      "sticky top-0 z-50 w-full transition-all duration-300",
      isScrolled
        ? "bg-background/85 backdrop-blur-md shadow-sm border-b border-border/10"
        : "bg-transparent shadow-none border-b border-transparent"
    )}>
      <div className="container mx-auto px-4 lg:px-8 h-16 flex items-center justify-between">

        {/* Left Side: Logo & Main Navigation */}
        <div className="flex items-center gap-6 lg:gap-8 flex-1">
          <Link href="/" className="flex items-center gap-2 group shrink-0">
            <div className="size-9 rounded-[12px] bg-primary flex items-center justify-center text-primary-foreground group-hover:scale-105 transition-transform duration-300">
              <Kanban className="size-5" />
            </div>
            <span className="font-sans font-bold text-xl tracking-tight text-foreground">
              K&apos;an<span className="text-primary">Pro</span>
            </span>
          </Link>

          <nav className="hidden lg:flex items-center">
            <NavigationMenu viewport={false}>
              <NavigationMenuList className="gap-1 xl:gap-2">

                {/* Item 1: Buscar Talento */}
                <NavigationMenuItem>
                  <NavigationMenuTrigger className="text-muted-foreground hover:text-foreground focus:text-foreground bg-transparent hover:bg-muted/40 cursor-pointer">
                    Buscar Talento
                  </NavigationMenuTrigger>
                  <NavigationMenuContent className="w-[320px] p-2 flex flex-col gap-1 md:w-[320px]">
                    <NavigationMenuLink asChild>
                      <Link href="/register/company" className="flex items-start gap-3 hover:bg-muted/50 cursor-pointer">
                        <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                          <PlusCircle className="size-4.5" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-foreground">Publicar una Vacante</div>
                          <div className="text-[10px] text-muted-foreground mt-0.5">Sube una oferta de empleo local en segundos sin complicaciones.</div>
                        </div>
                      </Link>
                    </NavigationMenuLink>
                    <NavigationMenuLink asChild>
                      <Link href="/discovery" className="flex items-start gap-3 hover:bg-muted/50 cursor-pointer">
                        <div className="size-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                          <Search className="size-4.5" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-foreground">Explorar Candidatos</div>
                          <div className="text-[10px] text-muted-foreground mt-0.5">Encuentra talento local por zona específica y habilidades.</div>
                        </div>
                      </Link>
                    </NavigationMenuLink>
                    <NavigationMenuLink asChild>
                      <Link href="/login" className="flex items-start gap-3 hover:bg-muted/50 cursor-pointer">
                        <div className="size-8 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                          <BrainCircuit className="size-4.5" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-foreground">Sello de Calidad</div>
                          <div className="text-[10px] text-muted-foreground mt-0.5">Perfiles revisados y validados manualmente para tu tranquilidad.</div>
                        </div>
                      </Link>
                    </NavigationMenuLink>
                  </NavigationMenuContent>
                </NavigationMenuItem>

                {/* Item 2: Encontrar Trabajo */}
                <NavigationMenuItem>
                  <NavigationMenuTrigger className="text-muted-foreground hover:text-foreground focus:text-foreground bg-transparent hover:bg-muted/40 cursor-pointer">
                    Encontrar Trabajo
                  </NavigationMenuTrigger>
                  <NavigationMenuContent className="w-[320px] p-2 flex flex-col gap-1 md:w-[320px]">
                    <NavigationMenuLink asChild>
                      <Link href="/discovery" className="flex items-start gap-3 hover:bg-muted/50 cursor-pointer">
                        <div className="size-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                          <Briefcase className="size-4.5" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-foreground">Buscar Empleos</div>
                          <div className="text-[10px] text-muted-foreground mt-0.5">Explora vacantes en el sureste y postúlate directo.</div>
                        </div>
                      </Link>
                    </NavigationMenuLink>
                    <NavigationMenuLink asChild>
                      <Link href="/register/candidate" className="flex items-start gap-3 hover:bg-muted/50 cursor-pointer">
                        <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                          <Users className="size-4.5" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-foreground">Crear CV Digital Premium</div>
                          <div className="text-[10px] text-muted-foreground mt-0.5">Muestra quién eres, qué sabes hacer y en qué zona vives.</div>
                        </div>
                      </Link>
                    </NavigationMenuLink>
                    <NavigationMenuLink asChild>
                      <Link href="#" className="flex items-start gap-3 hover:bg-muted/50 cursor-pointer">
                        <div className="size-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                          <TrendingUp className="size-4.5" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-foreground">Control de Privacidad</div>
                          <div className="text-[10px] text-muted-foreground mt-0.5">Tú decides cuándo y a quién mostrar tu número de WhatsApp.</div>
                        </div>
                      </Link>
                    </NavigationMenuLink>
                  </NavigationMenuContent>
                </NavigationMenuItem>

                {/* Item 3: Por qué K'anPro */}
                <NavigationMenuItem>
                  <NavigationMenuTrigger className="text-muted-foreground hover:text-foreground focus:text-foreground bg-transparent hover:bg-muted/40 cursor-pointer">
                    Por Qué K&apos;anPro
                  </NavigationMenuTrigger>
                  <NavigationMenuContent className="w-[320px] p-2 flex flex-col gap-1 md:w-[320px]">
                    <NavigationMenuLink asChild>
                      <Link href="#features" className="flex items-start gap-3 hover:bg-muted/50 cursor-pointer">
                        <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                          <PlusCircle className="size-4.5" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-foreground">Para Empresas</div>
                          <div className="text-[10px] text-muted-foreground mt-0.5">Contratación directa por WhatsApp y sin burocracia.</div>
                        </div>
                      </Link>
                    </NavigationMenuLink>
                    <NavigationMenuLink asChild>
                      <Link href="#features" className="flex items-start gap-3 hover:bg-muted/50 cursor-pointer">
                        <div className="size-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                          <Users className="size-4.5" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-foreground">Para Candidatos</div>
                          <div className="text-[10px] text-muted-foreground mt-0.5">Encuentra trabajo cerca de tu casa y contacta al instante.</div>
                        </div>
                      </Link>
                    </NavigationMenuLink>
                    <NavigationMenuLink asChild>
                      <Link href="#" className="flex items-start gap-3 hover:bg-muted/50 cursor-pointer">
                        <div className="size-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                          <ShieldCheck className="size-4.5" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-foreground">Validación Humana</div>
                          <div className="text-[10px] text-muted-foreground mt-0.5">Sello de calidad para evitar spam, fraudes y cuentas falsas.</div>
                        </div>
                      </Link>
                    </NavigationMenuLink>
                  </NavigationMenuContent>
                </NavigationMenuItem>

                {/* Flat Link: Precios */}
                <NavigationMenuItem>
                  <NavigationMenuLink asChild className={cn(navigationMenuTriggerStyle(), "bg-transparent hover:bg-muted/40 text-muted-foreground hover:text-foreground focus:text-foreground cursor-pointer")}>
                    <Link href="#pricing">
                      Precios
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>

                {/* Flat Link: Explorar */}
                <NavigationMenuItem>
                  <NavigationMenuLink asChild className={cn(navigationMenuTriggerStyle(), "bg-transparent hover:bg-muted/40 text-muted-foreground hover:text-foreground focus:text-foreground cursor-pointer")}>
                    <Link href="/discovery">
                      Explorar
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
          </nav>
        </div>

        {/* Right Side: Theme, Auth Actions, Mobile Menu */}
        <div className="flex items-center gap-3">

          {/* Theme Switcher */}
          {mounted && (
            <Button
              variant="ghost"
              size="icon"
              className="rounded-xl hover:bg-muted/50 shrink-0 text-muted-foreground hover:text-foreground cursor-pointer"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              aria-label="Alternar tema oscuro"
            >
              {theme === "dark" ? <Sun className="size-4.5" /> : <Moon className="size-4.5" />}
            </Button>
          )}

          {/* Desktop Auth Actions */}
          <div className="hidden lg:flex items-center gap-3">
            <Button variant="ghost" className="h-12 px-6 rounded-full font-semibold text-sm tracking-[0.24px]" asChild>
              <Link href="/login">Iniciar Sesión</Link>
            </Button>
            <Button className="h-12 px-6 rounded-full bg-primary hover:bg-primary/95 text-primary-foreground font-semibold text-sm tracking-[0.24px] transition-all duration-200" asChild>
              <Link href="/register">Registrarse</Link>
            </Button>
          </div>

          {/* Mobile Drawer Trigger (Sheet) */}
          <Sheet open={openMobile} onOpenChange={setOpenMobile}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/50"
                aria-label="Abrir menú de navegación"
              >
                <Menu className="size-5.5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[85vw] max-w-[340px] p-6 flex flex-col justify-between">

              <div className="space-y-6">
                <SheetHeader className="p-0 border-b border-border/50 pb-4 flex flex-row items-center justify-between">
                  <SheetTitle className="flex items-center gap-2">
                    <div className="size-8 rounded-lg bg-gradient-to-br from-primary via-indigo-600 to-amber-500 flex items-center justify-center text-white">
                      <Kanban className="size-4.5" />
                    </div>
                    <span className="font-sans font-bold text-base">
                      K&apos;anPro
                    </span>
                  </SheetTitle>
                </SheetHeader>

                {/* Mobile Menu List */}
                <nav className="flex flex-col gap-1">
                  <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-2 py-1">Navegación</div>

                  <Link
                    href="/discovery"
                    onClick={() => setOpenMobile(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted/50 font-medium text-foreground text-sm transition-all"
                  >
                    <Briefcase className="size-4 text-primary" /> Buscar Empleos
                  </Link>

                  <Link
                    href="/discovery"
                    onClick={() => setOpenMobile(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted/50 font-medium text-foreground text-sm transition-all"
                  >
                    <Users className="size-4 text-amber-500" /> Buscar Talento
                  </Link>

                  <Link
                    href="#features"
                    onClick={() => setOpenMobile(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted/50 font-medium text-foreground text-sm transition-all"
                  >
                    <ShieldCheck className="size-4 text-emerald-500" /> Características
                  </Link>

                  <Link
                    href="#pricing"
                    onClick={() => setOpenMobile(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted/50 font-medium text-foreground text-sm transition-all"
                  >
                    <DollarSign className="size-4 text-amber-500" /> Precios
                  </Link>

                  <Link
                    href="/contact"
                    onClick={() => setOpenMobile(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted/50 font-medium text-foreground text-sm transition-all"
                  >
                    <ChevronDown className="size-4 -rotate-90 text-muted-foreground" /> Contacto
                  </Link>
                </nav>
              </div>

              {/* Mobile Auth actions */}
              <div className="space-y-3 pt-6 border-t border-border/50">
                {mounted && (
                  <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-muted/40">
                    <span className="text-xs font-medium text-muted-foreground">Modo Oscuro</span>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="rounded-lg hover:bg-muted/80 text-muted-foreground hover:text-foreground"
                      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                      aria-label="Alternar tema oscuro"
                    >
                      {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
                    </Button>
                  </div>
                )}

                <Button variant="outline" className="w-full h-12 rounded-full justify-center font-semibold text-sm tracking-[0.24px]" asChild>
                  <Link href="/login" onClick={() => setOpenMobile(false)}>Iniciar Sesión</Link>
                </Button>

                <Button className="w-full h-12 rounded-full bg-primary hover:bg-primary/95 justify-center font-semibold text-primary-foreground text-sm tracking-[0.24px] transition-all duration-200" asChild>
                  <Link href="/register" onClick={() => setOpenMobile(false)}>
                    Registrarse Gratis <ArrowRight className="size-4 ml-1.5" />
                  </Link>
                </Button>
              </div>

            </SheetContent>
          </Sheet>

        </div>

      </div>
    </header>
  );
}
