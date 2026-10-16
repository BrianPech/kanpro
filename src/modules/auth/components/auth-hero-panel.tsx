"use client";

import React, { useState, useEffect } from "react";
import { Sparkles, ShieldCheck, Clock, Kanban } from "lucide-react";
import { cn } from "@/lib/utils";

interface SlideData {
  id: number;
  tag: string;
  tagIcon: React.ReactNode;
  title: string;
  description: string;
}

const slides: SlideData[] = [
  {
    id: 0,
    tag: "Plataforma Líder",
    tagIcon: <Sparkles className="size-3 text-blue-400" />,
    title: "El Ecosistema Laboral del Sureste Mexicano",
    description:
      "Conectamos talento y empresas con vacantes 100% verificadas, salarios transparentes y cálculo de cercanía geográfica.",
  },
  {
    id: 1,
    tag: "Procesos Ágiles",
    tagIcon: <Clock className="size-3 text-sky-400" />,
    title: "Postulaciones en 1 Clic y Contratación Digital",
    description:
      "Aplica en segundos, gestiona tus entrevistas en tiempo real y firma contratos con plena validez conforme a la LFT.",
  },
  {
    id: 2,
    tag: "Certeza Jurídica",
    tagIcon: <ShieldCheck className="size-3 text-blue-400" />,
    title: "Cumplimiento Legal y Reducción de Tiempos",
    description:
      "Gestión de nómina, asistencias con geocercas inteligentes y prestaciones de ley transparentes para empresas y colaboradores.",
  },
];

export function AuthHeroPanel() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5500);

    return () => clearInterval(interval);
  }, [isPaused]);

  const activeSlide = slides[currentSlide];

  return (
    <aside
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className="relative hidden lg:flex lg:col-span-5 xl:col-span-5 flex-col justify-between overflow-hidden bg-gradient-to-br from-[#070e1e] via-[#0b162f] to-[#060c1a] dark:from-[#040813] dark:via-[#070e20] dark:to-[#03060d] text-white p-8 xl:p-12 select-none border-r border-border/80 dark:border-white/10"
    >
      {/* ── Ambient Radial Gradient Mesh (Pure Royal Blue & Sky Aura) ── */}
      <div
        className="pointer-events-none absolute -top-24 -right-12 size-[480px] rounded-full blur-[100px] opacity-45 dark:opacity-60"
        style={{
          background:
            "radial-gradient(circle, #3b82f6 0%, #1d4ed8 45%, #1e3a8a 80%, transparent 100%)",
        }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-20 -left-16 size-[380px] rounded-full blur-[90px] opacity-30 dark:opacity-40"
        style={{
          background:
            "radial-gradient(circle, #0284c7 0%, #0369a1 50%, #1e40af 80%, transparent 100%)",
        }}
        aria-hidden="true"
      />
      {/* Top light sheen for depth */}
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/[0.07] via-transparent to-black/30"
        aria-hidden="true"
      />
      {/* Technical micro-dot grid for tactile texture */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.035] bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:20px_20px]"
        aria-hidden="true"
      />

      {/* ── Top Brand Bar ── */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="size-8 rounded-xl bg-blue-500/15 border border-blue-400/25 flex items-center justify-center text-blue-400 backdrop-blur-md shadow-xs">
            <Kanban className="size-4 text-blue-400" />
          </div>
          <span className="font-extrabold text-base tracking-tight text-white/95">
            K&apos;anPro
          </span>
        </div>
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/15 border border-blue-400/25 text-[10px] font-bold text-blue-300 tracking-wide uppercase">
          <span className="size-1.5 rounded-full bg-blue-400 animate-pulse" />
          <span>Sureste MX</span>
        </div>
      </div>

      {/* ── Center Hero Visual & Headline Card ── */}
      <div className="relative z-10 my-auto py-8 flex flex-col items-center text-center max-w-sm mx-auto">
        {/* Squircle Logo Box with Elevated Blue Glow and Glass Sheen */}
        <div className="relative mb-8 group cursor-default">
          {/* Ambient blue colored aura */}
          <div className="absolute -inset-2 rounded-[28px] bg-gradient-to-tr from-blue-600/40 via-blue-400/35 to-sky-400/25 blur-xl opacity-80 group-hover:opacity-100 transition duration-500" />

          {/* Squircle Container */}
          <div className="relative size-22 sm:size-24 rounded-[26px] bg-gradient-to-b from-[#152749] via-[#0f1d38] to-[#0a1325] border border-blue-400/30 dark:border-blue-400/20 shadow-[0_20px_40px_rgba(2,12,38,0.7)] flex items-center justify-center text-white backdrop-blur-xl group cursor-default transition-transform duration-300 hover:scale-[1.02]">
            {/* Inner Sheen Highlight */}
            <div className="absolute inset-0 rounded-[25px] bg-gradient-to-b from-white/20 via-white/[0.03] to-transparent pointer-events-none" />

            {/* K'anPro Brand Symbol */}
            <div className="relative flex items-center justify-center">
              <Kanban className="size-11 text-blue-400 drop-shadow-[0_2px_14px_rgba(96,165,250,0.85)]" />
            </div>
          </div>
        </div>

        {/* Dynamic Tag Pill */}
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-blue-500/15 border border-blue-400/25 backdrop-blur-md text-[11px] font-semibold text-blue-200 mb-4 shadow-2xs">
          {activeSlide.tagIcon}
          <span>{activeSlide.tag}</span>
        </div>

        {/* Headline */}
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight min-h-[68px] flex items-center justify-center transition-all duration-300 text-balance">
          {activeSlide.title}
        </h2>

        {/* Subtitle Description */}
        <p className="text-xs sm:text-sm text-slate-300 dark:text-slate-300 font-normal leading-relaxed mt-3 max-w-xs min-h-[64px] transition-all duration-300">
          {activeSlide.description}
        </p>
      </div>

      {/* ── Bottom Carousel Indicators & Dots ── */}
      <div className="relative z-10 flex items-center justify-center gap-2 pt-4">
        {slides.map((slide) => {
          const isActive = slide.id === currentSlide;
          return (
            <button
              key={slide.id}
              type="button"
              onClick={() => setCurrentSlide(slide.id)}
              aria-label={`Ver slide ${slide.id + 1}`}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300 cursor-pointer focus:outline-none",
                isActive
                  ? "w-7 bg-blue-500 dark:bg-blue-400 shadow-[0_0_12px_rgba(59,130,246,0.9)]"
                  : "w-2 bg-white/20 hover:bg-white/40"
              )}
            />
          );
        })}
      </div>
    </aside>
  );
}
