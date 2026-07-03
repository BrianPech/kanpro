"use client";

import * as React from "react";
import Image from "next/image";
import {
  Search,
  Filter,
  MapPin,
  Briefcase,
  Award,
  ExternalLink,
  ChevronRight,
  Phone,
  ArrowLeft,
  Loader2,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useConnection } from "@/hooks/use-connection";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { useGeolocation, calculateHaversineDistance } from "@/hooks/use-geolocation";
import { GEO_CONFIG, getCoordsForZone } from "@/config/geo";

export interface Candidate {
  id: string;
  full_name: string;
  headline: string;
  avatar_url: string | null;
  location: string;
  skills: string[];
  bio: string | null;
  experience_summary: string;
  is_validated: boolean;
  phone: string | null;
  email: string | null;
  experience: any[];
  education: any[];
}

export function CandidateRadar() {
  const [candidates, setCandidates] = React.useState<Candidate[]>([]);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [mobileDetailOpen, setMobileDetailOpen] = React.useState(false);
  const [selectedZone, setSelectedZone] = React.useState<string>("all");
  const [companyCity, setCompanyCity] = React.useState<string>("");
  const [companyZone, setCompanyZone] = React.useState<string>("");

  const { initiateWhatsAppConnection, loading: connecting } = useConnection();
  const supabase = createClient();
  const { coordinates: userCoords, requestLocation } = useGeolocation();

  React.useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  const loadCandidates = React.useCallback(async () => {
    try {
      setIsLoading(true);

      // Get company city & zone
      const { data: { user } } = await supabase.auth.getUser();
      let fetchedCompanyCity = "";
      let fetchedCompanyZone = "";
      if (user) {
        const { data: companyProfile } = await supabase
          .from("profiles")
          .select("location")
          .eq("id", user.id)
          .single();
        if (companyProfile?.location) {
          const locStr = companyProfile.location;
          if (locStr.includes(" - ")) {
            const parts = locStr.split(" - ");
            fetchedCompanyCity = parts[0];
            fetchedCompanyZone = parts[1];
          } else {
            if (locStr.toLowerCase().includes("playa del carmen")) {
              fetchedCompanyCity = "Playa del Carmen";
              fetchedCompanyZone = locStr.replace(/Playa del Carmen/i, "").replace(/^[-\s,|]+|[-\s,|]+$/g, "") || "Centro";
            } else {
              fetchedCompanyCity = "Mérida";
              fetchedCompanyZone = locStr.replace(/Mérida/i, "").replace(/^[-\s,|]+|[-\s,|]+$/g, "") || "Centro Mérida";
            }
          }
          setCompanyCity(fetchedCompanyCity);
          setCompanyZone(fetchedCompanyZone);
        }
      }

      // Restrict candidates to the company's city in Supabase (Paso A)
      let query = supabase
        .from("profiles")
        .select("*")
        .eq("role", "candidate");

      if (fetchedCompanyCity) {
        query = query.ilike("location", `%${fetchedCompanyCity}%`);
      }

      const { data, error } = await query.order("created_at", { ascending: false });

      if (error) throw error;

      if (data && data.length > 0) {
        const formatted: Candidate[] = data.map((c: any) => ({
          id: c.id,
          full_name: c.full_name || "Profesional K'anPro",
          headline: c.headline || "Candidato",
          avatar_url: c.avatar_url,
          location: c.location || "Playa del Carmen, Centro",
          skills: Array.isArray(c.skills) ? c.skills : (c.skills ? String(c.skills).split(",") : []),
          bio: c.bio,
          experience_summary: c.experience_summary || "Profesional con ganas de trabajar.",
          is_validated: c.is_validated || false,
          phone: c.phone,
          email: c.email,
          experience: Array.isArray(c.experience) ? c.experience : [],
          education: Array.isArray(c.education) ? c.education : [],
        }));
        setCandidates(formatted);
        if (formatted.length > 0) {
          setSelectedId(formatted[0].id);
        }
      } else {
        setCandidates([]);
        setSelectedId(null);
      }
    } catch (error) {
      console.error("Error loading candidates:", error);
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  React.useEffect(() => {
    loadCandidates();
  }, [loadCandidates]);

  // Selección del candidato activo
  const selectedCandidate = React.useMemo(() => {
    return candidates.find((c) => c.id === selectedId) || null;
  }, [candidates, selectedId]);

  // Filtrado de candidatos
  const filteredCandidates = React.useMemo(() => {
    const matched = candidates.filter((c) => {
      const matchesSearch = searchQuery
        ? c.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.headline.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.skills.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()))
        : true;

      const matchesZone = selectedZone === "all"
        ? true
        : c.location.toLowerCase().includes(selectedZone.toLowerCase()) ||
          c.location.toLowerCase().includes(GEO_CONFIG[companyCity]?.zones[selectedZone]?.name.toLowerCase() || "");

      return matchesSearch && matchesZone;
    });

    // Paso B: Ordenamiento por Geolocalización
    if (userCoords) {
      return [...matched].sort((a, b) => {
        const aCoords = getCoordsForZone(a.location);
        const bCoords = getCoordsForZone(b.location);

        if (!aCoords && !bCoords) return 0;
        if (!aCoords) return 1;
        if (!bCoords) return -1;

        const distA = calculateHaversineDistance(userCoords, aCoords);
        const distB = calculateHaversineDistance(userCoords, bCoords);
        return distA - distB;
      });
    }

    // Paso C: Fallback Clásico (Priorizar la zona del perfil)
    if (companyZone) {
      const zoneLower = companyZone.toLowerCase();
      return [...matched].sort((a, b) => {
        const aInZone = a.location.toLowerCase().includes(zoneLower) ? 1 : 0;
        const bInZone = b.location.toLowerCase().includes(zoneLower) ? 1 : 0;
        return bInZone - aInZone;
      });
    }

    return matched;
  }, [candidates, searchQuery, selectedZone, userCoords, companyCity, companyZone]);

  const handleContact = async (candidate: Candidate) => {
    try {
      const toastId = toast.loading("Conectando con el candidato...");
      const link = await initiateWhatsAppConnection({
        candidateId: candidate.id,
        initiatedBy: "company",
      });
      toast.dismiss(toastId);
      toast.success("¡Enlace de WhatsApp generado con éxito!");
    } catch (err: any) {
      toast.error("Error al conectar", {
        description: err.message || "No se pudo abrir el canal de WhatsApp.",
      });
    }
  };

  const selectCandidateOnMobile = (id: string) => {
    setSelectedId(id);
    setMobileDetailOpen(true);
  };

  return (
    <div className="flex-grow flex h-[calc(100vh-65px)] overflow-hidden bg-background animate-in fade-in duration-300">
      
      {/* ================= COLUMNA IZQUIERDA: LISTADO (Feed Vertical) ================= */}
      <div className={`w-full md:w-[40%] flex flex-col border-r border-border/40 bg-card/10 h-full ${
        mobileDetailOpen ? "hidden md:flex" : "flex"
      }`}>
        
        {/* Encabezado del Radar */}
        <div className="p-6 border-b border-border/40 flex flex-col gap-4 bg-background/50 backdrop-blur-sm shrink-0">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-extrabold text-foreground tracking-tight md:text-2xl">
              Radar de Talento
            </h2>
            <span className="bg-primary/10 text-primary px-3 py-1 rounded-full font-bold text-[10px] uppercase tracking-wider">
              {filteredCandidates.length} Candidatos
            </span>
          </div>

          {/* Filtros de Ubicación */}
          <div className="w-full">
            <select
              value={selectedZone}
              onChange={(e) => setSelectedZone(e.target.value)}
              className="w-full h-11 px-3 bg-muted/40 border border-border/40 rounded-xl text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
            >
              <option value="all">Todas las zonas ({companyCity || "Riviera Maya"})</option>
              {companyCity && GEO_CONFIG[companyCity] &&
                Object.keys(GEO_CONFIG[companyCity].zones).map((zoneKey) => (
                  <option key={zoneKey} value={zoneKey}>
                    {GEO_CONFIG[companyCity].zones[zoneKey].name}
                  </option>
                ))
              }
              {!companyCity &&
                Object.keys(GEO_CONFIG["Mérida"].zones).map((zoneKey) => (
                  <option key={zoneKey} value={zoneKey}>
                    {GEO_CONFIG["Mérida"].zones[zoneKey].name}
                  </option>
                ))
              }
            </select>
          </div>

          {/* Buscador de Candidato */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground size-3.5" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 h-11 bg-card border-border/60 rounded-xl text-xs font-semibold focus-visible:ring-primary/20"
              placeholder="Buscar por nombre, puesto o habilidad..."
            />
          </div>
        </div>

        {/* Listado con scroll */}
        <div className="flex-grow overflow-y-auto min-h-0 p-4 space-y-3 bg-slate-50/30 dark:bg-slate-950/10">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((n) => (
                <Card key={n} className="border border-border/40 p-5 bg-card">
                  <div className="flex gap-4">
                    <Skeleton className="size-12 rounded-full shrink-0 animate-pulse" />
                    <div className="flex-grow space-y-2">
                      <div className="flex items-center justify-between">
                        <Skeleton className="h-4 w-28 animate-pulse" />
                        <Skeleton className="h-4 w-16 animate-pulse" />
                      </div>
                      <Skeleton className="h-3 w-36 animate-pulse" />
                      <Skeleton className="h-3 w-24 animate-pulse" />
                      <div className="flex gap-1.5 pt-1">
                        <Skeleton className="h-5 w-12 rounded-md animate-pulse" />
                        <Skeleton className="h-5 w-12 rounded-md animate-pulse" />
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : filteredCandidates.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              <p className="text-sm font-semibold">No se encontraron candidatos</p>
              <p className="text-xs mt-1">Prueba refinando tus parámetros de búsqueda.</p>
            </div>
          ) : (
            filteredCandidates.map((candidate) => (
              <article key={candidate.id} aria-label={`Perfil de ${candidate.full_name}`} className="w-full">
                <Card
                  onClick={() => selectCandidateOnMobile(candidate.id)}
                  className={`cursor-pointer border border-border/50 hover:border-primary/40 transition-all rounded-2xl overflow-hidden active:scale-[0.99] ${
                    selectedId === candidate.id ? "border-primary/60 bg-primary/5 dark:bg-primary/10 shadow-sm" : "bg-card hover:bg-muted/15"
                  }`}
                >
                <CardContent className="p-5 flex gap-4">
                  <div className="relative shrink-0">
                    <Image
                      src={candidate.avatar_url || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop"}
                      alt={candidate.full_name}
                      width={48}
                      height={48}
                      className="size-12 rounded-full object-cover border border-border"
                    />
                    {candidate.is_validated && (
                      <span className="absolute -bottom-1 -right-1 bg-emerald-500 text-white p-0.5 rounded-full" title="Perfil Verificado">
                        <Award className="size-3.5 fill-white text-emerald-500" />
                      </span>
                    )}
                  </div>
                  <div className="flex-grow min-w-0 flex flex-col gap-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-extrabold text-sm md:text-base text-foreground truncate group-hover:text-primary transition-colors">
                        {candidate.full_name}
                      </h3>
                      {candidate.is_validated && (
                        <Badge className="bg-emerald-500/10 hover:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-bold text-[8px] tracking-wider uppercase px-2 h-5 flex items-center shrink-0">
                          Sello de Calidad
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-slate-700 dark:text-slate-300 font-bold truncate">
                      {candidate.headline}
                    </p>
                    <div className="flex items-center gap-1 text-[11px] text-muted-foreground font-semibold">
                      <MapPin className="size-3 text-slate-400 shrink-0" />
                      <span className="truncate">
                        {candidate.location}
                        {(() => {
                          const candidateCoords = getCoordsForZone(candidate.location);
                          if (userCoords && candidateCoords) {
                            return ` (${calculateHaversineDistance(userCoords, candidateCoords).toFixed(1)} km)`;
                          }
                          return "";
                        })()}
                      </span>
                    </div>

                    {/* Habilidades en Tags */}
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {candidate.skills.slice(0, 3).map((skill, idx) => (
                        <Badge
                          key={idx}
                          variant="secondary"
                          className="text-[9px] font-bold tracking-tight rounded-md px-1.5 py-0.5"
                        >
                          {skill}
                        </Badge>
                      ))}
                      {candidate.skills.length > 3 && (
                        <span className="text-[10px] text-muted-foreground font-bold pl-1">
                          +{candidate.skills.length - 3}
                        </span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </article>
          ))
          )}
        </div>
      </div>

      {/* ================= COLUMNA DERECHA: DETALLE (Split-View 60%) ================= */}
      <div className={`w-full md:w-[60%] flex flex-col h-full bg-card ${
        mobileDetailOpen ? "flex" : "hidden md:flex"
      }`}>
        {selectedCandidate ? (
          <div className="flex flex-col h-full">
            {/* Header móvil para volver atrás */}
            <div className="p-4 border-b border-border/40 flex items-center gap-3 shrink-0 bg-background md:hidden">
              <Button
                variant="ghost"
                size="icon"
                aria-label="Regresar al listado de candidatos"
                onClick={() => setMobileDetailOpen(false)}
                className="rounded-full size-11 active:scale-95 transition-transform"
              >
                <ArrowLeft className="size-5" />
              </Button>
              <h3 className="font-extrabold text-sm uppercase tracking-wider text-muted-foreground">
                Regresar al Radar
              </h3>
            </div>

            {/* Contenido del Detalle con Scroll */}
            <div className="flex-grow overflow-y-auto p-6 md:p-8 space-y-8">
              
              {/* Perfil Principal */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-5">
                <Image
                  src={selectedCandidate.avatar_url || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=180&h=180&fit=crop"}
                  alt={selectedCandidate.full_name}
                  width={80}
                  height={80}
                  className="size-20 rounded-full object-cover border-2 border-primary/20 shadow-sm"
                />
                <div className="flex-grow space-y-2.5">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <h1 className="text-2xl font-extrabold text-foreground tracking-tight">
                      {selectedCandidate.full_name}
                    </h1>
                    {selectedCandidate.is_validated && (
                      <Badge className="bg-emerald-500/10 hover:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-extrabold text-[10px] tracking-wider uppercase px-2.5 h-6 flex items-center mx-auto sm:mx-0 w-fit gap-1">
                        <Award className="size-3.5 fill-emerald-500/20 text-emerald-500" />
                        <span>Sello de Calidad</span>
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm md:text-base text-slate-800 dark:text-slate-200 font-extrabold">
                    {selectedCandidate.headline}
                  </p>
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs font-semibold text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <MapPin className="size-3.5 text-slate-400" />
                      <span>{selectedCandidate.location}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Botón de Contacto Directo WhatsApp */}
              <div className="p-5 border border-emerald-500/20 bg-emerald-500/5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="space-y-1 text-center sm:text-left">
                  <p className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                    ¿Quieres agendar entrevista?
                  </p>
                  <p className="text-xs text-muted-foreground font-medium">
                    Al hacer clic se registrará el contacto y se abrirá WhatsApp.
                  </p>
                </div>
                <Button
                  onClick={() => handleContact(selectedCandidate)}
                  disabled={connecting}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold h-12 px-6 rounded-xl flex items-center gap-2 shadow-sm w-full sm:w-auto active:scale-95 transition-all text-xs uppercase tracking-wider"
                >
                  {connecting ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Phone className="size-4 fill-white text-emerald-600" />
                  )}
                  <span>Contactar en WhatsApp</span>
                </Button>
              </div>

              {/* Biografía / Acerca de */}
              <div className="space-y-3">
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-muted-foreground">
                  Acerca del Candidato
                </h3>
                <div className="p-5 bg-muted/20 dark:bg-muted/10 rounded-2xl text-sm leading-relaxed text-slate-800 dark:text-slate-200 font-medium">
                  {selectedCandidate.bio || "Este candidato no ha redactado una biografía."}
                </div>
              </div>

              {/* Resumen de Experiencia */}
              <div className="space-y-3">
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-muted-foreground">
                  Resumen de Experiencia
                </h3>
                <div className="p-5 bg-muted/10 dark:bg-muted/5 rounded-2xl text-sm leading-relaxed text-slate-800 dark:text-slate-200 font-medium">
                  {selectedCandidate.experience_summary}
                </div>
              </div>

              {/* Habilidades Completas */}
              <div className="space-y-3">
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-muted-foreground">
                  Habilidades y Destrezas
                </h3>
                <div className="flex flex-wrap gap-2">
                  {selectedCandidate.skills.map((skill, idx) => (
                    <Badge
                      key={idx}
                      variant="secondary"
                      className="text-xs font-bold tracking-tight rounded-lg px-3 py-1 bg-muted/65 hover:bg-muted/65 text-slate-800 dark:text-slate-100"
                    >
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Historial de Trabajos */}
              {selectedCandidate.experience.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-sm font-extrabold uppercase tracking-wider text-muted-foreground">
                    Historial de Empleo
                  </h3>
                  <div className="space-y-4">
                    {selectedCandidate.experience.map((exp: any, idx: number) => (
                      <div key={idx} className="flex gap-4 items-start">
                        <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 shrink-0" />
                        <div className="space-y-1">
                          <h4 className="font-extrabold text-sm text-foreground">
                            {exp.role} — <span className="text-primary font-bold">{exp.company}</span>
                          </h4>
                          <p className="text-xs text-muted-foreground font-semibold">{exp.period}</p>
                          <p className="text-xs text-slate-700 dark:text-slate-300 font-medium mt-1 leading-relaxed">
                            {exp.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Educación */}
              {selectedCandidate.education.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-sm font-extrabold uppercase tracking-wider text-muted-foreground">
                    Educación y Certificaciones
                  </h3>
                  <div className="space-y-4">
                    {selectedCandidate.education.map((edu: any, idx: number) => (
                      <div key={idx} className="flex gap-4 items-start">
                        <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-2 shrink-0" />
                        <div className="space-y-1">
                          <h4 className="font-extrabold text-sm text-foreground">
                            {edu.degree}
                          </h4>
                          <p className="text-xs text-slate-600 dark:text-slate-300 font-bold">{edu.institution}</p>
                          <p className="text-xs text-muted-foreground font-semibold">{edu.period}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <Briefcase className="size-12 stroke-[1.5] mb-2" />
            <p className="text-sm font-semibold">Selecciona un candidato</p>
            <p className="text-xs">Usa la barra lateral izquierda para explorar y ver el perfil completo.</p>
          </div>
        )}
      </div>

    </div>
  );
}
