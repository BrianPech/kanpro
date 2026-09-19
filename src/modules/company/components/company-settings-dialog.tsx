"use client";

import * as React from "react";
import { useTheme } from "next-themes";
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
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
  updateSubscriptionPlan,
  getCompanyInvoices,
} from "@/modules/company/actions/settings";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export interface CompanySettingsModalProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactElement;
  children?: React.ReactNode;
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
    description: "Planes, vacantes destacadas y CFDI",
  },
  {
    id: "notifications",
    label: "Notificaciones",
    icon: Bell,
    description: "Canales de aviso y alertas automáticas",
  },
];

export function CompanySettingsModal({
  open,
  onOpenChange,
  trigger,
}: CompanySettingsModalProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  const [activeSection, setActiveSection] = React.useState("appearance");
  const [language, setLanguage] = React.useState("es");

  // Account Information States
  const [accountInfo, setAccountInfo] = React.useState<{
    id: string;
    name: string;
    email: string;
    phone: string;
  }>({
    id: "",
    name: "Empresa K'anPro",
    email: "empresa@kanpro.com",
    phone: "No registrado",
  });
  const [copiedId, setCopiedId] = React.useState(false);
  const [isChangingPassword, setIsChangingPassword] = React.useState(false);
  const [isSettingUp2FA, setIsSettingUp2FA] = React.useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false);

  // Subscription & Billing States
  const [subscriptionPlan, setSubscriptionPlan] = React.useState<
    "basic" | "pro" | "enterprise"
  >("basic");
  const [featuredAllowance, setFeaturedAllowance] = React.useState(0);
  const [featuredUsed, setFeaturedUsed] = React.useState(0);
  const [invoices, setInvoices] = React.useState<BillingRecord[]>([]);
  const [isChangingPlan, setIsChangingPlan] = React.useState(false);
  const [isUpdatingPlan, setIsUpdatingPlan] = React.useState(false);

  // Notification Preferences States
  const [notifyEmail, setNotifyEmail] = React.useState(true);
  const [notifyWhatsApp, setNotifyWhatsApp] = React.useState(true);
  const [notifyDigest, setNotifyDigest] = React.useState(false);
  const [notifyContracts, setNotifyContracts] = React.useState(true);
  const [notifyLeaves, setNotifyLeaves] = React.useState(true);

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
          const [profileRes, companyRes, invoicesRes] = await Promise.all([
            supabase
              .from("profiles")
              .select("full_name, email, role")
              .eq("id", user.id)
              .maybeSingle(),
            supabase
              .from("company_profiles")
              .select("*")
              .eq("id", user.id)
              .maybeSingle(),
            supabase
              .from("company_invoices")
              .select("*")
              .eq("company_id", user.id)
              .order("created_at", { ascending: false }),
          ]);

          const comp = companyRes.data;

          setAccountInfo({
            id: user.id,
            name:
              comp?.company_name ||
              profileRes.data?.full_name ||
              (user.user_metadata?.full_name as string) ||
              "Mi Empresa",
            email: user.email || profileRes.data?.email || "empresa@kanpro.com",
            phone:
              comp?.contact_phone ||
              user.phone ||
              "No registrado",
          });

          if (comp) {
            const plan = (comp.subscription_plan as "basic" | "pro" | "enterprise") || "basic";
            setSubscriptionPlan(plan);
            setFeaturedAllowance(comp.featured_vacancies_allowance ?? 0);
            setFeaturedUsed(comp.featured_vacancies_used ?? 0);
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

  const handleSelectPlan = async (newPlan: "basic" | "pro" | "enterprise") => {
    if (!accountInfo.id) return;
    setIsUpdatingPlan(true);
    try {
      await updateSubscriptionPlan(accountInfo.id, newPlan);
      setSubscriptionPlan(newPlan);
      if (newPlan === "pro") setFeaturedAllowance(3);
      else if (newPlan === "enterprise") setFeaturedAllowance(10);
      else setFeaturedAllowance(0);

      setIsChangingPlan(false);
      const planTitles = {
        basic: "Plan Básico / Fundador",
        pro: "Plan PRO Mensual",
        enterprise: "Plan Corporativo",
      };
      toast.success("Plan actualizado con éxito", {
        description: `Tu cuenta ahora disfruta de los beneficios del ${planTitles[newPlan]}.`,
      });

      // Refresh invoices
      const freshInvoices = await getCompanyInvoices(accountInfo.id);
      if (freshInvoices) {
        setInvoices(
          freshInvoices.map((inv: any) => ({
            id: inv.id,
            plan_name: inv.plan_name || "Plan K'anPro",
            type: "Factura Fiscal",
            amount: Number(inv.amount) || 0,
            currency: inv.currency || "MXN",
            status: inv.status || "PAGADO",
            payment_method: inv.payment_method || "Tarjeta / SPEI",
            created_at: inv.created_at || new Date().toISOString(),
          }))
        );
      }
    } catch (err: any) {
      toast.error("Error al actualizar plan", {
        description: err?.message || "Intenta nuevamente.",
      });
    } finally {
      setIsUpdatingPlan(false);
    }
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
                  <Badge variant="outline" className="text-[10px] font-bold h-5 px-1.5 rounded-md border-border/30">
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
                            <Badge variant="outline" className="text-[10px] font-bold h-5 px-2 rounded-md bg-primary/5 text-primary border-primary/20">
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
                          Administra tu plan corporativo, cupos de vacantes destacadas y CFDI.
                        </p>
                      </div>

                      {/* 1. PLAN ACTUAL & VACANTES DESTACADAS */}
                      <div className="space-y-2.5">
                        <div className="space-y-0.5">
                          <Label className="text-xs font-bold text-foreground">
                            Plan Activo & Cupos
                          </Label>
                          <p className="text-[11px] text-muted-foreground font-medium">
                            Nivel de suscripción actual y asignación de vacantes premium.
                          </p>
                        </div>

                        <div className="p-3.5 rounded-xl border border-border/40 bg-card space-y-3">
                          <div className="flex items-center justify-between gap-3 pb-2.5 border-b border-border/20">
                            <div className="flex items-center gap-2.5">
                              <div className="size-8 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                                <Sparkles className="size-4" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h4 className="text-xs font-bold text-foreground">
                                    {subscriptionPlan === "enterprise"
                                      ? "Plan Corporativo"
                                      : subscriptionPlan === "pro"
                                      ? "Plan PRO Mensual"
                                      : "Plan Fundador / Básico"}
                                  </h4>
                                  <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-none text-[10px] font-bold h-4.5 px-1.5 rounded-full">
                                    Activo
                                  </Badge>
                                </div>
                                <p className="text-[10px] text-muted-foreground font-medium mt-0.5">
                                  {subscriptionPlan === "enterprise"
                                    ? "$3,999 MXN / mes • Facturación automática"
                                    : subscriptionPlan === "pro"
                                    ? "$1,499 MXN / mes • Facturación automática"
                                    : "Gratuito durante etapa de lanzamiento"}
                                </p>
                              </div>
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setIsChangingPlan(!isChangingPlan)}
                              className="h-8 text-xs font-semibold rounded-lg px-3 border-border/40 hover:bg-muted/50 cursor-pointer shrink-0"
                            >
                              {isChangingPlan ? "Cerrar planes" : "Cambiar Plan"}
                            </Button>
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

                          {/* Selector de Planes Desplegable */}
                          {isChangingPlan && (
                            <div className="pt-3 border-t border-border/20 space-y-2.5 animate-in slide-in-from-top-2 duration-200">
                              <p className="text-[11px] font-bold text-foreground uppercase tracking-wider">
                                Selecciona el nivel de servicio:
                              </p>
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                
                                {/* Básico */}
                                <div
                                  onClick={() => !isUpdatingPlan && handleSelectPlan("basic")}
                                  className={cn(
                                    "p-3 rounded-xl border cursor-pointer transition-all space-y-1.5",
                                    subscriptionPlan === "basic"
                                      ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                                      : "border-border/40 hover:border-border hover:bg-muted/30"
                                  )}
                                >
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-foreground">Básico</span>
                                    {subscriptionPlan === "basic" && <Check className="size-3 text-primary" />}
                                  </div>
                                  <p className="text-[10px] text-muted-foreground font-semibold">Gratis</p>
                                  <p className="text-[9px] text-muted-foreground leading-tight">Sin vacantes destacadas.</p>
                                </div>

                                {/* PRO */}
                                <div
                                  onClick={() => !isUpdatingPlan && handleSelectPlan("pro")}
                                  className={cn(
                                    "p-3 rounded-xl border cursor-pointer transition-all space-y-1.5",
                                    subscriptionPlan === "pro"
                                      ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                                      : "border-border/40 hover:border-border hover:bg-muted/30"
                                  )}
                                >
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-foreground">PRO</span>
                                    {subscriptionPlan === "pro" && <Check className="size-3 text-primary" />}
                                  </div>
                                  <p className="text-[10px] text-primary font-bold">$1,499 MXN/m</p>
                                  <p className="text-[9px] text-muted-foreground leading-tight">3 vacantes destacadas.</p>
                                </div>

                                {/* Enterprise */}
                                <div
                                  onClick={() => !isUpdatingPlan && handleSelectPlan("enterprise")}
                                  className={cn(
                                    "p-3 rounded-xl border cursor-pointer transition-all space-y-1.5",
                                    subscriptionPlan === "enterprise"
                                      ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                                      : "border-border/40 hover:border-border hover:bg-muted/30"
                                  )}
                                >
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-foreground">Corporativo</span>
                                    {subscriptionPlan === "enterprise" && <Check className="size-3 text-primary" />}
                                  </div>
                                  <p className="text-[10px] text-purple-600 dark:text-purple-400 font-bold">$3,999 MXN/m</p>
                                  <p className="text-[9px] text-muted-foreground leading-tight">10 vacantes destacadas.</p>
                                </div>

                              </div>
                              {isUpdatingPlan && (
                                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground py-1">
                                  <Loader2 className="size-3.5 animate-spin" />
                                  <span>Actualizando plan...</span>
                                </div>
                              )}
                            </div>
                          )}
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
                                  Régimen Fiscal & Uso de CFDI
                                </span>
                                <span className="text-[10px] text-muted-foreground font-medium block">
                                  601 General de Ley • G03 Gastos en general
                                </span>
                              </div>
                            </div>
                            <Badge variant="outline" className="text-[10px] font-bold h-5 px-2 rounded-md border-border/30">
                              SAT Verificado
                            </Badge>
                          </div>
                          <p className="text-[10px] text-muted-foreground leading-relaxed">
                            Tus facturas en formato XML y PDF se generan automáticamente tras cada ciclo y se envían a tu correo corporativo.
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
                                  Aviso cuando un colaborador someta una solicitud para revisión.
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
