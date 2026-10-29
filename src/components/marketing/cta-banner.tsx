"use client";

import React from "react";
import Link from "next/link";
import { KanproIsotype, ArrowRight } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CtaBannerProps {
  className?: string;
}

export function CtaBanner({ className }: CtaBannerProps) {
  return (
    <section
      aria-label="Llamado a la acción principal"
      className={cn(
        "w-full max-w-[1536px] mx-auto px-4 sm:px-8 md:px-12 lg:px-16 xl:px-20 pt-14 sm:pt-20 pb-0 relative",
        className
      )}
    >
      <div className="rounded-[2.5rem] bg-card text-card-foreground border border-border shadow-xl shadow-primary/5 p-8 sm:p-14 lg:p-16 flex flex-col items-center text-center relative overflow-hidden">
        {/* Ambient Lighting using shadcn Primary Token */}
        <div
          className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-[520px] h-[300px] rounded-full bg-primary/10 blur-[100px]"
          aria-hidden="true"
        />

        {/* Subtle Radial Dot Pattern */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)",
            backgroundSize: "24px 24px",
          }}
          aria-hidden="true"
        />

        {/* Centered Brand Squircle Mark in Primary */}
        <div className="relative z-10 size-14 sm:size-16 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center shadow-md mb-6 transition-transform hover:scale-105 duration-200">
          <KanproIsotype className="size-7 sm:size-8" variant="white" />
        </div>

        {/* Clean High-Contrast Heading */}
        <h2 className="relative z-10 text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-foreground font-sans max-w-xl leading-[1.12]">
          ¿Listo para transformar la contratación?
        </h2>

        {/* Accessible Subheading */}
        <p className="relative z-10 text-sm sm:text-base text-muted-foreground font-normal max-w-lg leading-relaxed mt-4 mb-8">
          Únete a cientos de empresas y miles de profesionales que ya contratan directo en el Sureste. Sin intermediarios, sin comisiones y con verificación digital.
        </p>

        {/* Action Buttons using shadcn Button components */}
        <div className="relative z-10 flex flex-col sm:flex-row items-center gap-3.5">
          <Button
            render={<Link href="/register/company" />}
            size="lg"
            className="h-11 sm:h-12 px-8 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs sm:text-sm shadow-md hover:shadow-lg transition-all active:scale-[0.98] cursor-pointer gap-2"
          >
            <span>Publicar vacante gratis</span>
            <ArrowRight className="size-4" />
          </Button>

          <Button
            render={<Link href="/register/candidate" />}
            variant="outline"
            size="lg"
            className="h-11 sm:h-12 px-7 rounded-full border-border bg-background hover:bg-muted text-foreground font-semibold text-xs sm:text-sm transition-all cursor-pointer shadow-2xs"
          >
            <span>Soy candidato</span>
          </Button>
        </div>
      </div>
    </section>
  );
}
