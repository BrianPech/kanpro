"use client"

import * as React from "react"
import { Settings, Shield, Globe, Lock, Bell, Database, Palette, ChevronRight } from "lucide-react"

const settingsSections = [
  {
    icon: <Shield className="h-5 w-5" />,
    title: "Seguridad",
    description: "Políticas de acceso, autenticación y permisos",
    color: "#494fdf",
  },
  {
    icon: <Globe className="h-5 w-5" />,
    title: "Configuración Global",
    description: "Idioma, moneda, regiones y preferencias generales",
    color: "#00a87e",
  },
  {
    icon: <Lock className="h-5 w-5" />,
    title: "Privacidad",
    description: "Políticas de datos, cookies y consentimiento",
    color: "#007bc2",
  },
  {
    icon: <Bell className="h-5 w-5" />,
    title: "Notificaciones",
    description: "Plantillas de email, alertas y notificaciones push",
    color: "#ec7e00",
  },
  {
    icon: <Database className="h-5 w-5" />,
    title: "Datos",
    description: "Respaldos, migraciones y mantenimiento",
    color: "#428619",
  },
  {
    icon: <Palette className="h-5 w-5" />,
    title: "Personalización",
    description: "Temas, marca blanca y assets visuales",
    color: "#e61e49",
  },
]

export default function AdminSettingsPage() {
  return (
    <div className="flex flex-col gap-10 p-6 md:p-12 lg:p-16 max-w-[1400px] mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
            <Settings className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-[28px] md:text-[36px] font-medium tracking-tighter leading-[1.0]">
              Configuración
            </h1>
            <p className="text-[15px] text-muted-foreground mt-1">
              Administra la configuración global de la plataforma
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {settingsSections.map((section) => (
          <button
            key={section.title}
            className="bg-card text-card-foreground border border-border/50 rounded-[24px] p-[28px] flex flex-col gap-5 shadow-sm hover:border-foreground/20 hover:shadow-md transition-all group text-left"
          >
            <div
              className="h-12 w-12 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-500 ease-out"
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
    </div>
  )
}
