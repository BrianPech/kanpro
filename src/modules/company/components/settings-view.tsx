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
  ShieldCheck
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Progress } from "@/components/ui/progress"
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
import { toggleGlobalRecruitment, updateContactChannel } from "@/modules/company/actions/settings"

interface Transaction {
  id: string
  type: "purchase" | "usage"
  description: string
  credits: number
  date: string
  amount?: string
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
}

interface SettingsUser {
  id: string
  email: string
}

interface CompanySettingsViewProps {
  user: SettingsUser
  initialProfile: CompanyProfile
  initialPauseState: boolean
}

export function CompanySettingsView({ user, initialProfile, initialPauseState }: CompanySettingsViewProps) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)
  const [activeTab, setActiveTab] = React.useState<"general" | "recruitment" | "credits">("general")
  
  // Tab 1: General State
  const [language, setLanguage] = React.useState("es")
  const [isResettingPassword, setIsResettingPassword] = React.useState(false)

  // Tab 2: Recruitment State (Bound to props and updated via Server Actions)
  const [pauseGlobal, setPauseGlobal] = React.useState(initialPauseState)
  const [contactChannel, setContactChannel] = React.useState(initialProfile.contact_channel)

  // Tab 3: Subscription & Credits State
  const [credits, setCredits] = React.useState(initialProfile.credits_available)
  const [currentPlan, setCurrentPlan] = React.useState<"Gratis" | "Destacado" | "Enterprise">("Gratis")
  
  // Mock transaction list with user profile updates appended
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
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true)
  }, [])

  // 1. Password Reset connected to Supabase Auth
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
    } catch (error: any) {
      console.error("Error resetting password:", error)
      toast.error("Error de autenticación", {
        description: error.message || "No se pudo enviar el correo de restauración. Inténtalo de nuevo.",
      })
    } finally {
      setIsResettingPassword(false)
    }
  }

  // 2. Switch Pausa Global connected to Server Action
  const handleTogglePause = async (checked: boolean) => {
    const previousState = pauseGlobal
    setPauseGlobal(checked)
    
    try {
      await toggleGlobalRecruitment(initialProfile.id, checked)
      
      if (checked) {
        toast.warning("Reclutamiento Pausado", {
          description: "Tus vacantes se ocultarán del feed público de K&apos;anPro temporalmente.",
        })
      } else {
        toast.success("Reclutamiento Activo", {
          description: "Tus vacantes vuelven a ser visibles para los candidatos.",
        })
      }
    } catch (error: any) {
      // Revert status on failure
      setPauseGlobal(previousState)
      toast.error("Error de red", {
        description: error.message || "No se pudo actualizar el estado de reclutamiento. Inténtalo más tarde.",
      })
    }
  }

  // 3. Contact Channel connected to Server Action
  const handleContactChannelChange = async (channel: string) => {
    const previousChannel = contactChannel
    setContactChannel(channel)
    
    const channelNames: Record<string, string> = {
      whatsapp: "WhatsApp Directo",
      phone: "Llamada Telefónica",
      inbox: "Inbox K&apos;anPro",
    }
    
    try {
      await updateContactChannel(initialProfile.id, channel)
      
      toast.success("Canal de contacto actualizado", {
        description: `Los candidatos ahora te contactarán preferentemente vía ${channelNames[channel]}.`,
      })
    } catch (error: any) {
      // Revert status on failure
      setContactChannel(previousChannel)
      toast.error("Error al guardar cambios", {
        description: error.message || "No se pudo actualizar el canal de contacto preferido.",
      })
    }
  }

  // 4. Buy Credits (Lean redirection flow via WhatsApp link)
  const handleConfirmPurchase = () => {
    if (!selectedCreditsPackage) return
    
    const { credits: pkgCredits, price } = selectedCreditsPackage
    
    // Construct pre-filled message for verification
    const message = `Hola K'anPro, quiero comprar el paquete de ${pkgCredits} créditos (${price}) para mi empresa: ${initialProfile.company_name} (ID: ${initialProfile.id}).`
    const whatsappNumber = "529841390637" // Riviera Maya Support Phone Number
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`
    
    // Add to history list as a pending transaction
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
    
    // Open redirection link in a new tab
    window.open(whatsappUrl, "_blank")
    
    toast.info("Redireccionando a Soporte", {
      description: "Abrimos una ventana de WhatsApp para coordinar tu pago. Al verificarlo, se sumarán tus créditos.",
    })
  }

  // Simulate local plan update visually (in production this would redirect to Stripe/Billing page)
  const handleSelectPlan = (plan: "Gratis" | "Destacado" | "Enterprise") => {
    setCurrentPlan(plan)
    setIsPlanModalOpen(false)
    toast.success("Plan actualizado", {
      description: `Tu cuenta ha cambiado al Plan ${plan} de forma exitosa.`,
    })
  }

  // Navigation tabs list
  const tabsList = [
    { id: "general", label: "General", icon: <Settings className="size-4" /> },
    { id: "recruitment", label: "Reclutamiento", icon: <Briefcase className="size-4" /> },
    { id: "credits", label: "Suscripción y Créditos", icon: <CreditCard className="size-4" /> },
  ] as const

  return (
    <div className="flex flex-col lg:flex-row h-full min-h-[calc(100vh-80px)] bg-background">
      
      {/* 1. Navigation Shell: Left Sidebar (Desktop) or Horizontal Scrollable Bar (Mobile) */}
      <div className="w-full lg:w-[280px] flex-shrink-0 border-b lg:border-b-0 lg:border-r border-border/40 flex flex-col bg-background/50 backdrop-blur-sm p-4 lg:p-6 lg:h-auto gap-4">
        <div className="hidden lg:flex items-center gap-3 px-2 mb-6">
          <div className="w-8 h-8 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <Settings className="size-4 animate-spin-slow" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-foreground leading-none">Ajustes Corporativos</h2>
            <span className="text-[10px] text-muted-foreground">K&apos;anPro Mérida y Riviera Maya</span>
          </div>
        </div>

        {/* Tab triggers */}
        <nav className="flex lg:flex-col overflow-x-auto lg:overflow-x-visible -mx-4 px-4 lg:mx-0 lg:px-0 gap-1.5 hide-scrollbar scroll-smooth">
          {tabsList.map(tab => {
            const isTabActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2.5 px-4 py-2.5 rounded-2xl text-xs font-semibold whitespace-nowrap transition-all duration-300 relative select-none",
                  isTabActive
                    ? "bg-blue-600 text-white shadow-sm shadow-blue-500/10"
                    : "text-muted-foreground hover:text-blue-600 dark:hover:text-blue-400 hover:bg-muted/40"
                )}
              >
                {tab.icon}
                <span>{tab.label}</span>
                {tab.id === "credits" && credits <= 3 && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-destructive animate-pulse hidden lg:block" />
                )}
              </button>
            )
          })}
        </nav>
      </div>

      {/* 2. Main Content View Area */}
      <div className="flex-1 overflow-y-auto bg-card/10 p-6 md:p-10 lg:p-12">
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
          
          {/* Active View renders here based on selected activeTab */}
          
          {/* TAB 1: GENERAL SETTINGS */}
          {activeTab === "general" && (
            <div className="space-y-8">
              <div className="flex flex-col gap-1 border-b border-border/40 pb-4">
                <h1 className="text-xl font-bold tracking-tight text-foreground">Configuración General</h1>
                <p className="text-xs text-muted-foreground">Ajusta tus preferencias operativas de idioma y tema de la aplicación K&apos;anPro.</p>
              </div>

              {/* Theme Settings (Premium visual selection Cards) */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-3 rounded-full bg-blue-600" />
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Apariencia visual</Label>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Claro (Light) card */}
                  <div
                    onClick={() => setTheme("light")}
                    className={cn(
                      "group relative flex flex-col justify-between overflow-hidden border rounded-3xl p-4 cursor-pointer transition-all duration-300 bg-card select-none",
                      mounted && theme === "light"
                        ? "border-blue-500 shadow-sm shadow-blue-500/5 bg-blue-500/[0.01]"
                        : "border-border/60 hover:border-blue-500/50"
                    )}
                  >
                    <div className="flex justify-between items-center mb-6">
                      <span className="text-xs font-bold text-foreground">Claro</span>
                      <Sun className={cn("size-4 text-amber-500", mounted && theme === "light" && "animate-spin-slow")} />
                    </div>
                    {/* Mockup */}
                    <div className="h-20 w-full bg-slate-100/80 dark:bg-zinc-900 rounded-2xl p-2 flex flex-col gap-1.5 border border-border/20">
                      <div className="h-2 w-1/3 bg-slate-200 rounded-full" />
                      <div className="flex gap-2">
                        <div className="h-8 w-8 bg-white rounded-lg border border-slate-200 flex items-center justify-center text-[8px] font-bold text-blue-600 shadow-sm">K&apos;</div>
                        <div className="flex-1 flex flex-col gap-1">
                          <div className="h-2 w-full bg-slate-200 rounded-full" />
                          <div className="h-1.5 w-2/3 bg-slate-200 rounded-full" />
                        </div>
                      </div>
                    </div>
                    {mounted && theme === "light" && (
                      <div className="absolute top-2 right-2 bg-blue-600 text-white rounded-full p-0.5">
                        <Check className="size-3" />
                      </div>
                    )}
                  </div>

                  {/* Oscuro (Dark) card */}
                  <div
                    onClick={() => setTheme("dark")}
                    className={cn(
                      "group relative flex flex-col justify-between overflow-hidden border rounded-3xl p-4 cursor-pointer transition-all duration-300 bg-card select-none",
                      mounted && theme === "dark"
                        ? "border-blue-500 shadow-sm shadow-blue-500/5 bg-blue-500/[0.01]"
                        : "border-border/60 hover:border-blue-500/50"
                    )}
                  >
                    <div className="flex justify-between items-center mb-6">
                      <span className="text-xs font-bold text-foreground">Oscuro</span>
                      <Moon className="size-4 text-blue-400 group-hover:rotate-12 transition-transform" />
                    </div>
                    {/* Mockup */}
                    <div className="h-20 w-full bg-zinc-950 rounded-2xl p-2 flex flex-col gap-1.5 border border-border/10">
                      <div className="h-2 w-1/3 bg-zinc-800 rounded-full" />
                      <div className="flex gap-2">
                        <div className="h-8 w-8 bg-zinc-900 rounded-lg border border-zinc-800 flex items-center justify-center text-[8px] font-bold text-blue-600 shadow-sm">K&apos;</div>
                        <div className="flex-1 flex flex-col gap-1">
                          <div className="h-2 w-full bg-zinc-800 rounded-full" />
                          <div className="h-1.5 w-2/3 bg-zinc-800 rounded-full" />
                        </div>
                      </div>
                    </div>
                    {mounted && theme === "dark" && (
                      <div className="absolute top-2 right-2 bg-blue-600 text-white rounded-full p-0.5">
                        <Check className="size-3" />
                      </div>
                    )}
                  </div>

                  {/* Sistema (System) card */}
                  <div
                    onClick={() => setTheme("system")}
                    className={cn(
                      "group relative flex flex-col justify-between overflow-hidden border rounded-3xl p-4 cursor-pointer transition-all duration-300 bg-card select-none",
                      mounted && theme === "system"
                        ? "border-blue-500 shadow-sm shadow-blue-500/5 bg-blue-500/[0.01]"
                        : "border-border/60 hover:border-blue-500/50"
                    )}
                  >
                    <div className="flex justify-between items-center mb-6">
                      <span className="text-xs font-bold text-foreground">Sistema</span>
                      <Laptop className="size-4 text-muted-foreground" />
                    </div>
                    {/* Mockup */}
                    <div className="h-20 w-full bg-gradient-to-r from-slate-100/80 to-zinc-950 rounded-2xl p-2 flex flex-col gap-1.5 border border-border/20">
                      <div className="h-2 w-1/3 bg-slate-300 dark:bg-zinc-800 rounded-full" />
                      <div className="flex gap-2">
                        <div className="h-8 w-8 bg-slate-200/50 dark:bg-zinc-900 rounded-lg border border-slate-300 flex items-center justify-center text-[8px] font-bold text-blue-600 shadow-sm">K&apos;</div>
                        <div className="flex-1 flex flex-col gap-1">
                          <div className="h-2 w-full bg-slate-300 dark:bg-zinc-800 rounded-full" />
                          <div className="h-1.5 w-2/3 bg-slate-300 dark:bg-zinc-800 rounded-full" />
                        </div>
                      </div>
                    </div>
                    {mounted && theme === "system" && (
                      <div className="absolute top-2 right-2 bg-blue-600 text-white rounded-full p-0.5">
                        <Check className="size-3" />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Language selection */}
              <div className="space-y-4 pt-4 border-t border-border/40">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-3 rounded-full bg-blue-600" />
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Idioma de visualización</Label>
                </div>
                <div className="flex items-center gap-4">
                  <Languages className="size-4 text-muted-foreground" />
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger className="w-full sm:w-[240px] rounded-2xl border-border bg-input/20 h-9 px-4">
                      <SelectValue placeholder="Selecciona idioma" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="es">Español (México)</SelectItem>
                      <SelectItem value="en">English (US)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Basic Security / Password Reset */}
              <div className="space-y-4 pt-6 border-t border-border/40">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-3 rounded-full bg-blue-600" />
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Seguridad de la cuenta</Label>
                </div>

                <div className="glass-card rounded-[24px] p-6 border border-border/40 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="email-input" className="text-xs text-muted-foreground">Correo de la Empresa</Label>
                      <Input
                        id="email-input"
                        type="email"
                        value={user.email}
                        disabled
                        className="rounded-2xl border-border h-9 px-4 bg-muted/30 text-muted-foreground text-xs"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="rol-input" className="text-xs text-muted-foreground">Rol Comercial</Label>
                      <Input
                        id="rol-input"
                        type="text"
                        value="Reclutador Administrador"
                        disabled
                        className="rounded-2xl border-border h-9 px-4 bg-muted/30 text-muted-foreground text-xs"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-muted/20 border border-border/20">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400">
                        <KeyRound className="size-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-foreground">Contraseña de acceso</h4>
                        <span className="text-[10px] text-muted-foreground">Reconfiguración de contraseña vía Supabase Auth</span>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleResetPassword}
                      disabled={isResettingPassword}
                      className="rounded-xl px-4 text-xs font-semibold h-8 select-none border-border"
                    >
                      {isResettingPassword ? (
                        <>
                          <RefreshCw className="mr-2 size-3 animate-spin" />
                          Procesando...
                        </>
                      ) : (
                        "Restablecer Contraseña"
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: RECRUITMENT CONTROLS */}
          {activeTab === "recruitment" && (
            <div className="space-y-8">
              <div className="flex flex-col gap-1 border-b border-border/40 pb-4">
                <h1 className="text-xl font-bold tracking-tight text-foreground">Control de Reclutamiento</h1>
                <p className="text-xs text-muted-foreground">Gestiona la disponibilidad operativa de tu cuenta y los canales de comunicación oficiales.</p>
              </div>

              {/* Switch de Pausa Global */}
              <div className="glass-card rounded-[24px] p-6 border border-border/40 space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      "p-2 rounded-xl text-white mt-0.5",
                      pauseGlobal ? "bg-amber-500" : "bg-emerald-500"
                    )}>
                      <ShieldCheck className="size-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">Pausar Reclutamiento Temporalmente</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">Al activarlo, todas tus vacantes activas se ocultarán del feed de los candidatos.</p>
                    </div>
                  </div>
                  <Switch
                    checked={pauseGlobal}
                    onCheckedChange={handleTogglePause}
                  />
                </div>

                {/* Warning message on Pause active */}
                {pauseGlobal && (
                  <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs animate-in slide-in-from-top-2 duration-300">
                    <AlertCircle className="size-4 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="font-bold">Efecto Inmediato:</span> Tus anuncios de empleo en Playa del Carmen, Mérida, Cancún, Tulum y otras locaciones han sido retirados temporalmente del feed público. No recibirás nuevos contactos hasta reanudar.
                    </div>
                  </div>
                )}
              </div>

              {/* Canal de Contacto Preferido */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-3 rounded-full bg-blue-600" />
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Canal de contacto preferido</Label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* WhatsApp Directo */}
                  <div
                    onClick={() => handleContactChannelChange("whatsapp")}
                    className={cn(
                      "group relative flex flex-col justify-between overflow-hidden border rounded-3xl p-5 cursor-pointer transition-all duration-300 bg-card select-none",
                      contactChannel === "whatsapp"
                        ? "border-emerald-500 shadow-sm bg-emerald-500/[0.02]"
                        : "border-border/60 hover:border-primary/50"
                    )}
                  >
                    <div className="flex justify-between items-center mb-4">
                      <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500 group-hover:scale-105 transition-transform">
                        <MessageCircle className="size-4 fill-emerald-500/10" />
                      </div>
                      {contactChannel === "whatsapp" && (
                        <div className="bg-emerald-500 text-white rounded-full p-0.5">
                          <Check className="size-3" />
                        </div>
                      )}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-foreground">WhatsApp Directo</h4>
                      <p className="text-[10px] text-muted-foreground mt-1 leading-normal">
                        Conexión express. Recomendado en Mérida y Playa para perfiles operativos.
                      </p>
                    </div>
                  </div>

                  {/* Llamada Telefónica */}
                  <div
                    onClick={() => handleContactChannelChange("phone")}
                    className={cn(
                      "group relative flex flex-col justify-between overflow-hidden border rounded-3xl p-5 cursor-pointer transition-all duration-300 bg-card select-none",
                      contactChannel === "phone"
                        ? "border-blue-500 shadow-sm bg-blue-500/[0.02]"
                        : "border-border/60 hover:border-primary/50"
                    )}
                  >
                    <div className="flex justify-between items-center mb-4">
                      <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500 group-hover:scale-105 transition-transform">
                        <Phone className="size-4" />
                      </div>
                      {contactChannel === "phone" && (
                        <div className="bg-blue-500 text-white rounded-full p-0.5">
                          <Check className="size-3" />
                        </div>
                      )}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-foreground">Llamada Telefónica</h4>
                      <p className="text-[10px] text-muted-foreground mt-1 leading-normal">
                        Entrevistas rápidas directas. Ideal para contactar de forma directa.
                      </p>
                    </div>
                  </div>

                  {/* Inbox K'anPro */}
                  <div
                    onClick={() => handleContactChannelChange("inbox")}
                    className={cn(
                      "group relative flex flex-col justify-between overflow-hidden border rounded-3xl p-5 cursor-pointer transition-all duration-300 bg-card select-none",
                      contactChannel === "inbox"
                        ? "border-blue-500 shadow-sm bg-blue-500/[0.02]"
                        : "border-border/60 hover:border-blue-500/50"
                    )}
                  >
                    <div className="flex justify-between items-center mb-4">
                      <div className="p-2 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 group-hover:scale-105 transition-transform">
                        <MessageSquare className="size-4" />
                      </div>
                      {contactChannel === "inbox" && (
                        <div className="bg-blue-600 text-white rounded-full p-0.5">
                          <Check className="size-3" />
                        </div>
                      )}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-foreground">Inbox K&apos;anPro</h4>
                      <p className="text-[10px] text-muted-foreground mt-1 leading-normal">
                        Mensajes integrados. Mantiene la privacidad de tu número y correo comercial.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SUBSCRIPTION & CREDITS (BENTO GRID) */}
          {activeTab === "credits" && (
            <div className="space-y-8">
              <div className="flex flex-col gap-1 border-b border-border/40 pb-4">
                <h1 className="text-xl font-bold tracking-tight text-foreground">Suscripción y Créditos</h1>
                <p className="text-xs text-muted-foreground">Controla tus gastos de publicación, recarga créditos y visualiza tu historial.</p>
              </div>

              {/* Bento Grid Layout */}
              <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
                
                {/* Bento Card 1: Plan Actual (Span 3) */}
                <Card className="md:col-span-3 flex flex-col justify-between glass-card border-border/40 bg-background/80 relative overflow-hidden group/card shadow-sm hover:translate-y-0 hover:shadow-sm">
                  {/* Subtle decorative color dot on corner */}
                  <div className={cn(
                    "absolute -top-12 -right-12 w-24 h-24 rounded-full blur-2xl opacity-20 transition-all duration-300",
                    currentPlan === "Gratis" && "bg-emerald-500",
                    currentPlan === "Destacado" && "bg-indigo-500",
                    currentPlan === "Enterprise" && "bg-amber-500"
                  )} />

                  <CardHeader className="pb-3 relative z-10">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Tu Membresía</span>
                      
                      {currentPlan === "Gratis" && (
                        <span className="inline-flex items-center px-2 py-0.5 text-[9px] font-semibold border rounded-full bg-emerald-50 text-emerald-700 border-emerald-200/50 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/40">
                          Plan Gratis
                        </span>
                      )}
                      {currentPlan === "Destacado" && (
                        <span className="inline-flex items-center px-2 py-0.5 text-[9px] font-semibold border rounded-full bg-indigo-50 text-indigo-700 border-indigo-200/50 dark:bg-indigo-950/20 dark:text-indigo-400 dark:border-indigo-900/40">
                          Plan Premium
                        </span>
                      )}
                      {currentPlan === "Enterprise" && (
                        <span className="inline-flex items-center px-2 py-0.5 text-[9px] font-semibold border rounded-full bg-amber-50 text-amber-700 border-amber-200/50 dark:bg-amber-950/20 dark:text-emerald-400 dark:border-emerald-900/40">
                          Plan Enterprise
                        </span>
                      )}
                    </div>
                    <CardTitle className="text-base font-bold text-foreground mt-2">
                      {currentPlan === "Gratis" && "K&apos;anPro Free"}
                      {currentPlan === "Destacado" && "K&apos;anPro Destacado"}
                      {currentPlan === "Enterprise" && "K&apos;anPro Enterprise"}
                    </CardTitle>
                    <CardDescription className="text-xs text-muted-foreground mt-1">
                      {currentPlan === "Gratis" && "Acceso inicial para pequeños negocios en Mérida y Riviera Maya."}
                      {currentPlan === "Destacado" && "Posicionamiento premium y créditos de publicación recurrentes."}
                      {currentPlan === "Enterprise" && "Créditos ilimitados y acompañamiento integral en contratación."}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="py-2 text-xs relative z-10 flex-1">
                    <ul className="space-y-2 mt-2">
                      <li className="flex items-center gap-2">
                        <Check className="size-3.5 text-emerald-500 flex-shrink-0" />
                        <span className="text-muted-foreground">Publicación de vacantes básicas</span>
                      </li>
                      <li className="flex items-center gap-2">
                        {currentPlan !== "Gratis" ? (
                          <Check className="size-3.5 text-emerald-500 flex-shrink-0" />
                        ) : (
                          <div className="w-3.5 h-3.5 flex items-center justify-center text-[10px] text-muted-foreground/60 border border-muted-foreground/30 rounded-full font-bold">✕</div>
                        )}
                        <span className={cn(currentPlan === "Gratis" && "text-muted-foreground/50 line-through")}>
                          Filtro geográfico avanzado (Mérida / Playa)
                        </span>
                      </li>
                      <li className="flex items-center gap-2">
                        {currentPlan === "Enterprise" ? (
                          <Check className="size-3.5 text-emerald-500 flex-shrink-0" />
                        ) : (
                          <div className="w-3.5 h-3.5 flex items-center justify-center text-[10px] text-muted-foreground/60 border border-muted-foreground/30 rounded-full font-bold">✕</div>
                        )}
                        <span className={cn(currentPlan !== "Enterprise" && "text-muted-foreground/50 line-through")}>
                          Ejecutivo de contratación dedicado
                        </span>
                      </li>
                    </ul>
                  </CardContent>

                  <CardFooter className="pt-4 pb-5 relative z-10 border-t border-border/20">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsPlanModalOpen(true)}
                      className="w-full rounded-2xl h-8 text-xs font-semibold select-none border-border"
                    >
                      <span>Cambiar de Plan</span>
                      <ArrowRight className="size-3 ml-1 transition-transform group-hover/button:translate-x-0.5" />
                    </Button>
                  </CardFooter>
                </Card>

                {/* Bento Card 2: Contador de Créditos (Span 3) */}
                <Card className="md:col-span-3 flex flex-col justify-between glass-card border-border/40 bg-background/80 relative overflow-hidden group/card shadow-sm hover:translate-y-0 hover:shadow-sm">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Créditos de Publicación</span>
                      <Sparkles className="size-3 text-indigo-500 fill-indigo-500/20" />
                    </div>
                  </CardHeader>

                  <CardContent className="py-2 flex-1 flex flex-col justify-center">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-4xl font-extrabold tracking-tight text-foreground font-mono">{credits}</span>
                      <span className="text-xs font-semibold text-muted-foreground">Disponibles</span>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1.5 mt-4">
                      <Progress value={credits} max={10} className="bg-blue-100 dark:bg-blue-950/40 h-2" />
                      <div className="flex justify-between text-[10px] text-muted-foreground">
                        <span>{credits} créditos</span>
                        <span>Límite de 10 mensuales</span>
                      </div>
                    </div>
                  </CardContent>

                  <CardFooter className="pt-3 pb-5 border-t border-border/20">
                    <Button
                      size="sm"
                      onClick={() => setIsBuyModalOpen(true)}
                      className="w-full rounded-2xl h-8 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-semibold shadow-sm select-none border-0"
                    >
                      Comprar Paquete
                    </Button>
                  </CardFooter>
                </Card>

                {/* Bento Card 3: Historial / Facturas (Span 6) */}
                <Card className="col-span-1 md:col-span-6 glass-card border-border/40 bg-background/80 shadow-sm hover:translate-y-0 hover:shadow-sm">
                  <CardHeader className="pb-3 flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-xs font-bold text-foreground flex items-center gap-1.5">
                        <History className="size-3.5 text-muted-foreground" />
                        Historial de Movimientos
                      </CardTitle>
                      <CardDescription className="text-[10px] text-muted-foreground mt-0.5">Últimos movimientos de créditos y cargos de facturación.</CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="divide-y divide-border/20 max-h-[220px] overflow-y-auto custom-scrollbar">
                      {history.map((tx) => (
                        <div key={tx.id} className="flex items-center justify-between p-4 hover:bg-muted/10 transition-colors">
                          <div className="flex items-start gap-3">
                            <div className={cn(
                              "w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold",
                              tx.type === "purchase" 
                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" 
                                : "bg-neutral-500/10 text-neutral-600 dark:text-neutral-400"
                            )}>
                              {tx.type === "purchase" ? "+" : "-"}
                            </div>
                            <div>
                              <h4 className="text-xs font-medium text-foreground">{tx.description}</h4>
                              <span className="text-[9px] text-muted-foreground block mt-0.5">{tx.date}</span>
                            </div>
                          </div>

                          <div className="text-right flex flex-col items-end">
                            <span className={cn(
                              "text-xs font-bold font-mono",
                              tx.type === "purchase" ? "text-emerald-500" : "text-foreground"
                            )}>
                              {tx.type === "purchase" ? `+${tx.credits}` : tx.credits} creds
                            </span>
                            {tx.amount && (
                              <span className="text-[9px] text-muted-foreground font-mono mt-0.5">{tx.amount}</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

              </div>
            </div>
          )}

        </div>
      </div>

      {/* 3. MODALS / DIALOGS (INTERACTIVE ACTIONS) */}
      
      {/* Credits Purchase Modal */}
      <Dialog open={isBuyModalOpen} onOpenChange={setIsBuyModalOpen}>
        <DialogContent className="max-w-md rounded-3xl border-border bg-popover/90 backdrop-blur-md">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-foreground">Comprar Paquete de Créditos</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-1">
              Selecciona el paquete que mejor se adapte al volumen de contratación de tu empresa en Riviera Maya.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3.5 my-4">
            {/* Package 1 */}
            <div
              onClick={() => setSelectedCreditsPackage({ credits: 1, price: "$99 MXN" })}
              className={cn(
                "flex items-center justify-between p-3.5 rounded-2xl border cursor-pointer transition-all duration-200 bg-card select-none",
                selectedCreditsPackage?.credits === 1
                  ? "border-blue-500 bg-blue-500/[0.01]"
                  : "border-border hover:border-blue-500/50"
              )}
            >
              <div>
                <h4 className="text-xs font-bold text-foreground">1 Crédito Básico</h4>
                <p className="text-[9px] text-muted-foreground mt-0.5">Ideal para una publicación esporádica.</p>
              </div>
              <span className="text-xs font-bold text-blue-600 dark:text-blue-400 font-mono">$99 MXN</span>
            </div>

            {/* Package 2 */}
            <div
              onClick={() => setSelectedCreditsPackage({ credits: 5, price: "$399 MXN" })}
              className={cn(
                "flex items-center justify-between p-3.5 rounded-2xl border cursor-pointer transition-all duration-200 bg-card select-none relative",
                selectedCreditsPackage?.credits === 5
                  ? "border-blue-500 bg-blue-500/[0.01]"
                  : "border-border hover:border-blue-500/50"
              )}
            >
              <div>
                <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  5 Créditos Pack
                  <span className="bg-emerald-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full uppercase">
                    Ahorro 20%
                  </span>
                </h4>
                <p className="text-[9px] text-muted-foreground mt-0.5">Recomendado para reclutadores activos.</p>
              </div>
              <span className="text-xs font-bold text-blue-600 dark:text-blue-400 font-mono">$399 MXN</span>
            </div>

            {/* Package 3 */}
            <div
              onClick={() => setSelectedCreditsPackage({ credits: 10, price: "$699 MXN" })}
              className={cn(
                "flex items-center justify-between p-3.5 rounded-2xl border cursor-pointer transition-all duration-200 bg-card select-none",
                selectedCreditsPackage?.credits === 10
                  ? "border-blue-500 bg-blue-500/[0.01]"
                  : "border-border hover:border-blue-500/50"
              )}
            >
              <div>
                <h4 className="text-xs font-bold text-foreground">10 Créditos Pro</h4>
                <p className="text-[9px] text-muted-foreground mt-0.5">Para agencias de empleo y reclutadores recurrentes.</p>
              </div>
              <span className="text-xs font-bold text-blue-600 dark:text-blue-400 font-mono">$699 MXN</span>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => {
                setIsBuyModalOpen(false)
                setSelectedCreditsPackage(null)
              }}
              className="rounded-2xl text-xs font-semibold h-8 select-none border-border"
            >
              Cancelar
            </Button>
            <Button
              disabled={!selectedCreditsPackage}
              onClick={handleConfirmPurchase}
              className="rounded-2xl text-xs font-semibold h-8 select-none bg-blue-600 text-white hover:bg-blue-700"
            >
              Confirmar Pago
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Plan Selection Modal */}
      <Dialog open={isPlanModalOpen} onOpenChange={setIsPlanModalOpen}>
        <DialogContent className="max-w-xl rounded-3xl border-border bg-popover/90 backdrop-blur-md">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-foreground">Actualizar Plan de Suscripción</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-1">
              Lleva la visibilidad de tu marca empleadora al siguiente nivel en el Caribe Mexicano.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 my-4">
            {/* Tier 1: Gratis */}
            <div
              className={cn(
                "flex flex-col justify-between p-4 rounded-2xl border bg-card text-center gap-4 relative",
                currentPlan === "Gratis" ? "border-blue-500/50" : "border-border/60"
              )}
            >
              <div>
                <h4 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Free</h4>
                <span className="text-lg font-bold text-foreground block mt-1.5 font-mono">$0 MXN</span>
                <p className="text-[9px] text-muted-foreground mt-1 leading-normal">Vacantes básicas y limitadas sin costo.</p>
              </div>
              <Button
                variant={currentPlan === "Gratis" ? "outline" : "default"}
                size="xs"
                disabled={currentPlan === "Gratis"}
                onClick={() => handleSelectPlan("Gratis")}
                className="w-full rounded-xl select-none"
              >
                {currentPlan === "Gratis" ? "Activo" : "Seleccionar"}
              </Button>
            </div>

            {/* Tier 2: Destacado */}
            <div
              className={cn(
                "flex flex-col justify-between p-4 rounded-2xl border bg-card text-center gap-4 relative overflow-hidden",
                currentPlan === "Destacado" ? "border-indigo-500 bg-indigo-500/[0.01]" : "border-border/60"
              )}
            >
              <div className="absolute top-0 right-0 left-0 bg-indigo-500 text-white text-[7px] font-extrabold py-0.5 uppercase tracking-wide">
                Recomendado
              </div>
              <div className="pt-2">
                <h4 className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Premium</h4>
                <span className="text-lg font-bold text-foreground block mt-1.5 font-mono">$499 MXN</span>
                <span className="text-[8px] text-muted-foreground -mt-1 block">al mes</span>
                <p className="text-[9px] text-muted-foreground mt-1 leading-normal">Incluye 10 créditos mensuales y visibilidad VIP.</p>
              </div>
              <Button
                variant={currentPlan === "Destacado" ? "outline" : "default"}
                size="xs"
                disabled={currentPlan === "Destacado"}
                onClick={() => handleSelectPlan("Destacado")}
                className="w-full rounded-xl select-none bg-indigo-600 text-white hover:bg-indigo-700 border-0"
              >
                {currentPlan === "Destacado" ? "Activo" : "Actualizar"}
              </Button>
            </div>

            {/* Tier 3: Enterprise */}
            <div
              className={cn(
                "flex flex-col justify-between p-4 rounded-2xl border bg-card text-center gap-4",
                currentPlan === "Enterprise" ? "border-amber-500 bg-amber-500/[0.01]" : "border-border/60"
              )}
            >
              <div>
                <h4 className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider font-semibold">Enterprise</h4>
                <span className="text-lg font-bold text-foreground block mt-1.5 font-mono">$1,499 MXN</span>
                <span className="text-[8px] text-muted-foreground -mt-1 block">al mes</span>
                <p className="text-[9px] text-muted-foreground mt-1 leading-normal">Créditos ilimitados y soporte premium.</p>
              </div>
              <Button
                variant={currentPlan === "Enterprise" ? "outline" : "default"}
                size="xs"
                disabled={currentPlan === "Enterprise"}
                onClick={() => handleSelectPlan("Enterprise")}
                className="w-full rounded-xl select-none bg-amber-500 text-white hover:bg-amber-600 border-0"
              >
                {currentPlan === "Enterprise" ? "Activo" : "Actualizar"}
              </Button>
            </div>
          </div>
          
          <div className="flex justify-end pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsPlanModalOpen(false)}
              className="rounded-xl text-xs font-semibold h-8 select-none border-border"
            >
              Cerrar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
