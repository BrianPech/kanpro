"use client";

import React from "react";
import { Navbar } from "@/components/navbar";
import { HeroSection } from "@/components/hero-section";
import { FeaturesSection } from "@/components/features-section";
import { HowItWorks } from "@/components/how-it-works";
import { CtaBanner } from "@/components/cta-banner";
import { PricingSection } from "@/components/pricing-section";
import { JobsBanner } from "@/components/jobs-banner";
import { Footer } from "@/components/footer";

export default function Home() {

  return (
    <div className="relative min-h-screen bg-background text-foreground flex flex-col justify-between">
      {/* Ambient backgrounds */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute bottom-[20%] right-[-10%] w-[45%] h-[45%] rounded-full bg-amber-500/5 blur-[120px]" />
      </div>

      {/* Header */}
      <Navbar />

      {/* Main content */}
      <main className="flex-1">
        {/* Hero Section */}
        <section className="container mx-auto px-4 lg:px-8 py-6 md:py-10">
          <HeroSection />
        </section>

        {/* Features section */}
        <FeaturesSection />

        {/* Cómo funciona section */}
        <HowItWorks />

        {/* CTA Banner */}
        <CtaBanner />

        {/* Precios section */}
        <PricingSection />

        {/* Jobs Discovery Banner */}
        <JobsBanner />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
