"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function JobsBanner() {
  return (
    <section className="container mx-auto px-6 pb-20">
      <div className="relative rounded-[20px] bg-primary text-primary-foreground py-16 px-8 sm:px-12 overflow-hidden text-center flex flex-col items-center justify-center gap-6">
        
        {/* Inner Radial Glow Overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.1),transparent_60%)] pointer-events-none" />
        
        {/* Banner content */}
        <h3 className="text-[24px] md:text-[32px] font-medium leading-[1.19] tracking-[-0.32px] z-10 max-w-2xl">
          Encuentra empleo en Playa del Carmen cerca de ti y conecta hoy mismo
        </h3>

        <Link
          href="/discovery"
          className="z-10 bg-background text-primary hover:bg-background/90 font-semibold h-12 px-8 rounded-full text-sm tracking-[0.24px] transition-all duration-200 inline-flex items-center gap-2"
        >
          <span>Explorar ofertas</span>
          <ArrowRight className="size-4" />
        </Link>
      </div>
    </section>
  );
}
