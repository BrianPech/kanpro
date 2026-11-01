"use client";

import * as React from "react";
import { IntroDisclosure, type Step } from "@/components/ui/intro-disclosure";

export interface EmployeeModuleTourProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  onRegisterClick?: () => void;
  ignoreDismissal?: boolean;
}

export function EmployeeModuleTour({
  open,
  setOpen,
  onRegisterClick,
  ignoreDismissal = false,
}: EmployeeModuleTourProps) {
  const steps: Step[] = React.useMemo(
    () => [
      {
        title: "Directorio & Plantilla en Vivo",
        short_description: "Visión unificada de personal activo, invitaciones y bajas",
        full_description:
          "Centraliza a todos los colaboradores de tu empresa en un solo lugar. Filtra rápidamente por departamentos operativos (Alimentos y Bebidas, Mantenimiento, Recepción), busca por nombre o puesto y supervisa métricas de retención laboral en tiempo real.",
        media: {
          type: "image",
          src: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=1200&auto=format&fit=crop",
          alt: "Equipo de colaboradores y directorio laboral",
        },
      },
      {
        title: "Expediente Digital 360",
        short_description: "7 módulos con RFC, CURP, NSS, contratos y salarios",
        full_description:
          "Olvídate de los archiveros de papel. Cada colaborador cuenta con su expediente digital completo con 7 pestañas: datos fiscales SAT, salario diario integrado (SDI), contratos formalizados, constancias y opción de descarga del expediente completo para auditorías de la STPS.",
        media: {
          type: "image",
          src: "https://images.unsplash.com/photo-1450133064473-71024230f91b?q=80&w=1200&auto=format&fit=crop",
          alt: "Expediente laboral digital y contratos certificados",
        },
      },
      {
        title: "Altas e Invitaciones Express",
        short_description: "Registro manual o enlace directo por WhatsApp",
        full_description:
          "Incorpora personal en minutos: regístralos de inmediato con sus datos esenciales o envíales un enlace de invitación por WhatsApp o correo con código QR para que ellos mismos completen su expediente y suban sus documentos oficiales desde su celular.",
        media: {
          type: "image",
          src: "https://images.unsplash.com/photo-1557804506-669a67965ba0?q=80&w=1200&auto=format&fit=crop",
          alt: "Invitación de empleados con código QR y WhatsApp",
        },
        action: onRegisterClick
          ? {
              label: "Registrar Nuevo Colaborador",
              onClick: () => {
                setOpen(false);
                onRegisterClick();
              },
            }
          : undefined,
      },
      {
        title: "Checador QR & Vacaciones LFT",
        short_description: "Cumplimiento del Art. 76 LFT y checador por sucursal",
        full_description:
          "Conecta tu plantilla con el checador móvil por sucursal (tolerancia legal de 15 min y geocercas GPS). Además, el sistema calcula automáticamente los días de descanso por ley bajo la reforma de Vacaciones Dignas y permite aprobar solicitudes al instante.",
        media: {
          type: "image",
          src: "https://images.unsplash.com/photo-1506784365847-bbad939e9335?q=80&w=1200&auto=format&fit=crop",
          alt: "Control de asistencia y vacaciones laborales",
        },
        action: {
          label: "Ver Checador de Asistencia",
          href: "/dashboard/company/attendance",
        },
      },
    ],
    [onRegisterClick, setOpen]
  );

  return (
    <IntroDisclosure
      steps={steps}
      open={open}
      setOpen={setOpen}
      featureId="company_employees_module_tour"
      ignoreDismissal={ignoreDismissal}
      title="Guía: Módulo de Gestión de Personal"
      skipText="Omitir"
      previousText="Anterior"
      nextText="Siguiente"
      doneText="Entendido"
      dontShowAgainText="No volver a mostrar en este dispositivo"
    />
  );
}
