"use client";

import * as React from "react";
import {
  Settings,
  Shield,
  Key,
  Briefcase,
  CreditCard,
  Building2,
  Sparkles,
  SlidersHorizontal,
  ArrowRight,
  SunMoon,
  BellRing,
} from "@/components/ui/icons";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CompanySettingsModal } from "./company-settings-dialog";
import { type BillingRecord } from "./billing-subscriptions-table";
import { CompanyPageHeader } from "./shared/company-page-header";

interface Invoice {
  id: string;
  company_id: string;
  plan_name: string;
  amount: number;
  currency: string;
  status: string;
  payment_method: string | null;
  created_at: string;
}

interface CompanyProfile {
  id: string;
  company_name: string;
  credits_available: number;
  contact_channel: string;
  logo_url: string | null;
  description: string | null;
  phone: string | null;
  company_size: string | null;
  industry: string | null;
  website_or_linkedin: string | null;
  whatsapp_number: string;
  subscription_plan?: "basic" | "pro" | "enterprise" | string;
  subscription_status?: string;
  subscription_period_end?: string | null;
  featured_vacancies_allowance?: number;
  featured_vacancies_used?: number;
  rfc?: string | null;
  legal_name?: string | null;
  entity_type?: string | null;
  fiscal_address?: string | null;
  corporate_email?: string | null;
  verification_status?: string | null;
}

interface SettingsUser {
  id: string;
  email: string;
}

interface CompanySettingsViewProps {
  user: SettingsUser;
  initialProfile: CompanyProfile;
  initialPauseState?: boolean;
  initialInvoices?: Invoice[];
}

const CONFIG_MODULES = [
  {
    title: "Preferencias del Sistema",
    description: "Tema visual (claro/oscuro/sistema), apariencia y personalización del panel.",
    icon: SunMoon,
    badge: "Apariencia",
    badgeColor: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20",
  },
  {
    title: "Seguridad y Acceso",
    description: "Gestión de contraseña, cambio de correo, doble factor 2FA y sesiones activas.",
    icon: Key,
    badge: "Protección",
    badgeColor: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  },
  {
    title: "Control de Reclutamiento",
    description: "Pausa global de ofertas, canales de contacto (WhatsApp/Llamada/Inbox) y alertas.",
    icon: Briefcase,
    badge: "Operaciones",
    badgeColor: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  },
  {
    title: "Suscripción y Facturación",
    description: "Planes corporativos, asignación de vacantes destacadas, comprobantes fiscales CFDI 4.0 e historial de pagos.",
    icon: CreditCard,
    badge: "Finanzas",
    badgeColor: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
  },
  {
    title: "Notificaciones y Alertas",
    description: "Canales de aviso inmediato por correo electrónico y WhatsApp para nuevos postulantes.",
    icon: BellRing,
    badge: "Alertas",
    badgeColor: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  },
  {
    title: "Perfil Corporativo y SAT",
    description: "Expediente de verificación legal, razón social, RFC y datos comerciales.",
    icon: Building2,
    badge: "Legal",
    badgeColor: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
  },
  {
    title: "Reglas de mi empresa",
    description: "Flujo de aprobación de vacaciones en 1 o 2 pasos y reglas operativas de personal.",
    icon: SlidersHorizontal,
    badge: "Reglas",
    badgeColor: "bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20",
  },
];

export function CompanySettingsView({
  user: _user,
  initialProfile,
  initialPauseState: _initialPauseState = false,
  initialInvoices: _initialInvoices = [],
}: CompanySettingsViewProps) {
  const formattedInvoices: BillingRecord[] = React.useMemo(() => {
    return (_initialInvoices || []).map((inv) => ({
      id: inv.id,
      plan_name: inv.plan_name || "Suscripción K'anPro",
      type: "Suscripción" as const,
      amount: inv.amount || 0,
      currency: inv.currency || "MXN",
      status: inv.status || "PAGADO",
      payment_method: inv.payment_method || null,
      created_at: inv.created_at,
    }));
  }, [_initialInvoices]);

  return (
    <div className="w-full space-y-6 pb-12 font-sans animate-in fade-in duration-300">
      <CompanyPageHeader
        title="Configuración de Empresa"
        description="Administra las opciones globales, controles operativos, seguridad y preferencias del módulo corporativo."
        badge={
          <Badge
            variant="outline"
            className="text-xs font-bold"
          >
            {initialProfile.company_name}
          </Badge>
        }
      />

      {/* Main Hero Card with Modal Trigger */}
      <Card className="border border-primary/20 bg-gradient-to-br from-primary/5 via-background to-card shadow-sm overflow-hidden relative">
        <div className="absolute top-0 right-0 p-8 pointer-events-none opacity-5 dark:opacity-10">
          <Settings className="size-64 -mr-16 -mt-16 text-primary" />
        </div>
        
        <CardHeader className="p-6 sm:p-8 space-y-3 relative z-10">
          <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
            <Sparkles className="size-4 text-primary" />
            <span>Centro de Control Corporativo</span>
          </div>
          <CardTitle className="text-xl sm:text-2xl font-[800] text-foreground tracking-tight max-w-xl">
            Ajustes y Parámetros del Módulo
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm text-muted-foreground font-medium max-w-xl leading-relaxed">
            Haz clic en el botón a continuación para abrir la ventana modal de configuración con el 90% de espacio disponible para gestionar todos los aspectos del sistema.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-6 sm:p-8 pt-0 relative z-10 flex flex-wrap items-center gap-4">
          
          {/* CompanySettingsModal Component */}
          <CompanySettingsModal
            initialProfile={initialProfile}
            initialInvoices={formattedInvoices}
            trigger={
              <Button
                size="lg"
                className="gap-2.5 font-extrabold cursor-pointer"
              >
                <SlidersHorizontal className="size-4.5 stroke-[2.5]" />
                <span>Configuraciones</span>
              </Button>
            }
          />

          <Link href="/dashboard/company/profile">
            <Button
              variant="outline"
              size="lg"
              className="gap-2 font-bold cursor-pointer"
            >
              <Building2 className="size-4 text-muted-foreground" />
              <span>Ver Perfil Público</span>
              <ArrowRight className="size-3.5 ml-1 text-muted-foreground" />
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* Grid of Available Configuration Modules */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-[800] text-foreground flex items-center gap-2">
              <Shield className="size-5 text-primary" />
              Áreas de Configuración Disponibles
            </h2>
            <p className="text-xs text-muted-foreground font-medium mt-0.5">
              Módulos y preferencias que integran el ecosistema de administración corporativa.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {CONFIG_MODULES.map((module) => {
            const Icon = module.icon;
            return (
              <Card
                key={module.title}
                className="p-5 flex flex-col justify-between gap-4 hover:border-primary/40 transition-all"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="size-10 rounded-2xl bg-muted/60 flex items-center justify-center shrink-0 text-foreground">
                      <Icon className="size-5 text-primary" />
                    </div>
                    <Badge variant="outline" className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${module.badgeColor}`}>
                      {module.badge}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-foreground">{module.title}</h3>
                    <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                      {module.description}
                    </p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

    </div>
  );
}
