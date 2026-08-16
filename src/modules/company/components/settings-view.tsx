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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

export function CompanySettingsView({
  user,
  initialProfile,
  initialPauseState = false,
  initialInvoices = [],
}: CompanySettingsViewProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false);

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
    <div className="space-y-8 max-w-5xl mx-auto pb-12 font-sans animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Configuración y Seguridad
          </h1>
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 font-bold px-3 py-0.5 rounded-full text-xs">
            {initialProfile.company_name}
          </Badge>
        </div>
        <p className="text-muted-foreground text-sm leading-relaxed max-w-2xl">
          Administra la seguridad de tu acceso corporativo, autenticación de dos pasos, canales de reclutamiento, alertas y facturación.
        </p>
      </div>

      <Tabs defaultValue="security" className="space-y-6">
        <TabsList className="grid grid-cols-4 w-full max-w-xl bg-muted/60 p-1 rounded-xl">
          <TabsTrigger value="security" className="rounded-lg text-xs font-semibold gap-1.5">
            <Key className="size-3.5" />
            Seguridad
          </TabsTrigger>
          <TabsTrigger value="recruitment" className="rounded-lg text-xs font-semibold gap-1.5">
            <Briefcase className="size-3.5" />
            Reclutamiento
          </TabsTrigger>
          <TabsTrigger value="subscription" className="rounded-lg text-xs font-semibold gap-1.5">
            <CreditCard className="size-3.5" />
            Suscripción
          </TabsTrigger>
          <TabsTrigger value="company" className="rounded-lg text-xs font-semibold gap-1.5">
            <Building2 className="size-3.5" />
            Empresa
          </TabsTrigger>
        </TabsList>

        {/* ========================================================= */}
        {/* TAB 1: SEGURIDAD                                          */}
        {/* ========================================================= */}
        <TabsContent value="security" className="space-y-4">
          <ChangePasswordForm />
          <ChangeEmailForm />
          <TwoFactorSetup />
          <ActiveSessionsCard />

          {/* Theme & Appearance */}
          <Card className="rounded-2xl border-border/40 shadow-xs">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-500/10 rounded-xl text-indigo-600 dark:text-indigo-400">
                  <Sun className="size-5" />
                </div>
                <div>
                  <CardTitle className="text-base font-bold">Tema Visual de la Interfaz</CardTitle>
                  <CardDescription className="text-xs">
                    Selecciona el modo visual para el panel administrativo.
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
                      "flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-semibold gap-2 transition-all cursor-pointer",
                      theme === "light"
                        ? "border-primary bg-primary/10 text-primary font-bold shadow-2xs"
                        : "border-border/40 hover:bg-muted text-muted-foreground"
                    )}
                  >
                    <Sun className="size-4" />
                    <span>Claro</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTheme("dark")}
                    className={cn(
                      "flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-semibold gap-2 transition-all cursor-pointer",
                      theme === "dark"
                        ? "border-primary bg-primary/10 text-primary font-bold shadow-2xs"
                        : "border-border/40 hover:bg-muted text-muted-foreground"
                    )}
                  >
                    <Moon className="size-4" />
                    <span>Oscuro</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTheme("system")}
                    className={cn(
                      "flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-semibold gap-2 transition-all cursor-pointer",
                      theme === "system"
                        ? "border-primary bg-primary/10 text-primary font-bold shadow-2xs"
                        : "border-border/40 hover:bg-muted text-muted-foreground"
                    )}
                  >
                    <Laptop className="size-4" />
                    <span>Sistema</span>
                  </button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ========================================================= */}
        {/* TAB 2: RECLUTAMIENTO                                      */}
        {/* ========================================================= */}
        <TabsContent value="recruitment" className="space-y-6">
          {/* Pausa Global de Reclutamiento */}
          <Card className="rounded-2xl border-border/40 shadow-xs">
            <CardHeader>
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "p-2.5 rounded-xl text-white shrink-0 transition-colors",
                    pauseGlobal ? "bg-amber-500" : "bg-emerald-600"
                  )}>
                    <ShieldCheck className="size-5" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-bold">Pausa Global de Reclutamiento</CardTitle>
                    <CardDescription className="text-xs">
                      Oculta instantáneamente todas las vacantes de tu empresa del feed público.
                    </CardDescription>
                  </div>
                </div>
                <Switch
                  checked={pauseGlobal}
                  onCheckedChange={handleTogglePause}
                />
              </div>
            </CardHeader>
            {pauseGlobal && (
              <CardContent className="pt-0">
                <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-xs font-semibold">
                  <AlertCircle className="size-4 mt-0.5 shrink-0" />
                  <div>
                    <span className="font-bold">Efecto Inmediato:</span> Tus ofertas de empleo están pausadas. Ningún candidato podrá postularse hasta que reactives este control.
                  </div>
                </div>
              </CardContent>
            )}
          </Card>

          {/* Canal de Contacto Preferido */}
          <Card className="rounded-2xl border-border/40 shadow-xs">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-500/10 rounded-xl text-emerald-600 dark:text-emerald-400">
                  <MessageCircle className="size-5" />
                </div>
                <div>
                  <CardTitle className="text-base font-bold">Canal de Contacto Principal</CardTitle>
                  <CardDescription className="text-xs">
                    Elige cómo prefieres que los candidatos se comuniquen con tu equipo.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* WhatsApp Directo */}
                <div
                  onClick={() => handleContactChannelChange("whatsapp")}
                  className={cn(
                    "flex flex-col justify-between p-4 rounded-xl border cursor-pointer transition-all duration-200 select-none",
                    contactChannel === "whatsapp"
                      ? "border-emerald-600 dark:border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/30 shadow-xs"
                      : "border-border/40 hover:border-border bg-card"
                  )}
                >
                  <div className="flex justify-between items-center mb-3">
                    <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                      <MessageCircle className="size-4" />
                    </div>
                    {contactChannel === "whatsapp" && (
                      <Check className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-foreground">WhatsApp Directo</h4>
                    <p className="text-[11px] text-muted-foreground mt-1 leading-normal">
                      Conexión exprés directa al número de WhatsApp corporativo.
                    </p>
                  </div>
                </div>

                {/* Llamada Telefónica */}
                <div
                  onClick={() => handleContactChannelChange("phone")}
                  className={cn(
                    "flex flex-col justify-between p-4 rounded-xl border cursor-pointer transition-all duration-200 select-none",
                    contactChannel === "phone"
                      ? "border-primary bg-primary/10 shadow-xs"
                      : "border-border/40 hover:border-border bg-card"
                  )}
                >
                  <div className="flex justify-between items-center mb-3">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                      <Phone className="size-4" />
                    </div>
                    {contactChannel === "phone" && (
                      <Check className="size-4 text-primary shrink-0" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-foreground">Llamada Telefónica</h4>
                    <p className="text-[11px] text-muted-foreground mt-1 leading-normal">
                      Contacto telefónico directo para entrevistas y filtros.
                    </p>
                  </div>
                </div>

                {/* Inbox K'anPro */}
                <div
                  onClick={() => handleContactChannelChange("inbox")}
                  className={cn(
                    "flex flex-col justify-between p-4 rounded-xl border cursor-pointer transition-all duration-200 select-none",
                    contactChannel === "inbox"
                      ? "border-primary bg-primary/10 shadow-xs"
                      : "border-border/40 hover:border-border bg-card"
                  )}
                >
                  <div className="flex justify-between items-center mb-3">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                      <MessageSquare className="size-4" />
                    </div>
                    {contactChannel === "inbox" && (
                      <Check className="size-4 text-primary shrink-0" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-foreground">Bandeja K&apos;anPro</h4>
                    <p className="text-[11px] text-muted-foreground mt-1 leading-normal">
                      Mensajería interna protegida a través de la plataforma.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Alertas y Notificaciones */}
          <Card className="rounded-2xl border-border/40 shadow-xs">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-500/10 rounded-xl text-amber-600 dark:text-amber-400">
                  <Bell className="size-5" />
                </div>
                <div>
                  <CardTitle className="text-base font-bold">Alertas de Nuevos Postulantes</CardTitle>
                  <CardDescription className="text-xs">
                    Define cómo recibir avisos cuando un candidato aplique a tus vacantes.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-3.5 rounded-xl border border-border/30 bg-muted/20">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold block text-foreground">Alertas por Correo Electrónico</span>
                  <span className="text-[11px] text-muted-foreground block">
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

              <div className="flex items-center justify-between p-3.5 rounded-xl border border-border/30 bg-muted/20">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold block text-foreground">Avisos Inmediatos por WhatsApp</span>
                  <span className="text-[11px] text-muted-foreground block">
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
            </CardContent>
          </Card>
        </TabsContent>

        {/* ========================================================= */}
        {/* TAB 3: SUSCRIPCIÓN                                        */}
        {/* ========================================================= */}
        <TabsContent value="subscription" className="space-y-6">
          {/* Promotional Founder Banner */}
          <Card className="rounded-2xl p-6 md:p-8 bg-gradient-to-br from-primary/10 via-primary/5 to-emerald-500/10 border border-primary/20 space-y-4 shadow-xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
                  <Sparkles className="size-4" />
                  <span>PLAN FUNDADOR ACTIVO</span>
                  <Badge className="bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.2 rounded-full border-none">
                    Fase Beta Gratuita
                  </Badge>
                </div>
                <h2 className="text-2xl font-bold text-foreground">Acceso Ilimitado de Lanzamiento</h2>
                <p className="text-xs text-muted-foreground max-w-xl leading-relaxed">
                  Tu empresa cuenta con acceso total a todas las herramientas de K&apos;anPro sin costo durante la fase de lanzamiento en el Sureste.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-border/40 text-xs">
              <div className="flex items-center gap-2 text-foreground font-medium">
                <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                <span>Publicación ilimitada de vacantes</span>
              </div>
              <div className="flex items-center gap-2 text-foreground font-medium">
                <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                <span>Contacto directo vía WhatsApp con candidatos</span>
              </div>
            </div>
          </Card>

          {/* Invoices & Subscription Table */}
          <Card className="rounded-2xl border-border/40 shadow-xs">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-500/10 rounded-xl text-indigo-600 dark:text-indigo-400">
                  <CreditCard className="size-5" />
                </div>
                <div>
                  <CardTitle className="text-base font-bold">Historial de Suscripción & Facturación</CardTitle>
                  <CardDescription className="text-xs">
                    Comprobantes fiscales digitales (CFDI 4.0) y registros de pago corporativos.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <BillingSubscriptionsTable data={billingRecords} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ========================================================= */}
        {/* TAB 4: EMPRESA Y PRIVACIDAD                               */}
        {/* ========================================================= */}
        <TabsContent value="company" className="space-y-6">
          {/* Perfil Público y Verificación */}
          <Card className="rounded-2xl border-border/40 shadow-xs">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-primary/10 rounded-xl text-primary">
                  <Building2 className="size-5" />
                </div>
                <div>
                  <CardTitle className="text-base font-bold">Datos del Perfil Corporativo</CardTitle>
                  <CardDescription className="text-xs">
                    Información comercial y expediente de verificación legal de tu empresa.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-xs text-muted-foreground leading-relaxed">
                Gestiona la marca, logotipo, beneficios laborales y la documentación fiscal registrada ante el SAT.
              </p>
              <div className="flex items-center gap-3 flex-wrap">
                <Link href="/dashboard/company/profile">
                  <Button variant="outline" size="sm" className="rounded-full text-xs font-semibold">
                    Editar Perfil de Empresa
                    <ArrowRight className="size-3.5 ml-1.5" />
                  </Button>
                </Link>
                <Link href="/dashboard/company/verification">
                  <Button size="sm" className="rounded-full text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90">
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
                <div className="p-2.5 bg-destructive/10 rounded-xl text-destructive">
                  <Trash2 className="size-5" />
                </div>
                <div>
                  <CardTitle className="text-base font-bold text-destructive">Zona de Peligro</CardTitle>
                  <CardDescription className="text-xs">
                    Eliminación permanente de la cuenta corporativa y vacantes publicadas.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-xs text-muted-foreground leading-relaxed">
                Al eliminar tu cuenta de empresa, se cerrarán todas las vacantes publicadas, se desvincularán los expedientes de postulantes y se revocarán los accesos corporativos.
              </p>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setIsDeleteModalOpen(true)}
                className="rounded-full text-xs font-semibold"
              >
                Eliminar mi cuenta de empresa
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>

      <DeleteAccountModal
        open={isDeleteModalOpen}
        onOpenChange={setIsDeleteModalOpen}
      />
    </div>
  );
}
