"use client";

import * as React from "react";
import { IntroDisclosure, type Step } from "@/components/ui/intro-disclosure";

export interface CompanyDashboardTourProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  ignoreDismissal?: boolean;
}

export function CompanyDashboardTour({
  open,
  setOpen,
  ignoreDismissal = false,
}: CompanyDashboardTourProps) {
  const steps: Step[] = React.useMemo(
    () => [
      {
        title: "Bienvenido a K'anPro Empresa",
        short_description: "Tu centro de control operativo y de talento en el Caribe Mexicano",
        full_description:
          "Monitorea en tiempo real la salud operativa de tu negocio. Desde este panel principal tendrás visibilidad inmediata de tus colaboradores activos, rotación, asistencia diaria, contratos por vencer y vacantes publicadas.",
        media: {
          type: "image",
          src: "https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=1200&auto=format&fit=crop",
          alt: "Centro de control K'anPro Empresa",
        },
      },
      {
        title: "Reclutamiento & Radar Peninsular",
        short_description: "Publica vacantes y conecta con talento verificado",
        full_description:
          "Atrae talento local en Quintana Roo y Yucatán con esquemas salariales transparentes. Revisa postulaciones al instante, filtra por competencias operativas y acelera tus contrataciones sin costos ocultos.",
        media: {
          type: "image",
          src: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=1200&auto=format&fit=crop",
          alt: "Reclutamiento y selección de candidatos",
        },
        action: {
          label: "Gestionar Vacantes Activas",
          href: "/dashboard/company/vacancies",
        },
      },
      {
        title: "Plantilla & Expediente Digital 360",
        short_description: "Colaboradores, contratos y cumplimiento STPS",
        full_description:
          "Accede al directorio integral de tus colaboradores. Emite altas directas o envía enlaces de autocompletado por WhatsApp. Mantén expedientes normativos con SAT, IMSS y contratos descargables en un solo clic.",
        media: {
          type: "image",
          src: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=1200&auto=format&fit=crop",
          alt: "Expediente digital y plantilla de empleados",
        },
        action: {
          label: "Explorar Plantilla de Empleados",
          href: "/dashboard/company/employees",
        },
      },
      {
        title: "Checador QR, Asistencia & Nómina",
        short_description: "Control biométrico/móvil y Vacaciones Dignas LFT",
        full_description:
          "Tus colaboradores registran asistencia escaneando el código QR en sucursal con validación GPS y 15 minutos de tolerancia legal. El sistema computa retardos, horas extras y vacaciones conforme al Art. 76 de la LFT.",
        media: {
          type: "image",
          src: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?q=80&w=1200&auto=format&fit=crop",
          alt: "Checador inteligente y control de asistencia",
        },
        action: {
          label: "Ver Operaciones & Asistencia",
          href: "/dashboard/company/attendance",
        },
      },
    ],
    []
  );

  return (
    <IntroDisclosure
      steps={steps}
      open={open}
      setOpen={setOpen}
      featureId="company_main_dashboard_tour"
      ignoreDismissal={ignoreDismissal}
      title="Bienvenida: Conoce K'anPro Empresa"
      skipText="Omitir"
      previousText="Anterior"
      nextText="Siguiente"
      doneText="Empezar a Usar"
      dontShowAgainText="No volver a mostrar en este dispositivo"
    />
  );
}
