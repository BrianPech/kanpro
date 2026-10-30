import React from "react";
import type { Metadata } from "next";
import { Navbar } from "@/components/marketing/navbar";
import { Footer } from "@/components/marketing/footer";
import { getHelpNavigation } from "@/lib/help/docs-server";
import { DocsShell } from "@/components/help/docs-shell";

export const metadata: Metadata = {
  title: "Centro de Ayuda y Documentación Oficial | K'anPro",
  description:
    "Guías operativas, cumplimiento fiscal SAT de 13 puntos, atracción de talento local y manuales de empleo formal para Mérida, Cancún y toda la Península de Yucatán.",
};

export default function HelpLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const navigation = {
    empresas: getHelpNavigation("empresas"),
    candidatos: getHelpNavigation("candidatos"),
  };

  return (
    <div className="relative min-h-screen w-full bg-background text-foreground flex flex-col justify-between selection:bg-primary selection:text-primary-foreground">
      {/* Barra de navegación principal */}
      <div className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur-md">
        <Navbar />
      </div>

      {/* Docs Shell con Sidebar unificado */}
      <div className="relative z-10 flex-1 w-full">
        <DocsShell navigation={navigation}>
          {children}
        </DocsShell>
      </div>

      {/* Pie de página */}
      <div className="relative z-10 border-t border-border">
        <Footer />
      </div>
    </div>
  );
}
