"use client";

import React from "react";
import { Navigation14 } from "@/components/blocks/navigation-14";
import { Hero1 } from "@/components/blocks/hero-1";
import { FeaturesDarkBand } from "@/components/marketing/features-dark-band";
import { Comparison8 } from "@/components/blocks/comparison-8";
import { Faq7 } from "@/components/blocks/faq-7";
import { CtaBanner } from "@/components/marketing/cta-banner";
import { Footer } from "@/components/marketing/footer";

export function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-[var(--color-fiord-950)] flex flex-col justify-between selection:bg-[var(--color-fiord-950)] selection:text-white font-sans antialiased overflow-x-clip">
      {/* 1. Mega Panel Navigation 14 */}
      <Navigation14 />

      {/* 2. Light Fiord Marketing Bands */}
      <main className="flex-1">
        {/* Band 1: Interactive Split Hero Section */}
        <Hero1 />

        {/* Band 2: Operating Suite Band (Empresas, Candidatos & SAT Audit) */}
        <FeaturesDarkBand />

        {/* Band 3: Capability Matrix Comparison 8 */}
        <Comparison8 />

        {/* Band 4: Help Center FAQ 7 */}
        <Faq7 />

        {/* Band 5: Floating Light CTA Banner */}
        <CtaBanner />
      </main>

      {/* 3. Global Footer */}
      <Footer />
    </div>
  );
}
