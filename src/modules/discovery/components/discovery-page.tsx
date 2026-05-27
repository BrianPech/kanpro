"use client"

import * as React from "react"
import { SlidersHorizontal, X, Sparkles, Star, MapPin, Search, Filter, ShieldCheck, HelpCircle, MessageSquare } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { professionals, type Professional } from "../data/mock"
import { ProfessionalCard } from "./professional-card"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

type ViewMode = "jobs" | "professionals"

export function DiscoveryPage({ 
  showNav = true,
  initialMode = "jobs",
  lockMode = false
}: { 
  showNav?: boolean
  initialMode?: ViewMode
  lockMode?: boolean
}) {
  const [mode, setMode] = React.useState<ViewMode>(initialMode)
  const [selectedRole, setSelectedRole] = React.useState<string>("Todos")
  const [selectedLocation, setSelectedLocation] = React.useState<string>("Todos")
  const [minMatchScore, setMinMatchScore] = React.useState<number>(85)
  const [activeSkills, setActiveSkills] = React.useState<string[]>(["React", "Node.js", "Kubernetes"])
  
  // Custom skills catalog for toggling
  const skillsCatalog = ["React", "Node.js", "Kubernetes", "Figma", "Python", "Solidity"]

  // Simulated match score retriever for mocking
  const getMatchScore = (proId: string) => {
    switch (proId) {
      case "pro-6": return 98
      case "pro-1": return 92
      case "pro-2": return 89
      case "pro-3": return 87
      case "pro-4": return 94
      case "pro-5": return 85
      default: return 80
    }
  };

  // Dynamic mapped role title retriever
  const getRoleTitle = (proId: string, defaultTitle: string) => {
    switch (proId) {
      case "pro-1": return "Frontend Specialist"
      case "pro-2": return "Product Designer"
      case "pro-3": return "DevOps Engineer"
      case "pro-6": return "Backend/Cloud Engineer"
      default: return defaultTitle
    }
  };

  // Reactive filtering logic
  const filteredProfessionals = React.useMemo(() => {
    return professionals.filter((pro) => {
      // 1. Match score filter
      const score = getMatchScore(pro.id)
      if (score < minMatchScore) return false

      // 2. Mapped role title filter
      const roleTitle = getRoleTitle(pro.id, pro.title).toLowerCase()
      if (selectedRole !== "Todos") {
        if (selectedRole === "Frontend Specialist" && !roleTitle.includes("frontend")) return false
        if (selectedRole === "Product Designer" && !roleTitle.includes("design")) return false
        if (selectedRole === "DevOps Engineer" && !roleTitle.includes("devops")) return false
        if (selectedRole === "Backend/Cloud Engineer" && !roleTitle.includes("backend")) return false
      }

      // 3. Location filter
      if (selectedLocation !== "Todos") {
        const queryLoc = selectedLocation.toLowerCase()
        if (!pro.location.toLowerCase().includes(queryLoc)) return false
      }

      // 4. Skills match filter
      if (activeSkills.length > 0) {
        const hasSkill = activeSkills.some(skill => 
          pro.skills.some(s => s.toLowerCase().includes(skill.toLowerCase()))
        )
        if (!hasSkill) return false
      }

      return true
    })
  }, [minMatchScore, selectedRole, selectedLocation, activeSkills])

  // Identify if Elena Rodríguez (pro-6) is present for Top Match display
  const topMatchCandidate = React.useMemo(() => {
    return filteredProfessionals.find(p => p.id === "pro-6")
  }, [filteredProfessionals])

  // Filter out the top match candidate from the grid to avoid duplication
  const gridProfessionals = React.useMemo(() => {
    if (topMatchCandidate) {
      return filteredProfessionals.filter(p => p.id !== "pro-6")
    }
    return filteredProfessionals
  }, [filteredProfessionals, topMatchCandidate])

  const handleRemoveSkill = (skill: string) => {
    setActiveSkills(prev => prev.filter(s => s !== skill))
    toast.info(`Habilidad removida: ${skill}`)
  }

  const handleAddSkill = (skill: string) => {
    if (!activeSkills.includes(skill)) {
      setActiveSkills(prev => [...prev, skill])
      toast.success(`Habilidad agregada: ${skill}`)
    }
  }

  const handleContactTopMatch = () => {
    toast.success("Mensaje enviado", {
      description: "Se ha abierto un canal de comunicación directa con Elena Rodríguez.",
    })
  }

  // If lockMode is true, render the high fidelity talent discovery search board
  if (lockMode) {
    return (
      <div className="flex-grow min-h-screen bg-background/50 dark:bg-background/20 px-4 md:px-10 lg:px-12 py-10 flex flex-col gap-10 overflow-y-auto selection:bg-indigo-500/20 selection:text-indigo-600 dark:selection:text-indigo-300 animate-in fade-in duration-500 pb-20">
        
        {/* Header Section */}
        <section className="space-y-2">
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 md:text-4xl">
            Descubrir Talento
          </h2>
          <p className="text-sm md:text-base text-slate-600 dark:text-slate-350 max-w-3xl leading-relaxed font-medium">
            Utilice nuestras recomendaciones impulsadas por IA para encontrar a los candidatos perfectos que se alineen con la cultura y los requisitos técnicos de su empresa.
          </p>
        </section>

        {/* Horizontal Premium Filter Bar */}
        <section className="glass-card p-6 md:p-8 rounded-[28px] flex flex-col lg:flex-row items-stretch lg:items-center gap-6 shadow-sm relative overflow-hidden bg-card">
          
          {/* Role select */}
          <div className="flex-1 flex flex-col gap-2 min-w-[200px]">
            <label className="text-[11px] font-bold text-slate-500 dark:text-slate-450 uppercase tracking-wider px-1">Rol</label>
            <select 
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="w-full h-12 bg-muted/40 dark:bg-muted/20 border-none rounded-xl font-bold text-xs md:text-sm px-4 focus:ring-2 focus:ring-primary focus:bg-background text-slate-800 dark:text-slate-200 transition-all outline-none"
            >
              <option value="Todos">Todos los roles</option>
              <option value="Frontend Specialist">Frontend Specialist</option>
              <option value="Product Designer">Product Designer</option>
              <option value="DevOps Engineer">DevOps Engineer</option>
              <option value="Backend/Cloud Engineer">Backend / Cloud Engineer</option>
            </select>
          </div>

          {/* Location select */}
          <div className="flex-1 flex flex-col gap-2 min-w-[180px]">
            <label className="text-[11px] font-bold text-slate-500 dark:text-slate-450 uppercase tracking-wider px-1">Ubicación</label>
            <select 
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="w-full h-12 bg-muted/40 dark:bg-muted/20 border-none rounded-xl font-bold text-xs md:text-sm px-4 focus:ring-2 focus:ring-primary focus:bg-background text-slate-800 dark:text-slate-200 transition-all outline-none"
            >
              <option value="Todos">Global / Cualquiera</option>
              <option value="Remote">Remoto</option>
              <option value="Mexico City">México</option>
              <option value="Barcelona">España</option>
              <option value="Seattle">Estados Unidos</option>
            </select>
          </div>

          {/* Match Score slider */}
          <div className="flex-1.5 flex flex-col gap-2 min-w-[240px]">
            <div className="flex justify-between items-center px-1">
              <label className="text-[11px] font-bold text-slate-500 dark:text-slate-450 uppercase tracking-wider">Match Score Mínimo</label>
              <span className="text-xs font-extrabold text-indigo-600 dark:text-indigo-300 bg-indigo-500/10 dark:bg-indigo-500/20 px-2 py-0.5 rounded-md">{minMatchScore}%</span>
            </div>
            <div className="h-12 flex items-center">
              <input 
                type="range" 
                min={50} 
                max={100}
                value={minMatchScore}
                onChange={(e) => setMinMatchScore(Number(e.target.value))}
                className="w-full accent-primary h-1.5 bg-muted/65 dark:bg-muted/30 rounded-full appearance-none cursor-pointer"
              />
            </div>
          </div>

          {/* Active Skills tags */}
          <div className="flex-1.5 flex flex-col gap-2 min-w-[240px] lg:border-l lg:border-border/40 lg:pl-6">
            <label className="text-[11px] font-bold text-slate-500 dark:text-slate-450 uppercase tracking-wider px-1">Filtro de Habilidades</label>
            <div className="flex flex-wrap gap-1.5 max-h-16 overflow-y-auto hide-scrollbar">
              {activeSkills.map((skill) => (
                <span 
                  key={skill}
                  onClick={() => handleRemoveSkill(skill)}
                  className="bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wide flex items-center gap-1.5 hover:bg-destructive/10 hover:text-destructive cursor-pointer transition-colors shadow-sm"
                >
                  {skill}
                  <X className="size-3 shrink-0" />
                </span>
              ))}
              {skillsCatalog.filter(s => !activeSkills.includes(s)).slice(0, 2).map((skill) => (
                <span 
                  key={skill}
                  onClick={() => handleAddSkill(skill)}
                  className="bg-slate-500/5 dark:bg-slate-500/10 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-300 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wide flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  + {skill}
                </span>
              ))}
            </div>
          </div>

        </section>

        {/* Top Match Recommended Section */}
        {topMatchCandidate && (
          <section className="space-y-4">
            <div className="flex items-center gap-2 px-1">
              <Star className="size-5 fill-indigo-600 text-indigo-600 dark:fill-indigo-400 dark:text-indigo-400 animate-pulse" />
              <h3 className="font-extrabold text-lg md:text-xl text-slate-900 dark:text-slate-100 tracking-tight">
                Top Match Recomendado por IA
              </h3>
            </div>

            <div className="glass-card p-8 md:p-10 rounded-[32px] border border-indigo-500/15 relative overflow-hidden group shadow-sm bg-card">
              
              {/* Subtle background radial shine glow element */}
              <div 
                className="absolute inset-0 pointer-events-none opacity-40 group-hover:opacity-60 transition-opacity duration-500 rounded-[32px]"
                style={{
                  background: "radial-gradient(400px circle at 90% 10%, rgba(99, 102, 241, 0.08), transparent 80%)"
                }}
              />

              <div className="relative flex flex-col md:flex-row gap-8 lg:gap-10 items-start">
                
                {/* Profile Photo */}
                <div className="w-36 h-36 md:w-44 md:h-44 rounded-2xl overflow-hidden shadow-lg shadow-primary/5 shrink-0 border border-border/40 bg-muted">
                  <img 
                    alt="Elena Rodríguez" 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuCHXRn6E9Gg1yogaTbKvRulorOuHrDHWA8VeHHHkZT6TReM3dFGVNt0aYRoxWWqXfrvLstXU80eCijL-Xu23adcbx7gJBqdJA1XXNym8vyvlah_Cc23ShZmsMEdQJxFi4yhCLe_xtjpLTjALuthlRrPLR9if_X3-AM_qSJ22co4pzcJYfzpFw-WupqniCuorskMUa_YfhP2naIGSj0g6zherBY4a518fG9NBZguI3Jrg09DvLCK63RSZ50Qqd0FsCfdMXXFcKI0O4w" 
                  />
                </div>

                {/* Description details */}
                <div className="flex-grow space-y-6 min-w-0">
                  
                  <div className="flex flex-wrap justify-between items-start gap-4">
                    <div>
                      <h4 className="text-xl md:text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight mb-1">
                        Elena Rodríguez
                      </h4>
                      <p className="text-sm md:text-base text-indigo-600 dark:text-indigo-300 font-bold">
                        Senior Backend Engineer & Cloud Architect
                      </p>
                    </div>
                    
                    <div className="bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 px-5 py-2.5 rounded-2xl font-extrabold text-base md:text-lg flex items-center gap-2 shadow-sm shrink-0">
                      98% <span className="text-[11px] uppercase tracking-wider font-extrabold text-indigo-600 dark:text-indigo-400">Match IA</span>
                    </div>
                  </div>

                  {/* Skill Badges */}
                  <div className="flex flex-wrap gap-2">
                    <span className="bg-slate-500/10 dark:bg-slate-500/20 px-3.5 py-1.5 rounded-full text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">Kubernetes</span>
                    <span className="bg-slate-500/10 dark:bg-slate-500/20 px-3.5 py-1.5 rounded-full text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">Go / Golang</span>
                    <span className="bg-slate-500/10 dark:bg-slate-500/20 px-3.5 py-1.5 rounded-full text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">AWS Certified</span>
                    <span className="bg-slate-500/10 dark:bg-slate-500/20 px-3.5 py-1.5 rounded-full text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">Distributed Systems</span>
                  </div>

                  {/* AI Analysis Quote Box */}
                  <div className="bg-indigo-500/5 dark:bg-indigo-500/10 border-l-4 border-indigo-500 p-5 rounded-r-2xl space-y-2">
                    <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-300">
                      <Sparkles className="size-4 animate-pulse fill-indigo-600/15" />
                      <span className="text-xs font-bold uppercase tracking-wider">Análisis de IA K&apos;anPro</span>
                    </div>
                    <p className="text-xs md:text-sm text-slate-700 dark:text-slate-300 italic font-medium leading-relaxed">
                      &quot;Elena supera con creces los requisitos técnicos para puestos Backend y Arquitectura Cloud. Su experiencia previa liderando el escalado masivo de microservicios distribuidos en Fintech coincide exactamente con los desafíos de tu fase de expansión. Alta compatibilidad cultural en liderazgo.&quot;
                    </p>
                  </div>

                  {/* CTA Buttons */}
                  <div className="flex flex-wrap gap-3.5 pt-4">
                    <Button 
                      onClick={handleContactTopMatch}
                      className="bg-primary hover:bg-indigo-700 text-white px-8 py-5 h-auto rounded-2xl font-bold text-xs md:text-sm shadow-md active:scale-95 transition-all"
                    >
                      Contactar ahora
                    </Button>
                    <Button 
                      onClick={() => toast.info("Abriendo perfil...", { description: "Preparando portafolio técnico de Elena Rodríguez." })}
                      variant="outline"
                      className="bg-card border-border/60 hover:bg-muted text-slate-800 dark:text-slate-200 px-8 py-5 h-auto rounded-2xl font-bold text-xs md:text-sm active:scale-95 transition-all"
                    >
                      Ver Perfil Completo
                    </Button>
                  </div>

                </div>

              </div>

            </div>
          </section>
        )}

        {/* Talent Grid List */}
        <section className="space-y-6">
          <div className="flex items-center justify-between px-1">
            <h3 className="font-extrabold text-lg md:text-xl text-slate-900 dark:text-slate-100 tracking-tight">
              Candidatos Recomendados
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
              Mostrando <span className="text-indigo-600 dark:text-indigo-300">{filteredProfessionals.length}</span> perfiles
            </p>
          </div>

          {filteredProfessionals.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {gridProfessionals.map((pro) => (
                <ProfessionalCard key={pro.id} professional={pro} />
              ))}
            </div>
          ) : (
            <div className="glass-card rounded-[28px] py-16 px-6 text-center border border-border/50 max-w-md mx-auto flex flex-col items-center justify-center gap-4 bg-card shadow-sm">
              <div className="w-12 h-12 rounded-full bg-slate-500/10 dark:bg-slate-500/20 flex items-center justify-center text-slate-500 dark:text-slate-400">
                <SlidersHorizontal className="size-5" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
                  No se encontraron candidatos
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Prueba bajando el Match Score Mínimo o habilitando más habilidades.
                </p>
              </div>
            </div>
          )}
        </section>

      </div>
    )
  }

  // Standard Discovery page layout for job discovery fallback
  return (
    <div className={cn("min-h-screen", showNav ? "bg-white" : "bg-transparent")}>
      <div className="mx-auto max-w-[1400px] px-6 py-12 md:px-8 md:py-[88px]">
        <div className="mb-10">
          <h1 className="text-[40px] font-medium leading-[1.2] -tracking-[0.4px] text-foreground">
            {lockMode ? "Talento" : "Discovery"}
          </h1>
          <p className="mt-3 text-base leading-relaxed text-muted-foreground">
            Encuentra el talento o la oportunidad perfecta para tu próximo proyecto.
          </p>
        </div>

        <div className="flex gap-10">
          <div className="min-w-0 flex-1">
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {filteredProfessionals.map((pro) => (
                <ProfessionalCard key={pro.id} professional={pro} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
