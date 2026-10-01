import React from "react";
import type { Metadata } from "next";
import { getHelpNavigation } from "@/lib/help/docs-server";
import { HelpCenterClient } from "@/components/help/help-center-client";

export const metadata: Metadata = {
  title: "Centro de Ayuda y Documentación Oficial | K'anPro",
  description:
    "Guías operativas, cumplimiento fiscal SAT de 13 puntos, atracción de talento local y manuales de empleo formal para Mérida, Cancún y toda la Península de Yucatán.",
};

export default function HelpPage() {
  const navigation = {
    empresas: getHelpNavigation("empresas"),
    candidatos: getHelpNavigation("candidatos"),
  };

  return <HelpCenterClient navigation={navigation} />;
}
