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
      {/* Barra de navegación principal */}
      <div className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur-md">
        <Navbar />
      </div>

      {/* Contenido principal del Centro de Ayuda */}
      <main className="relative z-10 flex-1 w-full">
        {children}
      </main>

      {/* Pie de página */}
      <div className="relative z-10 border-t border-border">
        <Footer />
      </div>
    </div>
  );
}
