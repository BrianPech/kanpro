import React from "react";
import type { Metadata } from "next";
import { Navbar } from "@/components/marketing/navbar";
import { Footer } from "@/components/marketing/footer";

export const metadata: Metadata = {
  title: "Centro de Ayuda y Documentación | K'anPro",
  description:
    "Guías paso a paso, documentación operativa y respuestas a preguntas frecuentes para empresas y candidatos en Mérida, Cancún y la Riviera Maya.",
};

export default function HelpLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen w-full bg-background text-foreground flex flex-col justify-between selection:bg-primary selection:text-primary-foreground">
      {/* Sutil resplandor ambiental de fondo */}
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden"
        aria-hidden="true"
      >
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[900px] h-[450px] rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute top-96 right-[-5%] w-[400px] h-[400px] rounded-full bg-accent/30 blur-[130px]" />
      </div>

      {/* Barra de navegación principal */}
      <div className="relative z-20">
        <Navbar />
      </div>

      {/* Contenido principal del Centro de Ayuda */}
      <main className="relative z-10 flex-1 w-full">
        {children}
      </main>

      {/* Pie de página */}
      <div className="relative z-10">
        <Footer />
      </div>
    </div>
  );
}
