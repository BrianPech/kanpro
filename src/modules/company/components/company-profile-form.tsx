"use client"

import * as React from "react"
import { 
  Building2, 
  Globe, 
  MapPin, 
  Loader2, 
  Camera, 
  Edit3, 
  Link as LinkIcon, 
  Sparkles,
  RefreshCw,
  Save
} from "lucide-react"
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
import { useCompanyProfileForm } from "../hooks/use-company-profile-form"
import { toast } from "sonner"

export function CompanyProfileForm({ initialProfile, userId }: { initialProfile: any, userId: string }) {
  const {
    profile,
    setProfile,
    isSaving,
    handleSave,
    handleReset,
  } = useCompanyProfileForm(initialProfile, userId)

  const [charCount, setCharCount] = React.useState(0)

  React.useEffect(() => {
    setCharCount((profile.description || "").length)
  }, [profile.description])

  // Handle local logo file upload showing immediate browser previews
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const localUrl = URL.createObjectURL(file)
      setProfile({ ...profile, logo_url: localUrl })
      toast.success("Logotipo cargado", {
        description: "Se ha generado una vista previa del logo comercial localmente.",
      })
    }
  }

  // Handle bio count change under 300 chars limit
  const handleBioChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value.slice(0, 300)
    setProfile({ ...profile, description: text })
    setCharCount(text.length)
  }

  const isWarningCount = charCount >= 280

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} method="POST" className="space-y-8">
        
        {/* SECTION 1: IDENTIDAD VISUAL (GLASS CARD) */}
        <div className="glass-card rounded-[24px] p-8">
          <div className="flex flex-col md:flex-row gap-8 items-center md:items-start text-center md:text-left">
            
            {/* Logo uploader circular box */}
            <div className="flex-shrink-0 relative group">
              <div className="w-32 h-32 rounded-full bg-muted/60 border-2 border-dashed border-border/80 flex flex-col items-center justify-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-all duration-300 overflow-hidden relative shadow-sm">
                
                {profile.logo_url ? (
                  <img src={profile.logo_url} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  <>
                    <Camera className="size-8 text-muted-foreground group-hover:text-primary transition-colors" />
                    <span className="text-[11px] font-bold text-muted-foreground mt-2 group-hover:text-primary transition-colors">
                      Cargar Logo
                    </span>
                  </>
                )}
                
                {/* Hidden File Input */}
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={handleLogoChange}
                  className="absolute inset-0 opacity-0 cursor-pointer" 
                />
              </div>

              {/* Float edit button */}
              <div className="absolute -bottom-1 -right-1 bg-primary text-on-primary p-2 rounded-full shadow-md cursor-pointer active:scale-95 transition-transform">
                <Edit3 className="size-3 text-white" />
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={handleLogoChange}
                  className="absolute inset-0 opacity-0 cursor-pointer" 
                />
              </div>
            </div>

            {/* Logo details and specs */}
            <div className="flex-grow pt-2 space-y-2">
              <h3 className="text-xl font-extrabold text-foreground tracking-tight flex items-center gap-2 justify-center md:justify-start">
                <Sparkles className="size-5 text-primary" />
                Identidad Corporativa
              </h3>
              <p className="text-sm text-muted-foreground font-medium max-w-md leading-relaxed">
                El logo será visible en tu marketplace y propuestas. Recomendamos un formato cuadrado de al menos 400x400px.
              </p>
            </div>

          </div>
        </div>

        {/* SECTION 2: INFORMACIÓN GENERAL (GLASS CARD) */}
        <div className="glass-card rounded-[24px] p-8 space-y-8">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Commercial Name Input */}
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-1">
                Nombre Comercial
              </Label>
              <div className="relative">
                <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-muted-foreground" />
                <Input 
                  type="text"
                  placeholder="Ej. Soluciones Tech S.A." 
                  value={profile.company_name || ""}
                  onChange={(e) => setProfile({ ...profile, company_name: e.target.value })}
                  className="w-full h-12 bg-muted/30 border-none rounded-xl pl-12 pr-4 focus-visible:ring-2 focus-visible:ring-primary focus-visible:bg-background text-sm font-semibold transition-all outline-none"
                />
              </div>
            </div>

            {/* Industry Sector Dropdown Select */}
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-1">
                Sector Industrial
              </Label>
              <Select 
                value={profile.industry || ""} 
                onValueChange={(value) => setProfile({ ...profile, industry: value })}
              >
                <SelectTrigger className="w-full h-12 bg-muted/30 border-none rounded-xl px-4 text-sm font-semibold focus:ring-2 focus:ring-primary focus:bg-background transition-all outline-none shadow-none">
                  <SelectValue placeholder="Selecciona un sector" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-border/60">
                  <SelectItem value="Tecnología">Tecnología & Software</SelectItem>
                  <SelectItem value="Finanzas">Finanzas & Banca</SelectItem>
                  <SelectItem value="Salud">Salud & Bienestar</SelectItem>
                  <SelectItem value="Educación">Educación</SelectItem>
                  <SelectItem value="Diseño">Diseño & Creatividad</SelectItem>
                  <SelectItem value="Marketing">Marketing & Ventas</SelectItem>
                  <SelectItem value="Otro">Otro Sector</SelectItem>
                </SelectContent>
              </Select>
            </div>

          </div>

          <div className="h-px bg-border/40 w-full"></div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Website URL Input */}
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-1">
                URL Sitio Web
              </Label>
              <div className="relative flex items-center">
                <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-muted-foreground" />
                <Input 
                  type="url"
                  placeholder="https://miempresa.com" 
                  value={profile.website_or_linkedin || ""}
                  onChange={(e) => setProfile({ ...profile, website_or_linkedin: e.target.value })}
                  className="w-full h-12 bg-muted/30 border-none rounded-xl pl-12 pr-4 focus-visible:ring-2 focus-visible:ring-primary focus-visible:bg-background text-sm font-semibold transition-all outline-none"
                />
              </div>
            </div>

            {/* LinkedIn Profile Input */}
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-1">
                LinkedIn de la Empresa
              </Label>
              <div className="relative flex items-center">
                <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-muted-foreground" />
                <Input 
                  type="url"
                  placeholder="linkedin.com/company/miempresa" 
                  value={profile.linkedin || ""}
                  onChange={(e) => setProfile({ ...profile, linkedin: e.target.value })}
                  className="w-full h-12 bg-muted/30 border-none rounded-xl pl-12 pr-4 focus-visible:ring-2 focus-visible:ring-primary focus-visible:bg-background text-sm font-semibold transition-all outline-none"
                />
              </div>
            </div>

          </div>

          <div className="h-px bg-border/40 w-full"></div>

          {/* Location Input */}
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-1">
              Ubicación Principal
            </Label>
            <div className="relative flex items-center">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-muted-foreground" />
              <Input 
                type="text"
                placeholder="Ciudad, País" 
                value={profile.location || ""}
                onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                className="w-full h-12 bg-muted/30 border-none rounded-xl pl-12 pr-4 focus-visible:ring-2 focus-visible:ring-primary focus-visible:bg-background text-sm font-semibold transition-all outline-none"
              />
            </div>
          </div>

        </div>

        {/* SECTION 3: NARRATIVA (GLASS CARD) */}
        <div className="glass-card rounded-[24px] p-8 space-y-4">
          <div className="flex justify-between items-end">
            <div className="space-y-1">
              <h4 className="text-lg font-extrabold text-foreground tracking-tight">
                Bio Comercial
              </h4>
              <p className="text-xs text-muted-foreground font-medium">
                Resume la misión y valor de tu empresa para clientes potenciales.
              </p>
            </div>
            <span 
              id="char-count" 
              className={`text-xs font-bold font-sans transition-colors ${
                isWarningCount ? "text-destructive" : "text-muted-foreground"
              }`}
            >
              {charCount} / 300
            </span>
          </div>
          
          <Textarea 
            id="bio-textarea"
            maxLength={300}
            value={profile.description || ""}
            onChange={handleBioChange}
            placeholder="Describe brevemente tu organización..."
            className="w-full h-32 bg-muted/30 border-none rounded-xl px-6 py-4 focus-visible:ring-2 focus-visible:ring-primary focus-visible:bg-background text-sm font-semibold transition-all resize-none shadow-none"
          />
        </div>

        {/* FOOTER ACTIONS BAR */}
        <div className="flex items-center justify-end gap-4 pt-4">
          <Button 
            type="button"
            variant="outline"
            onClick={() => { handleReset(); toast.info("Cambios descartados", { description: "Se han restaurado los valores anteriores de tu perfil." }); }}
            className="px-6 py-5 h-auto rounded-xl font-bold border-border/60 hover:bg-muted text-muted-foreground hover:text-foreground text-xs md:text-sm shadow-none active:scale-95 transition-all"
          >
            <RefreshCw className="size-4 mr-2" />
            Descartar cambios
          </Button>
          <Button 
            type="submit"
            disabled={isSaving}
            className="px-8 py-5 h-auto rounded-xl font-bold bg-primary hover:bg-primary/95 text-on-primary text-xs md:text-sm active:scale-95 transition-all shadow-lg shadow-primary/10 hover:shadow-primary/25"
          >
            {isSaving ? (
              <Loader2 className="size-4 animate-spin mr-2" />
            ) : (
              <Save className="size-4 mr-2" />
            )}
            {isSaving ? "Guardando..." : "Guardar Perfil"}
          </Button>
        </div>

      </form>

    </div>
  )
}
