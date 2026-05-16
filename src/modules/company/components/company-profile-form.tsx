"use client"

import * as React from "react"
import { Building2, Globe, MapPin, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

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
    <div className="bg-card rounded-[32px] p-8 md:p-10 border border-border/50 shadow-sm relative overflow-hidden">
      {/* Accent Line as per DESIGN.md (Revolut style) */}
      <div className="absolute top-0 left-0 w-full h-1 bg-primary"></div>
      
      <div className="grid gap-8">
        {/* Nombre de la Empresa */}
        <div className="flex flex-col gap-3">
          <Label className="text-[12px] uppercase tracking-[0.15em] text-muted-foreground font-semibold">
            Nombre de la Empresa *
          </Label>
          <div className="relative">
            <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input 
              placeholder="Ej: K'anPro Technologies" 
              value={profile.company_name}
              onChange={(e) => setProfile({...profile, company_name: e.target.value})}
              className="h-[56px] pl-12 rounded-[12px] bg-muted/30 border-border/50 hover:border-border focus-visible:border-primary focus-visible:ring-primary/20 text-[15px] transition-all"
            />
          </div>
        </div>

        {/* Sector / Industria */}
        <div className="flex flex-col gap-3">
          <Label className="text-[12px] uppercase tracking-[0.15em] text-muted-foreground font-semibold">
            Sector / Industria
          </Label>
          <Select 
            value={profile.industry} 
            onValueChange={(value) => setProfile({...profile, industry: value})}
          >
            <SelectTrigger className="h-[56px] rounded-[12px] bg-muted/30 border-border/50 hover:border-border focus:border-primary focus:ring-primary/20 text-[15px] transition-all">
              <SelectValue placeholder="Selecciona un sector" />
            </SelectTrigger>
            <SelectContent className="rounded-[12px]">
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
        <div className="flex flex-col gap-3">
          <Label className="text-[12px] uppercase tracking-[0.15em] text-muted-foreground font-semibold">
            Sitio Web o LinkedIn
          </Label>
          <div className="relative">
            <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input 
              placeholder="https://tuempresa.com o linkedin.com/company/..." 
              value={profile.website_or_linkedin}
              onChange={(e) => setProfile({...profile, website_or_linkedin: e.target.value})}
              className="h-[56px] pl-12 rounded-[12px] bg-muted/30 border-border/50 hover:border-border focus-visible:border-primary focus-visible:ring-primary/20 text-[15px] transition-all"
            />
          </div>
        </div>

        {/* Ubicación */}
        <div className="flex flex-col gap-3">
          <Label className="text-[12px] uppercase tracking-[0.15em] text-muted-foreground font-semibold">
            Ubicación
          </Label>
          <div className="relative">
            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input 
              placeholder="Ej: Ciudad de México, México" 
              value={profile.location}
              onChange={(e) => setProfile({...profile, location: e.target.value})}
              className="h-[56px] pl-12 rounded-[12px] bg-muted/30 border-border/50 hover:border-border focus-visible:border-primary focus-visible:ring-primary/20 text-[15px] transition-all"
            />
          </div>
        </div>

        {/* Botones de Acción */}
        <div className="flex justify-end gap-4 mt-4">
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
            className="h-[48px] rounded-full px-8 text-[15px] font-semibold bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg hover:shadow-primary/25 transition-all duration-300 hover:scale-[1.02]"
          >
            {isSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Guardando...</> : "Guardar Cambios"}
          </Button>
        </div>
      </div>
    </div>
  )
}
