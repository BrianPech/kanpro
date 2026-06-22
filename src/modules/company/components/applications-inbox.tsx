"use client"

import * as React from "react"
import { 
  Search, 
  Filter, 
  Mail, 
  MoreVertical, 
  Star, 
  MapPin, 
  Briefcase, 
  Award,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  UserCheck,
  Phone,
  ArrowLeft,
  BriefcaseIcon,
  Loader2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { useApplicationsInbox, type Applicant } from "../hooks/use-applications-inbox"

export function ApplicationsInbox() {
  // Assume a default company user id or let Supabase fetch current user inside hook
  const {
    applicants,
    vacancies,
    selectedVacancyId,
    setSelectedVacancyId,
    selectedId,
    setSelectedId,
    searchQuery,
    setSearchQuery,
    selectedApplicant,
    isLoading,
    handleUpdateStatus,
    getWhatsAppLink,
    handleContactApplicant,
  } = useApplicationsInbox("company-id") // Fetch logic inside hooks takes care of user sessions

  const [mobileDetailOpen, setMobileDetailOpen] = React.useState(false)

  // Filter roster based on search text and vacancy selector
  const filteredApplicants = React.useMemo(() => {
    return applicants.filter((app) => {
      // Search text filter
      const matchesSearch = searchQuery
        ? app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          app.headline.toLowerCase().includes(searchQuery.toLowerCase()) ||
          app.skills.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()))
        : true

      // Vacancy selector filter
      const matchesVacancy = selectedVacancyId === "all" || app.vacancyId === selectedVacancyId

      return matchesSearch && matchesVacancy
    })
  }, [applicants, searchQuery, selectedVacancyId])

  const selectApplicantOnMobile = (id: string) => {
    setSelectedId(id)
    setMobileDetailOpen(true)
  }

  const handleStatusChangeLocal = async (id: string, status: Applicant["status"]) => {
    await handleUpdateStatus(id, status)
  }

  return (
    <div className="flex-grow flex h-[calc(100vh-65px)] overflow-hidden bg-background selection:bg-primary/20 animate-in fade-in duration-300">
      
      {/* ================= LEFT COLUMN: APPLICANTS ROSTER (40% width, hidden on mobile if detail is open) ================= */}
      <div className={`w-full md:w-[40%] flex flex-col border-r border-border/40 bg-card/10 relative h-full ${
        mobileDetailOpen ? "hidden md:flex" : "flex"
      }`}>
        
        {/* Roster Header */}
        <div className="p-6 border-b border-border/40 flex flex-col gap-4 bg-background/50 backdrop-blur-sm shrink-0">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-extrabold text-foreground tracking-tight md:text-2xl">
              Postulantes
            </h2>
            <span className="bg-primary/10 text-primary px-3 py-1 rounded-full font-bold text-xs font-sans tracking-wide">
              {filteredApplicants.length} Encontrados
            </span>
          </div>

          {/* Vacancy Filter Dropdown */}
          <div className="w-full">
            <select
              value={selectedVacancyId}
              onChange={(e) => setSelectedVacancyId(e.target.value)}
              className="w-full h-10 px-3 bg-muted/40 border border-border/40 rounded-xl text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="all">Todas las vacantes</option>
              {vacancies.map((vac) => (
                <option key={vac.id} value={vac.id}>
                  {vac.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Search & Filter Mini Pane inside roster */}
        <div className="px-6 py-4 border-b border-border/30 shrink-0 bg-background/20 flex gap-2">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground size-3.5" />
            <Input 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-4 h-9 bg-card border-border/60 rounded-full text-xs font-semibold focus-visible:ring-primary/20"
              placeholder="Buscar por nombre, puesto o habilidad..."
            />
          </div>
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => toast.info("Filtros avanzados", { description: "Próximamente filtros por afinidad e historial." })}
            className="size-9 rounded-full border-border/60 text-muted-foreground hover:text-foreground shrink-0 shadow-sm"
          >
            <Filter className="size-3.5" />
          </Button>
        </div>

        {/* Candidate Scrollable Cards */}
        <div className="overflow-y-auto hide-scrollbar flex-grow divide-y divide-border/20">
          {isLoading ? (
            <div className="p-12 text-center flex flex-col items-center justify-center gap-3">
              <Loader2 className="size-8 animate-spin text-primary" />
              <p className="text-xs text-muted-foreground font-semibold">Cargando postulantes...</p>
            </div>
          ) : filteredApplicants.map((applicant) => {
            const isSelected = applicant.id === selectedId
            return (
              <div 
                key={applicant.id}
                onClick={() => selectApplicantOnMobile(applicant.id)}
                className={`p-6 cursor-pointer transition-all duration-300 flex gap-4 ${
                  isSelected 
                    ? "bg-card border-l-4 border-primary shadow-sm" 
                    : "hover:bg-muted/30 border-b border-border/20"
                }`}
              >
                <img 
                  alt={applicant.name} 
                  className="h-12 w-12 rounded-xl object-cover border border-border/40 shadow-sm"
                  src={applicant.avatar} 
                />
                
                <div className="flex-grow min-w-0">
                  <div className="flex justify-between items-start gap-2">
                    <h3 className="text-sm font-extrabold text-foreground transition-colors truncate">
                      {applicant.name}
                    </h3>
                    <span className="text-[10px] font-bold text-muted-foreground font-sans shrink-0 whitespace-nowrap">
                      {applicant.elapsedTime}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground font-medium truncate">
                    {applicant.headline}
                  </p>
                  <p className="text-[10px] text-primary font-bold mt-1 truncate">
                    Vacante: {applicant.vacancyTitle}
                  </p>
                  
                  {/* Status Pills */}
                  <div className="mt-3">
                    <span className={`inline-flex px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide cursor-default ${
                      applicant.status === "Preseleccionado" 
                        ? "bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-200" 
                        : applicant.status === "En revisión"
                        ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200"
                        : applicant.status === "Contratado"
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200"
                        : applicant.status === "Descartado"
                        ? "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200"
                        : "bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-200"
                    }`}>
                      {applicant.status}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}

          {!isLoading && filteredApplicants.length === 0 && (
            <div className="p-12 text-center flex flex-col items-center justify-center gap-3">
              <Award className="size-8 text-muted-foreground/30" />
              <p className="text-xs text-muted-foreground font-medium">No se encontraron postulantes.</p>
            </div>
          )}
        </div>
      </div>

      {/* ================= RIGHT COLUMN: APPLICANT DETAILS SHOWCASE (60% width, hidden on mobile if detail is closed) ================= */}
      <div className={`w-full md:w-[60%] bg-muted/10 flex-col relative h-full ${
        mobileDetailOpen ? "flex" : "hidden md:flex"
      }`}>
        
        {selectedApplicant ? (
          <>
            {/* Sticky Detail Header */}
            <div className="p-6 md:p-8 sticky top-0 bg-background/90 backdrop-blur-xl z-10 border-b border-border/40 shrink-0">
              
              {/* Back Button for Mobile Roster */}
              <button 
                onClick={() => setMobileDetailOpen(false)}
                className="flex items-center gap-2 text-xs font-bold text-primary mb-4 md:hidden"
              >
                <ArrowLeft className="size-4" /> Volver al listado
              </button>

              <div className="flex flex-col sm:flex-row justify-between items-start gap-6">
                
                <div className="flex gap-6 items-center min-w-0">
                  <div className="h-20 w-20 rounded-3xl overflow-hidden shadow-md shadow-primary/5 border-2 border-primary/10 flex-shrink-0">
                    <img 
                      className="h-full w-full object-cover" 
                      alt={selectedApplicant.name}
                      src={selectedApplicant.avatar} 
                    />
                  </div>
                  
                  <div className="min-w-0">
                    <h2 className="text-2xl font-extrabold text-foreground tracking-tight truncate">
                      {selectedApplicant.name}
                    </h2>
                    <p className="text-primary font-bold text-xs md:text-sm mt-1 truncate">
                      {selectedApplicant.headline} • {selectedApplicant.location}
                    </p>
                    
                    {/* Rating Stars */}
                    <div className="flex items-center gap-1.5 mt-2">
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star 
                            key={star} 
                            className={`size-3.5 ${star <= selectedApplicant.rating ? "text-amber-500 fill-amber-500" : "text-muted/60"}`} 
                          />
                        ))}
                      </div>
                      <span className="text-[10px] font-bold text-muted-foreground font-sans">
                        ({selectedApplicant.reviewsCount} Reseñas)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Status Dropdown Actions */}
                <div className="flex flex-wrap gap-2 items-center w-full sm:w-auto">
                  <select
                    value={selectedApplicant.status}
                    onChange={(e) => handleStatusChangeLocal(selectedApplicant.id, e.target.value as any)}
                    className="h-10 px-3 bg-card border border-border/60 rounded-xl text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-sm"
                  >
                    <option value="Pendiente">Pendiente</option>
                    <option value="En revisión">En revisión</option>
                    <option value="Preseleccionado">Preseleccionado</option>
                    <option value="Contratado">Contratado</option>
                    <option value="Descartado">Descartado</option>
                  </select>
                </div>

              </div>
            </div>

            {/* Scrollable Detail Body Content */}
            <div className="overflow-y-auto hide-scrollbar flex-grow p-6 md:p-8 space-y-8 pb-32">
              
              {/* Vacancy Info Banner */}
              <div className="p-4 bg-primary/5 border border-primary/10 rounded-2xl flex items-center gap-3">
                <BriefcaseIcon className="size-5 text-primary" />
                <div>
                  <p className="text-[10px] font-extrabold text-primary uppercase tracking-wide">Vacante postulada</p>
                  <p className="text-xs font-bold text-foreground">{selectedApplicant.vacancyTitle}</p>
                </div>
              </div>

              {/* Headline & Bio Section */}
              <div className="glass-panel p-6 md:p-8 rounded-[24px] shadow-sm relative overflow-hidden bg-background border border-border/50">
                <div className="absolute top-0 right-0 w-20 h-20 bg-primary/5 rounded-bl-[100px] pointer-events-none"></div>
                <h3 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                  <Award className="size-3.5 text-indigo-650" /> Biografía Profesional
                </h3>
                <p className="text-sm md:text-base leading-relaxed text-foreground font-medium font-sans whitespace-pre-line">
                  {selectedApplicant.bio}
                </p>
              </div>

              {/* Experience Grid Section */}
              {selectedApplicant.experiences && selectedApplicant.experiences.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 px-1">
                    <Briefcase className="size-3.5 text-indigo-650" /> Experiencia Laboral
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {selectedApplicant.experiences.map((exp, index) => (
                      <div key={index} className="bg-card p-6 rounded-[24px] border border-border/60 shadow-sm flex flex-col justify-between hover:border-border transition-colors">
                        <div>
                          <div className="flex justify-between items-start gap-2 mb-1">
                            <h4 className="font-extrabold text-sm text-foreground">{exp.role}</h4>
                            <span className="text-[10px] font-bold text-primary px-2.5 py-0.5 bg-primary/5 border border-primary/10 rounded-full shrink-0 font-sans tracking-wide">
                              {exp.period}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground font-semibold mb-3">{exp.company}</p>
                          <p className="text-xs text-muted-foreground font-medium leading-relaxed font-sans line-clamp-3">
                            {exp.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Education Section */}
              {selectedApplicant.education && selectedApplicant.education.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 px-1">
                    <Award className="size-3.5 text-indigo-650" /> Educación & Certificaciones
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {selectedApplicant.education.map((edu, index) => (
                      <div key={index} className="bg-card p-6 rounded-[24px] border border-border/60 shadow-sm flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start gap-2 mb-1">
                            <h4 className="font-extrabold text-sm text-foreground">{edu.degree}</h4>
                            <span className="text-[10px] font-bold text-primary px-2.5 py-0.5 bg-primary/5 border border-primary/10 rounded-full shrink-0 font-sans tracking-wide">
                              {edu.period}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground font-semibold mb-3">{edu.institution}</p>
                          {edu.description && (
                            <p className="text-xs text-muted-foreground font-medium leading-relaxed font-sans line-clamp-3">
                              {edu.description}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Technical Skills Badges Section */}
              {selectedApplicant.skills && selectedApplicant.skills.length > 0 && (
                <div className="glass-panel p-6 md:p-8 rounded-[24px] shadow-sm bg-background border border-border/50">
                  <h3 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-1.5">
                    <TrendingUp className="size-3.5 text-indigo-650" /> Habilidades Técnicas
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedApplicant.skills.map((skill, index) => (
                      <span 
                        key={index}
                        className="px-4 py-2 bg-primary/5 text-primary rounded-full text-xs font-bold border border-primary/10 hover:bg-primary/10 transition-all cursor-default"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Contact Information */}
              <div className="glass-panel p-6 md:p-8 rounded-[24px] shadow-sm bg-background border border-border/50 space-y-4">
                <h3 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Mail className="size-3.5 text-indigo-650" /> Información de Contacto
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-medium text-muted-foreground">
                  {selectedApplicant.email && (
                    <div>
                      <span className="font-bold block text-foreground uppercase tracking-wider text-[9px] mb-1">Correo Electrónico</span>
                      <span>{selectedApplicant.email}</span>
                    </div>
                  )}
                  {selectedApplicant.phone && (
                    <div>
                      <span className="font-bold block text-foreground uppercase tracking-wider text-[9px] mb-1">Número de Teléfono</span>
                      <span>{selectedApplicant.phone}</span>
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* Fixed Bottom Action Controls overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-6 bg-background/80 backdrop-blur-md border-t border-border/40 flex justify-end gap-4 z-10 shrink-0">
              <Button 
                variant="ghost"
                onClick={() => {
                  handleStatusChangeLocal(selectedApplicant.id, "Descartado")
                  toast.warning("Postulación Descartada", { description: "Se ha archivado la postulación." })
                }}
                className="px-8 py-5 h-auto rounded-full font-bold text-muted-foreground hover:bg-muted text-xs md:text-sm active:scale-95 transition-all shadow-none"
              >
                Descartar
              </Button>
              
              {/* WhatsApp invitation button */}
              {selectedApplicant.phone ? (
                <a
                  href={getWhatsAppLink(selectedApplicant)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex"
                  onClick={() => handleContactApplicant(selectedApplicant)}
                >
                  <Button 
                    className="px-8 py-5 h-auto rounded-full font-bold bg-indigo-600 text-white hover:bg-indigo-700 text-xs md:text-sm active:scale-95 transition-all shadow-lg shadow-indigo-500/10 hover:shadow-indigo-500/25 gap-2"
                  >
                    <Phone className="size-4" />
                    <span>Contactar por WhatsApp</span>
                  </Button>
                </a>
              ) : (
                <Button 
                  disabled
                  className="px-8 py-5 h-auto rounded-full font-bold bg-muted text-muted-foreground text-xs md:text-sm gap-2"
                >
                  <Phone className="size-4" />
                  <span>Sin Teléfono</span>
                </Button>
              )}
            </div>
          </>
        ) : (
          <div className="flex-grow flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
            <UserCheck className="size-12 mb-4 text-muted-foreground/30" />
            <p className="text-sm font-semibold">Selecciona un candidato para ver su perfil completo.</p>
          </div>
        )}

      </div>

    </div>
  )
}
