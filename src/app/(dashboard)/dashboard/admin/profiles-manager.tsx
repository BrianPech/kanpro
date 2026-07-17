"use client";

import React, { useState, useTransition, useEffect } from "react";
import { Search, MapPin, BadgeCheck, ShieldAlert, Filter, Building2, Users } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { GEO_CONFIG } from "@/config/geo";
import { toggleCandidateVerification } from "./actions";
import { toast } from "sonner";

interface CandidateProfile {
  id: string;
  full_name: string | null;
  role: "candidate";
  location: string | null;
  skills: string[] | null;
  is_validated: boolean;
  avatar_url: string | null;
}

interface CompanyProfile {
  id: string;
  company_name: string;
  logo_url: string | null;
  location: string | null;
  is_validated: boolean;
  role: "company";
}

interface AdminProfilesManagerProps {
  initialCandidates: CandidateProfile[];
  initialCompanies: CompanyProfile[];
}

export function AdminProfilesManager({ initialCandidates, initialCompanies }: AdminProfilesManagerProps) {
  const [candidates, setCandidates] = useState<CandidateProfile[]>(initialCandidates);
  const [companies, setCompanies] = useState<CompanyProfile[]>(initialCompanies);
  
  const [candidateSearch, setCandidateSearch] = useState("");
  const [candidateCityFilter, setCandidateCityFilter] = useState<"all" | "merida" | "playa">("all");
  const [candidateStatusFilter, setCandidateStatusFilter] = useState<"all" | "verified" | "pending">("all");

  const [companySearch, setCompanySearch] = useState("");
  const [companyStatusFilter, setCompanyStatusFilter] = useState<"all" | "verified" | "pending">("all");

  const [isPending, startTransition] = useTransition();

  // Sync state with server-side props updates
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCandidates(initialCandidates);
  }, [initialCandidates]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCompanies(initialCompanies);
  }, [initialCompanies]);

  const handleToggleCandidateVerification = (profileId: string, currentStatus: boolean) => {
    const newStatus = !currentStatus;
    
    // Optimistic UI state toggle
    setCandidates((prev) =>
      prev.map((p) => (p.id === profileId ? { ...p, is_validated: newStatus } : p))
    );

    startTransition(async () => {
      try {
        await toggleCandidateVerification(profileId, newStatus);
        toast.success(
          newStatus
            ? "Candidato verificado: Sello de Calidad otorgado con éxito."
            : "Verificación de candidato desactivada."
        );
      } catch (err) {
        // Rollback optimistic update on error
        setCandidates((prev) =>
          prev.map((p) => (p.id === profileId ? { ...p, is_validated: currentStatus } : p))
        );
        const errorMessage = err instanceof Error ? err.message : "Ocurrió un error inesperado.";
        toast.error("Error al actualizar verificación", {
          description: errorMessage,
        });
      }
    });
  };

  const handleToggleCompanyVerification = (profileId: string, currentStatus: boolean) => {
    const newStatus = !currentStatus;
    
    // Optimistic UI state toggle
    setCompanies((prev) =>
      prev.map((p) => (p.id === profileId ? { ...p, is_validated: newStatus } : p))
    );

    startTransition(async () => {
      try {
        await toggleCandidateVerification(profileId, newStatus);
        toast.success(
          newStatus
            ? "Empresa verificada: Sello de Calidad otorgado con éxito."
            : "Verificación de empresa desactivada."
        );
      } catch (err) {
        // Rollback optimistic update on error
        setCompanies((prev) =>
          prev.map((p) => (p.id === profileId ? { ...p, is_validated: currentStatus } : p))
        );
        const errorMessage = err instanceof Error ? err.message : "Ocurrió un error inesperado.";
        toast.error("Error al actualizar verificación", {
          description: errorMessage,
        });
      }
    });
  };

  // Filter candidates using geo.ts
  const filteredCandidates = candidates.filter((candidate) => {
    // 1. Search text filter
    const name = (candidate.full_name || "").toLowerCase();
    const skillsText = (candidate.skills || []).join(" ").toLowerCase();
    const matchesSearch = name.includes(candidateSearch.toLowerCase()) || skillsText.includes(candidateSearch.toLowerCase());

    // 2. City filter using GEO_CONFIG
    const location = (candidate.location || "").toLowerCase();
    let matchesCity = true;
    
    const meridaName = GEO_CONFIG["Mérida"]?.name || "Mérida";
    const playaName = GEO_CONFIG["Playa del Carmen"]?.name || "Playa del Carmen";

    if (candidateCityFilter === "merida") {
      matchesCity = location.includes(meridaName.toLowerCase());
    } else if (candidateCityFilter === "playa") {
      matchesCity = location.includes(playaName.toLowerCase());
    }

    // 3. Status filter
    let matchesStatus = true;
    if (candidateStatusFilter === "verified") {
      matchesStatus = candidate.is_validated === true;
    } else if (candidateStatusFilter === "pending") {
      matchesStatus = candidate.is_validated === false;
    }

    return matchesSearch && matchesCity && matchesStatus;
  });

  // Filter companies
  const filteredCompanies = companies.filter((company) => {
    // 1. Search text filter
    const name = (company.company_name || "").toLowerCase();
    const matchesSearch = name.includes(companySearch.toLowerCase());

    // 2. Status filter
    let matchesStatus = true;
    if (companyStatusFilter === "verified") {
      matchesStatus = company.is_validated === true;
    } else if (companyStatusFilter === "pending") {
      matchesStatus = company.is_validated === false;
    }

    return matchesSearch && matchesStatus;
  });

  return (
    <Tabs defaultValue="candidates" className="w-full space-y-6">
      {/* Switch console view */}
      <TabsList className="bg-zinc-100 dark:bg-zinc-800/80 p-1 rounded-lg w-fit flex gap-1 border border-border/10">
        <TabsTrigger value="candidates" className="px-4 py-2 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer">
          <Users className="h-3.5 w-3.5" />
          <span>Auditar Candidatos</span>
        </TabsTrigger>
        <TabsTrigger value="companies" className="px-4 py-2 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer">
          <Building2 className="h-3.5 w-3.5" />
          <span>Auditar Empresas</span>
        </TabsTrigger>
      </TabsList>

      {/* PESTAÑA 1: CANDIDATOS */}
      <TabsContent value="candidates" className="space-y-6 outline-none">
        {/* Filters and Search Bar */}
        <div className="flex flex-col lg:flex-row gap-4 justify-between items-stretch lg:items-center bg-white dark:bg-zinc-900 p-4 border border-border/10 rounded-xl shadow-none">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
            <Input
              placeholder="Buscar candidatos por nombre o habilidades..."
              value={candidateSearch}
              onChange={(e) => setCandidateSearch(e.target.value)}
              className="pl-9 h-9 bg-white dark:bg-zinc-950/40 rounded-lg border border-border/10 text-xs placeholder-zinc-450"
            />
          </div>

          <div className="flex flex-wrap gap-3 items-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1">
              <Filter className="h-3 w-3" /> Filtrar:
            </span>
            
            {/* City filter using geo.ts configuration */}
            <div className="flex bg-zinc-100 dark:bg-zinc-800 p-0.5 rounded-lg text-[11px] font-semibold">
              <button
                onClick={() => setCandidateCityFilter("all")}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  candidateCityFilter === "all" ? "bg-white dark:bg-zinc-900 shadow-none text-zinc-900 dark:text-zinc-50 font-bold" : "text-zinc-400 dark:text-zinc-500"
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => setCandidateCityFilter("merida")}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  candidateCityFilter === "merida" ? "bg-white dark:bg-zinc-900 shadow-none text-zinc-900 dark:text-zinc-50 font-bold" : "text-zinc-400 dark:text-zinc-500"
                }`}
              >
                Mérida
              </button>
              <button
                onClick={() => setCandidateCityFilter("playa")}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  candidateCityFilter === "playa" ? "bg-white dark:bg-zinc-900 shadow-none text-zinc-900 dark:text-zinc-50 font-bold" : "text-zinc-400 dark:text-zinc-500"
                }`}
              >
                Playa del Carmen
              </button>
            </div>

            {/* Validation status filter */}
            <div className="flex bg-zinc-100 dark:bg-zinc-800 p-0.5 rounded-lg text-[11px] font-semibold">
              <button
                onClick={() => setCandidateStatusFilter("all")}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  candidateStatusFilter === "all" ? "bg-white dark:bg-zinc-900 shadow-none text-zinc-900 dark:text-zinc-50 font-bold" : "text-zinc-400 dark:text-zinc-500"
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => setCandidateStatusFilter("verified")}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  candidateStatusFilter === "verified" ? "bg-white dark:bg-zinc-900 shadow-none text-zinc-900 dark:text-zinc-50 font-bold" : "text-zinc-400 dark:text-zinc-500"
                }`}
              >
                Verificados
              </button>
              <button
                onClick={() => setCandidateStatusFilter("pending")}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  candidateStatusFilter === "pending" ? "bg-white dark:bg-zinc-900 shadow-none text-zinc-900 dark:text-zinc-50 font-bold" : "text-zinc-400 dark:text-zinc-500"
                }`}
              >
                Pendientes
              </button>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-zinc-400 px-1">
          <span>Mostrando <span className="font-mono text-xs">{filteredCandidates.length}</span> candidatos</span>
        </div>

        {/* Candidate List Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredCandidates.length > 0 ? (
            filteredCandidates.map((candidate) => (
              <Card
                key={candidate.id}
                className="relative overflow-hidden rounded-xl border border-border/10 bg-white dark:bg-zinc-900 shadow-none hover:border-zinc-350 dark:hover:border-zinc-750 transition-all duration-200"
              >
                <CardContent className="p-5 flex flex-col justify-between h-full gap-4">
                  
                  {/* Candidate Header */}
                  <div className="flex items-start gap-4">
                    <Avatar className="w-10 h-10 rounded-lg">
                      <AvatarImage src={candidate.avatar_url || ""} className="object-cover" />
                      <AvatarFallback className="font-extrabold text-xs uppercase bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-455">
                        {(candidate.full_name || "??").substring(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h5 className="font-bold text-sm text-zinc-900 dark:text-zinc-50 truncate">
                          {candidate.full_name || "Usuario Sin Nombre"}
                        </h5>
                        {candidate.is_validated ? (
                          <BadgeCheck className="h-4 w-4 text-primary shrink-0" />
                        ) : (
                          <ShieldAlert className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                        )}
                      </div>
                      
                      <p className="text-xs font-medium text-zinc-400 dark:text-zinc-500 flex items-center gap-1 mt-1">
                        <MapPin className="h-3 w-3 shrink-0" />
                        {candidate.location || "Ubicación no configurada"}
                      </p>
                    </div>

                    <Badge className="capitalize text-[9px] font-bold tracking-wider px-2 py-0.5 rounded-md border-none shrink-0 bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300">
                      Candidato
                    </Badge>
                  </div>

                  {/* Skills Section */}
                  <div className="space-y-1.5 flex-1">
                    <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-400">
                      Habilidades / Categorías
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {candidate.skills && candidate.skills.length > 0 ? (
                        candidate.skills.map((skill, index) => (
                          <span
                            key={index}
                            className="text-[9px] font-medium bg-zinc-50 dark:bg-zinc-950 border border-border/10 px-2 py-0.5 rounded-md text-zinc-600 dark:text-zinc-400"
                          >
                            {skill}
                          </span>
                        ))
                      ) : (
                        <span className="text-[11px] italic text-zinc-550 dark:text-zinc-500">
                          No especificadas
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Footer Validation Switch */}
                  <div className="pt-3 border-t border-border/10 flex items-center justify-between mt-1 shrink-0">
                    <div className="flex flex-col">
                      <span className="text-[11px] font-semibold text-zinc-900 dark:text-zinc-50">
                        Sello de Calidad
                      </span>
                      <span className="text-[9px] text-zinc-400 dark:text-zinc-500 mt-0.5">
                        {candidate.is_validated ? "Destacado & Verificado" : "Pendiente de aprobación"}
                      </span>
                    </div>

                    <Switch
                      checked={candidate.is_validated}
                      onCheckedChange={() => handleToggleCandidateVerification(candidate.id, candidate.is_validated)}
                      disabled={isPending}
                    />
                  </div>

                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-full py-16 px-6 border border-dashed border-border/10 rounded-xl text-center bg-zinc-50/20 dark:bg-zinc-900/10">
              <p className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
                No se encontraron candidatos
              </p>
              <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
                Prueba borrando tu búsqueda o cambiando los filtros superiores.
              </p>
            </div>
          )}
        </div>
      </TabsContent>

      {/* PESTAÑA 2: EMPRESAS */}
      <TabsContent value="companies" className="space-y-6 outline-none">
        {/* Filters and Search Bar */}
        <div className="flex flex-col lg:flex-row gap-4 justify-between items-stretch lg:items-center bg-white dark:bg-zinc-900 p-4 border border-border/10 rounded-xl shadow-none">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
            <Input
              placeholder="Buscar empresas por nombre comercial..."
              value={companySearch}
              onChange={(e) => setCompanySearch(e.target.value)}
              className="pl-9 h-9 bg-white dark:bg-zinc-950/40 rounded-lg border border-border/10 text-xs placeholder-zinc-450"
            />
          </div>

          <div className="flex flex-wrap gap-3 items-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1">
              <Filter className="h-3 w-3" /> Filtrar:
            </span>

            {/* Validation status filter */}
            <div className="flex bg-zinc-100 dark:bg-zinc-800 p-0.5 rounded-lg text-[11px] font-semibold">
              <button
                onClick={() => setCompanyStatusFilter("all")}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  companyStatusFilter === "all" ? "bg-white dark:bg-zinc-900 shadow-none text-zinc-900 dark:text-zinc-50 font-bold" : "text-zinc-400 dark:text-zinc-500"
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => setCompanyStatusFilter("verified")}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  companyStatusFilter === "verified" ? "bg-white dark:bg-zinc-900 shadow-none text-zinc-900 dark:text-zinc-50 font-bold" : "text-zinc-400 dark:text-zinc-500"
                }`}
              >
                Con Sello
              </button>
              <button
                onClick={() => setCompanyStatusFilter("pending")}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  companyStatusFilter === "pending" ? "bg-white dark:bg-zinc-900 shadow-none text-zinc-900 dark:text-zinc-50 font-bold" : "text-zinc-400 dark:text-zinc-500"
                }`}
              >
                Pendientes
              </button>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-zinc-400 px-1">
          <span>Mostrando <span className="font-mono text-xs">{filteredCompanies.length}</span> empresas</span>
        </div>

        {/* Company List Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredCompanies.length > 0 ? (
            filteredCompanies.map((company) => (
              <Card
                key={company.id}
                className="relative overflow-hidden rounded-xl border border-border/10 bg-white dark:bg-zinc-900 shadow-none hover:border-zinc-350 dark:hover:border-zinc-750 transition-all duration-200"
              >
                <CardContent className="p-5 flex flex-col justify-between h-full gap-4">
                  
                  {/* Company Header */}
                  <div className="flex items-start gap-4">
                    <Avatar className="w-10 h-10 rounded-lg bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center overflow-hidden border border-border/10">
                      <AvatarImage src={company.logo_url || ""} className="object-contain p-1" />
                      <AvatarFallback className="font-extrabold text-xs uppercase bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-455">
                        {(company.company_name || "??").substring(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h5 className="font-bold text-sm text-zinc-900 dark:text-zinc-50 truncate">
                          {company.company_name || "Empresa Sin Nombre"}
                        </h5>
                        {company.is_validated ? (
                          <BadgeCheck className="h-4 w-4 text-primary shrink-0" />
                        ) : (
                          <ShieldAlert className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                        )}
                      </div>
                      
                      <p className="text-xs font-medium text-zinc-400 dark:text-zinc-500 flex items-center gap-1 mt-1">
                        <MapPin className="h-3 w-3 shrink-0" />
                        {company.location || "Dirección/Referencia no configurada"}
                      </p>
                    </div>

                    <Badge className="capitalize text-[9px] font-bold tracking-wider px-2 py-0.5 rounded-md border-none shrink-0 bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300">
                      Empresa
                    </Badge>
                  </div>

                  {/* Footer Validation Switch */}
                  <div className="pt-3 border-t border-border/10 flex items-center justify-between mt-1 shrink-0">
                    <div className="flex flex-col">
                      <span className="text-[11px] font-semibold text-zinc-900 dark:text-zinc-50">
                        Sello de Calidad (Empresa)
                      </span>
                      <span className="text-[9px] text-zinc-400 dark:text-zinc-500 mt-0.5">
                        {company.is_validated ? "Sello de Calidad Otorgado" : "Pendiente de revisión de calidad"}
                      </span>
                    </div>

                    <Switch
                      checked={company.is_validated}
                      onCheckedChange={() => handleToggleCompanyVerification(company.id, company.is_validated)}
                      disabled={isPending}
                    />
                  </div>

                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-full py-16 px-6 border border-dashed border-border/10 rounded-xl text-center bg-zinc-50/20 dark:bg-zinc-900/10">
              <p className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
                No se encontraron empresas
              </p>
              <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
                Prueba borrando tu búsqueda o cambiando los filtros superiores.
              </p>
            </div>
          )}
        </div>
      </TabsContent>
    </Tabs>
  );
}
