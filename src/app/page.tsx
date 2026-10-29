import { Navigation14 } from "@/components/blocks/navigation-14";
import { Hero1 } from "@/components/blocks/hero-1";
import { FeaturesDarkBand } from "@/components/marketing/features-dark-band";
import { ComparisonLightBand } from "@/components/marketing/comparison-light-band";
import { FaqLightBand } from "@/components/marketing/faq-light-band";
import { CtaBanner } from "@/components/marketing/cta-banner";
import { Footer } from "@/components/marketing/footer";

export default function Home() {
  return (
    <div className="relative min-h-screen w-full bg-background text-foreground">
      {/* Sutil brillo ambiental de fondo contenido sin afectar el posicionamiento sticky */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[1000px] h-[550px] rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute top-96 right-[-5%] w-[450px] h-[450px] rounded-full bg-accent/40 blur-[130px]" />
      </div>

      {/* Content wrapper */}
      <div className="relative z-10 flex min-h-screen w-full flex-col">
        <Navigation14 />
        <main className="flex-1">
          <Hero1 />
          <FeaturesDarkBand />
          <ComparisonLightBand />
          <FaqLightBand />
          <CtaBanner />
        </main>
        <Footer />
      </div>
    </div>
  );
}

