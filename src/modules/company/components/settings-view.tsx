"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import {
  Key,
  Briefcase,
  CreditCard,
  Building2,
  Lock,
  Sparkles,
  Check,
  AlertCircle,
  Moon,
  Sun,
  Laptop,
  MessageCircle,
  Phone,
  MessageSquare,
  ShieldCheck,
  CheckCircle2,
  Bell,
  Trash2,
  ArrowRight,
  Shield,
} from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { toggleGlobalRecruitment, updateContactChannel } from "@/modules/company/actions/settings";
import { BillingSubscriptionsTable, type BillingRecord } from "./billing-subscriptions-table";
import {
  ChangePasswordForm,
  ChangeEmailForm,
  TwoFactorSetup,
  ActiveSessionsCard,
} from "@/modules/account/components";
import { DeleteAccountModal } from "@/modules/account/components/delete-account-modal";

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

const SETTING_SECTIONS = [
  {
    id: "system-preferences",
    label: "Preferencias del Sistema",
    icon: Sun,
    description: "Tema visual y apariencia",
  },
  {
    id: "security-access",
    label: "Seguridad y Acceso",
    icon: Key,
    description: "Contraseña, correo y 2FA",
  },
  {
    id: "recruitment-controls",
    label: "Control de Reclutamiento",
    icon: Briefcase,
    description: "Pausa de vacantes y canales",
  },
  {
    id: "subscription-billing",
    label: "Suscripción y Facturación",
    icon: CreditCard,
    description: "Plan activo y comprobantes",
  },
  {
    id: "company-privacy",
    label: "Empresa y Privacidad",
    icon: Building2,
    description: "Expediente y zona de peligro",
  },
];

export function CompanySettingsView({
  user,
  initialProfile,
  initialPauseState = false,
  initialInvoices = [],
}: CompanySettingsViewProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false);
  const [activeSection, setActiveSection] = React.useState("system-preferences");

  // Recruitment controls
  const [pauseGlobal, setPauseGlobal] = React.useState(initialPauseState);
  const [contactChannel, setContactChannel] = React.useState(initialProfile.contact_channel || "whatsapp");
  const [notifyEmail, setNotifyEmail] = React.useState(true);
  const [notifyWhatsapp, setNotifyWhatsapp] = React.useState(true);

  React.useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined") {
      const emailPref = localStorage.getItem("kanpro_company_notify_email");
      const waPref = localStorage.getItem("kanpro_company_notify_wa");
      if (emailPref !== null) setNotifyEmail(emailPref === "true");
      if (waPref !== null) setNotifyWhatsapp(waPref === "true");
    }
  }, []);

  // IntersectionObserver to auto-update active section on scroll
  React.useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      {
        rootMargin: "-20% 0px -60% 0px",
        threshold: 0.1,
      }
    );

    SETTING_SECTIONS.forEach((sec) => {
      const el = document.getElementById(sec.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // Handle Pause Global Recruitment
  const handleTogglePause = async (checked: boolean) => {
    const previous = pauseGlobal;
    setPauseGlobal(checked);

    try {
      await toggleGlobalRecruitment(initialProfile.id, checked);
      if (checked) {
        toast.warning("Reclutamiento Pausado", {
          description: "Tus vacantes han sido ocultadas del feed público temporalmente.",
        });
      } else {
        toast.success("Reclutamiento Activo", {
          description: "Tus vacantes vuelven a estar visibles para todos los candidatos.",
        });
      }
    } catch (err: any) {
      setPauseGlobal(previous);
      toast.error("Error al actualizar estado", {
        description: err.message || "No se pudo actualizar el estado de las vacantes.",
      });
    }
  };

  // Handle Contact Channel Change
  const handleContactChannelChange = async (channel: "whatsapp" | "phone" | "inbox") => {
    const previous = contactChannel;
    setContactChannel(channel);

    try {
      await updateContactChannel(initialProfile.id, channel);
      toast.success("Canal de contacto actualizado");
    } catch (err: any) {
      setContactChannel(previous);
      toast.error("Error al guardar canal", {
        description: err.message || "No se pudo actualizar el canal de contacto.",
      });
    }
  };

  // Subscription Billing Records (Real)
  const billingRecords: BillingRecord[] = React.useMemo(() => {
    const list: BillingRecord[] = initialInvoices.map((inv) => ({
      id: inv.id,
      plan_name: inv.plan_name,
      type: "Factura Fiscal",
      amount: inv.amount,
      currency: inv.currency,
      status: inv.status?.toUpperCase() || "PAGADO",
      payment_method: inv.payment_method || "Tarjeta / SPEI",
      created_at: inv.created_at,
    }));

    // Add active Founder Plan entry
    list.unshift({
      id: "sub-founder-beta",
      plan_name: "Plan Fundador (Lanzamiento Regional)",
      type: "Suscripción",
      amount: 0,
      currency: "MXN",
      status: "ACTIVO (100% BONIFICADO)",
      payment_method: "Acceso Promocional",
      created_at: new Date().toISOString(),
    });

    return list;
  }, [initialInvoices]);

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16 font-sans animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex flex-col gap-2 pb-4 border-b border-border/40">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-2xl sm:text-3xl font-[800] tracking-tight text-foreground">
            Configuración y Seguridad
          </h1>
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 font-bold px-3 py-0.5 rounded-full text-xs">
            {initialProfile.company_name}
          </Badge>
        </div>
        <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed max-w-2xl font-medium">
          Administra la apariencia, seguridad de acceso corporativo, canales de reclutamiento, alertas y facturación en un solo lugar.
        </p>
      </div>

      {/* Main Container: Sticky Quick Navigation + Continuous Column */}
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        
        {/* Quick Nav Vertical Index (Sticky on Desktop, Horizontal Pills on Mobile) */}
        <div className="w-full lg:w-64 shrink-0 sticky top-4 lg:top-24 z-20 bg-background/90 backdrop-blur-md rounded-2xl border border-border/40 p-2 shadow-xs">
          <div className="hidden lg:block px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Secciones de Ajustes
          </div>
          <nav className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-x-visible hide-scrollbar p-1 lg:p-0">
            {SETTING_SECTIONS.map((sec) => {
              const isSecActive = activeSection === sec.id;
              const Icon = sec.icon;
              return (
                <button
                  key={sec.id}
                  type="button"
                  onClick={() => scrollToSection(sec.id)}
                  className={cn(
                    "flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer whitespace-nowrap lg:whitespace-normal shrink-0 lg:shrink",
                    isSecActive
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                  )}
                >
                  <Icon className="size-4 shrink-0" />
                  <span className="truncate">{sec.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Continuous Single Column with All Sections */}
        <div className="flex-1 w-full space-y-10 min-w-0">
          
          {/* ========================================================= */}
          {/* 1. PREFERENCIAS DEL SISTEMA                               */}
          {/* ========================================================= */}
          <section id="system-preferences" className="scroll-mt-6 space-y-4">
            <Card className="rounded-2xl border border-border/40 bg-card shadow-xs">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                    <Sun className="size-5" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-extrabold text-foreground">
                      Preferencias del Sistema & Tema Visual
                    </CardTitle>
                    <CardDescription className="text-xs text-muted-foreground font-semibold mt-0.5">
                      Personaliza la apariencia del panel de administración corporativo.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-2">
                {mounted && (
                  <div className="grid grid-cols-3 gap-3 max-w-md">
                    <button
                      type="button"
                      onClick={() => setTheme("light")}
                      className={cn(
                        "flex flex-col items-center justify-center p-3.5 rounded-xl border text-xs font-bold gap-2 transition-all cursor-pointer",
                        theme === "light"
                          ? "border-primary bg-primary/10 text-foreground shadow-2xs"
                          : "border-border/40 hover:bg-muted/50 text-muted-foreground"
                      )}
                    >
                      <Sun className="size-4.5" />
                      <span>Claro</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setTheme("dark")}
                      className={cn(
                        "flex flex-col items-center justify-center p-3.5 rounded-xl border text-xs font-bold gap-2 transition-all cursor-pointer",
                        theme === "dark"
                          ? "border-primary bg-primary/10 text-foreground shadow-2xs"
                          : "border-border/40 hover:bg-muted/50 text-muted-foreground"
                      )}
                    >
                      <Moon className="size-4.5" />
                      <span>Oscuro</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setTheme("system")}
                      className={cn(
                        "flex flex-col items-center justify-center p-3.5 rounded-xl border text-xs font-bold gap-2 transition-all cursor-pointer",
                        theme === "system"
                          ? "border-primary bg-primary/10 text-foreground shadow-2xs"
                          : "border-border/40 hover:bg-muted/50 text-muted-foreground"
                      )}
                    >
                      <Laptop className="size-4.5" />
                      <span>Sistema</span>
                    </button>
                  </div>
                )}
              </CardContent>
            </Card>
          </section>

          {/* ========================================================= */}
          {/* 2. SEGURIDAD Y ACCESO (COLUMNA COMPACTA)                   */}
          {/* ========================================================= */}
          <section id="security-access" className="scroll-mt-6 space-y-4">
            <div className="pb-1">
              <h2 className="text-lg font-extrabold text-foreground flex items-center gap-2">
                <Key className="size-5 text-primary" />
                Seguridad y Acceso de la Cuenta
              </h2>
              <p className="text-xs text-muted-foreground font-semibold mt-0.5">
                Contraseñas de acceso, verificación de identidad en 2 pasos y sesiones activas.
              </p>
            </div>

            <ChangePasswordForm />
            <ChangeEmailForm />
            <TwoFactorSetup />
            <ActiveSessionsCard />
          </section>

          {/* ========================================================= */}
          {/* 3. CONTROL DE RECLUTAMIENTO                               */}
          {/* ========================================================= */}
          <section id="recruitment-controls" className="scroll-mt-6 space-y-4">
            <div className="pb-1">
              <h2 className="text-lg font-extrabold text-foreground flex items-center gap-2">
                <Briefcase className="size-5 text-primary" />
                Control de Reclutamiento & Alertas
              </h2>
              <p className="text-xs text-muted-foreground font-semibold mt-0.5">
                Pausa de vacantes, vías de contacto con candidatos y configuración de alertas.
              </p>
            </div>

            {/* Pausa Global de Reclutamiento */}
            <Card className="rounded-2xl border border-border/40 bg-card shadow-xs p-6 space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className={cn(
                    "p-2.5 rounded-2xl text-white mt-0.5 shrink-0 transition-colors",
                    pauseGlobal ? "bg-amber-500" : "bg-emerald-600"
                  )}>
                    <ShieldCheck className="size-5" />
                  </div>
                  <div className="space-y-0.5">
                    <h3 className="text-base font-extrabold text-foreground">
                      Pausar Reclutamiento Temporalmente
                    </h3>
                    <p className="text-xs text-muted-foreground font-semibold leading-relaxed max-w-xl">
                      Al activarlo, todas las vacantes de tu empresa se ocultan instantáneamente del feed público de candidatos.
                    </p>
                  </div>
                </div>
                <Switch
                  checked={pauseGlobal}
                  onCheckedChange={handleTogglePause}
                />
              </div>

              {pauseGlobal && (
                <div className="flex items-start gap-2.5 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-xs font-semibold animate-in slide-in-from-top-2 duration-300">
                  <AlertCircle className="size-4.5 mt-0.5 shrink-0" />
                  <div>
                    <span className="font-extrabold">Efecto Inmediato:</span> Tus ofertas de empleo están pausadas. Ningún candidato podrá postularse hasta que reactives este control.
                  </div>
                </div>
              )}
            </Card>

            {/* Canal de Contacto Preferido */}
            <Card className="rounded-2xl border border-border/40 bg-card shadow-xs p-6 space-y-4">
              <div className="flex items-center gap-3 pb-2 border-b border-border/40">
                <div className="size-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <MessageCircle className="size-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-foreground">
                    Canal de Contacto Principal con Candidatos
                  </h3>
                  <p className="text-xs text-muted-foreground font-semibold mt-0.5">
                    Elige cómo prefieres que los candidatos se comuniquen con tu equipo de recursos humanos.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-1">
                {/* WhatsApp Directo */}
                <div
                  onClick={() => handleContactChannelChange("whatsapp")}
                  className={cn(
                    "flex flex-col justify-between p-4.5 rounded-2xl border cursor-pointer transition-all select-none space-y-3",
                    contactChannel === "whatsapp"
                      ? "border-emerald-600 dark:border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/30 shadow-xs ring-1 ring-emerald-500/20"
                      : "border-border/40 hover:border-border bg-background"
                  )}
                >
                  <div className="flex justify-between items-center">
                    <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                      <MessageCircle className="size-4.5" />
                    </div>
                    {contactChannel === "whatsapp" && (
                      <Check className="size-4.5 text-emerald-600 dark:text-emerald-400 shrink-0 font-bold" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-extrabold text-foreground">WhatsApp Directo</h4>
                    <p className="text-[11px] text-muted-foreground font-medium mt-1 leading-normal">
                      Conexión exprés directa al WhatsApp corporativo.
                    </p>
                  </div>
                </div>

                {/* Llamada Telefónica */}
                <div
                  onClick={() => handleContactChannelChange("phone")}
                  className={cn(
                    "flex flex-col justify-between p-4.5 rounded-2xl border cursor-pointer transition-all select-none space-y-3",
                    contactChannel === "phone"
                      ? "border-primary bg-primary/10 shadow-xs ring-1 ring-primary/20"
                      : "border-border/40 hover:border-border bg-background"
                  )}
                >
                  <div className="flex justify-between items-center">
                    <div className="p-2 rounded-xl bg-primary/10 text-primary">
                      <Phone className="size-4.5" />
                    </div>
                    {contactChannel === "phone" && (
                      <Check className="size-4.5 text-primary shrink-0 font-bold" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-extrabold text-foreground">Llamada Telefónica</h4>
                    <p className="text-[11px] text-muted-foreground font-medium mt-1 leading-normal">
                      Contacto telefónico para entrevistas y filtros directos.
                    </p>
                  </div>
                </div>

                {/* Bandeja K'anPro */}
                <div
                  onClick={() => handleContactChannelChange("inbox")}
                  className={cn(
                    "flex flex-col justify-between p-4.5 rounded-2xl border cursor-pointer transition-all select-none space-y-3",
                    contactChannel === "inbox"
                      ? "border-primary bg-primary/10 shadow-xs ring-1 ring-primary/20"
                      : "border-border/40 hover:border-border bg-background"
                  )}
                >
                  <div className="flex justify-between items-center">
                    <div className="p-2 rounded-xl bg-primary/10 text-primary">
                      <MessageSquare className="size-4.5" />
                    </div>
                    {contactChannel === "inbox" && (
                      <Check className="size-4.5 text-primary shrink-0 font-bold" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-extrabold text-foreground">Bandeja K&apos;anPro</h4>
                    <p className="text-[11px] text-muted-foreground font-medium mt-1 leading-normal">
                      Mensajería interna protegida en la plataforma.
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Alertas y Notificaciones */}
            <Card className="rounded-2xl border border-border/40 bg-card shadow-xs p-6 space-y-4">
              <div className="flex items-center gap-3 pb-2 border-b border-border/40">
                <div className="size-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <Bell className="size-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-foreground">
                    Alertas de Nuevos Postulantes
                  </h3>
                  <p className="text-xs text-muted-foreground font-semibold mt-0.5">
                    Define los medios para recibir avisos cuando un candidato aplique a tus vacantes.
                  </p>
                </div>
              </div>

              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between p-4 rounded-2xl border border-border/40 bg-muted/20">
                  <div className="space-y-0.5">
                    <span className="text-xs sm:text-sm font-bold block text-foreground">Alertas por Correo Electrónico</span>
                    <span className="text-[11px] text-muted-foreground font-medium block">
                      Resumen y avisos inmediatos a {user.email}.
                    </span>
                  </div>
                  <Switch
                    checked={notifyEmail}
                    onCheckedChange={(val) => {
                      setNotifyEmail(val);
                      if (typeof window !== "undefined") localStorage.setItem("kanpro_company_notify_email", String(val));
                      toast.success(val ? "Alertas por email activadas" : "Alertas por email desactivadas");
                    }}
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-2xl border border-border/40 bg-muted/20">
                  <div className="space-y-0.5">
                    <span className="text-xs sm:text-sm font-bold block text-foreground">Avisos Inmediatos por WhatsApp</span>
                    <span className="text-[11px] text-muted-foreground font-medium block">
                      Notificación al número {initialProfile.phone || initialProfile.whatsapp_number || "registrado"}.
                    </span>
                  </div>
                  <Switch
                    checked={notifyWhatsapp}
                    onCheckedChange={(val) => {
                      setNotifyWhatsapp(val);
                      if (typeof window !== "undefined") localStorage.setItem("kanpro_company_notify_wa", String(val));
                      toast.success(val ? "Alertas por WhatsApp activadas" : "Alertas por WhatsApp desactivadas");
                    }}
                  />
                </div>
              </div>
            </Card>
          </section>

          {/* ========================================================= */}
          {/* 4. SUSCRIPCIÓN Y FACTURACIÓN                              */}
          {/* ========================================================= */}
          <section id="subscription-billing" className="scroll-mt-6 space-y-4">
            <div className="pb-1">
              <h2 className="text-lg font-extrabold text-foreground flex items-center gap-2">
                <CreditCard className="size-5 text-primary" />
                Suscripción & Facturación
              </h2>
              <p className="text-xs text-muted-foreground font-semibold mt-0.5">
                Plan activo, beneficios promocionales de lanzamiento y comprobantes fiscales CFDI 4.0.
              </p>
            </div>

            {/* Promotional Founder Banner */}
            <Card className="rounded-2xl p-6 sm:p-8 bg-gradient-to-br from-primary/10 via-background to-emerald-500/10 border border-primary/20 space-y-4 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
                    <Sparkles className="size-4 text-primary" />
                    <span>PLAN FUNDADOR ACTIVO</span>
                    <Badge className="bg-emerald-500 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full border-none">
                      Fase Beta Gratuita
                    </Badge>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-foreground">Acceso Ilimitado de Lanzamiento</h2>
                  <p className="text-xs sm:text-sm text-muted-foreground font-semibold max-w-xl leading-relaxed">
                    Tu empresa cuenta con acceso total a las herramientas de K&apos;anPro sin costo durante la fase de lanzamiento en el Sureste.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-4 border-t border-border/40 text-xs font-semibold">
                <div className="flex items-center gap-2.5 text-foreground">
                  <CheckCircle2 className="size-4.5 text-emerald-500 shrink-0" />
                  <span>Publicación ilimitada de vacantes</span>
                </div>
                <div className="flex items-center gap-2.5 text-foreground">
                  <CheckCircle2 className="size-4.5 text-emerald-500 shrink-0" />
                  <span>Contacto directo vía WhatsApp con candidatos</span>
                </div>
              </div>
            </Card>

            {/* Invoices & Subscription Table */}
            <Card className="rounded-2xl border border-border/40 bg-card shadow-xs p-6 space-y-4">
              <div className="flex items-center gap-3 pb-2 border-b border-border/40">
                <div className="size-10 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                  <CreditCard className="size-5" />
                </div>
                <div>
                  <CardTitle className="text-base font-bold text-foreground">
                    Historial de Facturación & Comprobantes
                  </CardTitle>
                  <CardDescription className="text-xs text-muted-foreground font-semibold mt-0.5">
                    Comprobantes fiscales digitales (CFDI 4.0) y registros de pago de tu empresa.
                  </CardDescription>
                </div>
              </div>
              <BillingSubscriptionsTable data={billingRecords} />
            </Card>
          </section>

          {/* ========================================================= */}
          {/* 5. EMPRESA Y PRIVACIDAD                                   */}
          {/* ========================================================= */}
          <section id="company-privacy" className="scroll-mt-6 space-y-4">
            <div className="pb-1">
              <h2 className="text-lg font-extrabold text-foreground flex items-center gap-2">
                <Building2 className="size-5 text-primary" />
                Empresa y Privacidad
              </h2>
              <p className="text-xs text-muted-foreground font-semibold mt-0.5">
                Expediente corporativo registrado ante el SAT y opciones de cuenta.
              </p>
            </div>

            {/* Perfil Público y Verificación */}
            <Card className="rounded-2xl border border-border/40 bg-card shadow-xs">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <Building2 className="size-5" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-bold">Datos del Perfil Corporativo</CardTitle>
                    <CardDescription className="text-xs font-semibold text-muted-foreground mt-0.5">
                      Información comercial y expediente de verificación legal de tu empresa.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                  Gestiona la marca, logotipo, beneficios laborales y la documentación fiscal registrada ante el SAT.
                </p>
                <div className="flex items-center gap-3 flex-wrap">
                  <Link href="/dashboard/company/profile">
                    <Button variant="outline" size="sm" className="rounded-xl text-xs font-bold h-10 px-4">
                      Editar Perfil de Empresa
                      <ArrowRight className="size-3.5 ml-1.5" />
                    </Button>
                  </Link>
                  <Link href="/dashboard/company/verification">
                    <Button size="sm" className="rounded-xl text-xs font-bold h-10 px-4 bg-primary text-primary-foreground hover:bg-primary/90">
                      Expediente de Verificación Legal
                      <ArrowRight className="size-3.5 ml-1.5" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Danger Zone */}
            <Card className="rounded-2xl border-destructive/20 bg-destructive/5 shadow-xs">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center shrink-0">
                    <Trash2 className="size-5" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-bold text-destructive">Zona de Peligro</CardTitle>
                    <CardDescription className="text-xs font-semibold text-muted-foreground mt-0.5">
                      Eliminación permanente de la cuenta corporativa y vacantes publicadas.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                  Al eliminar tu cuenta de empresa, se cerrarán todas las vacantes publicadas, se desvincularán los expedientes de postulantes y se revocarán los accesos corporativos.
                </p>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setIsDeleteModalOpen(true)}
                  className="rounded-xl text-xs font-bold h-10 px-5"
                >
                  Eliminar mi cuenta de empresa
                </Button>
              </CardContent>
            </Card>
          </section>

        </div>
      </div>

      <DeleteAccountModal
        open={isDeleteModalOpen}
        onOpenChange={setIsDeleteModalOpen}
      />
    </div>
  );
}
