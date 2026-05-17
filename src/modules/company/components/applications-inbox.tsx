"use client"

import * as React from "react"
import { Search, Filter, Mail, Trash2, Check, ExternalLink, MapPin, Briefcase } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function ApplicationsInbox() {
  // Datos mock para los postulantes
  const [applicants, setApplicants] = React.useState([
    {
      id: 1,
      name: "Alex Silva",
      headline: "Senior Frontend Developer",
      avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop",
      location: "Madrid, España",
      experience: "5+ años",
      tags: ["React", "TypeScript", "Next.js", "TailwindCSS"],
      status: "Pendiente",
    },
    {
      id: 2,
      name: "María Gómez",
      headline: "Product Designer",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop",
      location: "Barcelona, España",
      experience: "3+ años",
      tags: ["UI/UX", "Figma", "Design Systems", "Prototyping"],
      status: "Pendiente",
    },
    {
      id: 3,
      name: "Carlos Ruiz",
      headline: "Full Stack Engineer",
      avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&h=150&fit=crop",
      location: "Valencia, España",
      experience: "4+ años",
      tags: ["Node.js", "Python", "AWS", "Docker"],
      status: "Pendiente",
    },
    {
      id: 4,
      name: "Ana Martínez",
      headline: "QA Engineer",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop",
      location: "Sevilla, España",
      experience: "2+ años",
      tags: ["Cypress", "Selenium", "Jest", "Automation"],
      status: "Pendiente",
    },
  ])

  const handleAction = (id: number, status: string) => {
    setApplicants(applicants.map(app => 
      app.id === id ? { ...app, status } : app
    ))
  }

  return (
    <div className="p-6 md:p-12 lg:p-16 max-w-[1200px] mx-auto w-full animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-12">
        <div>
          <h1 className="text-[40px] font-medium tracking-tight text-foreground mb-2">Bandeja de Postulantes</h1>
          <p className="text-[16px] text-muted-foreground">Revisa y gestiona las postulaciones de los profesionales.</p>
        </div>
      </div>

      {/* Barra de búsqueda y filtros */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-8">
        <div className="relative w-full md:max-w-[400px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar postulantes o habilidades..." 
            className="pl-10 rounded-full bg-card/50"
          />
        </div>
        <Button variant="outline" className="rounded-full flex items-center gap-2 w-full md:w-auto">
          <Filter className="size-4" /> Filtros
        </Button>
      </div>

      {/* Grid de Postulantes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {applicants.filter(app => app.status === "Pendiente").map((applicant) => (
          <div 
            key={applicant.id} 
            className="bg-card border border-border/50 rounded-[24px] p-6 flex flex-col gap-6 hover:border-border transition-all duration-300 shadow-sm"
          >
            <div className="flex items-start gap-4">
              <div className="relative size-20 rounded-2xl overflow-hidden border border-border/50 flex-shrink-0">
                <img src={applicant.avatar} alt={applicant.name} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start gap-2">
                  <h3 className="text-[18px] font-medium tracking-tight text-foreground truncate">
                    {applicant.name}
                  </h3>
                  <Button variant="ghost" size="icon" className="rounded-full size-8 -mt-1 -mr-1 text-muted-foreground hover:text-foreground">
                    <ExternalLink className="size-4" />
                  </Button>
                </div>
                <p className="text-sm text-primary font-medium mb-1 truncate">{applicant.headline}</p>
                
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <MapPin className="size-3.5" />
                    {applicant.location}
                  </div>
                  <div className="flex items-center gap-1">
                    <Briefcase className="size-3.5" />
                    {applicant.experience}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {applicant.tags.map((tag, i) => (
                <span key={i} className="text-[11px] px-2.5 py-0.5 bg-muted text-muted-foreground rounded-full font-medium">
                  {tag}
                </span>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3 mt-auto pt-2">
              <Button 
                variant="outline" 
                className="rounded-full flex items-center gap-2 justify-center border-destructive/20 text-destructive hover:bg-destructive/5 hover:border-destructive/30"
                onClick={() => handleAction(applicant.id, "Descartado")}
              >
                <Trash2 className="size-4" /> Descartar
              </Button>
              <Button 
                className="rounded-full flex items-center gap-2 justify-center"
                onClick={() => handleAction(applicant.id, "Contactado")}
              >
                <Mail className="size-4" /> Contactar
              </Button>
            </div>
          </div>
        ))}

        {applicants.filter(app => app.status === "Pendiente").length === 0 && (
          <div className="col-span-1 md:col-span-2 bg-muted/30 border border-dashed border-border rounded-[24px] p-12 text-center">
            <p className="text-muted-foreground font-medium">No hay más postulantes pendientes por revisar.</p>
          </div>
        )}
      </div>
    </div>
  )
}
