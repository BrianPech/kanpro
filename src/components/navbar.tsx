"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Kanban, 
  Menu, 
  ArrowRight,
  PlusCircle,
  Search,
  BrainCircuit,
  Briefcase,
  Users,
  TrendingUp,
  ShieldCheck,
  LayoutDashboard,
  ChevronDown
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
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [openMobile, setOpenMobile] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const supabase = createClient();
    
    async function checkAuth() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
        
        if (user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .single();
            
          setRole(profile?.role || "candidate");
        }
      } catch (e) {
        console.error("Error checking auth status in navbar:", e);
      } finally {
        setIsLoading(false);
      }
    }

    checkAuth();
  }, []);

  const dashboardUrl = role === "admin" 
    ? "/dashboard/admin" 
    : role === "company" 
      ? "/dashboard/company" 
      : "/dashboard/candidate";

  return (
    <header 
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        isScrolled 
          ? "bg-background/80 backdrop-blur-md border-b border-border/40 shadow-xs py-3" 
          : "bg-transparent py-5"
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        
        {/* Left Side: Brand & Main Navigation */}
        <div className="flex items-center gap-8">
          
          {/* Logo Brand */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-transform group-hover:scale-105">
              <Kanban className="size-5" />
            </div>
            <span className="text-xl font-bold tracking-tight text-foreground">
              K&apos;anPro
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center">
            <NavigationMenu>
              <NavigationMenuList className="gap-1">
                
                {/* Item 1: Buscar Talento */}
                <NavigationMenuItem>
                  <NavigationMenuTrigger className="text-muted-foreground hover:text-foreground focus:text-foreground bg-transparent hover:bg-muted/40 cursor-pointer">
                    Buscar Talento
                  </NavigationMenuTrigger>
                  <NavigationMenuContent className="w-[320px] p-2 flex flex-col gap-1 md:w-[320px]">
                    <NavigationMenuLink render={<Link href="/register/company" className="flex items-start gap-3 hover:bg-muted/50 cursor-pointer" />}>
                      <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <PlusCircle className="size-4.5" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-foreground">Publicar una Vacante</div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">Sube una oferta de empleo local en segundos sin complicaciones.</div>
                      </div>
                    </NavigationMenuLink>
                    <NavigationMenuLink render={<Link href="/discovery" className="flex items-start gap-3 hover:bg-muted/50 cursor-pointer" />}>
                      <div className="size-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                        <Search className="size-4.5" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-foreground">Explorar Candidatos</div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">Encuentra talento local por zona específica y habilidades.</div>
                      </div>
                    </NavigationMenuLink>
                    <NavigationMenuLink render={<Link href="/login" className="flex items-start gap-3 hover:bg-muted/50 cursor-pointer" />}>
                      <div className="size-8 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                        <BrainCircuit className="size-4.5" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-foreground">Sello de Calidad</div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">Perfiles revisados y validados manualmente para tu tranquilidad.</div>
                      </div>
                    </NavigationMenuLink>
                  </NavigationMenuContent>
                </NavigationMenuItem>

                {/* Item 2: Encontrar Trabajo */}
                <NavigationMenuItem>
                  <NavigationMenuTrigger className="text-muted-foreground hover:text-foreground focus:text-foreground bg-transparent hover:bg-muted/40 cursor-pointer">
                    Encontrar Trabajo
                  </NavigationMenuTrigger>
                  <NavigationMenuContent className="w-[320px] p-2 flex flex-col gap-1 md:w-[320px]">
                    <NavigationMenuLink render={<Link href="/discovery" className="flex items-start gap-3 hover:bg-muted/50 cursor-pointer" />}>
                      <div className="size-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                        <Briefcase className="size-4.5" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-foreground">Buscar Empleos</div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">Explora vacantes en el sureste y postúlate directo.</div>
                      </div>
                    </NavigationMenuLink>
                    <NavigationMenuLink render={<Link href="/register/candidate" className="flex items-start gap-3 hover:bg-muted/50 cursor-pointer" />}>
                      <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <Users className="size-4.5" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-foreground">Crear CV Digital Premium</div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">Muestra quién eres, qué sabes hacer y en qué zona vives.</div>
                      </div>
                    </NavigationMenuLink>
                    <NavigationMenuLink render={<Link href="#" className="flex items-start gap-3 hover:bg-muted/50 cursor-pointer" />}>
                      <div className="size-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                        <TrendingUp className="size-4.5" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-foreground">Control de Privacidad</div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">Tú decides cuándo y a quién mostrar tu número de WhatsApp.</div>
                      </div>
                    </NavigationMenuLink>
                  </NavigationMenuContent>
                </NavigationMenuItem>

                {/* Item 3: Por qué K'anPro */}
                <NavigationMenuItem>
                  <NavigationMenuTrigger className="text-muted-foreground hover:text-foreground focus:text-foreground bg-transparent hover:bg-muted/40 cursor-pointer">
                    Por Qué K&apos;anPro
                  </NavigationMenuTrigger>
                  <NavigationMenuContent className="w-[320px] p-2 flex flex-col gap-1 md:w-[320px]">
                    <NavigationMenuLink render={<Link href="#features" className="flex items-start gap-3 hover:bg-muted/50 cursor-pointer" />}>
                      <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <PlusCircle className="size-4.5" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-foreground">Para Empresas</div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">Contratación directa por WhatsApp y sin burocracia.</div>
                      </div>
                    </NavigationMenuLink>
                    <NavigationMenuLink render={<Link href="#features" className="flex items-start gap-3 hover:bg-muted/50 cursor-pointer" />}>
                      <div className="size-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                        <Users className="size-4.5" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-foreground">Para Candidatos</div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">Encuentra trabajo cerca de tu casa y contacta al instante.</div>
                      </div>
                    </NavigationMenuLink>
                    <NavigationMenuLink render={<Link href="#" className="flex items-start gap-3 hover:bg-muted/50 cursor-pointer" />}>
                      <div className="size-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                        <ShieldCheck className="size-4.5" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-foreground">Validación Humana</div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">Sello de calidad para evitar spam, fraudes y cuentas falsas.</div>
                      </div>
                    </NavigationMenuLink>
                  </NavigationMenuContent>
                </NavigationMenuItem>

                {/* Flat Link: Precios */}
                <NavigationMenuItem>
                  <NavigationMenuLink
                    render={<Link href="#pricing" />}
                    className={cn(navigationMenuTriggerStyle(), "bg-transparent hover:bg-muted/40 text-muted-foreground hover:text-foreground focus:text-foreground cursor-pointer")}
                  >
                    Precios
                  </NavigationMenuLink>
                </NavigationMenuItem>

                {/* Flat Link: Explorar */}
                <NavigationMenuItem>
                  <NavigationMenuLink
                    render={<Link href="/discovery" />}
                    className={cn(navigationMenuTriggerStyle(), "bg-transparent hover:bg-muted/40 text-muted-foreground hover:text-foreground focus:text-foreground cursor-pointer")}
                  >
                    Explorar
                  </NavigationMenuLink>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
          </nav>
        </div>

        {/* Right Side: Auth Actions, Mobile Menu */}
        <div className="flex items-center gap-3">

          {/* Desktop Auth Actions */}
          <div className="hidden lg:flex items-center gap-3">
            {isLoading ? (
              <div className="h-10 w-36 bg-muted/60 animate-pulse rounded-full" />
            ) : user ? (
              <Button
                render={<Link href={dashboardUrl} />}
                className="h-12 px-6 rounded-full bg-primary hover:bg-primary/95 text-primary-foreground font-semibold text-sm tracking-[0.24px] transition-all duration-200 flex items-center gap-2"
              >
                <LayoutDashboard className="size-4" />
                <span>Ir a mi Panel ({role === "admin" ? "Admin" : role === "company" ? "Empresa" : "Candidato"})</span>
                <ArrowRight className="size-4" />
              </Button>
            ) : (
              <>
                <Button render={<Link href="/login" />} variant="ghost" className="h-12 px-6 rounded-full font-semibold text-sm tracking-[0.24px]">
                  Iniciar Sesión
                </Button>
                <Button render={<Link href="/register" />} className="h-12 px-6 rounded-full bg-primary hover:bg-primary/95 text-primary-foreground font-semibold text-sm tracking-[0.24px] transition-all duration-200">
                  Registrarse
                </Button>
              </>
            )}
          </div>

          {/* Mobile Drawer Trigger (Sheet) */}
          <Sheet open={openMobile} onOpenChange={setOpenMobile}>
            <SheetTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  className="lg:hidden rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  aria-label="Abrir menú de navegación"
                />
              }
            >
              <Menu className="size-5.5" />
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[350px] p-6 flex flex-col justify-between">
              <div>
                <SheetHeader className="pb-6 border-b border-border/50 text-left">
                  <SheetTitle className="flex items-center gap-2 text-foreground font-bold">
                    <Kanban className="size-5 text-primary" />
                    <span>K&apos;anPro Menú</span>
                  </SheetTitle>
                </SheetHeader>

                <nav className="flex flex-col gap-1 py-4">
                  <Link 
                    href="/discovery" 
                    onClick={() => setOpenMobile(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted/50 font-medium text-foreground text-sm transition-all"
                  >
                    <Briefcase className="size-4 text-emerald-500" /> Explorar Vacantes
                  </Link>
                  <Link 
                    href="/register/company" 
                    onClick={() => setOpenMobile(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted/50 font-medium text-foreground text-sm transition-all"
                  >
                    <PlusCircle className="size-4 text-primary" /> Publicar Vacante
                  </Link>
                  <Link 
                    href="/register/candidate" 
                    onClick={() => setOpenMobile(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted/50 font-medium text-foreground text-sm transition-all"
                  >
                    <Users className="size-4 text-amber-500" /> Crear CV Digital
                  </Link>
                  <Link 
                    href="#features" 
                    onClick={() => setOpenMobile(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted/50 font-medium text-foreground text-sm transition-all"
                  >
                    <ShieldCheck className="size-4 text-purple-500" /> ¿Por Qué K&apos;anPro?
                  </Link>
                  <Link 
                    href="#pricing" 
                    onClick={() => setOpenMobile(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted/50 font-medium text-foreground text-sm transition-all"
                  >
                    <TrendingUp className="size-4 text-blue-500" /> Precios
                  </Link>
                  <Link 
                    href="#contact" 
                    onClick={() => setOpenMobile(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted/50 font-medium text-foreground text-sm transition-all"
                  >
                    <ChevronDown className="size-4 -rotate-90 text-muted-foreground" /> Contacto
                  </Link>
                </nav>
              </div>

              {/* Mobile Auth actions */}
              <div className="space-y-3 pt-6 border-t border-border/50">
                {isLoading ? (
                  <div className="h-12 w-full bg-muted/60 animate-pulse rounded-full" />
                ) : user ? (
                  <Button
                    render={<Link href={dashboardUrl} onClick={() => setOpenMobile(false)} />}
                    className="w-full h-12 rounded-full bg-primary hover:bg-primary/95 justify-center font-semibold text-primary-foreground text-sm tracking-[0.24px] flex items-center gap-2"
                  >
                    <LayoutDashboard className="size-4" />
                    <span>Ir a mi Panel</span>
                    <ArrowRight className="size-4 ml-1" />
                  </Button>
                ) : (
                  <>
                    <Button
                      render={<Link href="/login" onClick={() => setOpenMobile(false)} />}
                      variant="outline"
                      className="w-full h-12 rounded-full justify-center font-semibold text-sm tracking-[0.24px]"
                    >
                      Iniciar Sesión
                    </Button>

                    <Button
                      render={<Link href="/register" onClick={() => setOpenMobile(false)} />}
                      className="w-full h-12 rounded-full bg-primary hover:bg-primary/95 justify-center font-semibold text-primary-foreground text-sm tracking-[0.24px] transition-all duration-200"
                    >
                      Registrarse Gratis <ArrowRight className="size-4 ml-1.5" />
                    </Button>
                  </>
                )}
              </div>

            </SheetContent>
          </Sheet>

        </div>

      </div>
    </header>
  );
}
