"use client"

import * as React from "react"
import { Settings, Shield, Globe, Lock, Bell, Database, Palette, ChevronRight, SlidersHorizontal } from "@/components/ui/icons"
import { Button } from "@/components/ui/button"
import { SettingsDialog } from "@/modules/admin/components/settings-dialog"

const settingsSections = [
  {
    id: "demo_rollout",
    icon: <SlidersHorizontal className="h-5 w-5" />,
    title: "Fases DEMO (Empresas)",
    description: "Controla qué herramientas se desbloquean cada semana para las empresas participantes",
    color: "#8b5cf6",
  },
  {
    id: "security",
    icon: <Shield className="h-5 w-5" />,
    title: "Seguridad",
    description: "Políticas de acceso, autenticación en 2 pasos y permisos",
    color: "#494fdf",
  },
  {
    id: "general",
    icon: <Globe className="h-5 w-5" />,
    title: "Configuración Global",
    description: "Idioma, moneda, regiones y preferencias generales",
    color: "#00a87e",
  },
  {
    id: "privacy",
    icon: <Lock className="h-5 w-5" />,
    title: "Privacidad",
    description: "Políticas de datos, cookies y cumplimiento RGPD",
    color: "#007bc2",
  },
  {
    id: "notifications",
    icon: <Bell className="h-5 w-5" />,
    title: "Notificaciones",
    description: "Plantillas de email, alertas de SLAs y webhooks",
    color: "#ec7e00",
  },
  {
    id: "database",
    icon: <Database className="h-5 w-5" />,
    title: "Datos",
    description: "Estado de la base de datos Supabase, respaldos y logs",
    color: "#428619",
  },
  {
    id: "appearance",
    icon: <Palette className="h-5 w-5" />,
    title: "Personalización",
    description: "Temas visuales, marcas y personalización de interfaz",
    color: "#e61e49",
  },
]

export default function AdminSettingsPage() {
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [selectedCategory, setSelectedCategory] = React.useState("general")

  const handleOpenCategory = (catId: string) => {
    setSelectedCategory(catId)
    setDialogOpen(true)
  }

  return (
    <div className="flex flex-col gap-10 p-6 md:p-12 lg:p-16 max-w-[1400px] mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
            <Settings className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-[28px] md:text-[36px] font-bold tracking-tight leading-[1.0]">
              Configuración del Sistema
            </h1>
            <p className="text-[14px] text-muted-foreground mt-1">
              Administra los parámetros centrales del panel de control K&apos;anPro
            </p>
          </div>
        </div>

        <Button
          onClick={() => handleOpenCategory("general")}
          className="h-11 px-5 rounded-xl font-bold gap-2 text-sm shadow-md hover:shadow-lg transition-all cursor-pointer"
        >
          <SlidersHorizontal className="size-4 stroke-[2.5]" />
          <span>Abrir Panel de Ajustes</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {settingsSections.map((section) => (
          <button
            key={section.title}
            onClick={() => handleOpenCategory(section.id)}
            className="bg-card text-card-foreground border border-border/50 rounded-[24px] p-[28px] flex flex-col gap-5 shadow-sm hover:border-foreground/20 hover:shadow-md transition-all group text-left cursor-pointer active:scale-[0.99]"
          >
            <div
              className="h-12 w-12 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-500 ease-out shrink-0"
              style={{ backgroundColor: `${section.color}15`, color: section.color }}
            >
              {section.icon}
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <h3 className="text-[18px] font-semibold text-foreground tracking-tight">
                  {section.title}
                </h3>
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
              </div>
              <p className="text-[14px] text-muted-foreground leading-relaxed">
                {section.description}
              </p>
            </div>
          </button>
        ))}
      </div>

      <SettingsDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        defaultCategory={selectedCategory}
      />
    </div>
  )
}

