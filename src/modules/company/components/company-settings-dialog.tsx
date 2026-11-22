"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { getActiveCompanyContextAction } from "@/modules/company/actions/tenant-actions";
import { CompanyWorkRulesPanel } from "./settings/company-work-rules-panel";
import {
  X,
  Sun,
  Moon,
  Laptop,
  Globe,
  Palette,
  Check,
  Bell,
  Mail,
  MessageCircle,
  FileCheck2,
  CalendarDays,
  Sparkles,
  User,
  Building,
  Phone,
  Key,
  Copy,
  Lock,
  ShieldCheck,
  PauseCircle,
  Trash2,
  CreditCard,
  Receipt,
  Zap,
  CheckCircle2,
  FileText,
} from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarProvider,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupContent,
} from "@/components/ui/sidebar";
import { createClient } from "@/lib/supabase/client";
import { DeleteAccountModal } from "@/modules/account/components/delete-account-modal";
import { ChangePasswordForm, TwoFactorSetup } from "@/modules/account/components";
import {
  BillingSubscriptionsTable,
  type BillingRecord,
} from "./billing-subscriptions-table";
import {
  getCompanyInvoices,
  updateCompanyAccountPhone,
} from "@/modules/company/actions/settings";
import { updateCompanyLeaveApprovalModeAction } from "@/modules/company/actions/leaves";
import type { LeaveApprovalMode } from "@/modules/company/strategies/leave-approval.strategy";
import {
  getSubscriptionPlan,
  type SubscriptionPlanId,
} from "@/config/subscriptions";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export interface CompanySettingsModalProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactElement;
  children?: React.ReactNode;
  defaultSection?: string;
  initialProfile?: {
    id?: string;
    company_name?: string;
    contact_phone?: string | null;
    corporate_email?: string | null;
    rfc?: string | null;
    legal_name?: string | null;
    entity_type?: string | null;
    fiscal_address?: string | null;
    verification_status?: string | null;
    subscription_plan?: string;
    subscription_status?: string;
    subscription_period_end?: string | null;
    featured_vacancies_allowance?: number;
    featured_vacancies_used?: number;
    credits_available?: number;
  };
  initialInvoices?: BillingRecord[];
}

const SETTINGS_SECTIONS = [
  {
    id: "appearance",
    label: "Apariencia e Idioma",
    icon: Palette,
    description: "Tema visual e idioma del sistema",
  },
  {
    id: "account",
    label: "Cuenta y Seguridad",
    icon: User,
    description: "Datos de usuario, contraseña y 2FA",
  },
  {
    id: "subscription",
    label: "Suscripción y Facturación",
    icon: CreditCard,
    description: "Acceso anticipado, cupos y comprobantes CFDI",
  },
  {
    id: "notifications",
    label: "Notificaciones",
    icon: Bell,
    description: "Canales de aviso y alertas automáticas",
  },
  {
    id: "company_rules",
    label: "Reglas de mi empresa",
    icon: FileCheck2,
    description: "Flujo de aprobación de vacaciones y políticas",
  },
];

const resolveApprovalMode = (config: unknown): LeaveApprovalMode =>
  config &&
  typeof config === "object" &&
  (config as { approvalMode?: string }).approvalMode === "two_step"
    ? "two_step"
    : "single_step";

export function CompanySettingsModal({
  open,
  onOpenChange,
  trigger,
  initialProfile,
  initialInvoices,
  defaultSection,
}: CompanySettingsModalProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  const [activeSection, setActiveSection] = React.useState(
    defaultSection || "appearance"
  );
  const [language, setLanguage] = React.useState("es");

  React.useEffect(() => {
    if (defaultSection) {
      setActiveSection(defaultSection);
    }
  }, [defaultSection, open]);

  // Account Information States
  const [accountInfo, setAccountInfo] = React.useState<{
    id: string;
    name: string;
    email: string;
    phone: string;
  }>({
    id: initialProfile?.id || "",
    name: initialProfile?.company_name || "",
    email: initialProfile?.corporate_email || "",
    phone: initialProfile?.contact_phone || "",
  });
  const [copiedId, setCopiedId] = React.useState(false);
  const [isChangingPassword, setIsChangingPassword] = React.useState(false);
  const [isSettingUp2FA, setIsSettingUp2FA] = React.useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false);
  const [activeCompanyId, setActiveCompanyId] = React.useState(initialProfile?.id || "");
  const [isEditingPhone, setIsEditingPhone] = React.useState(false);
  const [phoneInput, setPhoneInput] = React.useState("");
  const [isSavingPhone, setIsSavingPhone] = React.useState(false);

  // Fiscal CFDI 4.0 States
  const [fiscalProfile, setFiscalProfile] = React.useState<{
    rfc: string;
    legalName: string;
    entityType: string;
    fiscalAddress: string;
    corporateEmail: string;
    verificationStatus: string | null;
  }>({
    rfc: initialProfile?.rfc || "",
    legalName: initialProfile?.legal_name || initialProfile?.company_name || "",
    entityType: initialProfile?.entity_type || "",
    fiscalAddress: initialProfile?.fiscal_address || "",
    corporateEmail: initialProfile?.corporate_email || "",
    verificationStatus: initialProfile?.verification_status || null,
  });

  // Subscription & Billing States
  const initialPlan =
    (initialProfile?.subscription_plan as SubscriptionPlanId) || "basic";
  const [subscriptionPlan, setSubscriptionPlan] =
    React.useState<SubscriptionPlanId>(initialPlan);
  const [subscriptionStatus, setSubscriptionStatus] = React.useState<string>(
    initialProfile?.subscription_status || "active"
  );
  const [subscriptionPeriodEnd, setSubscriptionPeriodEnd] = React.useState<
    string | null
  >(initialProfile?.subscription_period_end || null);
  const [featuredAllowance, setFeaturedAllowance] = React.useState(
    initialProfile?.featured_vacancies_allowance ??
      getSubscriptionPlan(initialPlan).featuredVacanciesAllowance
  );
  const [featuredUsed, setFeaturedUsed] = React.useState(
    initialProfile?.featured_vacancies_used ?? 0
  );
  const [invoices, setInvoices] = React.useState<BillingRecord[]>(
    initialInvoices || []
  );

  // Notification Preferences States
  const [notifyEmail, setNotifyEmail] = React.useState(true);
  const [notifyWhatsApp, setNotifyWhatsApp] = React.useState(true);
  const [notifyDigest, setNotifyDigest] = React.useState(false);
  const [notifyContracts, setNotifyContracts] = React.useState(true);
  const [notifyLeaves, setNotifyLeaves] = React.useState(true);
  const [leaveApprovalMode, setLeaveApprovalMode] =
    React.useState<LeaveApprovalMode>(
      resolveApprovalMode(
        (initialProfile as { leave_approval_config?: unknown } | null)
          ?.leave_approval_config
      )
    );
  const [payrollImpactConfig, setPayrollImpactConfig] = React.useState<unknown>(
    (initialProfile as { payroll_impact_config?: unknown } | null)
      ?.payroll_impact_config ?? null
  );
  const [isSavingApprovalMode, setIsSavingApprovalMode] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined") {
      const savedLang = localStorage.getItem("kanpro_language");
      if (savedLang) setLanguage(savedLang);

      const emailPref = localStorage.getItem("kanpro_notify_email");
      if (emailPref !== null) setNotifyEmail(emailPref === "true");

      const waPref = localStorage.getItem("kanpro_notify_wa");
      if (waPref !== null) setNotifyWhatsApp(waPref === "true");

      const digestPref = localStorage.getItem("kanpro_notify_digest");
      if (digestPref !== null) setNotifyDigest(digestPref === "true");

      const contractsPref = localStorage.getItem("kanpro_notify_contracts");
      if (contractsPref !== null) setNotifyContracts(contractsPref === "true");

      const leavesPref = localStorage.getItem("kanpro_notify_leaves");
      if (leavesPref !== null) setNotifyLeaves(leavesPref === "true");
    }

    const supabase = createClient();
    async function loadAccountData() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          const scopeRes = await getActiveCompanyContextAction();
          const companyScopeId = scopeRes.success ? scopeRes.data.companyId : user.id;

          const [profileRes, companyRes, invoicesRes] = await Promise.all([
            supabase
              .from("profiles")
              .select("full_name, email, role, whatsapp_number")
              .eq("id", user.id)
              .maybeSingle(),
            supabase
              .from("company_profiles")
              .select("*")
              .eq("id", companyScopeId)
              .maybeSingle(),
            supabase
              .from("company_invoices")
              .select("*")
              .eq("company_id", companyScopeId)
              .order("created_at", { ascending: false }),
          ]);

          const comp = companyRes.data;
          setActiveCompanyId(comp?.id || companyScopeId);

          const resolvedPhone =
            comp?.contact_phone ||
            profileRes.data?.whatsapp_number ||
            user.phone ||
            "";

          setPhoneInput(resolvedPhone);
          setAccountInfo({
            id: user.id,
            name:
              comp?.company_name ||
              profileRes.data?.full_name ||
              (user.user_metadata?.full_name as string) ||
              "Mi Empresa",
            email:
              comp?.corporate_email ||
              user.email ||
              profileRes.data?.email ||
              "",
            phone: resolvedPhone || "No registrado",
          });

          if (comp) {
            const plan = (comp.subscription_plan as SubscriptionPlanId) || "basic";
            setSubscriptionPlan(plan);
            const planCfg = getSubscriptionPlan(plan);
            setFeaturedAllowance(
              comp.featured_vacancies_allowance ??
                planCfg.featuredVacanciesAllowance
            );
            setFeaturedUsed(comp.featured_vacancies_used ?? 0);
            setSubscriptionStatus(comp.subscription_status || "active");
            setSubscriptionPeriodEnd(comp.subscription_period_end || null);

            setFiscalProfile({
              rfc: comp.rfc || "",
              legalName: comp.legal_name || comp.company_name || "",
              entityType: comp.entity_type || "",
              fiscalAddress: comp.fiscal_address || "",
              corporateEmail: comp.corporate_email || user.email || "",
              verificationStatus: comp.verification_status || null,
            });
            setLeaveApprovalMode(
              resolveApprovalMode(
                (comp as { leave_approval_config?: unknown })
                  .leave_approval_config
              )
            );
            setPayrollImpactConfig(
              (comp as { payroll_impact_config?: unknown })
                .payroll_impact_config ?? null
            );
          }

          if (invoicesRes.data && invoicesRes.data.length > 0) {
            const formatted: BillingRecord[] = invoicesRes.data.map((inv: any) => ({
              id: inv.id,
              plan_name: inv.plan_name || "Plan K'anPro",
              type: "Factura Fiscal",
              amount: Number(inv.amount) || 0,
              currency: inv.currency || "MXN",
              status: inv.status || "PAGADO",
              payment_method: inv.payment_method || "Tarjeta / SPEI",
              created_at: inv.created_at || new Date().toISOString(),
            }));
            setInvoices(formatted);
          }
        }
      } catch (err) {
        console.error("Error loading account data:", err);
      }
    }
    loadAccountData();
  }, []);

  const handleSaveAccountPhone = async () => {
    const cleanPhone = phoneInput.trim();
    if (!activeCompanyId) {
      toast.error("No se pudo identificar la empresa activa.");
      return;
    }
    setIsSavingPhone(true);
    try {
      const res = await updateCompanyAccountPhone(activeCompanyId, cleanPhone);
      if (!res.success || !res.data) {
        toast.error("Error al guardar teléfono", { description: res.error });
        return;
      }
      setAccountInfo((prev) => ({ ...prev, phone: res.data!.phone }));
      setPhoneInput(res.data.phone);
      setIsEditingPhone(false);
      toast.success("Teléfono registrado", {
        description: "El teléfono de contacto se guardó correctamente.",
      });
    } catch {
      toast.error("Error inesperado al guardar el teléfono.");
    } finally {
      setIsSavingPhone(false);
    }
  };

  const handleCopyId = () => {
    if (!accountInfo.id) return;
    navigator.clipboard.writeText(accountInfo.id);
    setCopiedId(true);
    toast.success("ID de cuenta copiado al portapapeles");
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleSuspendAccount = () => {
    toast.warning("Cuenta Suspendida Temporalmente", {
      description:
        "Tus vacantes han sido pausadas. Puedes reactivarlas en cualquier momento.",
    });
  };

  const handleLanguageChange = (val: string | null) => {
    if (!val) return;
    setLanguage(val);
    if (typeof window !== "undefined") {
      localStorage.setItem("kanpro_language", val);
    }
    const langNames: Record<string, string> = {
      es: "Español (Latinoamérica)",
      en: "English (United States)",
      myn: "Maya (Sureste de México)",
    };
    toast.success("Idioma actualizado", {
      description: `La interfaz ahora está configurada en ${langNames[val] || val}.`,
    });
  };

  const handleThemeChange = (newTheme: "light" | "dark" | "system") => {
    setTheme(newTheme);
    const themeNames: Record<string, string> = {
      light: "Modo Claro",
      dark: "Modo Oscuro",
      system: "Tema del Sistema",
    };
    toast.success("Tema visual actualizado", {
      description: `Se ha establecido el ${themeNames[newTheme]}.`,
    });
  };

  const handleToggleNotification = (
    key: string,
    currentVal: boolean,
    setter: (val: boolean) => void,
    label: string
  ) => {
    const newVal = !currentVal;
    setter(newVal);
    if (typeof window !== "undefined") {
      localStorage.setItem(key, String(newVal));
    }
    toast.success(newVal ? `${label} activadas` : `${label} desactivadas`);
  };

  const handleLeaveApprovalModeChange = async (nextMode: LeaveApprovalMode) => {
    if (isSavingApprovalMode || nextMode === leaveApprovalMode) return;
    const prev = leaveApprovalMode;
    setLeaveApprovalMode(nextMode);
    setIsSavingApprovalMode(true);
    try {
      const res = await updateCompanyLeaveApprovalModeAction(nextMode);
      if (!res.success) {
        setLeaveApprovalMode(prev);
        toast.error("No se pudo guardar la regla de aprobación", {
          description: res.error,
        });
        return;
      }
      toast.success(
        nextMode === "two_step"
          ? "Aprobación en 2 pasos activada (Vo.Bo. Líder → RH)"
          : "Aprobación directa de RH activada (1 paso)"
      );
    } catch {
      setLeaveApprovalMode(prev);
      toast.error("Error inesperado al guardar la regla de aprobación.");
    } finally {
      setIsSavingApprovalMode(false);
    }
  };

  return (
    <>
      <AlertDialog open={open} onOpenChange={onOpenChange}>
        {trigger && <AlertDialogTrigger render={trigger} />}
        <AlertDialogContent className="!fixed !inset-0 !m-auto !w-[94vw] !max-w-[980px] !h-[660px] !max-h-[88vh] !translate-x-0 !translate-y-0 rounded-3xl sm:rounded-4xl p-0 bg-card text-card-foreground border border-border/40 overflow-hidden outline-none relative data-[size=default]:max-w-[980px] data-[size=default]:sm:max-w-[980px]">
          
          {/* Accessible header for screen readers */}
          <AlertDialogHeader className="sr-only">
            <AlertDialogTitle>Configuración de Empresa</AlertDialogTitle>
            <AlertDialogDescription>
              Panel modal de configuración del módulo corporativo
            </AlertDialogDescription>
          </AlertDialogHeader>

          {/* Modal Layout with Sidebar */}
          <SidebarProvider className="items-start h-full min-h-0 w-full flex-row">
            
            {/* Modal Sidebar */}
            <Sidebar
              collapsible="none"
              className="w-[240px] shrink-0 border-r border-border/30 bg-muted/20 dark:bg-muted/10 h-full flex flex-col justify-start"
            >
              <SidebarHeader className="p-4 pb-3 border-b border-border/20">
                <h2 className="text-base font-[800] text-foreground text-left tracking-tight">
                  Configuraciones
                </h2>
              </SidebarHeader>

              <SidebarContent className="p-2.5">
                <SidebarGroup className="p-0">
                  <SidebarGroupContent>
                    <SidebarMenu className="gap-1">
                      {SETTINGS_SECTIONS.map((section) => {
                        const Icon = section.icon;
                        const isActive = activeSection === section.id;
                        return (
                          <SidebarMenuItem key={section.id}>
                            <SidebarMenuButton
                              isActive={isActive}
                              onClick={() => setActiveSection(section.id)}
                              className={cn(
                                "h-9 rounded-xl px-2.5 gap-2 text-xs font-bold transition-all cursor-pointer",
                                isActive
                                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                              )}
                            >
                              <Icon className="size-4 shrink-0" />
                              <span className="truncate">{section.label}</span>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        );
                      })}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>
              </SidebarContent>

              <div className="mt-auto p-3.5 border-t border-border/20">
                <div className="flex items-center justify-between text-[11px] text-muted-foreground font-medium px-1">
                  <span>K&apos;anPro</span>
                  <Badge variant="outline" className="text-[10px] font-bold h-5 px-1.5 border-border/30">
                    v2.4
                  </Badge>
                </div>
              </div>
            </Sidebar>

            {/* Main Area: Centered Section Content with ScrollArea */}
            <main className="flex-1 h-full min-h-0 relative flex flex-col overflow-hidden bg-background">
              
              {/* Top-Right 'X' Close Button */}
              <AlertDialogCancel
                className="absolute top-4 right-4 sm:top-5 sm:right-5 rounded-full size-8 p-0 flex items-center justify-center hover:bg-muted text-muted-foreground hover:text-foreground border border-border/30 cursor-pointer transition-colors z-20"
                render={<Button variant="ghost" size="icon" />}
              >
                <X className="size-4" />
                <span className="sr-only">Cerrar</span>
              </AlertDialogCancel>

              {/* ScrollArea for Smooth and Custom Modal Scrolling */}
              <ScrollArea className="h-full w-full">
                <div className="p-6 sm:p-9">
                  
                  {/* 1. SECCIÓN: APARIENCIA E IDIOMA */}
                  {activeSection === "appearance" && (
                    <div className="w-full max-w-2xl mx-auto space-y-6 animate-in fade-in-50 duration-200">
                      
                      {/* Compact Content Header */}
                      <div className="space-y-0.5 pb-2.5 border-b border-border/25">
                        <h3 className="text-base font-[800] text-foreground tracking-tight">
                          Apariencia e Idioma
                        </h3>
                        <p className="text-xs text-muted-foreground font-medium">
                          Personaliza el tema visual y el idioma de la interfaz del portal.
                        </p>
                      </div>

                      {/* 1. TEMA DE LA APLICACIÓN */}
                      <div className="space-y-2.5">
                        <div className="space-y-0.5">
                          <Label className="text-xs font-bold text-foreground">
                            Tema de la Aplicación
                          </Label>
                          <p className="text-[11px] text-muted-foreground font-medium">
                            Elige la apariencia visual según tus preferencias o dispositivo.
                          </p>
                        </div>

                        {mounted ? (
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-0.5">
                            
                            {/* Tema Claro */}
                            <div
                              onClick={() => handleThemeChange("light")}
                              className={cn(
                                "p-3 rounded-xl border cursor-pointer transition-all select-none relative",
                                theme === "light"
                                  ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                                  : "border-border/40 hover:border-border hover:bg-muted/30"
                              )}
                            >
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <div className="size-7.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                                    <Sun className="size-4" />
                                  </div>
                                  {theme === "light" && (
                                    <div className="size-4 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                                      <Check className="size-2.5 stroke-[3]" />
                                    </div>
                                  )}
                                </div>
                                <div>
                                  <h4 className="text-xs font-bold text-foreground">
                                    Claro
                                  </h4>
                                  <p className="text-[10px] text-muted-foreground font-medium mt-0.5">
                                    Fondo blanco nítido.
                                  </p>
                                </div>
                              </div>
                            </div>

                            {/* Tema Oscuro */}
                            <div
                              onClick={() => handleThemeChange("dark")}
                              className={cn(
                                "p-3 rounded-xl border cursor-pointer transition-all select-none relative",
                                theme === "dark"
                                  ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                                  : "border-border/40 hover:border-border hover:bg-muted/30"
                              )}
                            >
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <div className="size-7.5 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                                    <Moon className="size-4" />
                                  </div>
                                  {theme === "dark" && (
                                    <div className="size-4 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                                      <Check className="size-2.5 stroke-[3]" />
                                    </div>
                                  )}
                                </div>
                                <div>
                                  <h4 className="text-xs font-bold text-foreground">
                                    Oscuro
                                  </h4>
                                  <p className="text-[10px] text-muted-foreground font-medium mt-0.5">
                                    Menor fatiga visual.
                                  </p>
                                </div>
                              </div>
                            </div>

                            {/* Tema Sistema */}
                            <div
                              onClick={() => handleThemeChange("system")}
                              className={cn(
                                "p-3 rounded-xl border cursor-pointer transition-all select-none relative",
                                theme === "system"
                                  ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                                  : "border-border/40 hover:border-border hover:bg-muted/30"
                              )}
                            >
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <div className="size-7.5 rounded-lg bg-slate-500/10 text-slate-600 dark:text-slate-400 flex items-center justify-center">
                                    <Laptop className="size-4" />
                                  </div>
                                  {theme === "system" && (
                                    <div className="size-4 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                                      <Check className="size-2.5 stroke-[3]" />
                                    </div>
                                  )}
                                </div>
                                <div>
                                  <h4 className="text-xs font-bold text-foreground">
                                    Sistema
                                  </h4>
                                  <p className="text-[10px] text-muted-foreground font-medium mt-0.5">
                                    Según tu equipo.
                                  </p>
                                </div>
                              </div>
                            </div>

                          </div>
                        ) : (
                          <div className="h-16 rounded-xl bg-muted/20 animate-pulse" />
                        )}
                      </div>

                      <div className="border-t border-border/25 pt-3.5">
                        {/* 2. IDIOMA DE LA APLICACIÓN */}
                        <div className="space-y-2.5">
                          <div className="space-y-0.5">
                            <Label className="text-xs font-bold text-foreground">
                              Idioma de la Interfaz
                            </Label>
                            <p className="text-[11px] text-muted-foreground font-medium">
                              Selecciona el idioma regional predeterminado del portal.
                            </p>
                          </div>

                          <div className="p-3.5 rounded-xl border border-border/40 bg-card space-y-2.5">
                            <div className="flex items-center gap-2.5">
                              <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                                <Globe className="size-4" />
                              </div>
                              <div className="space-y-0.5">
                                <h4 className="text-xs font-bold text-foreground">
                                  Idioma Regional
                                </h4>
                                <p className="text-[10px] text-muted-foreground font-medium">
                                  Menús, avisos y formularios corporativos
                                </p>
                              </div>
                            </div>

                            <Select value={language} onValueChange={handleLanguageChange}>
                              <SelectTrigger className="w-full h-9.5 px-3 text-xs font-semibold rounded-lg bg-background border border-border/40 flex items-center justify-between">
                                <span className="flex items-center gap-2 truncate">
                                  {language === "es" && "🇲🇽 Español (Latinoamérica)"}
                                  {language === "en" && "🇺🇸 English (United States)"}
                                  {language === "myn" && "🏛️ Maya (Sureste MX)"}
                                </span>
                              </SelectTrigger>
                              <SelectContent className="rounded-xl border border-border/30">
                                <SelectItem value="es" className="text-xs font-medium cursor-pointer py-2.5">
                                  🇲🇽 Español (Latinoamérica)
                                </SelectItem>
                                <SelectItem value="en" className="text-xs font-medium cursor-pointer py-2.5">
                                  🇺🇸 English (United States)
                                </SelectItem>
                                <SelectItem value="myn" className="text-xs font-medium cursor-pointer py-2.5">
                                  🏛️ Maya (Sureste MX)
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>

                    </div>
                  )}

                  {/* 2. SECCIÓN: CUENTA Y SEGURIDAD */}
                  {activeSection === "account" && (
                    <div className="w-full max-w-2xl mx-auto space-y-6 animate-in fade-in-50 duration-200">
                      
                      {/* Compact Content Header */}
                      <div className="space-y-0.5 pb-2.5 border-b border-border/25">
                        <h3 className="text-base font-[800] text-foreground tracking-tight">
                          Cuenta y Seguridad
                        </h3>
                        <p className="text-xs text-muted-foreground font-medium">
                          Información general de tu cuenta corporativa y controles de acceso.
                        </p>
                      </div>

                      {/* 1. INFORMACIÓN DE LA CUENTA */}
                      <div className="space-y-2.5">
                        <div className="space-y-0.5">
                          <Label className="text-xs font-bold text-foreground">
                            Información General
                          </Label>
                          <p className="text-[11px] text-muted-foreground font-medium">
                            Identificadores principales asociados a tu acceso corporativo.
                          </p>
                        </div>

                        <div className="p-3.5 rounded-xl border border-border/40 bg-card space-y-3">
                          
                          {/* Nombre / Empresa */}
                          <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-border/20">
                            <div className="flex items-center gap-2.5">
                              <div className="size-7.5 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                                <Building className="size-4" />
                              </div>
                              <div>
                                <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider block">
                                  Empresa / Usuario
                                </span>
                                <span className="text-xs font-bold text-foreground block">
                                  {accountInfo.name}
                                </span>
                              </div>
                            </div>
                            <Badge variant="outline" className="text-[10px] font-bold h-5 px-2 bg-primary/5 text-primary border-primary/20">
                              Empresa
                            </Badge>
                          </div>

                          {/* ID de Cuenta */}
                          <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-border/20">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="size-7.5 rounded-lg bg-muted/60 text-muted-foreground flex items-center justify-center shrink-0">
                                <Key className="size-4" />
                              </div>
                              <div className="min-w-0">
                                <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider block">
                                  ID de Cuenta
                                </span>
                                <span className="text-xs font-mono font-medium text-foreground truncate block">
                                  {accountInfo.id ? `${accountInfo.id.slice(0, 18)}...` : "Cargando..."}
                                </span>
                              </div>
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={handleCopyId}
                              className="h-7 text-[11px] px-2.5 font-semibold rounded-lg gap-1 border-border/40 hover:bg-muted/50 cursor-pointer shrink-0"
                            >
                              {copiedId ? (
                                <>
                                  <Check className="size-3 text-emerald-500" />
                                  <span>Copiado</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="size-3 text-muted-foreground" />
                                  <span>Copiar ID</span>
                                </>
                              )}
                            </Button>
                          </div>

                          {/* Email */}
                          <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-border/20">
                            <div className="flex items-center gap-2.5">
                              <div className="size-7.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                                <Mail className="size-4" />
                              </div>
                              <div>
                                <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider block">
                                  Correo Electrónico
                                </span>
                                <span className="text-xs font-bold text-foreground block">
                                  {accountInfo.email}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Teléfono */}
                          <div className="space-y-2.5">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2.5">
                                <div className="size-7.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                                  <Phone className="size-4" />
                                </div>
                                <div>
                                  <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider block">
                                    Teléfono Registrado
                                  </span>
                                  <span className="text-xs font-bold text-foreground block">
                                    {accountInfo.phone}
                                  </span>
                                </div>
                              </div>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setPhoneInput(
                                    accountInfo.phone === "No registrado" ? "" : accountInfo.phone
                                  );
                                  setIsEditingPhone((prev) => !prev);
                                }}
                                className="h-7 text-[11px] px-2.5 font-semibold rounded-lg border-border/40 hover:bg-muted/50 cursor-pointer shrink-0"
                              >
                                {isEditingPhone
                                  ? "Cancelar"
                                  : accountInfo.phone === "No registrado"
                                    ? "Registrar"
                                    : "Editar"}
                              </Button>
                            </div>

                            {isEditingPhone && (
                              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-2 border-t border-border/20">
                                <Input
                                  type="tel"
                                  aria-label="Teléfono de contacto"
                                  placeholder="Ej. 9991234567"
                                  value={phoneInput}
                                  onChange={(e) => setPhoneInput(e.target.value)}
                                  disabled={isSavingPhone}
                                  className="h-8 text-xs rounded-lg bg-background flex-1"
                                />
                                <Button
                                  type="button"
                                  size="sm"
                                  onClick={handleSaveAccountPhone}
                                  disabled={isSavingPhone}
                                  className="h-8 text-xs font-semibold rounded-lg px-3 cursor-pointer shrink-0"
                                >
                                  {isSavingPhone ? "Guardando..." : "Guardar"}
                                </Button>
                              </div>
                            )}
                          </div>

                        </div>
                      </div>

                      {/* 2. SEGURIDAD Y ACCESO */}
                      <div className="border-t border-border/25 pt-3.5 space-y-2.5">
                        <div className="space-y-0.5">
                          <Label className="text-xs font-bold text-foreground">
                            Seguridad & Credenciales
                          </Label>
                          <p className="text-[11px] text-muted-foreground font-medium">
                            Protección de acceso y autenticación corporativa.
                          </p>
                        </div>

                        <div className="space-y-2.5 pt-0.5">
                          
                          {/* Contraseña */}
                          <div className="p-3.5 rounded-xl border border-border/40 bg-card space-y-3">
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex items-start gap-2.5">
                                <div className="size-7.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                                  <Lock className="size-4" />
                                </div>
                                <div className="space-y-0.5">
                                  <span className="text-xs font-bold text-foreground block">
                                    Contraseña de Acceso
                                  </span>
                                  <span className="text-[10px] text-muted-foreground font-medium block leading-tight">
                                    Protegida con cifrado seguro. Se recomienda actualizar periódicamente.
                                  </span>
                                </div>
                              </div>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setIsChangingPassword(!isChangingPassword)}
                                className="h-8 text-xs font-semibold rounded-lg px-3 border-border/40 hover:bg-muted/50 cursor-pointer shrink-0"
                              >
                                {isChangingPassword ? "Ocultar" : "Cambiar Contraseña"}
                              </Button>
                            </div>

                            {isChangingPassword && (
                              <div className="pt-2 border-t border-border/20 animate-in slide-in-from-top-2 duration-200">
                                <ChangePasswordForm />
                              </div>
                            )}
                          </div>

                          {/* 2FA */}
                          <div className="p-3.5 rounded-xl border border-border/40 bg-card space-y-3">
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex items-start gap-2.5">
                                <div className="size-7.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                                  <ShieldCheck className="size-4" />
                                </div>
                                <div className="space-y-0.5">
                                  <span className="text-xs font-bold text-foreground block">
                                    Autenticación en 2 Pasos (2FA)
                                  </span>
                                  <span className="text-[10px] text-muted-foreground font-medium block leading-tight">
                                    Exige un código temporal al iniciar sesión para mayor seguridad.
                                  </span>
                                </div>
                              </div>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setIsSettingUp2FA(!isSettingUp2FA)}
                                className="h-8 text-xs font-semibold rounded-lg px-3 border-border/40 hover:bg-muted/50 cursor-pointer shrink-0"
                              >
                                {isSettingUp2FA ? "Ocultar" : "Configurar 2FA"}
                              </Button>
                            </div>

                            {isSettingUp2FA && (
                              <div className="pt-2 border-t border-border/20 animate-in slide-in-from-top-2 duration-200">
                                <TwoFactorSetup />
                              </div>
                            )}
                          </div>

                        </div>
                      </div>

                      {/* 3. ZONA DE PELIGRO / ESTADO DE CUENTA */}
                      <div className="border-t border-border/25 pt-3.5 space-y-2.5">
                        <div className="space-y-0.5">
                          <Label className="text-xs font-bold text-destructive">
                            Estado de Cuenta & Zona de Peligro
                          </Label>
                          <p className="text-[11px] text-muted-foreground font-medium">
                            Opciones para pausar o dar de baja el registro corporativo.
                          </p>
                        </div>

                        <div className="p-3.5 rounded-xl border border-destructive/25 bg-destructive/5 space-y-3">
                          
                          {/* Suspender cuenta */}
                          <div className="flex items-center justify-between gap-3 pb-2.5 border-b border-destructive/15">
                            <div className="space-y-0.5">
                              <span className="text-xs font-bold text-foreground block">
                                Suspender Cuenta Temporalmente
                              </span>
                              <span className="text-[10px] text-muted-foreground font-medium block leading-tight">
                                Pausa tus ofertas y desactiva el acceso sin eliminar tu historial ni postulantes.
                              </span>
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={handleSuspendAccount}
                              className="h-8 text-xs font-semibold rounded-lg px-3 border-destructive/30 hover:bg-destructive/10 text-foreground cursor-pointer shrink-0"
                            >
                              <PauseCircle className="size-3.5 mr-1 text-muted-foreground" />
                              Suspender
                            </Button>
                          </div>

                          {/* Eliminar cuenta */}
                          <div className="flex items-center justify-between gap-3">
                            <div className="space-y-0.5">
                              <span className="text-xs font-bold text-destructive block">
                                Eliminar Cuenta Definitivamente
                              </span>
                              <span className="text-[10px] text-muted-foreground font-medium block leading-tight">
                                Baja permanente de acuerdo a la legislación de datos personales (LFPDPPP).
                              </span>
                            </div>
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              onClick={() => setIsDeleteModalOpen(true)}
                              className="h-8 text-xs font-semibold rounded-lg px-3 cursor-pointer shrink-0"
                            >
                              <Trash2 className="size-3.5 mr-1" />
                              Eliminar cuenta
                            </Button>
                          </div>

                        </div>
                      </div>

                    </div>
                  )}

                  {/* 3. SECCIÓN: SUSCRIPCIÓN Y FACTURACIÓN */}
                  {activeSection === "subscription" && (
                    <div className="w-full max-w-2xl mx-auto space-y-6 animate-in fade-in-50 duration-200">
                      
                      {/* Compact Content Header */}
                      <div className="space-y-0.5 pb-2.5 border-b border-border/25">
                        <h3 className="text-base font-[800] text-foreground tracking-tight">
                          Suscripción y Facturación
                        </h3>
                        <p className="text-xs text-muted-foreground font-medium">
                          Administra tu acceso anticipado corporativo, cupos de vacantes destacadas y CFDI.
                        </p>
                      </div>

                      {/* Periodo de pruebas / Acceso anticipado Banner */}
                      <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3.5 shadow-2xs">
                        <div className="size-9 rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0 mt-0.5">
                          <Sparkles className="size-4.5 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-xs sm:text-sm font-bold text-amber-950 dark:text-amber-100">
                              Periodo de Pruebas • Acceso Anticipado (Plan Básico)
                            </h4>
                            <Badge className="bg-amber-500/20 text-amber-700 dark:text-amber-300 border-none text-[10px] font-bold px-2 py-0.5 rounded-full">
                              100% Gratuito
                            </Badge>
                          </div>
                          <p className="text-xs text-amber-900/80 dark:text-amber-200/80 leading-relaxed font-medium">
                            Tu empresa participa en el acceso anticipado de K&apos;anPro con el Plan Básico bonificado sin costo durante esta etapa. Actualmente están activos reclutamiento, Radar de Talento, gestión de empleados, asistencia y checador QR; nómina, contratos LFT, evaluaciones y reportes avanzados se habilitarán progresivamente según tu fase de despliegue.
                          </p>
                        </div>
                      </div>

                      {/* 1. PLAN ACTUAL & VACANTES DESTACADAS */}
                      <div className="space-y-2.5">
                        <div className="space-y-0.5">
                          <Label className="text-xs font-bold text-foreground">
                            Plan Activo & Cupos
                          </Label>
                          <p className="text-[11px] text-muted-foreground font-medium">
                            Nivel de servicio y asignación de vacantes destacadas para tu empresa.
                          </p>
                        </div>

                        <div className="p-3.5 rounded-xl border border-border/40 bg-card space-y-3">
                          <div className="flex items-center justify-between gap-3 pb-2.5 border-b border-border/20">
                            <div className="flex items-center gap-2.5">
                              <div className="size-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                                <Sparkles className="size-4" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h4 className="text-xs font-bold text-foreground">
                                    Plan Básico • Acceso Anticipado
                                  </h4>
                                  <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-300 border-none text-[10px] font-bold h-4.5 px-2 rounded-full">
                                    Activo • 100% Bonificado
                                  </Badge>
                                </div>
                                <p className="text-[10px] text-muted-foreground font-medium mt-0.5">
                                  Sin costo mensual durante el acceso anticipado con activación gradual de módulos.
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Vacantes Destacadas Allowance */}
                          <div className="flex items-center justify-between text-xs pt-0.5">
                            <span className="text-muted-foreground font-medium">
                              Vacantes Destacadas Utilizadas:
                            </span>
                            <span className="font-bold text-foreground font-mono">
                              {featuredUsed} / {featuredAllowance} cupos
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* 2. DATOS DE FACTURACIÓN CFDI 4.0 */}
                      <div className="border-t border-border/25 pt-3.5 space-y-2.5">
                        <div className="space-y-0.5">
                          <Label className="text-xs font-bold text-foreground">
                            Comprobantes Fiscales CFDI 4.0
                          </Label>
                          <p className="text-[11px] text-muted-foreground font-medium">
                            Emisión automática de facturas timbradas ante el SAT.
                          </p>
                        </div>

                        <div className="p-3.5 rounded-xl border border-border/40 bg-card space-y-2.5">
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2.5">
                              <div className="size-7.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                                <Receipt className="size-4" />
                              </div>
                              <div className="space-y-0.5">
                                <span className="text-xs font-bold text-foreground block">
                                  {fiscalProfile.legalName || "Razón Social Registrada"}
                                </span>
                                <span className="text-[10px] text-muted-foreground font-medium block">
                                  {fiscalProfile.rfc
                                    ? `RFC: ${fiscalProfile.rfc} • ${
                                        fiscalProfile.entityType === "persona_moral" || fiscalProfile.rfc.length === 12
                                          ? "601 General de Ley Personas Morales"
                                          : "612 Personas Físicas con Actividades Empresariales"
                                      } • G03 Gastos en general`
                                    : "RFC no registrado en el perfil corporativo"}
                                </span>
                              </div>
                            </div>
                            {fiscalProfile.verificationStatus === "approved" ? (
                              <Badge
                                variant="outline"
                                className="text-[10px] font-bold h-5 px-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                              >
                                SAT Verificado
                              </Badge>
                            ) : fiscalProfile.verificationStatus === "pending" ? (
                              <Badge
                                variant="outline"
                                className="text-[10px] font-bold h-5 px-2 bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                              >
                                En Validación SAT
                              </Badge>
                            ) : fiscalProfile.verificationStatus === "rejected" ? (
                              <Badge
                                variant="outline"
                                className="text-[10px] font-bold h-5 px-2 bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
                              >
                                Doc. Rechazada
                              </Badge>
                            ) : (
                              <Badge
                                variant="outline"
                                className="text-[10px] font-bold h-5 px-2 border-border/30 text-muted-foreground"
                              >
                                Sin Verificar
                              </Badge>
                            )}
                          </div>
                          <p className="text-[10px] text-muted-foreground leading-relaxed">
                            {fiscalProfile.corporateEmail
                              ? `Tus facturas en formato XML y PDF se generan automáticamente tras cada ciclo y se envían a ${fiscalProfile.corporateEmail}.`
                              : "Configura tu correo corporativo y RFC en el expediente fiscal para recibir automáticamente tus comprobantes timbrados."}
                          </p>
                        </div>
                      </div>

                      {/* 3. HISTORIAL DE FACTURACIÓN */}
                      <div className="border-t border-border/25 pt-3.5 space-y-2.5">
                        <div className="space-y-0.5">
                          <Label className="text-xs font-bold text-foreground">
                            Historial de Facturas & Pagos
                          </Label>
                          <p className="text-[11px] text-muted-foreground font-medium">
                            Comprobantes fiscales y recibos de transacciones previas.
                          </p>
                        </div>

                        <BillingSubscriptionsTable data={invoices} />
                      </div>

                    </div>
                  )}

                  {/* 4. SECCIÓN: NOTIFICACIONES */}
                  {activeSection === "notifications" && (
                    <div className="w-full max-w-2xl mx-auto space-y-6 animate-in fade-in-50 duration-200">
                      
                      {/* Compact Content Header */}
                      <div className="space-y-0.5 pb-2.5 border-b border-border/25">
                        <h3 className="text-base font-[800] text-foreground tracking-tight">
                          Notificaciones y Alertas
                        </h3>
                        <p className="text-xs text-muted-foreground font-medium">
                          Configura los canales y la frecuencia de los avisos automáticos.
                        </p>
                      </div>

                      {/* Grupo 1: Atracción de Talento */}
                      <div className="space-y-2.5">
                        <div className="space-y-0.5">
                          <Label className="text-xs font-bold text-foreground">
                            Atracción de Talento & Postulaciones
                          </Label>
                          <p className="text-[11px] text-muted-foreground font-medium">
                            Alertas inmediatas cuando los candidatos interactúen con tus ofertas.
                          </p>
                        </div>

                        <div className="space-y-2 pt-0.5">
                          {/* Correo Electrónico */}
                          <div className="flex items-center justify-between p-3 rounded-xl border border-border/40 bg-card gap-3">
                            <div className="flex items-start gap-2.5">
                              <div className="size-7.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                                <Mail className="size-4" />
                              </div>
                              <div className="space-y-0.5">
                                <span className="text-xs font-bold text-foreground block">
                                  Alertas por Correo Electrónico
                                </span>
                                <span className="text-[10px] text-muted-foreground font-medium block leading-tight">
                                  Aviso inmediato por cada candidato que aplique a tus vacantes.
                                </span>
                              </div>
                            </div>
                            <Switch
                              checked={notifyEmail}
                              onCheckedChange={() =>
                                handleToggleNotification(
                                  "kanpro_notify_email",
                                  notifyEmail,
                                  setNotifyEmail,
                                  "Alertas por correo"
                                )
                              }
                            />
                          </div>

                          {/* WhatsApp */}
                          <div className="flex items-center justify-between p-3 rounded-xl border border-border/40 bg-card gap-3">
                            <div className="flex items-start gap-2.5">
                              <div className="size-7.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                                <MessageCircle className="size-4" />
                              </div>
                              <div className="space-y-0.5">
                                <span className="text-xs font-bold text-foreground block">
                                  Avisos Inmediatos por WhatsApp
                                </span>
                                <span className="text-[10px] text-muted-foreground font-medium block leading-tight">
                                  Mensaje instantáneo al número corporativo registrado.
                                </span>
                              </div>
                            </div>
                            <Switch
                              checked={notifyWhatsApp}
                              onCheckedChange={() =>
                                handleToggleNotification(
                                  "kanpro_notify_wa",
                                  notifyWhatsApp,
                                  setNotifyWhatsApp,
                                  "Avisos por WhatsApp"
                                )
                              }
                            />
                          </div>

                          {/* Resumen Semanal */}
                          <div className="flex items-center justify-between p-3 rounded-xl border border-border/40 bg-card gap-3">
                            <div className="flex items-start gap-2.5">
                              <div className="size-7.5 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 mt-0.5">
                                <Sparkles className="size-4" />
                              </div>
                              <div className="space-y-0.5">
                                <span className="text-xs font-bold text-foreground block">
                                  Resumen Semanal de Rendimiento
                                </span>
                                <span className="text-[10px] text-muted-foreground font-medium block leading-tight">
                                  Compendio con estadísticas y métricas cada lunes.
                                </span>
                              </div>
                            </div>
                            <Switch
                              checked={notifyDigest}
                              onCheckedChange={() =>
                                handleToggleNotification(
                                  "kanpro_notify_digest",
                                  notifyDigest,
                                  setNotifyDigest,
                                  "Resumen semanal"
                                )
                              }
                            />
                          </div>
                        </div>
                      </div>

                      {/* Grupo 2: Operaciones y Personal */}
                      <div className="border-t border-border/25 pt-3.5 space-y-2.5">
                        <div className="space-y-0.5">
                          <Label className="text-xs font-bold text-foreground">
                            Gestión de Personal & RRHH
                          </Label>
                          <p className="text-[11px] text-muted-foreground font-medium">
                            Recordatorios de vencimientos e incidencias laborales.
                          </p>
                        </div>

                        <div className="space-y-2 pt-0.5">
                          {/* Vencimiento de Contratos */}
                          <div className="flex items-center justify-between p-3 rounded-xl border border-border/40 bg-card gap-3">
                            <div className="flex items-start gap-2.5">
                              <div className="size-7.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                                <FileCheck2 className="size-4" />
                              </div>
                              <div className="space-y-0.5">
                                <span className="text-xs font-bold text-foreground block">
                                  Vencimiento Próximo de Contratos
                                </span>
                                <span className="text-[10px] text-muted-foreground font-medium block leading-tight">
                                  Avisos preventivos 30 días antes del término de un contrato.
                                </span>
                              </div>
                            </div>
                            <Switch
                              checked={notifyContracts}
                              onCheckedChange={() =>
                                handleToggleNotification(
                                  "kanpro_notify_contracts",
                                  notifyContracts,
                                  setNotifyContracts,
                                  "Alertas de contratos"
                                )
                              }
                            />
                          </div>

                          {/* Vacaciones y Permisos */}
                          <div className="flex items-center justify-between p-3 rounded-xl border border-border/40 bg-card gap-3">
                            <div className="flex items-start gap-2.5">
                              <div className="size-7.5 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0 mt-0.5">
                                <CalendarDays className="size-4" />
                              </div>
                              <div className="space-y-0.5">
                                <span className="text-xs font-bold text-foreground block">
                                  Permisos y Solicitudes de Vacaciones
                                </span>
                                <span className="text-[10px] text-muted-foreground font-medium block leading-tight">
                                  Aviso cuando un empleado someta una solicitud para revisión.
                                </span>
                              </div>
                            </div>
                            <Switch
                              checked={notifyLeaves}
                              onCheckedChange={() =>
                                handleToggleNotification(
                                  "kanpro_notify_leaves",
                                  notifyLeaves,
                                  setNotifyLeaves,
                                  "Alertas de vacaciones y permisos"
                                )
                              }
                            />
                          </div>
                        </div>
                      </div>

                    </div>
                  )}

                  {/* 5. SECCIÓN: REGLAS DE MI EMPRESA */}
                  {activeSection === "company_rules" && (
                    <div className="w-full max-w-2xl mx-auto space-y-6 animate-in fade-in-50 duration-200">
                      <div className="space-y-0.5 pb-2.5 border-b border-border/25">
                        <h3 className="text-base font-[800] text-foreground tracking-tight">
                          Reglas de mi empresa
                        </h3>
                        <p className="text-xs text-muted-foreground font-medium">
                          Configura puntualidad, faltas, séptimo día, incapacidades, vacaciones, bonos y aprobación de permisos desde un solo lugar.
                        </p>
                      </div>

                      <CompanyWorkRulesPanel
                        companyId={activeCompanyId || undefined}
                        initialPayrollImpactConfig={payrollImpactConfig}
                        initialLeaveApprovalMode={leaveApprovalMode}
                        onSaved={(savedConfig, savedApprovalMode) => {
                          setPayrollImpactConfig(savedConfig);
                          setLeaveApprovalMode(savedApprovalMode);
                        }}
                      />
                    </div>
                  )}

                </div>
              </ScrollArea>
            </main>

          </SidebarProvider>
        </AlertDialogContent>
      </AlertDialog>

      <DeleteAccountModal
        open={isDeleteModalOpen}
        onOpenChange={setIsDeleteModalOpen}
      />
    </>
  );
}
