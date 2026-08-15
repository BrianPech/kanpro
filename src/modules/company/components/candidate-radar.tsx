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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { useConnection } from "@/hooks/use-connection";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { useGeolocation, calculateHaversineDistance } from "@/hooks/use-geolocation";
import { GEO_CONFIG, getCoordsForZone } from "@/config/geo";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import Link from "next/link";
import { cn } from "@/lib/utils";

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
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [mobileDetailOpen, setMobileDetailOpen] = React.useState(false);
  const [selectedZone, setSelectedZone] = React.useState<string>("all");
  const [companyCity, setCompanyCity] = React.useState<string>("");
  const [companyZone, setCompanyZone] = React.useState<string>("");

  const { initiateWhatsAppConnection, loading: connecting } = useConnection();
  const supabase = createClient();
  const { coordinates: userCoords, requestLocation } = useGeolocation();

  // Company profile checking states
  const [profile, setProfile] = React.useState<any>(null);
  const [loadingProfile, setLoadingProfile] = React.useState(true);

  React.useEffect(() => {
    const checkProfile = async () => {
      try {
        setLoadingProfile(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: baseProfile } = await supabase
            .from("profiles")
            .select("full_name, location")
            .eq("id", user.id)
            .single();

          const { data: compProfile } = await supabase
            .from("company_profiles")
            .select("company_name, contact_phone, fiscal_address, logo_url, subscription_plan")
            .eq("id", user.id)
            .maybeSingle();

          setProfile({
            company_name: compProfile?.company_name || baseProfile?.full_name || "",
            phone: compProfile?.contact_phone || "configurado",
            location: compProfile?.fiscal_address || baseProfile?.location || "",
            logo_url: compProfile?.logo_url || null,
            subscription_plan: compProfile?.subscription_plan || "basic",
          });
        }
      } catch (err) {
        console.error("Error loading profile:", err);
      } finally {
        setLoadingProfile(false);
      }
    };
    checkProfile();
  }, [supabase]);

  const isProfileIncomplete = React.useMemo(() => {
    if (loadingProfile) return false;
    if (!profile) return false;

    const name = profile.company_name?.trim() || "";
    const addr = profile.location?.trim() || "";

    return !name || name === "Nueva Empresa" || !addr;
  }, [profile, loadingProfile]);

  React.useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  // TanStack Query for candidate list
  const { data: candidates = [], isLoading } = useQuery({
    queryKey: ['candidates', companyCity, selectedZone],
    queryFn: async () => {
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

      const { data, error } = await supabase
        .from("profiles")
        .select(`
          id,
          full_name,
          avatar_url,
          location,
          whatsapp_number,
          email,
          is_verified,
          created_at,
          candidate_profiles (
            id,
            headline,
            bio,
            skills,
            experience,
            education,
            preferred_zone
          )
        `)
        .eq("role", "candidate")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Supabase Error loading candidate profiles:", error.message || error);
        throw error;
      }

      if (!data || data.length === 0) {
        return [];
      }

      const formatted: Candidate[] = data.map((prof: any) => {
        const cand = Array.isArray(prof.candidate_profiles)
          ? prof.candidate_profiles[0]
          : (prof.candidate_profiles || {});

        return {
          id: prof.id,
          full_name: prof.full_name || "Profesional K'anPro",
          headline: cand.headline || "Candidato Registrado",
          avatar_url: prof.avatar_url || null,
          location: prof.location || cand.preferred_zone || "Riviera Maya",
          skills: Array.isArray(cand.skills) ? cand.skills : (cand.skills ? String(cand.skills).split(",") : []),
          bio: cand.bio || null,
          experience_summary: cand.bio || "Profesional disponible en la región.",
          is_validated: Boolean(prof.is_verified),
          phone: prof.whatsapp_number || null,
          email: prof.email || null,
          experience: Array.isArray(cand.experience) ? cand.experience : [],
          education: Array.isArray(cand.education) ? cand.education : [],
        };
      });

      const targetCity = fetchedCompanyCity || companyCity;
      const filteredByCity = targetCity
        ? formatted.filter((cand) => cand.location.toLowerCase().includes(targetCity.toLowerCase()))
        : formatted;

      return filteredByCity.length > 0 ? filteredByCity : formatted;
    },
    staleTime: 5 * 60 * 1000,
  });

  React.useEffect(() => {
    if (candidates.length > 0 && (!selectedId || !candidates.some((c) => c.id === selectedId))) {
      setSelectedId(candidates[0].id);
    }
  }, [candidates, selectedId]);

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
    // If company is on basic plan, suggest upgrading to PRO for proactive Radar outreach
    if (profile?.subscription_plan === "basic" || !profile?.subscription_plan) {
      toast.info("Función del Plan PRO", {
        description: "El contacto proactivo desde el Radar GPS es exclusivo de los Planes PRO y Corporativo. Actualiza tu suscripción en Configuración para escribirle directamente.",
        action: {
          label: "Ver Planes",
          onClick: () => {
            window.location.href = "/dashboard/company/settings";
          }
        }
      });
      return;
    }

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

          {isProfileIncomplete && !loadingProfile && (
            <Alert variant="destructive" className="bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-400 p-4 rounded-xl flex flex-col gap-3">
              <div className="flex items-start gap-2">
                <span className="text-base shrink-0 mt-0.5">⚠️</span>
                <div className="space-y-1">
                  <AlertTitle className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                    Perfil Incompleto
                  </AlertTitle>
                  <AlertDescription className="text-[11px] font-semibold leading-normal text-amber-600 dark:text-amber-300/90">
                    Para poder consultar los perfiles a detalle, activar tu radar de cercanía y contactar al talento local, primero completa la información esencial de tu negocio en la sección de Mi Perfil.
                  </AlertDescription>
                </div>
              </div>
              <Button
                asChild
                className="w-full h-10 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-[10px] uppercase tracking-wider transition-all"
              >
                <Link href="/dashboard/company/profile">
                  Completar Perfil
                </Link>
              </Button>
            </Alert>
          )}

          {/* Filtros de Ubicación */}
          <div className="w-full">
            <Select
              value={selectedZone}
              onValueChange={setSelectedZone}
            >
              <SelectTrigger className={cn(
                "w-full h-11 px-3 bg-muted/40 border border-border/40 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer text-left",
                selectedZone !== "all"
                  ? "text-zinc-900 dark:text-zinc-50 font-extrabold border-blue-500/30"
                  : "text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300"
              )}>
                <SelectValue placeholder="Selecciona Zona" />
              </SelectTrigger>
              <SelectContent className="bg-white/95 dark:bg-zinc-900/95 border-border/40 rounded-xl">
                <SelectItem value="all" className="text-xs font-medium cursor-pointer rounded-lg">
                  Todas las zonas ({companyCity || "Riviera Maya"})
                </SelectItem>
                {companyCity && GEO_CONFIG[companyCity] &&
                  Object.keys(GEO_CONFIG[companyCity].zones).map((zoneKey) => (
                    <SelectItem key={zoneKey} value={zoneKey} className="text-xs font-medium cursor-pointer rounded-lg">
                      {GEO_CONFIG[companyCity].zones[zoneKey].name}
                    </SelectItem>
                  ))
                }
                {!companyCity &&
                  Object.keys(GEO_CONFIG["Mérida"].zones).map((zoneKey) => (
                    <SelectItem key={zoneKey} value={zoneKey} className="text-xs font-medium cursor-pointer rounded-lg">
                      {GEO_CONFIG["Mérida"].zones[zoneKey].name}
                    </SelectItem>
                  ))
                }
              </SelectContent>
            </Select>
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
            <div className="flex-grow overflow-y-auto p-6 md:p-8 space-y-8 relative">
              
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
                  disabled={connecting || isProfileIncomplete}
                  className={cn(
                    "bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold h-12 px-6 rounded-xl flex items-center gap-2 shadow-sm w-full sm:w-auto active:scale-95 transition-all text-xs uppercase tracking-wider",
                    isProfileIncomplete && "opacity-50 cursor-not-allowed hover:bg-emerald-600"
                  )}
                >
                  {connecting ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Phone className="size-4 fill-white text-emerald-600" />
                  )}
                  <span>Contactar en WhatsApp</span>
                </Button>
              </div>

              {/* Contenido Privado (Con blur si el perfil está incompleto) */}
              <div className={cn("space-y-8", isProfileIncomplete && "filter blur-[4px] select-none pointer-events-none")}>
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

              {/* Lock Overlay */}
              {isProfileIncomplete && (
                <div className="absolute inset-x-0 bottom-0 top-[260px] bg-background/50 backdrop-blur-[1px] flex flex-col items-center justify-center p-6 text-center z-20">
                  <div className="max-w-sm p-6 bg-card border border-border/80 rounded-2xl shadow-lg flex flex-col items-center gap-3 animate-in zoom-in-95 duration-200">
                    <span className="text-3xl">🔒</span>
                    <h4 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                      Detalles Privados Bloqueados
                    </h4>
                    <p className="text-xs text-muted-foreground font-semibold leading-relaxed">
                      Para ver el perfil completo, historial laboral y certificaciones de los candidatos, completa la información de tu negocio.
                    </p>
                    <Button
                      asChild
                      className="h-11 rounded-xl bg-primary hover:bg-primary/95 text-white font-bold text-xs uppercase tracking-wider px-5"
                    >
                      <Link href="/dashboard/company/profile">
                        Completar Perfil
                      </Link>
                    </Button>
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
