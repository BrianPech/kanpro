"use client";

import React from "react";
import { Navbar } from "@/components/marketing/navbar";
import { HeroBand } from "@/components/marketing/hero-band";
import { FeaturesDarkBand } from "@/components/marketing/features-dark-band";
import { ComparisonLightBand } from "@/components/marketing/comparison-light-band";
import { PricingDarkBand } from "@/components/marketing/pricing-dark-band";
import { FaqLightBand } from "@/components/marketing/faq-light-band";
import { Footer } from "@/components/marketing/footer";

export function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-[var(--color-fiord-950)] flex flex-col justify-between selection:bg-[var(--color-fiord-950)] selection:text-white font-sans antialiased overflow-x-clip">
      {/* 1. Sticky Nav */}
      <Navbar />

      {/* 2. Light Fiord Marketing Bands */}
      <main className="flex-1">
        {/* Band 1: Fiord Gradient Hero with Flagship Typography & Live Product UI */}
        <HeroBand />

        {/* Band 2: Operating Suite Band (Empresas, Candidatos & SAT Audit) */}
        <FeaturesDarkBand />

        {/* Band 3: Economic Comparison & Territorial Corridors */}
        <ComparisonLightBand />

        {/* Band 4: Transparent Pricing Grid with Featured SAT Verification */}
        <PricingDarkBand />

        {/* Band 5: FAQ Accordion Band */}
        <FaqLightBand />
      </main>

      {/* 3. Global Footer */}
      <Footer />
    </div>
  );
}
