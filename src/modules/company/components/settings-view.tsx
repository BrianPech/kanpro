"use client"

import * as React from "react"
import { useTheme } from "next-themes"
import { toast } from "sonner"
import {
  Settings,
  Languages,
  Briefcase,
  CreditCard,
  History,
  Sparkles,
  Check,
  AlertCircle,
  Moon,
  Sun,
  Laptop,
  MessageCircle,
  Phone,
  MessageSquare,
  RefreshCw,
  ArrowRight,
  KeyRound,
  ShieldCheck,
  UserCheck,
  MapPin,
  Crosshair,
  Loader2,
  Building2
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { toggleGlobalRecruitment, updateContactChannel, updateSubscriptionPlan } from "@/modules/company/actions/settings"
import { GEO_CONFIG, findNearestCityAndZone } from "@/config/geo"

interface Invoice {
  id: string
  company_id: string
  plan_name: string
  amount: number
  currency: string
  status: string
  payment_method: string | null
  created_at: string
}

interface CompanyProfile {
  id: string
  company_name: string
  credits_available: number
  contact_channel: string
  logo_url: string | null
  description: string | null
  phone: string | null
  company_size: string | null
  industry: string | null
  website_or_linkedin: string | null
  whatsapp_number: string
  subscription_plan?: "basic" | "pro" | "enterprise" | string
  subscription_status?: string
  subscription_period_end?: string | null
  featured_vacancies_allowance?: number
  featured_vacancies_used?: number
}

interface SettingsUser {
  id: string
  email: string
}

interface CompanySettingsViewProps {
  user: SettingsUser
  initialProfile: CompanyProfile
  initialPauseState: boolean
  initialInvoices?: Invoice[]
}

export function CompanySettingsView({ user, initialProfile, initialPauseState, initialInvoices = [] }: CompanySettingsViewProps) {
  const [mounted, setMounted] = React.useState(false)
  const [activeTab, setActiveTab] = React.useState<"account" | "location" | "recruitment" | "credits">("account")
  
  // Location & Radar State for Company
  const [companyCity, setCompanyCity] = React.useState<string>("Mérida")
  const [companyZone, setCompanyZone] = React.useState<string>("Centro Mérida")
  const [companyLocationStatus, setCompanyLocationStatus] = React.useState<string>("")
  const [isLocatingCompany, setIsLocatingCompany] = React.useState<boolean>(false)
  const [isSavingCompanyLocation, setIsSavingCompanyLocation] = React.useState<boolean>(false)

  // Fetch company location from Supabase
  React.useEffect(() => {
    async function loadCompanyLocation() {
      if (initialProfile?.id) {
        const supabase = createClient()
        const { data } = await supabase
          .from("profiles")
          .select("location")
          .eq("id", initialProfile.id)
          .single()

        if (data?.location && data.location.includes(" - ")) {
          setCompanyLocationStatus(data.location)
          const [cCity, cZone] = data.location.split(" - ")
          if (GEO_CONFIG[cCity]) {
            setCompanyCity(cCity)
            setCompanyZone(cZone)
          }
        }
      }
    }
    loadCompanyLocation()
  }, [initialProfile])

  // GPS Location Handler for Company
  const handleDetectCompanyLocation = () => {
    if (!("geolocation" in navigator)) {
      toast.error("Geolocalización no soportada en navegador")
      return
    }

    setIsLocatingCompany(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        const { city: dCity, zone: dZone } = findNearestCityAndZone(latitude, longitude)
        setCompanyCity(dCity)
        setCompanyZone(dZone)
        setIsLocatingCompany(false)
        toast.success("Ubicación GPS detectada", {
          description: `Se seleccionó: ${dCity} - ${dZone}`
        })
      },
      (err) => {
        setIsLocatingCompany(false)
        toast.error("No se pudo obtener la ubicación GPS", {
          description: "Otorga permisos de geolocalización a tu navegador."
        })
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  // Save Location Handler for Company
  const handleSaveCompanyLocation = async () => {
    if (!companyCity || !companyZone) {
      toast.error("Selecciona ciudad y zona")
      return
    }

    setIsSavingCompanyLocation(true)
    const locationStr = `${companyCity} - ${companyZone}`
    const supabase = createClient()

    try {
      await supabase.auth.updateUser({
        data: { location: locationStr, city: companyCity, zone: companyZone }
      })

      await supabase
        .from("company_profiles")
        .update({ fiscal_address: locationStr, updated_at: new Date().toISOString() })
        .eq("id", initialProfile.id)

      try {
        await supabase
          .from("profiles")
          .update({ location: locationStr, updated_at: new Date().toISOString() })
          .eq("id", initialProfile.id)
      } catch (e) {}

      setCompanyLocationStatus(locationStr)
      toast.success("Ubicación corporativa guardada", {
        description: `Tu sede se registró como ${locationStr}.`
      })
    } catch (err: any) {
      toast.error("Error al guardar ubicación", { description: err.message || "Error al actualizar." })
    } finally {
      setIsSavingCompanyLocation(false)
    }
  }
  
  // Tab 1: Appearance State
  const [language, setLanguage] = React.useState("es")
  const [isResettingPassword, setIsResettingPassword] = React.useState(false)

  // Tab 3: Recruitment State (Bound to props and updated via Server Actions)
  const [pauseGlobal, setPauseGlobal] = React.useState(initialPauseState)
  const [contactChannel, setContactChannel] = React.useState(initialProfile.contact_channel)

  // Tab 4: Subscription & Credits State
  const credits = initialProfile.credits_available
  const [currentPlan, setCurrentPlan] = React.useState<"Gratis" | "Destacado" | "Enterprise">("Gratis")
  
  // Mock transaction list
  const [history, setHistory] = React.useState<Transaction[]>([
    {
      id: "tx-1",
      type: "usage",
      description: "Publicación: Auxiliar de Cocina (Playa del Carmen)",
      credits: -1,
      date: "08 Jul, 2026",
    },
    {
      id: "tx-2",
      type: "usage",
      description: "Publicación: Recepcionista (Tulum)",
      credits: -1,
      date: "04 Jul, 2026",
    },
    {
      id: "tx-3",
      type: "purchase",
      description: "Compra: Paquete de 5 Créditos",
      credits: 5,
      date: "01 Jul, 2026",
      amount: "$399 MXN",
    },
  ])

  // Dialog / Modal states
  const [isBuyModalOpen, setIsBuyModalOpen] = React.useState(false)
  const [isPlanModalOpen, setIsPlanModalOpen] = React.useState(false)
  const [selectedCreditsPackage, setSelectedCreditsPackage] = React.useState<{credits: number, price: string} | null>(null)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  // Password Reset
  const handleResetPassword = async () => {
    setIsResettingPassword(true)
    const supabase = createClient()
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/account/security`,
      })

      if (error) {
        throw error
      }

      toast.success("Correo de restauración enviado", {
        description: `Hemos enviado las instrucciones para restablecer tu contraseña a ${user.email}.`,
      })
    } catch (error) {
      const err = error as Error
      console.error("Error resetting password:", err)
      toast.error("Error de autenticación", {
        description: err.message || "No se pudo enviar el correo de restauración. Inténtalo de nuevo.",
      })
    } finally {
      setIsResettingPassword(false)
    }
  }

  // Toggle Global Pause Action
  const handleTogglePause = async (checked: boolean) => {
    const previousState = pauseGlobal
    setPauseGlobal(checked)
    
    try {
      await toggleGlobalRecruitment(initialProfile.id, checked)
      
      if (checked) {
        toast.warning("Reclutamiento Pausado", {
          description: "Tus vacantes se ocultarán del feed público de K'anPro temporalmente.",
        })
      } else {
        toast.success("Reclutamiento Activo", {
          description: "Tus vacantes vuelven a ser visibles para los candidatos.",
        })
      }
    } catch (error) {
      const err = error as Error
      setPauseGlobal(previousState)
      toast.error("Error de red", {
        description: err.message || "No se pudo actualizar el estado de reclutamiento.",
      })
    }
  }

  // Update Contact Channel Action
  const handleContactChannelChange = async (channel: string) => {
    const previousChannel = contactChannel
    setContactChannel(channel)
    
    const channelNames: Record<string, string> = {
      whatsapp: "WhatsApp Directo",
      phone: "Llamada Telefónica",
      inbox: "Inbox K'anPro",
    }
    
    try {
      await updateContactChannel(initialProfile.id, channel)
      
      toast.success("Canal de contacto actualizado", {
        description: `Los candidatos te contactarán preferentemente vía ${channelNames[channel]}.`,
      })
    } catch (error) {
      const err = error as Error
      setContactChannel(previousChannel)
      toast.error("Error al guardar cambios", {
        description: err.message || "No se pudo actualizar el canal de contacto preferido.",
      })
    }
  }

  const handleConfirmPurchase = async () => {
    if (!selectedCreditsPackage) return
    
    const { credits: pkgCredits, price } = selectedCreditsPackage
    const message = `Hola K'anPro, quiero comprar el paquete de ${pkgCredits} créditos (${price}) para mi empresa: ${initialProfile.company_name} (ID: ${initialProfile.id}).`
    const whatsappNumber = "529841390637"
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`
    
    const newTx: Transaction = {
      id: `tx-${Date.now()}`,
      type: "purchase",
      description: `Solicitud: Paquete de ${pkgCredits} Créditos (Pendiente de pago)`,
      credits: pkgCredits,
      date: new Date().toLocaleDateString("es-MX", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
      amount: `${price} (Pendiente)`,
    }
    
    setHistory(prev => [newTx, ...prev])
    setIsBuyModalOpen(false)
    setSelectedCreditsPackage(null)

    try {
      const supabase = createClient()
      await supabase.from("notifications").insert({
        user_id: user.id,
        title: "Solicitud de Créditos Registrada",
        description: `Solicitud de paquete de ${pkgCredits} créditos (${price}). El equipo verificará tu pago.`,
        type: "credit_purchase",
      })
    } catch (e) {
      console.warn("Could not save credit notification:", e)
    }

    window.open(whatsappUrl, "_blank")
    
    toast.info("Redireccionando a Soporte", {
      description: "Abrimos una ventana de WhatsApp para coordinar tu pago. Al verificarlo, se sumarán tus créditos.",
    })
  }

  // Navigation tabs list cleanly separated into focused categories
  const tabsList = [
    { id: "account", label: "Cuenta y Seguridad", icon: <ShieldCheck className="size-4" /> },
    { id: "location", label: "Sede Corporativa (GPS)", icon: <MapPin className="size-4" /> },
    { id: "recruitment", label: "Control de Reclutamiento", icon: <Briefcase className="size-4" /> },
    { id: "credits", label: "Suscripción y Créditos", icon: <CreditCard className="size-4" /> },
  ] as const

  return (
    <div className="flex flex-col lg:flex-row h-full min-h-[calc(100vh-80px)] bg-background pb-28 md:pb-0">
      
      {/* 1. Navigation Shell: Left Sidebar (Desktop) or Horizontal Scrollable Bar (Mobile) */}
      <div className="w-full lg:w-[300px] flex-shrink-0 border-b lg:border-b-0 lg:border-r border-border/40 flex flex-col bg-background/50 backdrop-blur-sm p-4 lg:p-6 lg:h-auto gap-4">
        <div className="hidden lg:flex items-center gap-3 px-2 mb-6">
          <div className="w-9 h-9 rounded-xl bg-[#1f2732] dark:bg-zinc-100 text-white dark:text-zinc-900 flex items-center justify-center">
            <Settings className="size-5" />
          </div>
          <div>
            <h2 className="text-base font-[800] text-fiord-900 dark:text-fiord-50 leading-none">Ajustes Corporativos</h2>
            <span className="text-[11px] text-fiord-400 dark:text-fiord-400 font-semibold mt-0.5 block">K&apos;anPro Mérida y Riviera Maya</span>
          </div>
        </div>

        {/* Tab triggers */}
        <nav className="flex lg:flex-col overflow-x-auto lg:overflow-x-visible -mx-4 px-4 lg:mx-0 lg:px-0 gap-2 hide-scrollbar scroll-smooth">
          {tabsList.map(tab => {
            const isTabActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "flex items-center gap-3 px-4.5 py-3 rounded-[14px] text-xs sm:text-sm font-bold whitespace-nowrap transition-all duration-200 relative select-none cursor-pointer",
                  isTabActive
                    ? "bg-[#1f2732] dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-sm"
                    : "text-fiord-600 dark:text-fiord-400 hover:text-fiord-900 dark:hover:text-fiord-100 hover:bg-fiord-50 dark:hover:bg-fiord-900/60"
                )}
              >
                {tab.icon}
                <span>{tab.label}</span>
                {tab.id === "credits" && credits <= 3 && (
                  <span className="ml-auto size-2.5 rounded-full bg-amber-500 animate-pulse hidden lg:block" />
                )}
              </button>
            )
          })}
        </nav>
      </div>

      {/* 2. Main Content View Area */}
      <div className="flex-1 overflow-y-auto bg-card/10 p-6 md:p-10 lg:p-12">
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">

          {/* TAB 2: CUENTA Y SEGURIDAD */}
          {activeTab === "account" && (
            <div className="space-y-6">
              <div className="flex flex-col gap-1 pb-2">
                <h1 className="text-xl font-bold tracking-tight text-fiord-900 dark:text-fiord-50">
                  Cuenta y Seguridad
                </h1>
                <p className="text-xs text-fiord-500 dark:text-fiord-400 font-medium">
                  Administra las credenciales corporativas y la clave de acceso de tu usuario.
                </p>
              </div>

              <Card className="border-fiord-100 dark:border-fiord-800 bg-white dark:bg-fiord-900 rounded-2xl p-6 shadow-sm space-y-6">
                <div className="space-y-0.5">
                  <h3 className="text-sm font-bold text-fiord-900 dark:text-fiord-50 flex items-center gap-2">
                    <UserCheck className="size-4 text-fiord-500" />
                    Datos de Autenticación
                  </h3>
                  <p className="text-[11px] text-fiord-400 dark:text-fiord-400 font-medium">
                    Información técnica y permisos de la cuenta.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="email-input" className="text-xs font-semibold text-fiord-700 dark:text-fiord-300">
                      Correo de la Empresa
                    </Label>
                    <Input
                      id="email-input"
                      type="email"
                      value={user.email}
                      disabled
                      className="rounded-xl border-fiord-100 dark:border-fiord-800 h-10 px-4 bg-fiord-50/50 dark:bg-fiord-950/40 text-fiord-600 dark:text-fiord-400 text-xs font-medium"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="rol-input" className="text-xs font-semibold text-fiord-700 dark:text-fiord-300">
                      Rol Comercial
                    </Label>
                    <Input
                      id="rol-input"
                      type="text"
                      value="Reclutador Administrador"
                      disabled
                      className="rounded-xl border-fiord-100 dark:border-fiord-800 h-10 px-4 bg-fiord-50/50 dark:bg-fiord-950/40 text-fiord-600 dark:text-fiord-400 text-xs font-medium"
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-fiord-50/50 dark:bg-fiord-800/30 border border-fiord-100/60 dark:border-fiord-800">
                  <div className="flex items-center gap-3">
                    <div className="size-8 rounded-lg bg-fiord-950 dark:bg-fiord-50 text-white dark:text-fiord-950 flex items-center justify-center shrink-0">
                      <KeyRound className="size-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-fiord-900 dark:text-fiord-50">Contraseña de acceso</h4>
                      <span className="text-[10px] text-fiord-400 dark:text-fiord-400 font-medium">
                        Reconfiguración segura vía Supabase Auth
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleResetPassword}
                    disabled={isResettingPassword}
                    className="rounded-xl px-4 text-xs font-bold h-9 select-none border-fiord-200 dark:border-fiord-700 hover:bg-fiord-100 dark:hover:bg-fiord-800"
                  >
                    {isResettingPassword ? (
                      <>
                        <RefreshCw className="mr-2 size-3.5 animate-spin" />
                        Procesando...
                      </>
                    ) : (
                      "Restablecer Contraseña"
                    )}
                  </Button>
                </div>
              </Card>
            </div>
          )}

          {/* TAB: UBICACIÓN Y SEDE CORPORATIVA */}
          {activeTab === "location" && (
            <div className="space-y-6">
              <div className="flex flex-col gap-1 pb-2">
                <h1 className="text-xl font-bold tracking-tight text-fiord-900 dark:text-fiord-50">
                  Ubicación y Sede Corporativa
                </h1>
                <p className="text-xs text-fiord-500 dark:text-fiord-400 font-medium">
                  Configura la ubicación geolocalizada de tu empresa para la publicación de vacantes en Mérida y Riviera Maya.
                </p>
              </div>

              <Card className="border-fiord-100 dark:border-fiord-800 bg-white dark:bg-fiord-900 rounded-2xl p-6 shadow-sm space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <h3 className="text-sm font-bold text-fiord-900 dark:text-fiord-50 flex items-center gap-2">
                      <Building2 className="size-4 text-fiord-500" />
                      Ubicación Fiscal y Operativa
                    </h3>
                    <p className="text-[11px] text-fiord-400 dark:text-fiord-400 font-medium">
                      {companyLocationStatus ? `Sede actual: ${companyLocationStatus}` : "Define la ciudad y zona de tu empresa."}
                    </p>
                  </div>
                  {companyLocationStatus && (
                    <Badge variant="outline" className="text-[10px] font-bold border-emerald-500/20 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10">
                      Geolocalizado
                    </Badge>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-fiord-700 dark:text-fiord-300">
                      Ciudad Principal
                    </Label>
                    <Select
                      value={companyCity}
                      onValueChange={(val) => {
                        setCompanyCity(val);
                        const firstZone = Object.keys(GEO_CONFIG[val]?.zones || {})[0] || "";
                        setCompanyZone(firstZone);
                      }}
                    >
                      <SelectTrigger className="w-full h-10 bg-fiord-50/50 dark:bg-fiord-950/40 border-fiord-100 dark:border-fiord-800 rounded-xl px-4 text-xs font-semibold">
                        <SelectValue placeholder="Selecciona Ciudad" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        {Object.keys(GEO_CONFIG).map((cityKey) => (
                          <SelectItem key={cityKey} value={cityKey}>
                            {cityKey}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-fiord-700 dark:text-fiord-300">
                      Zona / Colonia de la Sede
                    </Label>
                    <Select
                      value={companyZone}
                      onValueChange={setCompanyZone}
                      disabled={!companyCity}
                    >
                      <SelectTrigger className="w-full h-10 bg-fiord-50/50 dark:bg-fiord-950/40 border-fiord-100 dark:border-fiord-800 rounded-xl px-4 text-xs font-semibold">
                        <SelectValue placeholder="Selecciona Zona" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        {companyCity &&
                          Object.keys(GEO_CONFIG[companyCity]?.zones || {}).map((zoneKey) => (
                            <SelectItem key={zoneKey} value={zoneKey}>
                              {GEO_CONFIG[companyCity].zones[zoneKey].name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleDetectCompanyLocation}
                    disabled={isLocatingCompany}
                    className="w-full sm:w-auto h-10 rounded-xl border-fiord-200 text-xs font-bold flex items-center gap-2"
                  >
                    {isLocatingCompany ? (
                      <Loader2 className="size-4 animate-spin text-primary" />
                    ) : (
                      <Crosshair className="size-4 text-primary" />
                    )}
                    <span>Detectar por GPS</span>
                  </Button>

                  <Button
                    type="button"
                    onClick={handleSaveCompanyLocation}
                    disabled={isSavingCompanyLocation}
                    className="w-full sm:w-auto h-10 rounded-xl bg-primary hover:bg-primary/95 text-white text-xs font-bold px-6 flex items-center gap-2"
                  >
                    {isSavingCompanyLocation ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Sparkles className="size-4" />
                    )}
                    <span>Guardar Ubicación</span>
                  </Button>
                </div>
              </Card>
            </div>
          )}

          {/* TAB 3: CONTROL DE RECLUTAMIENTO */}
          {activeTab === "recruitment" && (
            <div className="space-y-6">
              <div className="flex flex-col gap-1 pb-2">
                <h1 className="text-xl font-bold tracking-tight text-fiord-900 dark:text-fiord-50">Control de Reclutamiento</h1>
                <p className="text-xs text-fiord-500 dark:text-fiord-400 font-medium">Gestiona la disponibilidad operativa de tu cuenta y los canales de comunicación oficiales.</p>
              </div>

              {/* SECCIÓN 1: PAUSA GLOBAL */}
              <Card className="border-fiord-100 dark:border-fiord-800 bg-white dark:bg-fiord-900 rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      "p-2 rounded-xl text-white mt-0.5 shrink-0",
                      pauseGlobal ? "bg-amber-500" : "bg-emerald-600"
                    )}>
                      <ShieldCheck className="size-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-fiord-900 dark:text-fiord-50">Pausar Reclutamiento Temporalmente</h3>
                      <p className="text-xs text-fiord-400 dark:text-fiord-400 font-medium mt-0.5">Al activarlo, todas tus vacantes activas se ocultarán del feed público de los candidatos.</p>
                    </div>
                  </div>
                  <Switch
                    checked={pauseGlobal}
                    onCheckedChange={handleTogglePause}
                  />
                </div>

                {pauseGlobal && (
                  <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs animate-in slide-in-from-top-2 duration-300">
                    <AlertCircle className="size-4 mt-0.5 shrink-0" />
                    <div>
                      <span className="font-bold">Efecto Inmediato:</span> Tus anuncios de empleo en Mérida, Playa del Carmen y Riviera Maya han sido pausados temporalmente.
                    </div>
                  </div>
                )}
              </Card>

              {/* SECCIÓN 2: CANAL DE CONTACTO PREFERIDO */}
              <Card className="border-fiord-100 dark:border-fiord-800 bg-white dark:bg-fiord-900 rounded-2xl p-6 shadow-sm space-y-4">
                <div className="space-y-0.5">
                  <h3 className="text-sm font-bold text-fiord-900 dark:text-fiord-50 flex items-center gap-2">
                    <MessageCircle className="size-4 text-fiord-500" />
                    Canal de Contacto Preferido
                  </h3>
                  <p className="text-[11px] text-fiord-400 dark:text-fiord-400 font-medium">
                    Forma en la que los candidatos se comunicarán principalmente con tu equipo.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  {/* WhatsApp Directo */}
                  <div
                    onClick={() => handleContactChannelChange("whatsapp")}
                    className={cn(
                      "flex flex-col justify-between p-4 rounded-xl border cursor-pointer transition-all duration-200 select-none",
                      contactChannel === "whatsapp"
                        ? "border-emerald-600 dark:border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/30 shadow-xs"
                        : "border-fiord-100 dark:border-fiord-800 bg-white dark:bg-fiord-900/50 hover:border-fiord-300 dark:hover:border-fiord-700"
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
                      <h4 className="text-xs font-bold text-fiord-900 dark:text-fiord-50">WhatsApp Directo</h4>
                      <p className="text-[10px] text-fiord-400 dark:text-fiord-400 font-medium mt-1 leading-normal">
                        Conexión exprés directa al número de WhatsApp de tu empresa.
                      </p>
                    </div>
                  </div>

                  {/* Llamada Telefónica */}
                  <div
                    onClick={() => handleContactChannelChange("phone")}
                    className={cn(
                      "flex flex-col justify-between p-4 rounded-xl border cursor-pointer transition-all duration-200 select-none",
                      contactChannel === "phone"
                        ? "border-fiord-900 dark:border-fiord-100 bg-fiord-50/70 dark:bg-fiord-800/80 shadow-xs"
                        : "border-fiord-100 dark:border-fiord-800 bg-white dark:bg-fiord-900/50 hover:border-fiord-300 dark:hover:border-fiord-700"
                    )}
                  >
                    <div className="flex justify-between items-center mb-3">
                      <div className="p-2 rounded-lg bg-fiord-50 dark:bg-fiord-800 text-fiord-900 dark:text-fiord-100">
                        <Phone className="size-4" />
                      </div>
                      {contactChannel === "phone" && (
                        <Check className="size-4 text-fiord-900 dark:text-fiord-50 shrink-0" />
                      )}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-fiord-900 dark:text-fiord-50">Llamada Telefónica</h4>
                      <p className="text-[10px] text-fiord-400 dark:text-fiord-400 font-medium mt-1 leading-normal">
                        Contacto directo vía llamadas de voz tradicionales.
                      </p>
                    </div>
                  </div>

                  {/* Inbox K'anPro */}
                  <div
                    onClick={() => handleContactChannelChange("inbox")}
                    className={cn(
                      "flex flex-col justify-between p-4 rounded-xl border cursor-pointer transition-all duration-200 select-none",
                      contactChannel === "inbox"
                        ? "border-fiord-900 dark:border-fiord-100 bg-fiord-50/70 dark:bg-fiord-800/80 shadow-xs"
                        : "border-fiord-100 dark:border-fiord-800 bg-white dark:bg-fiord-900/50 hover:border-fiord-300 dark:hover:border-fiord-700"
                    )}
                  >
                    <div className="flex justify-between items-center mb-3">
                      <div className="p-2 rounded-lg bg-fiord-50 dark:bg-fiord-800 text-fiord-900 dark:text-fiord-100">
                        <MessageSquare className="size-4" />
                      </div>
                      {contactChannel === "inbox" && (
                        <Check className="size-4 text-fiord-900 dark:text-fiord-50 shrink-0" />
                      )}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-fiord-900 dark:text-fiord-50">Inbox K&apos;anPro</h4>
                      <p className="text-[10px] text-fiord-400 dark:text-fiord-400 font-medium mt-1 leading-normal">
                        Mensajería interna protegida para privacidad.
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* TAB 4: SUSCRIPCIÓN Y PLANES */}
          {activeTab === "credits" && (
            <div className="space-y-6">
              <div className="flex flex-col gap-1 pb-2">
                <h1 className="text-xl font-bold tracking-tight text-fiord-900 dark:text-fiord-50">Suscripción y Plan Mensual</h1>
                <p className="text-xs text-fiord-500 dark:text-fiord-400 font-medium">Administra tu plan de contratación, cupos de vacantes destacadas y facturación.</p>
              </div>

              {/* Bento Grid Layout */}
              <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
                
                {/* Bento Card 1: Plan Actual (Span 3) */}
                <Card className="md:col-span-3 flex flex-col justify-between rounded-xl border border-border/10 bg-white dark:bg-zinc-900 relative overflow-hidden group/card shadow-none hover:border-zinc-350 dark:hover:border-zinc-700 transition-all duration-200">
                  <div className={cn(
                    "absolute -top-12 -right-12 w-24 h-24 rounded-full blur-2xl opacity-20 transition-all duration-300",
                    (initialProfile.subscription_plan === "basic" || !initialProfile.subscription_plan) && "bg-emerald-500",
                    initialProfile.subscription_plan === "pro" && "bg-primary",
                    initialProfile.subscription_plan === "enterprise" && "bg-amber-500"
                  )} />

                  <CardHeader className="pb-3 relative z-10">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Plan Activo</span>
                      
                      {(initialProfile.subscription_plan === "basic" || !initialProfile.subscription_plan) && (
                        <span className="inline-flex items-center px-2 py-0.5 text-[9px] font-semibold border rounded-full bg-emerald-50 text-emerald-700 border-emerald-200/50 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/40">
                          Plan Básico
                        </span>
                      )}
                      {initialProfile.subscription_plan === "pro" && (
                        <span className="inline-flex items-center px-2 py-0.5 text-[9px] font-semibold border rounded-full bg-primary/10 text-primary border-primary/20 dark:bg-primary/20 dark:text-primary-foreground font-bold">
                          Plan PRO ⭐
                        </span>
                      )}
                      {initialProfile.subscription_plan === "enterprise" && (
                        <span className="inline-flex items-center px-2 py-0.5 text-[9px] font-semibold border rounded-full bg-amber-50 text-amber-700 border-amber-200/50 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/40 font-bold">
                          Plan Corporativo 👑
                        </span>
                      )}
                    </div>
                    <CardTitle className="text-base font-bold text-foreground mt-2">
                      {(initialProfile.subscription_plan === "basic" || !initialProfile.subscription_plan) && "K'anPro Básico"}
                      {initialProfile.subscription_plan === "pro" && "K'anPro PRO"}
                      {initialProfile.subscription_plan === "enterprise" && "K'anPro Corporativo"}
                    </CardTitle>
                    <CardDescription className="text-xs text-muted-foreground mt-1">
                      {(initialProfile.subscription_plan === "basic" || !initialProfile.subscription_plan) && "Acceso ágil para vacantes locales y recepción de postulantes."}
                      {initialProfile.subscription_plan === "pro" && "Cacería de talento con Radar GPS y vacantes destacadas."}
                      {initialProfile.subscription_plan === "enterprise" && "Volumen ilimitado y acompañamiento VIP en contratación."}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="py-2 text-xs relative z-10 flex-1">
                    <ul className="space-y-2 mt-2">
                      <li className="flex items-center gap-2">
                        <Check className="size-3.5 text-emerald-500 flex-shrink-0" />
                        <span className="text-muted-foreground">
                          Límite de vacantes activas:{" "}
                          <strong className="text-foreground font-bold">
                            {initialProfile.subscription_plan === "pro" ? "15 vacantes" : initialProfile.subscription_plan === "enterprise" ? "Ilimitadas" : "5 vacantes"}
                          </strong>
                        </span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="size-3.5 text-emerald-500 flex-shrink-0" />
                        <span className="text-muted-foreground">WhatsApp directo en postulaciones recibidas</span>
                      </li>
                      <li className="flex items-center gap-2">
                        {initialProfile.subscription_plan !== "basic" ? (
                          <Check className="size-3.5 text-emerald-500 flex-shrink-0" />
                        ) : (
                          <div className="w-3.5 h-3.5 flex items-center justify-center text-[10px] text-muted-foreground/60 border border-muted-foreground/30 rounded-full font-bold">✕</div>
                        )}
                        <span className={cn(initialProfile.subscription_plan === "basic" && "text-muted-foreground/50 line-through")}>
                          Contacto proactivo vía Radar GPS
                        </span>
                      </li>
                    </ul>
                  </CardContent>

                  <CardFooter className="pt-4 pb-5 relative z-10 border-t border-border/20">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsPlanModalOpen(true)}
                      className="w-full rounded-lg text-xs font-semibold h-8 select-none border-border"
                    >
                      <span>Cambiar o Renovar Plan</span>
                      <ArrowRight className="size-3 ml-1 transition-transform group-hover/button:translate-x-0.5" />
                    </Button>
                  </CardFooter>
                </Card>

                {/* Bento Card 2: Vacantes Destacadas (Span 3) */}
                <Card className="md:col-span-3 flex flex-col justify-between rounded-xl border border-border/10 bg-white dark:bg-zinc-900 relative overflow-hidden group/card shadow-none hover:border-zinc-350 dark:hover:border-zinc-700 transition-all duration-200">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Vacantes Destacadas</span>
                      <Sparkles className="size-3 text-primary fill-primary/20" />
                    </div>
                  </CardHeader>

                  <CardContent className="py-2 flex-1 flex flex-col justify-center">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-4xl font-extrabold tracking-tight text-foreground font-mono">
                        {(initialProfile.featured_vacancies_allowance || 0) - (initialProfile.featured_vacancies_used || 0)}
                      </span>
                      <span className="text-xs font-semibold text-muted-foreground">Destacados Disponibles</span>
                    </div>

                    <div className="space-y-1.5 mt-4">
                      <Progress
                        value={initialProfile.featured_vacancies_allowance ? ((initialProfile.featured_vacancies_allowance - (initialProfile.featured_vacancies_used || 0)) / initialProfile.featured_vacancies_allowance) * 100 : 0}
                        className="bg-zinc-100 dark:bg-zinc-800 h-2"
                      />
                      <div className="flex justify-between text-[10px] text-muted-foreground">
                        <span>{initialProfile.featured_vacancies_used || 0} usados</span>
                        <span>Cupo de {initialProfile.featured_vacancies_allowance || 0} mensuales</span>
                      </div>
                    </div>
                  </CardContent>

                  <CardFooter className="pt-3 pb-5 border-t border-border/20">
                    <Button
                      size="sm"
                      onClick={() => setIsPlanModalOpen(true)}
                      className="w-full rounded-lg h-8 bg-primary hover:bg-primary/95 text-primary-foreground font-semibold shadow-sm select-none border-none"
                    >
                      Mejorar a Plan PRO / Corporativo
                    </Button>
                  </CardFooter>
                </Card>

                {/* Bento Card 3: Historial de Facturas (Span 6) */}
                <Card className="col-span-1 md:col-span-6 rounded-xl border border-border/10 bg-white dark:bg-zinc-900 shadow-none hover:border-zinc-350 dark:hover:border-zinc-700 transition-all duration-200">
                  <CardHeader className="pb-3 flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-xs font-bold text-foreground flex items-center gap-1.5">
                        <History className="size-3.5 text-muted-foreground" />
                        Historial de Facturación y Recibos
                      </CardTitle>
                      <CardDescription className="text-[10px] text-muted-foreground mt-0.5">Pagos y renovaciones de suscripción registradas.</CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    {initialInvoices.length > 0 ? (
                      <div className="divide-y divide-border/20 max-h-[220px] overflow-y-auto custom-scrollbar">
                        {initialInvoices.map((inv) => (
                          <div key={inv.id} className="flex items-center justify-between p-4 hover:bg-muted/10 transition-colors">
                            <div className="flex items-start gap-3">
                              <div className="p-1.5 rounded-lg text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mt-0.5">
                                PAGADO
                              </div>
                              <div>
                                <h5 className="text-xs font-bold text-foreground">{inv.plan_name}</h5>
                                <span className="text-[10px] text-muted-foreground">
                                  {new Date(inv.created_at).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" })}
                                </span>
                              </div>
                            </div>
                            <span className="text-xs font-bold font-mono text-foreground">${inv.amount} {inv.currency}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-6 text-center text-xs text-muted-foreground">
                        No hay facturas registradas aún. El Plan Básico es de acceso libre.
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Modal de Selección de Plan */}
              <Dialog open={isPlanModalOpen} onOpenChange={setIsPlanModalOpen}>
                <DialogContent className="max-w-3xl sm:rounded-[24px]">
                  <DialogHeader>
                    <DialogTitle className="text-lg font-bold">Planes de Lanzamiento - Fase 1 Beta</DialogTitle>
                    <DialogDescription className="text-xs text-muted-foreground">
                      Planes especiales de prueba e inicio para las primeras empresas en Mérida y Quintana Roo.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-4">
                    {/* Empresa Beta */}
                    <div className={cn(
                      "p-4 rounded-2xl border flex flex-col justify-between transition-all relative overflow-hidden",
                      (initialProfile.subscription_plan === "basic" || !initialProfile.subscription_plan) ? "border-emerald-500 bg-emerald-500/5" : "border-border"
                    )}>
                      <div>
                        <Badge variant="outline" className="text-[10px] font-bold border-emerald-500 text-emerald-600 dark:text-emerald-400">FASE 1 BETA 🟢</Badge>
                        <h3 className="text-lg font-bold mt-2">Gratis <span className="text-xs font-normal text-muted-foreground">en prueba</span></h3>
                        <p className="text-[11px] text-muted-foreground mt-1">Objetivo: Conseguir primeros usuarios y aprender de tu operación.</p>
                        <ul className="text-xs space-y-1.5 mt-4">
                          <li className="flex items-center gap-1.5"><Check className="size-3.5 text-emerald-500" /> Perfil Empresarial Completo</li>
                          <li className="flex items-center gap-1.5"><Check className="size-3.5 text-emerald-500" /> 3 Vacantes Activas</li>
                          <li className="flex items-center gap-1.5"><Check className="size-3.5 text-emerald-500" /> Candidatos Ilimitados</li>
                          <li className="flex items-center gap-1.5"><Check className="size-3.5 text-emerald-500" /> Contacto Directo por WhatsApp</li>
                          <li className="flex items-center gap-1.5"><Check className="size-3.5 text-emerald-500" /> Verificación Manual</li>
                        </ul>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="mt-4 w-full text-xs font-bold border-emerald-500 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10"
                        onClick={async () => {
                          await updateSubscriptionPlan(initialProfile.id, "basic");
                          setIsPlanModalOpen(false);
                          toast.success("Activo en Plan Empresa Beta");
                        }}
                      >
                        Activar Plan Beta Gratis
                      </Button>
                    </div>

                    {/* Empresa Profesional */}
                    <div className={cn(
                      "p-4 rounded-2xl border-2 flex flex-col justify-between transition-all relative overflow-hidden",
                      initialProfile.subscription_plan === "pro" ? "border-primary bg-primary/10" : "border-primary/50 bg-primary/5"
                    )}>
                      <div className="absolute top-2 right-2">
                        <Badge className="bg-primary text-primary-foreground text-[9px] font-bold">RECURRENTE 🔵</Badge>
                      </div>
                      <div>
                        <Badge variant="default" className="text-[10px] font-bold">Profesional</Badge>
                        <h3 className="text-lg font-bold mt-2">$399 - $999 <span className="text-xs font-normal text-muted-foreground">MXN/mes</span></h3>
                        <p className="text-[11px] text-muted-foreground mt-1">Para empresas contratando constantemente con ingresos recurrentes.</p>
                        <ul className="text-xs space-y-1.5 mt-4 font-semibold">
                          <li className="flex items-center gap-1.5"><Check className="size-3.5 text-emerald-500" /> Más Vacantes (15 activas)</li>
                          <li className="flex items-center gap-1.5"><Check className="size-3.5 text-emerald-500" /> Empresa Verificada con Badge</li>
                          <li className="flex items-center gap-1.5"><Check className="size-3.5 text-emerald-500" /> Mejor Exposición en Feed</li>
                          <li className="flex items-center gap-1.5"><Check className="size-3.5 text-emerald-500" /> Filtros Avanzados de Candidatos</li>
                        </ul>
                      </div>
                      <Button
                        size="sm"
                        className="mt-4 w-full text-xs font-bold bg-primary hover:bg-primary/90 text-primary-foreground"
                        onClick={async () => {
                          await updateSubscriptionPlan(initialProfile.id, "pro");
                          setIsPlanModalOpen(false);
                          toast.success("¡Plan Profesional Activado!");
                        }}
                      >
                        Activar Plan Profesional
                      </Button>
                    </div>

                    {/* Corporativo */}
                    <div className={cn(
                      "p-4 rounded-2xl border flex flex-col justify-between transition-all opacity-95",
                      initialProfile.subscription_plan === "enterprise" ? "border-amber-500 bg-amber-500/5" : "border-border"
                    )}>
                      <div>
                        <Badge variant="secondary" className="text-[10px] font-bold">Corporativo 🟣</Badge>
                        <h3 className="text-lg font-bold mt-2">Bajo Demanda <span className="text-xs font-normal text-muted-foreground">VIP</span></h3>
                        <p className="text-[11px] text-muted-foreground mt-1">Para grandes grupos y cadenas hoteleras cuando exista demanda.</p>
                        <ul className="text-xs space-y-1.5 mt-4">
                          <li className="flex items-center gap-1.5"><Check className="size-3.5 text-emerald-500" /> Equipos Multi-Reclutador</li>
                          <li className="flex items-center gap-1.5"><Check className="size-3.5 text-emerald-500" /> Reportes Personalizados</li>
                          <li className="flex items-center gap-1.5"><Check className="size-3.5 text-emerald-500" /> Funciones Especiales a Medida</li>
                          <li className="flex items-center gap-1.5"><Check className="size-3.5 text-emerald-500" /> Vacantes Destacadas VIP</li>
                        </ul>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="mt-4 w-full text-xs font-bold border-amber-500 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10"
                        onClick={async () => {
                          await updateSubscriptionPlan(initialProfile.id, "enterprise");
                          setIsPlanModalOpen(false);
                          toast.success("¡Plan Corporativo Solicitado!");
                        }}
                      >
                        Solicitar Plan Corporativo
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
