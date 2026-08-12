"use client"

import * as React from "react"
import { toast } from "sonner"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Shield,
  Globe,
  Lock,
  Bell,
  Database,
  Palette,
  HelpCircle,
  Save,
  CheckCircle2,
  Settings,
} from "lucide-react"

export interface SettingsDialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  trigger?: React.ReactNode
  defaultCategory?: string
}

const categories = [
  {
    id: "general",
    name: "Configuración Global",
    icon: Globe,
    description: "Idioma, zona horaria y moneda de la plataforma",
  },
  {
    id: "security",
    name: "Seguridad y Permisos",
    icon: Shield,
    description: "Políticas de acceso, autenticación en 2 pasos y sesiones",
  },
  {
    id: "notifications",
    name: "Notificaciones",
    icon: Bell,
    description: "Alertas automáticas, correos y webhooks de eventos",
  },
  {
    id: "privacy",
    name: "Privacidad y Datos",
    icon: Lock,
    description: "Retención de postulaciones y cumplimiento RGPD",
  },
  {
    id: "database",
    name: "Base de Datos",
    icon: Database,
    description: "Estado de almacenamiento Supabase y copias de seguridad",
  },
  {
    id: "appearance",
    name: "Personalización",
    icon: Palette,
    description: "Aspecto visual, colores de marca e insignias",
  },
  {
    id: "support",
    name: "Ayuda y Soporte",
    icon: HelpCircle,
    description: "Información del sistema y canales de asistencia",
  },
]

export function SettingsDialog({
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  trigger,
  defaultCategory = "general",
}: SettingsDialogProps) {
  const [internalOpen, setInternalOpen] = React.useState(false)
  const [activeCategory, setActiveCategory] = React.useState(defaultCategory)
  const [isSaving, setIsSaving] = React.useState(false)

  // Sync category if defaultCategory prop changes when dialog opens
  React.useEffect(() => {
    if (defaultCategory) {
      setActiveCategory(defaultCategory)
    }
  }, [defaultCategory])

  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : internalOpen
  const setOpen = (value: boolean) => {
    if (isControlled) {
      controlledOnOpenChange?.(value)
    } else {
      setInternalOpen(value)
    }
  }

  const handleSave = () => {
    setIsSaving(true)
    setTimeout(() => {
      setIsSaving(false)
      toast.success("Configuración actualizada correctamente", {
        description: "Los cambios se han aplicado al sistema K'anPro.",
      })
    }, 600)
  }

  const currentCatObj =
    categories.find((c) => c.id === activeCategory) || categories[0]

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="overflow-hidden p-0 w-full sm:max-w-[840px] md:max-w-[920px] lg:max-w-[980px] h-[620px] max-h-[85vh] gap-0 border-border/40 shadow-2xl rounded-2xl">
        <DialogTitle className="sr-only">Configuración K'anPro</DialogTitle>
        <DialogDescription className="sr-only">
          Panel de configuración del sistema para administradores
        </DialogDescription>
        <SidebarProvider className="items-start h-full min-h-0">
          <Sidebar
            collapsible="none"
            className="w-[240px] shrink-0 border-r border-border/15 bg-zinc-50/70 dark:bg-zinc-950/60 h-full flex flex-col justify-between"
          >
            <SidebarContent className="p-2 gap-1">
              <div className="px-3 py-3 flex items-center gap-2 mb-1 border-b border-border/10">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Settings className="size-4" />
                </div>
                <span className="text-sm font-bold tracking-tight text-foreground">
                  Ajustes Sistema
                </span>
              </div>
              <SidebarGroup className="p-0">
                <SidebarGroupContent>
                  <SidebarMenu className="gap-1">
                    {categories.map((item) => {
                      const Icon = item.icon
                      const isActive = activeCategory === item.id
                      return (
                        <SidebarMenuItem key={item.id}>
                          <SidebarMenuButton
                            isActive={isActive}
                            onClick={() => setActiveCategory(item.id)}
                            className="h-9 rounded-lg px-3 gap-2.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-all cursor-pointer data-[active=true]:bg-primary/10 dark:data-[active=true]:bg-primary/20 data-[active=true]:text-primary data-[active=true]:font-semibold"
                          >
                            <Icon className="size-4 shrink-0" />
                            <span className="truncate">{item.name}</span>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      )
                    })}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>

            <div className="p-3 border-t border-border/10">
              <div className="flex items-center justify-between text-[11px] text-muted-foreground font-medium px-1">
                <span>Versión K'anPro</span>
                <Badge variant="outline" className="text-[10px] h-5 font-bold">
                  v2.4.0
                </Badge>
              </div>
            </div>
          </Sidebar>

          <main className="flex h-full flex-1 flex-col overflow-hidden bg-background">
            <header className="flex h-14 shrink-0 items-center justify-between border-b border-border/10 px-6 pr-12 bg-card/40">
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem className="hidden md:block">
                    <BreadcrumbLink href="#" onClick={(e) => e.preventDefault()}>
                      Administración
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="hidden md:block" />
                  <BreadcrumbItem>
                    <BreadcrumbPage className="font-semibold text-foreground">
                      {currentCatObj.name}
                    </BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </header>

            <div className="flex-1 overflow-y-auto p-6">
              {activeCategory === "general" && (
                <div className="flex flex-col gap-6 animate-in fade-in-50 duration-200">
                  <div>
                    <h3 className="text-base font-bold text-foreground">
                      Configuración Global
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Define los parámetros principales del sistema K'anPro.
                    </p>
                  </div>
                  <Separator />

                  <div className="grid gap-4">
                    <div className="grid gap-1.5">
                      <Label htmlFor="site-name" className="text-xs font-semibold">
                        Nombre de la Aplicación
                      </Label>
                      <Input
                        id="site-name"
                        defaultValue="K'anPro Platform"
                        className="h-9 text-xs"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-1.5">
                        <Label htmlFor="language" className="text-xs font-semibold">
                          Idioma Principal
                        </Label>
                        <Select defaultValue="es">
                          <SelectTrigger id="language" className="h-9 text-xs">
                            <SelectValue placeholder="Seleccionar idioma" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="es">Español (Latam)</SelectItem>
                            <SelectItem value="en">English (US)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid gap-1.5">
                        <Label htmlFor="timezone" className="text-xs font-semibold">
                          Zona Horaria
                        </Label>
                        <Select defaultValue="America/Mexico_City">
                          <SelectTrigger id="timezone" className="h-9 text-xs">
                            <SelectValue placeholder="Seleccionar zona" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="America/Mexico_City">
                              Ciudad de México (GMT-6)
                            </SelectItem>
                            <SelectItem value="America/Bogota">
                              Bogotá (GMT-5)
                            </SelectItem>
                            <SelectItem value="America/Santiago">
                              Santiago (GMT-4)
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid gap-1.5">
                      <Label htmlFor="currency" className="text-xs font-semibold">
                        Moneda por Defecto
                      </Label>
                      <Select defaultValue="MXN">
                        <SelectTrigger id="currency" className="h-9 text-xs">
                          <SelectValue placeholder="Moneda" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MXN">Peso Mexicano ($ MXN)</SelectItem>
                          <SelectItem value="USD">Dólar ($ USD)</SelectItem>
                          <SelectItem value="EUR">Euro (€ EUR)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}

              {activeCategory === "security" && (
                <div className="flex flex-col gap-6 animate-in fade-in-50 duration-200">
                  <div>
                    <h3 className="text-base font-bold text-foreground">
                      Seguridad y Autenticación
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Gestiona los niveles de acceso y políticas de contraseñas.
                    </p>
                  </div>
                  <Separator />

                  <div className="flex flex-col gap-5">
                    <div className="flex items-center justify-between rounded-xl border border-border/40 p-4 bg-muted/20">
                      <div className="grid gap-0.5">
                        <span className="text-xs font-bold text-foreground">
                          Autenticación de 2 Factores (2FA) Obligatoria
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          Exigir 2FA a todos los usuarios con rol Administrador.
                        </span>
                      </div>
                      <Switch defaultChecked />
                    </div>

                    <div className="flex items-center justify-between rounded-xl border border-border/40 p-4 bg-muted/20">
                      <div className="grid gap-0.5">
                        <span className="text-xs font-bold text-foreground">
                          Expiración de Sesión Inactiva
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          Cerrar sesión tras 30 minutos sin interacción.
                        </span>
                      </div>
                      <Switch defaultChecked />
                    </div>

                    <div className="grid gap-1.5">
                      <Label htmlFor="max-attempts" className="text-xs font-semibold">
                        Intentos Fallidos de Inicio de Sesión Máximos
                      </Label>
                      <Input
                        id="max-attempts"
                        type="number"
                        defaultValue="5"
                        className="h-9 text-xs w-32"
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeCategory === "notifications" && (
                <div className="flex flex-col gap-6 animate-in fade-in-50 duration-200">
                  <div>
                    <h3 className="text-base font-bold text-foreground">
                      Alertas y Notificaciones
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Configura canales de correo y notificaciones push.
                    </p>
                  </div>
                  <Separator />

                  <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between rounded-xl border border-border/40 p-4 bg-muted/20">
                      <div className="grid gap-0.5">
                        <span className="text-xs font-bold text-foreground">
                          Notificaciones de Nuevos Candidatos
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          Enviar resumen diario por correo a reclutadores.
                        </span>
                      </div>
                      <Switch defaultChecked />
                    </div>

                    <div className="flex items-center justify-between rounded-xl border border-border/40 p-4 bg-muted/20">
                      <div className="grid gap-0.5">
                        <span className="text-xs font-bold text-foreground">
                          Alertas de Desviación de SLA
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          Notificar de inmediato cuando una respuesta supere el límite.
                        </span>
                      </div>
                      <Switch defaultChecked />
                    </div>

                    <div className="grid gap-1.5 mt-2">
                      <Label htmlFor="admin-email" className="text-xs font-semibold">
                        Email Principal de Notificaciones del Sistema
                      </Label>
                      <Input
                        id="admin-email"
                        defaultValue="admin@kanpro.com"
                        className="h-9 text-xs"
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeCategory === "privacy" && (
                <div className="flex flex-col gap-6 animate-in fade-in-50 duration-200">
                  <div>
                    <h3 className="text-base font-bold text-foreground">
                      Privacidad y Retención de Datos
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Controla la política de almacenamiento y cumplimiento normativo.
                    </p>
                  </div>
                  <Separator />

                  <div className="flex flex-col gap-4">
                    <div className="grid gap-1.5">
                      <Label htmlFor="retention" className="text-xs font-semibold">
                        Tiempo de Retención de Hojas de Vida (Meses)
                      </Label>
                      <Select defaultValue="12">
                        <SelectTrigger id="retention" className="h-9 text-xs">
                          <SelectValue placeholder="Retención" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="6">6 Meses</SelectItem>
                          <SelectItem value="12">12 Meses</SelectItem>
                          <SelectItem value="24">24 Meses</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center justify-between rounded-xl border border-border/40 p-4 bg-muted/20 mt-2">
                      <div className="grid gap-0.5">
                        <span className="text-xs font-bold text-foreground">
                          Anonimización Automática de Candidatos Rechazados
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          Remover datos personales una vez finalizado el proceso.
                        </span>
                      </div>
                      <Switch defaultChecked={false} />
                    </div>
                  </div>
                </div>
              )}

              {activeCategory === "database" && (
                <div className="flex flex-col gap-6 animate-in fade-in-50 duration-200">
                  <div>
                    <h3 className="text-base font-bold text-foreground">
                      Base de Datos (Supabase Postgres)
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Mantenimiento y respaldos del motor de datos.
                    </p>
                  </div>
                  <Separator />

                  <div className="grid gap-4">
                    <div className="flex items-center justify-between rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4">
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="size-5 text-emerald-600 dark:text-emerald-400" />
                        <div className="grid gap-0.5">
                          <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                            Estado de la Base de Datos: Saludable
                          </span>
                          <span className="text-[11px] text-emerald-700 dark:text-emerald-300">
                            Conexiones activas: 12 / 100 • Latencia: 18ms
                          </span>
                        </div>
                      </div>
                      <Badge className="bg-emerald-600 text-white hover:bg-emerald-700">
                        Online
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between rounded-xl border border-border/40 p-4 bg-muted/20">
                      <div className="grid gap-0.5">
                        <span className="text-xs font-bold text-foreground">
                          Respaldos Automáticos Diarios
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          Último respaldo ejecutado a las 03:00 AM.
                        </span>
                      </div>
                      <Switch defaultChecked />
                    </div>
                  </div>
                </div>
              )}

              {activeCategory === "appearance" && (
                <div className="flex flex-col gap-6 animate-in fade-in-50 duration-200">
                  <div>
                    <h3 className="text-base font-bold text-foreground">
                      Personalización Visual
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Ajusta la apariencia del panel de administración.
                    </p>
                  </div>
                  <Separator />

                  <div className="grid gap-4">
                    <div className="grid gap-1.5">
                      <Label htmlFor="theme" className="text-xs font-semibold">
                        Tema Predeterminado
                      </Label>
                      <Select defaultValue="system">
                        <SelectTrigger id="theme" className="h-9 text-xs">
                          <SelectValue placeholder="Tema" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="light">Claro</SelectItem>
                          <SelectItem value="dark">Oscuro</SelectItem>
                          <SelectItem value="system">Sistema</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}

              {activeCategory === "support" && (
                <div className="flex flex-col gap-6 animate-in fade-in-50 duration-200">
                  <div>
                    <h3 className="text-base font-bold text-foreground">
                      Ayuda y Soporte Técnico
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Recursos de ayuda y contacto directo con desarrollo.
                    </p>
                  </div>
                  <Separator />

                  <div className="grid gap-4">
                    <div className="rounded-xl border border-border/40 p-4 bg-muted/20 flex flex-col gap-2">
                      <span className="text-xs font-bold text-foreground">
                        Soporte de Plataforma K'anPro
                      </span>
                      <p className="text-[12px] text-muted-foreground leading-relaxed">
                        Para incidencias críticas o requerimientos de infraestructura, contacta con el equipo de soporte técnico.
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        <Button variant="outline" size="sm" className="h-8 text-xs font-semibold">
                          soporte@kanpro.com
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <footer className="flex h-14 shrink-0 items-center justify-between border-t border-border/10 px-6 bg-card/40">
              <div className="text-[11px] text-muted-foreground font-medium flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Panel de administración activo</span>
              </div>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={isSaving}
                className="h-9 gap-1.5 px-4 text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer"
              >
                {isSaving ? (
                  <span className="animate-spin text-xs">⏳</span>
                ) : (
                  <Save className="size-3.5" />
                )}
                Guardar Cambios
              </Button>
            </footer>
          </main>
        </SidebarProvider>
      </DialogContent>
    </Dialog>
  )
}



