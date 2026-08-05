"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUserSession } from "@/modules/auth/hooks/use-user-session";

export function HeroSection() {
  const { user, dashboardUrl } = useUserSession();
  const [activeTab, setActiveTab] = useState<"hire" | "work">("hire");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentCityIndex, setCurrentCityIndex] = useState(0);
  const [fadeCity, setFadeCity] = useState(true);
  const cities = ["Mérida", "Playa del Carmen"];

  useEffect(() => {
    const interval = setInterval(() => {
      setFadeCity(false);
      setTimeout(() => {
        setCurrentCityIndex((prev) => (prev + 1) % cities.length);
        setFadeCity(true);
      }, 300);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const popularTags = {
    hire: [
      { label: "Centro Mérida", query: "Centro Mérida" },
      { label: "Altabrisa", query: "Altabrisa" },
      { label: "Comercio & Ventas", query: "Comercio" },
      { label: "Gastronomía", query: "Gastronomía" },
    ],
    work: [
      { label: "Villas del Sol", query: "Villas del Sol" },
      { label: "Paseo de Montejo", query: "Paseo de Montejo" },
      { label: "Servicios Generales", query: "Servicios" },
      { label: "Administración", query: "Administración" },
    ],
  };

  const handleTagClick = (query: string) => {
    setSearchQuery(query);
  };

  return (
    <div className="w-full flex flex-col gap-6 pt-4">
      {/* Top Banner */}
      <div className="w-full rounded-[16px] sm:rounded-full bg-primary/10 border border-primary/20 px-6 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-all duration-300">
        <div className="flex items-center gap-2">
          <div className="size-5 rounded-full bg-primary/20 text-primary flex items-center justify-center shrink-0">
            <Sparkles className="size-3.5 fill-primary/20" />
          </div>
          <p className="text-xs sm:text-sm font-medium text-foreground">
            Encuentra empleo o contrata talento local en <span className={`font-bold text-primary transition-opacity duration-300 ${fadeCity ? "opacity-100" : "opacity-0"}`}>{cities[currentCityIndex]}</span> sin comisiones.
          </p>
        </div>
        <Link
          href={user ? dashboardUrl : "/register"}
          className="text-xs sm:text-sm font-semibold text-primary hover:text-primary/80 underline underline-offset-4 flex items-center gap-0.5 shrink-0 transition-colors"
        >
          {user ? "Ir a mi Panel" : "Comenzar ahora"} <ArrowRight className="size-3.5" />
        </Link>
      </div>

      {/* Main Hero Card */}
      <div className="relative w-full rounded-[28px] overflow-hidden min-h-0 sm:min-h-[500px] md:min-h-[550px] lg:min-h-[600px] flex items-center border border-border/25">
        {/* Background Image */}
        <Image
          src="/images/workspace_hero.png"
          alt="Workspace Hero"
          fill
          priority
          sizes="100vw"
          className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none"
        />

        {/* Gradient Mask Overlays */}
        {/* Left dark gradient for text readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/75 sm:via-black/60 to-transparent z-1" />
        {/* Bottom dark gradient for mobile and general framing */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent z-1" />
        {/* Decorative corner glows */}
        <div className="absolute top-0 left-0 w-80 h-80 bg-primary/10 rounded-full blur-[100px] pointer-events-none z-1" />

        {/* Content Container */}
        <div className="relative z-10 w-full px-6 py-8 sm:py-12 sm:px-12 md:p-16 lg:p-20 flex flex-col items-start text-left max-w-4xl space-y-5 sm:space-y-8">

          {/* Main Title & Subtitle */}
          <div className="space-y-4">
            <h1 className="font-sans font-medium text-3xl sm:text-5xl lg:text-[72px] text-white tracking-[-0.8px] sm:tracking-[-1.6px] leading-[1.1] sm:leading-[1.0]">
              Trabaja cerca de casa, <br className="hidden sm:block" />
              contrata sin rodeos
            </h1>
            <p className="text-base sm:text-[18px] text-white/85 max-w-2xl leading-[1.56] tracking-[-0.09px] font-normal">
              Conectamos talento local y empresas en el sureste en tiempo real a través de WhatsApp. Rápido, directo y sin intermediarios.
            </p>
          </div>

          {/* Interactive Toggles & Search Bar Area */}
          <div className="w-full space-y-5">
            {/* Action Toggles */}
            <div className="inline-flex p-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10">
              <button
                onClick={() => {
                  setActiveTab("hire");
                  setSearchQuery("");
                }}
                className={`px-6 py-2.5 rounded-full text-xs font-semibold tracking-wide transition-all duration-300 ${activeTab === "hire"
                  ? "bg-white text-black"
                  : "text-white hover:text-white/90 bg-transparent"
                  }`}
              >
                Quiero contratar
              </button>
              <button
                onClick={() => {
                  setActiveTab("work");
                  setSearchQuery("");
                }}
                className={`px-6 py-2.5 rounded-full text-xs font-semibold tracking-wide transition-all duration-300 ${activeTab === "work"
                  ? "bg-white text-black"
                  : "text-white hover:text-white/90 bg-transparent"
                  }`}
              >
                Quiero trabajar
              </button>
            </div>

            {/* Pill Search Input */}
            <div className="relative flex items-center w-full max-w-2xl bg-background border border-border rounded-[12px] h-14 p-1.5 transition-all duration-300 focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/20">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  activeTab === "hire"
                    ? "Describe lo que buscas contratar (ej: Cocinero Colonia Centro, Recepcionista)..."
                    : "Busca empleos por cercanía (ej: Mesero Emiliano Zapata, Auxiliar Administrativo Centro)..."
                }
                className="flex-1 bg-transparent border-none outline-none ring-0 focus:ring-0 px-3 text-sm text-foreground placeholder:text-muted-foreground/80 min-w-0"
              />
              <Button
                className="h-11 rounded-full bg-primary hover:bg-primary/95 text-primary-foreground font-semibold px-6 shrink-0 gap-1.5 transition-all duration-200"
              >
                <Search className="size-4" />
                <span className="hidden sm:inline">Buscar</span>
              </Button>
            </div>
          </div>

          {/* Popular search tags */}
          <div className="w-full space-y-3">
            <h3 className="text-[11px] font-bold text-white/70 uppercase tracking-widest">
              Sugerencias populares:
            </h3>
            <div className="flex flex-wrap gap-2.5">
              {popularTags[activeTab].map((tag, idx) => (
                <button
                  key={idx}
                  onClick={() => handleTagClick(tag.query)}
                  className="px-4 py-1.5 rounded-full border border-white/20 hover:border-white/50 bg-white/5 hover:bg-white/10 text-[11px] sm:text-xs font-semibold text-white transition-all duration-200 flex items-center gap-1 cursor-pointer"
                >
                  {tag.label} <ArrowRight className="size-3 text-white/60" />
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
