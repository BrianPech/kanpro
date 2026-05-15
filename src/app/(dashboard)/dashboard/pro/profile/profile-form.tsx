"use client"

import * as React from "react"
import { useState } from "react"
import { User, MapPin, Briefcase, DollarSign, Camera, CheckCircle2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export function ProfileForm({ initialProfile, userId }: { initialProfile: any, userId: string }) {
  const [isSaving, setIsSaving] = useState(false)
  const supabase = createClient()
  
  // Local state for the profile
  const [profile, setProfile] = useState(initialProfile)
  
  // Separate state for skills string to allow trailing commas while typing
  const [skillsInput, setSkillsInput] = useState(initialProfile.skills?.join(", ") || "")

  const handleChange = (field: string, value: string) => {
    setProfile((prev: any) => ({ ...prev, [field]: value }))
  }

  const handleSkillsChange = (value: string) => {
    const skillsArray = value.split(',').map((s: string) => s.trim()).filter((s: string) => s !== "")
    setProfile((prev: any) => ({ ...prev, skills: skillsArray }))
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const { error } = await supabase
        .from("professional_profiles")
        .upsert({
          id: userId,
          full_name: profile.full_name,
          headline: profile.headline,
          bio: profile.bio,
          category: profile.category,
          location: profile.location,
          birth_date: profile.birth_date,
          phone: profile.phone,
          hourly_rate: profile.hourly_rate ? parseFloat(profile.hourly_rate) : null,
          skills: profile.skills,
          // avatar_url is omitted for now until file upload is implemented
        })

      if (error) throw error
      
      toast.success("Perfil actualizado", {
        description: "Los cambios se han guardado correctamente.",
      })
    } catch (error: any) {
      console.error(error)
      toast.error("Error al guardar", {
        description: error.message || "Ocurrió un error al actualizar el perfil.",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const fields = [
    profile.full_name, profile.headline, profile.bio, profile.category, 
    profile.location, profile.birth_date, profile.phone, profile.hourly_rate, 
    profile.skills?.join(", ")
  ]
  const filledFields = fields.filter(f => f && f.toString().length > 0).length
  const completionPercentage = Math.round((filledFields / fields.length) * 100)

  const initials = profile.full_name ? profile.full_name.substring(0, 2).toUpperCase() : "US"
  const skillsString = profile.skills?.join(", ") || ""

  return (
    <div className="flex flex-col gap-8 pb-16 max-w-[1000px] mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Top Banner / Preview Header */}
      <div className="flex flex-col relative w-full mt-6 md:mt-10 px-4 md:px-8">
        <div className="h-[160px] md:h-[200px] w-full bg-gradient-to-r from-primary/20 via-primary/5 to-background rounded-[32px] border border-border/50 relative overflow-hidden">
          <div className="absolute top-4 right-4 bg-background/50 backdrop-blur-md px-4 py-2 rounded-full border border-border/50 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-primary" />
            <span className="text-[13px] font-medium text-foreground">Perfil {completionPercentage}%</span>
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-end gap-6 px-6 md:px-10 -mt-16 md:-mt-20 relative z-10">
          <div className="relative group cursor-pointer shrink-0">
            <div className="w-[120px] h-[120px] md:w-[150px] md:h-[150px] rounded-full bg-card overflow-hidden flex items-center justify-center border-4 border-background shadow-xl transition-transform duration-300 group-hover:scale-105">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-[40px] font-bold text-muted-foreground">{initials}</span>
              )}
            </div>
            <div className="absolute inset-0 bg-foreground/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 m-1">
              <Camera className="w-8 h-8 text-background" />
            </div>
          </div>

          <div className="flex flex-col flex-1 pb-2 md:pb-4 gap-1">
            <h1 className="text-[28px] md:text-[36px] font-semibold tracking-tight leading-none">
              {profile.full_name || "Nombre del Profesional"}
            </h1>
            <p className="text-[16px] text-muted-foreground mt-1 flex items-center gap-2">
              <Briefcase className="w-4 h-4" />
              {profile.headline || "Añade tu titular profesional"}
            </p>
            {profile.location && (
              <p className="text-[14px] text-muted-foreground flex items-center gap-2 mt-1">
                <MapPin className="w-4 h-4" />
                {profile.location}
              </p>
            )}
          </div>

          <div className="flex pb-2 md:pb-4">
            <Dialog>
              <DialogTrigger asChild>
                <Button className="rounded-full px-6 bg-primary text-primary-foreground">
                  Ver Perfil Público
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden border-border/50 rounded-[32px]">
                <DialogHeader className="p-6 pb-0 absolute z-50">
                  <DialogTitle className="sr-only">Vista Previa del Perfil Público</DialogTitle>
                  <DialogDescription className="sr-only">Así es como verán tu perfil las empresas</DialogDescription>
                </DialogHeader>
                
                {/* Public Profile Mockup inside Dialog */}
                <div className="w-full h-full max-h-[85vh] overflow-y-auto bg-background">
                  {/* Banner */}
                  <div className="h-[140px] w-full bg-gradient-to-r from-primary/20 via-primary/5 to-background border-b border-border/50"></div>
                  
                  <div className="px-6 md:px-10 -mt-16 relative z-10 pb-10">
                    <div className="flex justify-between items-end mb-6">
                      <div className="w-[120px] h-[120px] rounded-full bg-card overflow-hidden flex items-center justify-center border-4 border-background shadow-lg">
                        {profile.avatar_url ? (
                          <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-[32px] font-bold text-muted-foreground">{initials}</span>
                        )}
                      </div>
                      <Button className="rounded-full px-8 bg-primary text-primary-foreground shadow-lg">
                        Contratar
                      </Button>
                    </div>

                    <h2 className="text-[28px] font-semibold tracking-tight leading-none">
                      {profile.full_name || "Nombre del Profesional"}
                    </h2>
                    <p className="text-[16px] text-muted-foreground mt-2 font-medium">
                      {profile.headline || "Titular Profesional"}
                    </p>
                    
                    <div className="flex flex-wrap gap-4 mt-4 text-[14px] text-muted-foreground">
                      {profile.location && (
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-4 h-4" />
                          <span>{profile.location}</span>
                        </div>
                      )}
                      {profile.hourly_rate && (
                        <div className="flex items-center gap-1.5">
                          <DollarSign className="w-4 h-4" />
                          <span>${profile.hourly_rate} / hora</span>
                        </div>
                      )}
                    </div>

                    {profile.bio && (
                      <div className="mt-8">
                        <h3 className="text-[16px] font-semibold text-foreground mb-3">Acerca de</h3>
                        <p className="text-[14px] text-muted-foreground leading-relaxed">
                          {profile.bio}
                        </p>
                      </div>
                    )}

                    {profile.skills && profile.skills.length > 0 && (
                      <div className="mt-8">
                        <h3 className="text-[16px] font-semibold text-foreground mb-4">Habilidades Especializadas</h3>
                        <div className="flex flex-wrap gap-2">
                          {profile.skills.map((skill: string, index: number) => (
                            <span key={index} className="px-3 py-1.5 bg-muted text-muted-foreground text-[13px] font-medium rounded-full border border-border/50">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Fake Portfolio Section to make it look complete */}
                    <div className="mt-10">
                       <h3 className="text-[16px] font-semibold text-foreground mb-4">Portafolio</h3>
                       <div className="grid grid-cols-2 gap-4">
                         <div className="h-[100px] rounded-[16px] bg-muted/50 border border-border/50 flex flex-col items-center justify-center gap-2">
                           <Briefcase className="w-5 h-5 text-muted-foreground" />
                           <span className="text-[12px] text-muted-foreground font-medium">Proyecto 1</span>
                         </div>
                         <div className="h-[100px] rounded-[16px] bg-muted/50 border border-border/50 flex flex-col items-center justify-center gap-2">
                           <Briefcase className="w-5 h-5 text-muted-foreground" />
                           <span className="text-[12px] text-muted-foreground font-medium">Proyecto 2</span>
                         </div>
                       </div>
                    </div>

                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      <div className="w-full px-4 md:px-8 mt-4">
        {completionPercentage < 100 && (
          <div className="bg-primary/5 rounded-[24px] p-6 border border-primary/10 mb-8 flex flex-col md:flex-row items-center gap-6">
            <div className="flex-1">
              <h4 className="font-medium text-foreground">Completa tu perfil para destacar</h4>
              <p className="text-[14px] text-muted-foreground mt-1">
                Agrega la información faltante para alcanzar el 100% y mejorar tu visibilidad ante los reclutadores.
              </p>
            </div>
            <div className="w-full md:w-[200px] flex flex-col gap-2">
              <div className="flex justify-between text-[12px] font-medium">
                <span>Progreso</span>
                <span className="text-primary">{completionPercentage}%</span>
              </div>
              <div className="w-full bg-primary/10 rounded-full h-2">
                <div className="bg-primary h-2 rounded-full transition-all duration-1000" style={{ width: `${completionPercentage}%` }}></div>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-8">
          
          {/* General Info Card */}
          <div className="bg-card rounded-[32px] p-8 md:p-10 border border-border/50 shadow-sm relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-1 bg-primary"></div>
             <h3 className="text-[24px] font-semibold tracking-tight mb-8">Información Básica</h3>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="flex flex-col gap-3">
                 <Label className="text-[12px] uppercase tracking-[0.15em] text-muted-foreground font-semibold">Nombre Completo</Label>
                 <div className="relative group">
                   <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground transition-colors group-focus-within:text-primary" />
                   <Input 
                     value={profile.full_name} 
                     onChange={(e) => handleChange("full_name", e.target.value)}
                     className="h-[56px] pl-12 rounded-[16px] bg-muted/30 border-border/50 hover:border-border focus-visible:border-primary focus-visible:ring-primary/20 text-[15px] transition-all" 
                   />
                 </div>
               </div>

               <div className="flex flex-col gap-3">
                 <Label className="text-[12px] uppercase tracking-[0.15em] text-muted-foreground font-semibold">Categoría Profesional</Label>
                 <div className="relative group">
                   <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground transition-colors group-focus-within:text-primary" />
                   <Input 
                     value={profile.category} 
                     onChange={(e) => handleChange("category", e.target.value)}
                     className="h-[56px] pl-12 rounded-[16px] bg-muted/30 border-border/50 hover:border-border focus-visible:border-primary focus-visible:ring-primary/20 text-[15px] transition-all" 
                   />
                 </div>
               </div>

               <div className="flex flex-col gap-3 md:col-span-2">
                 <Label className="text-[12px] uppercase tracking-[0.15em] text-muted-foreground font-semibold">Titular Profesional</Label>
                 <Input 
                   value={profile.headline} 
                   onChange={(e) => handleChange("headline", e.target.value)}
                   className="h-[56px] px-5 rounded-[16px] bg-muted/30 border-border/50 hover:border-border focus-visible:border-primary focus-visible:ring-primary/20 text-[15px] transition-all" 
                 />
               </div>

               <div className="flex flex-col gap-3 md:col-span-2">
                 <Label className="text-[12px] uppercase tracking-[0.15em] text-muted-foreground font-semibold">Resumen Profesional (Bio)</Label>
                 <Textarea 
                   value={profile.bio}
                   onChange={(e) => handleChange("bio", e.target.value)}
                   className="min-h-[140px] rounded-[16px] bg-muted/30 border-border/50 hover:border-border focus-visible:border-primary focus-visible:ring-primary/20 text-[15px] p-5 resize-none transition-all"
                 />
               </div>
             </div>
          </div>

          {/* Personal & Contact Card */}
          <div className="bg-card rounded-[32px] p-8 md:p-10 border border-border/50 shadow-sm relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-1 bg-muted-foreground/10"></div>
             <h3 className="text-[24px] font-semibold tracking-tight mb-8">Personal y Contacto</h3>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="flex flex-col gap-3">
                 <Label className="text-[12px] uppercase tracking-[0.15em] text-muted-foreground font-semibold">Fecha de Nacimiento</Label>
                 <Input 
                   value={profile.birth_date} 
                   onChange={(e) => handleChange("birth_date", e.target.value)}
                   type="date" 
                   className="h-[56px] px-5 rounded-[16px] bg-muted/30 border-border/50 hover:border-border focus-visible:border-primary focus-visible:ring-primary/20 text-[15px] transition-all" 
                 />
               </div>

               <div className="flex flex-col gap-3">
                 <Label className="text-[12px] uppercase tracking-[0.15em] text-muted-foreground font-semibold">Ubicación (Ciudad, País)</Label>
                 <div className="relative group">
                   <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground transition-colors group-focus-within:text-primary" />
                   <Input 
                     value={profile.location} 
                     onChange={(e) => handleChange("location", e.target.value)}
                     className="h-[56px] pl-12 rounded-[16px] bg-muted/30 border-border/50 hover:border-border focus-visible:border-primary focus-visible:ring-primary/20 text-[15px] transition-all" 
                   />
                 </div>
               </div>

               <div className="flex flex-col gap-3 md:col-span-2">
                 <Label className="text-[12px] uppercase tracking-[0.15em] text-muted-foreground font-semibold">Teléfono de Contacto</Label>
                 <Input 
                   value={profile.phone} 
                   onChange={(e) => handleChange("phone", e.target.value)}
                   className="h-[56px] px-5 rounded-[16px] bg-muted/30 border-border/50 hover:border-border focus-visible:border-primary focus-visible:ring-primary/20 text-[15px] transition-all" 
                 />
               </div>
             </div>
          </div>

          {/* Skills & Rates Card */}
          <div className="bg-card rounded-[32px] p-8 md:p-10 border border-border/50 shadow-sm relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-1 bg-muted-foreground/10"></div>
             <h3 className="text-[24px] font-semibold tracking-tight mb-8">Tarifas y Habilidades</h3>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="flex flex-col gap-3">
                 <Label className="text-[12px] uppercase tracking-[0.15em] text-muted-foreground font-semibold">Tarifa por Hora (USD)</Label>
                 <div className="relative group">
                   <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground transition-colors group-focus-within:text-primary" />
                   <Input 
                     value={profile.hourly_rate} 
                     onChange={(e) => handleChange("hourly_rate", e.target.value)}
                     type="number" 
                     className="h-[56px] pl-12 rounded-[16px] bg-muted/30 border-border/50 hover:border-border focus-visible:border-primary focus-visible:ring-primary/20 text-[15px] transition-all" 
                   />
                 </div>
               </div>

               <div className="flex flex-col gap-3 md:col-span-2">
                 <Label className="text-[12px] uppercase tracking-[0.15em] text-muted-foreground font-semibold">Habilidades Destacadas (Separadas por comas)</Label>
                 <Input 
                   value={skillsInput} 
                   onChange={(e) => {
                     setSkillsInput(e.target.value)
                     handleSkillsChange(e.target.value)
                   }}
                   className="h-[56px] px-5 rounded-[16px] bg-muted/30 border-border/50 hover:border-border focus-visible:border-primary focus-visible:ring-primary/20 text-[15px] transition-all" 
                 />
                 <p className="text-[12px] text-muted-foreground mt-1">Ejemplo: React, Node.js, UI/UX, Marketing Digital</p>
               </div>
             </div>
          </div>

          {/* Portfolio & Projects Card (MOCK) */}
          <div className="bg-card rounded-[32px] p-8 md:p-10 border border-border/50 shadow-sm relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-1 bg-primary/40"></div>
             <div className="flex justify-between items-center mb-8">
               <h3 className="text-[24px] font-semibold tracking-tight">Portafolio Destacado</h3>
               <Button variant="outline" className="rounded-full text-[13px] h-9">
                 + Agregar Proyecto
               </Button>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="border border-dashed border-border hover:border-primary/50 rounded-[20px] h-[180px] flex flex-col items-center justify-center gap-3 cursor-pointer bg-muted/10 transition-colors group" onClick={() => toast.info("Funcionalidad en desarrollo")}>
                 <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                   <Briefcase className="w-5 h-5 text-muted-foreground group-hover:text-primary" />
                 </div>
                 <span className="text-[14px] font-medium text-muted-foreground group-hover:text-primary">Subir Caso de Estudio</span>
               </div>
               <div className="border border-border rounded-[20px] overflow-hidden group">
                 <div className="h-[120px] bg-muted w-full relative">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
                    <span className="absolute bottom-3 left-4 text-white font-medium text-[14px]">E-commerce App</span>
                 </div>
                 <div className="p-4 bg-card">
                   <p className="text-[13px] text-muted-foreground line-clamp-2">Desarrollo completo de aplicación móvil para tienda de ropa usando React Native y Supabase.</p>
                 </div>
               </div>
             </div>
          </div>

          {/* Social & Links Card */}
          <div className="bg-card rounded-[32px] p-8 md:p-10 border border-border/50 shadow-sm relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-1 bg-muted-foreground/10"></div>
             <h3 className="text-[24px] font-semibold tracking-tight mb-8">Enlaces Profesionales</h3>
             
             <div className="grid grid-cols-1 gap-6">
               <div className="flex flex-col gap-3">
                 <Label className="text-[12px] uppercase tracking-[0.15em] text-muted-foreground font-semibold">URL de LinkedIn</Label>
                 <Input placeholder="https://linkedin.com/in/tu-perfil" className="h-[56px] px-5 rounded-[16px] bg-muted/30 border-border/50 hover:border-border focus-visible:border-primary focus-visible:ring-primary/20 text-[15px] transition-all" />
               </div>
               <div className="flex flex-col gap-3">
                 <Label className="text-[12px] uppercase tracking-[0.15em] text-muted-foreground font-semibold">URL de Portafolio / Web Personal</Label>
                 <Input placeholder="https://tu-sitio-web.com" className="h-[56px] px-5 rounded-[16px] bg-muted/30 border-border/50 hover:border-border focus-visible:border-primary focus-visible:ring-primary/20 text-[15px] transition-all" />
               </div>
             </div>
          </div>

          <div className="flex justify-end gap-4 mt-2">
             <Button variant="ghost" className="h-[56px] rounded-full px-8 text-[15px] font-semibold hover:bg-muted" onClick={() => setProfile(initialProfile)}>
               Descartar
             </Button>
             <Button 
               onClick={handleSave}
               disabled={isSaving}
               className="h-[56px] rounded-full px-12 text-[15px] font-semibold bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg hover:shadow-primary/25 transition-all duration-300 hover:scale-[1.02]"
             >
               {isSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Guardando...</> : "Guardar Cambios"}
             </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
