"use client"

import * as React from "react"
import { Building2, Globe, MapPin, Loader2, Phone, ImageIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

import { useCompanyProfileForm } from "../hooks/use-company-profile-form";

export function CompanyProfileForm({ initialProfile, userId }: { initialProfile: any, userId: string }) {
  const {
    profile,
    setProfile,
    isSaving,
    handleSave,
    handleReset,
  } = useCompanyProfileForm(initialProfile, userId);

  return (
    <div className="space-y-6">
      {/* Card 1: Banner + Perfil + Información Básica */}
      <div className="bg-card rounded-[20px] border border-border/50 shadow-sm overflow-hidden">
        {/* Banner con gradiente de la marca */}
        <div className="h-32 bg-gradient-to-r from-[#494fdf] via-[#4f55f1] to-[#3a40c4] relative">
          <div className="absolute inset-0 bg-black/10"></div>
        </div>
        
        <div className="p-6 md:p-8">
          {/* Foto de Perfil (Logo) superpuesta */}
          <div className="relative -mt-16 mb-6">
            <div className="w-24 h-24 bg-background rounded-[16px] border-4 border-card shadow-md flex items-center justify-center overflow-hidden group hover:scale-105 transition-transform duration-300">
              {profile.logo_url ? (
                <img src={profile.logo_url} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <Building2 className="w-10 h-10 text-muted-foreground/50 group-hover:text-[#494fdf] transition-colors" />
              )}
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-[16px] font-semibold text-foreground flex items-center gap-2">
              <span className="w-1 h-4 bg-[#494fdf] rounded-full"></span>
              Información Básica
            </h3>
            
            <div className="grid gap-6 md:grid-cols-2">
              {/* Nombre de la Empresa */}
              <div className="flex flex-col gap-2">
                <Label className="text-[14px] font-medium text-foreground">
                  Nombre de la Empresa *
                </Label>
                <div className="relative">
                  <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input 
                    placeholder="Ej: K'anPro Technologies" 
                    value={profile.company_name}
                    onChange={(e) => setProfile({...profile, company_name: e.target.value})}
                    className="h-[52px] pl-12 rounded-[10px] bg-muted/30 border-border/50 hover:border-border focus-visible:border-[#494fdf] focus-visible:ring-[#494fdf]/20 text-[15px] transition-all"
                  />
                </div>
              </div>

              {/* Sector / Industria */}
              <div className="flex flex-col gap-2">
                <Label className="text-[14px] font-medium text-foreground">
                  Sector / Industria *
                </Label>
                <Select 
                  value={profile.industry} 
                  onValueChange={(value) => setProfile({...profile, industry: value})}
                >
                  <SelectTrigger className="h-[52px] rounded-[10px] bg-muted/30 border-border/50 hover:border-border focus:border-[#494fdf] focus:ring-[#494fdf]/20 text-[15px] transition-all">
                    <SelectValue placeholder="Selecciona un sector" />
                  </SelectTrigger>
                  <SelectContent className="rounded-[10px]">
                    <SelectItem value="Tecnología">Tecnología</SelectItem>
                    <SelectItem value="Diseño">Diseño</SelectItem>
                    <SelectItem value="Marketing">Marketing</SelectItem>
                    <SelectItem value="Finanzas">Finanzas</SelectItem>
                    <SelectItem value="Educación">Educación</SelectItem>
                    <SelectItem value="Salud">Salud</SelectItem>
                    <SelectItem value="Otro">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Sitio Web o LinkedIn */}
              <div className="flex flex-col gap-2">
                <Label className="text-[14px] font-medium text-foreground">
                  Sitio Web o LinkedIn *
                </Label>
                <div className="relative">
                  <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input 
                    placeholder="https://tuempresa.com" 
                    value={profile.website_or_linkedin}
                    onChange={(e) => setProfile({...profile, website_or_linkedin: e.target.value})}
                    className="h-[52px] pl-12 rounded-[10px] bg-muted/30 border-border/50 hover:border-border focus-visible:border-[#494fdf] focus-visible:ring-[#494fdf]/20 text-[15px] transition-all"
                  />
                </div>
              </div>

              {/* Ubicación */}
              <div className="flex flex-col gap-2">
                <Label className="text-[14px] font-medium text-foreground">
                  Ubicación *
                </Label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input 
                    placeholder="Ciudad de México, México" 
                    value={profile.location}
                    onChange={(e) => setProfile({...profile, location: e.target.value})}
                    className="h-[52px] pl-12 rounded-[10px] bg-muted/30 border-border/50 hover:border-border focus-visible:border-[#494fdf] focus-visible:ring-[#494fdf]/20 text-[15px] transition-all"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Card 2: Configuración Adicional */}
      <div className="bg-card rounded-[20px] p-6 md:p-8 border border-border/50 shadow-sm space-y-6">
        <h3 className="text-[16px] font-semibold text-foreground flex items-center gap-2">
          <span className="w-1 h-4 bg-[#494fdf] rounded-full"></span>
          Configuración Adicional
        </h3>
        
        <div className="grid gap-6 md:grid-cols-2">
          {/* Logo URL */}
          <div className="flex flex-col gap-2">
            <Label className="text-[14px] font-medium text-foreground">
              URL del Logo
            </Label>
            <div className="relative">
              <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input 
                placeholder="https://tuempresa.com/logo.png" 
                value={profile.logo_url || ""}
                onChange={(e) => setProfile({...profile, logo_url: e.target.value})}
                className="h-[52px] pl-12 rounded-[10px] bg-muted/30 border-border/50 hover:border-border focus-visible:border-[#494fdf] focus-visible:ring-[#494fdf]/20 text-[15px] transition-all"
              />
            </div>
          </div>

          {/* Teléfono */}
          <div className="flex flex-col gap-2">
            <Label className="text-[14px] font-medium text-foreground">
              Teléfono
            </Label>
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input 
                type="tel"
                placeholder="+52 55 1234 5678" 
                value={profile.phone || ""}
                onChange={(e) => setProfile({...profile, phone: e.target.value})}
                className="h-[52px] pl-12 rounded-[10px] bg-muted/30 border-border/50 hover:border-border focus-visible:border-[#494fdf] focus-visible:ring-[#494fdf]/20 text-[15px] transition-all"
              />
            </div>
          </div>

          {/* Tamaño de la Empresa */}
          <div className="flex flex-col gap-2">
            <Label className="text-[14px] font-medium text-foreground">
              Tamaño de la Empresa
            </Label>
            <Select 
              value={profile.company_size || ""} 
              onValueChange={(value) => setProfile({...profile, company_size: value})}
            >
              <SelectTrigger className="h-[52px] rounded-[10px] bg-muted/30 border-border/50 hover:border-border focus:border-[#494fdf] focus:ring-[#494fdf]/20 text-[15px] transition-all">
                <SelectValue placeholder="Selecciona el tamaño" />
              </SelectTrigger>
              <SelectContent className="rounded-[10px]">
                <SelectItem value="1-10">1-10 empleados</SelectItem>
                <SelectItem value="11-50">11-50 empleados</SelectItem>
                <SelectItem value="51-200">51-200 empleados</SelectItem>
                <SelectItem value="201-500">201-500 empleados</SelectItem>
                <SelectItem value="500+">Más de 500 empleados</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Descripción (Abarca 2 columnas en desktop) */}
          <div className="flex flex-col gap-2 md:col-span-2">
            <Label className="text-[14px] font-medium text-foreground">
              Descripción (Máx. 300 car.)
            </Label>
            <div className="relative">
              <Textarea 
                placeholder="Cuéntanos sobre tu empresa..." 
                value={profile.description || ""}
                onChange={(e) => setProfile({...profile, description: e.target.value.slice(0, 300)})}
                className="min-h-[100px] p-4 rounded-[10px] bg-muted/30 border-border/50 hover:border-border focus-visible:border-[#494fdf] focus-visible:ring-[#494fdf]/20 text-[15px] transition-all resize-none"
              />
              <div className="text-xs text-muted-foreground text-right mt-1">
                {(profile.description || "").length}/300
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Botones de Acción Globales */}
      <div className="flex justify-end gap-4">
        <Button 
          variant="ghost" 
          className="h-[48px] rounded-full px-6 text-[15px] font-semibold hover:bg-muted"
          onClick={handleReset}
        >
          Descartar
        </Button>
        <Button 
          onClick={handleSave}
          disabled={isSaving}
          className="h-[48px] rounded-full px-8 text-[15px] font-semibold bg-[#494fdf] text-white hover:bg-[#4f55f1] shadow-lg hover:shadow-[#494fdf]/25 transition-all duration-300 hover:scale-[1.02]"
        >
          {isSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Guardando...</> : "Guardar Cambios"}
        </Button>
      </div>
    </div>
  )
}
