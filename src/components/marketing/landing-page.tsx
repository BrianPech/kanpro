"use client";

import React from "react";
import { Navbar } from "@/components/marketing/navbar";
import { HeroSection } from "@/components/marketing/hero-section";
import { FeaturesDarkBand } from "@/components/marketing/features-dark-band";
import { ComparisonLightBand } from "@/components/marketing/comparison-light-band";
import { FaqLightBand } from "@/components/marketing/faq-light-band";
import { CtaBanner } from "@/components/marketing/cta-banner";
import { Footer } from "@/components/marketing/footer";

export function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-[var(--color-fiord-950)] flex flex-col justify-between selection:bg-[var(--color-fiord-950)] selection:text-white font-sans antialiased overflow-x-clip">
      {/* 1. Sticky Nav */}
      <Navbar />

      {/* 2. Light Fiord Marketing Bands */}
      <main className="flex-1">
        {/* Band 1: Interactive Split Hero Section */}
        <HeroSection />

        {/* Band 2: Operating Suite Band (Empresas, Candidatos & SAT Audit) */}
        <FeaturesDarkBand />

        {/* Band 3: Economic Comparison & Territorial Corridors */}
        <ComparisonLightBand />

        {/* Band 4: FAQ Accordion Band */}
        <FaqLightBand />

        {/* Band 5: Floating Light CTA Banner */}
        <CtaBanner />
      </main>

      {/* 3. Global Footer */}
      <Footer />
    </div>
  );
}
