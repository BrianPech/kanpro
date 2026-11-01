"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, ArrowUpRight, Sparkles, ShieldCheck } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export interface Hero1Props {
  badgeText?: string;
  badgeLabel?: string;
  title?: string;
  description?: string;
  primaryCtaText?: string;
  primaryCtaHref?: string;
  secondaryCtaText?: string;
  secondaryCtaHref?: string;
  statNumber?: string;
  statLabel?: string;
  imageUrl?: string;
}

export function Hero1({
  badgeText = "Nuevo",
  badgeLabel = "Suite de Reclutamiento & Operación LFT",
  title = "Vinculación laboral y control de personal con certeza jurídica en el Sureste",
  description = "La plataforma integral para empresas y colaboradores en Cancún, Mérida y la Riviera Maya: desde vacantes auditadas ante el SAT y radar de talento, hasta el checador QR y expediente digital 360.",
  primaryCtaText = "Publicar Vacante",
  primaryCtaHref = "/register/company",
  secondaryCtaText = "Explorar Empleos",
  secondaryCtaHref = "/dashboard/candidate/discovery",
  statNumber = "12,000+",
  statLabel = "Candidatos verificados listos para contratación inmediata.",
  imageUrl = "https://images.unsplash.com/photo-1553877522-43269d4ea984?q=80&w=1740&auto=format&fit=crop",
}: Hero1Props) {
  return (
    <section className="w-full flex items-start lg:items-center py-12 px-4 sm:px-6 lg:px-8 bg-background">
      <div className="max-w-[1400px] mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 xl:gap-16 items-center">
          {/* Columna Izquierda: Copywriting, Llamados a la Acción y Social Proof */}
          <div className="flex flex-col space-y-6 sm:space-y-8">
            {/* Pill Badge / Tag */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="flex items-center gap-2 sm:gap-3 rounded-full border border-border/70 bg-muted/30 p-1 w-fit hover:border-border transition-colors cursor-pointer select-none"
            >
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs sm:text-sm font-semibold shadow-xs">
                {badgeText}
              </span>
              <span className="text-xs sm:text-sm text-foreground mr-2 font-medium">
                {badgeLabel}
              </span>
            </motion.div>

            {/* Titular Principal */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl tracking-tight font-extrabold text-foreground leading-[1.12]"
            >
              {title}
            </motion.h1>

            {/* Subtítulo / Descripción */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-lg tracking-tight"
            >
              {description}
            </motion.p>

            {/* Botones de Acción */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4"
            >
              <Link href={primaryCtaHref} className="w-full sm:w-auto">
                <Button
                  size="lg"
                  className="w-full sm:w-auto rounded-full font-semibold px-7 shadow-sm cursor-pointer"
                >
                  {primaryCtaText}
                </Button>
              </Link>
              <Link href={secondaryCtaHref} className="w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto rounded-full font-medium pl-5 pr-3 border-border hover:bg-muted/50 cursor-pointer flex items-center justify-center gap-2 group"
                >
                  <span>{secondaryCtaText}</span>
                  <motion.span
                    className="flex items-center justify-center size-6 rounded-full bg-primary text-primary-foreground shrink-0"
                    whileHover={{ rotate: 45 }}
                    transition={{ duration: 0.25 }}
                  >
                    <ArrowUpRight className="size-3.5" />
                  </motion.span>
                </Button>
              </Link>
            </motion.div>

            {/* Prueba Social (Social Proof) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="flex items-center gap-3 sm:gap-4 pt-2 sm:pt-4 select-none"
            >
              <div className="flex -space-x-2.5">
                <div className="size-10 sm:size-11 rounded-full bg-primary/20 border-2 border-background flex items-center justify-center text-primary text-xs sm:text-sm font-bold shadow-xs">
                  RH
                </div>
                <div className="size-10 sm:size-11 rounded-full bg-emerald-500/20 border-2 border-background flex items-center justify-center text-emerald-600 dark:text-emerald-400 text-xs sm:text-sm font-bold shadow-xs">
                  MX
                </div>
                <div className="size-10 sm:size-11 rounded-full bg-indigo-500/20 border-2 border-background flex items-center justify-center text-indigo-600 dark:text-indigo-400 text-xs sm:text-sm font-bold shadow-xs">
                  QR
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-base sm:text-lg font-bold text-foreground tracking-tight">
                  {statNumber}
                </span>
                <span className="text-xs sm:text-sm text-muted-foreground font-medium">
                  {statLabel}
                </span>
              </div>
            </motion.div>
          </div>

          {/* Columna Derecha: Tarjeta Visual con Recorte Invertido Chamfer */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="relative w-full h-auto"
          >
            <div className="relative w-full h-full min-h-[300px] sm:min-h-[520px] rounded-4xl bg-muted/30 border border-border/80 overflow-hidden shadow-xl ring-1 ring-foreground/5">
              <img
                src={imageUrl}
                alt="Plataforma de vinculación laboral K'anPro"
                className="absolute inset-0 w-full h-full object-cover"
              />

              {/* Acento con Recorte de Esquina Suave (Inverted Chamfer SVG) */}
              <div className="absolute bottom-0 right-0 flex flex-col items-end">
                <svg
                  width="40"
                  height="40"
                  viewBox="0 0 200 200"
                  xmlns="http://www.w3.org/2000/svg"
                  className="fill-background"
                  aria-hidden="true"
                >
                  <path d="M0 200C155.996 199.961 200.029 156.308 200 0V200H0Z" />
                </svg>
                <div className="relative">
                  <div className="size-24 bg-background rounded-tl-4xl pl-4 pt-4">
                    <Link
                      href={primaryCtaHref}
                      className="size-full border-none flex items-center justify-center bg-primary text-primary-foreground rounded-[1.2em] hover:bg-primary/90 transition-opacity shadow-md"
                      aria-label="Registrar empresa o explorar"
                    >
                      <ArrowUpRight className="size-6 text-primary-foreground" />
                    </Link>
                  </div>
                  <svg
                    width="40"
                    height="40"
                    viewBox="0 0 200 200"
                    xmlns="http://www.w3.org/2000/svg"
                    className="absolute bottom-0 -left-10 fill-background"
                    aria-hidden="true"
                  >
                    <path d="M0 200C155.996 199.961 200.029 156.308 200 0V200H0Z" />
                  </svg>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
