"use client";

import React, { useState, useMemo } from "react";
import {
  Search,
  MapPin,
  Briefcase,
  Star,
  ShieldCheck,
  Send,
  Sparkles,
  Users,
  Compass,
  CheckCircle2,
  X,
  Building2,
  Phone,
  MessageCircle,
  Filter,
} from "@/components/ui/icons";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { inviteCandidateToVacancyAction } from "../../actions/radar";
import type { Database } from "@/types/supabase";
import { CompanyPageHeader } from "../shared/company-page-header";

export type CandidateDirectoryItem = Database["public"]["Views"]["candidate_directory"]["Row"];

export interface VacancyOption {
  id: string;
  title: string;
  location: string;
}

interface CandidateRadarViewProps {
  candidates: CandidateDirectoryItem[];
  companyCity: string;
  vacancies: VacancyOption[];
}

const CITIES = [
  "Todas",
  "Playa del Carmen",
  "Cancún",
  "Tulum",
  "Mérida",
  "Cozumel",
  "Chetumal",
];

export function CandidateRadarView({
  candidates: initialCandidates,
  companyCity,
  vacancies,
}: CandidateRadarViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState("Todas");
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateDirectoryItem | null>(null);
  const [selectedVacancyId, setSelectedVacancyId] = useState<string>(vacancies[0]?.id || "");
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isSubmittingInvite, setIsSubmittingInvite] = useState(false);

  // Filter candidates dynamically
  const filteredCandidates = useMemo(() => {
    return initialCandidates.filter((cand) => {
      // 1. City filter
      if (selectedCity !== "Todas") {
        const loc = cand.location || cand.preferred_zone || "";
        if (!loc.toLowerCase().includes(selectedCity.toLowerCase())) {
          return false;
        }
      }

      // 2. Text search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const nameMatch = cand.full_name?.toLowerCase().includes(query);
        const headlineMatch = cand.headline?.toLowerCase().includes(query);
        const bioMatch = cand.bio?.toLowerCase().includes(query);
        const skillsMatch = Array.isArray(cand.skills)
          ? cand.skills.some((s) => typeof s === "string" && s.toLowerCase().includes(query))
          : false;

        if (!nameMatch && !headlineMatch && !bioMatch && !skillsMatch) {
          return false;
        }
      }

      return true;
    });
  }, [initialCandidates, selectedCity, searchQuery]);

  // Statistics
  const totalInCity = useMemo(() => {
    if (!companyCity) return 0;
    return initialCandidates.filter((c) =>
      (c.location || "").toLowerCase().includes(companyCity.toLowerCase())
    ).length;
  }, [initialCandidates, companyCity]);

  const totalVerified = useMemo(() => {
    return initialCandidates.filter((c) => Boolean(c.is_verified)).length;
  }, [initialCandidates]);

  const handleOpenInvite = (cand: CandidateDirectoryItem) => {
    if (vacancies.length === 0) {
      toast.error("No tienes vacantes activas", {
        description: "Publica una vacante primero para poder invitar candidatos.",
      });
      return;
    }
    setSelectedCandidate(cand);
    setSelectedVacancyId(vacancies[0]?.id || "");
    setIsInviteModalOpen(true);
  };

  const handleConfirmInvite = async () => {
    if (!selectedCandidate?.id || !selectedVacancyId) return;

    setIsSubmittingInvite(true);
    try {
      const res = await inviteCandidateToVacancyAction(selectedCandidate.id, selectedVacancyId);

      if (!res.success) {
        throw new Error(res.error);
      }

      toast.success("¡Invitación enviada con éxito!", {
        description: res.message,
      });

      setIsInviteModalOpen(false);
      setSelectedCandidate(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al enviar invitación.";
      toast.error("Error al invitar candidato", { description: msg });
    } finally {
      setIsSubmittingInvite(false);
    }
  };

  return (
    <div className="w-full space-y-6 pb-12 animate-in fade-in duration-300">
      <CompanyPageHeader
        title="Radar de Talento Local"
        description="Descubre y contacta perfiles operativos y técnicos disponibles en la Península de Yucatán."
        badge={
          <Badge variant="outline" className="text-xs">
            {initialCandidates.length} Candidatos
          </Badge>
        }
        actions={
          companyCity ? (
            <div className="flex items-center gap-2 bg-muted/40 px-3 py-1.5 rounded-full border border-border/60">
              <MapPin className="size-3.5 text-primary shrink-0" />
              <span className="text-xs font-semibold text-foreground">{companyCity}</span>
            </div>
          ) : undefined
        }
      />

      {/* KPI Cards Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 space-y-1.5">
          <div className="flex items-center justify-between text-xs font-bold text-muted-foreground">
            <span>Candidatos en Radar</span>
            <Users className="size-4 text-primary" />
          </div>
          <div className="text-2xl font-extrabold text-foreground">{initialCandidates.length}</div>
          <p className="text-[11px] text-muted-foreground font-medium">Perfiles registrados en la plataforma</p>
        </Card>

        <Card className="p-4 space-y-1.5">
          <div className="flex items-center justify-between text-xs font-bold text-muted-foreground">
            <span>En tu Ciudad ({companyCity || "Local"})</span>
            <MapPin className="size-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">{totalInCity}</div>
          <p className="text-[11px] text-muted-foreground font-medium">Listos para contratación inmediata</p>
        </Card>

        <Card className="p-4 space-y-1.5">
          <div className="flex items-center justify-between text-xs font-bold text-muted-foreground">
            <span>Perfiles Verificados</span>
            <ShieldCheck className="size-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400">{totalVerified}</div>
          <p className="text-[11px] text-muted-foreground font-medium">Identidad o expediente auditado</p>
        </Card>
      </div>

      {/* Search and Filters Bar */}
      <Card className="p-4 sm:p-5 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="relative flex-1">
            <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre, puesto deseado o habilidades (ej. Mesero, Inglés, Ventas)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-full"
            />
          </div>

          <Badge
            variant="outline"
            className="text-xs font-bold py-1 px-3 self-start sm:self-center shrink-0"
          >
            {`${filteredCandidates.length} candidatos encontrados`}
          </Badge>
        </div>

        {/* City Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-0.5 scrollbar-none text-xs">
          <span className="text-[11px] font-bold text-muted-foreground mr-1 flex items-center gap-1 shrink-0">
            <Filter className="size-3" />
            <span>Ciudad:</span>
          </span>
          {CITIES.map((city) => (
            <button
              key={city}
              type="button"
              onClick={() => setSelectedCity(city)}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer ${
                selectedCity === city
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground border border-border/50"
              }`}
            >
              {city}
            </button>
          ))}
        </div>
      </Card>

      {/* Candidate Grid */}
      {filteredCandidates.length === 0 ? (
        <Card className="p-12 text-center border-dashed space-y-3 bg-muted/10">
          <Users className="size-10 text-muted-foreground mx-auto stroke-1" />
          <div className="space-y-1">
            <p className="text-sm font-bold text-foreground">No se encontraron candidatos coincidentes</p>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Intenta ampliando los términos de búsqueda o seleccionando &quot;Todas&quot; las ciudades en el filtro superior.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSearchQuery("");
              setSelectedCity("Todas");
            }}
            className="font-bold cursor-pointer"
          >
            Limpiar Filtros
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCandidates.map((cand) => {
            const skillsList = Array.isArray(cand.skills)
              ? cand.skills.filter((s): s is string => typeof s === "string")
              : [];

            return (
              <Card
                key={cand.id || `cand-${Math.random()}`}
                className="p-5 space-y-4 hover:border-primary/40 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  {/* Top: Avatar & Name */}
                  <div className="flex items-start gap-3">
                    <Avatar className="size-12 rounded-2xl border border-border/50 shrink-0">
                      <AvatarImage src={cand.avatar_url || ""} alt={cand.full_name || "Candidato"} />
                      <AvatarFallback className="rounded-2xl bg-primary/10 text-primary font-bold text-sm">
                        {(cand.full_name || "C")
                          .split(" ")
                          .map((p) => p[0])
                          .slice(0, 2)
                          .join("")}
                      </AvatarFallback>
                    </Avatar>

                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-extrabold text-sm text-foreground truncate">
                          {cand.full_name || "Candidato Registrado"}
                        </span>
                        {cand.is_verified && (
                          <Badge variant="outline" className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 border-emerald-500/20 bg-emerald-500/10 flex items-center gap-0.5">
                            <ShieldCheck className="size-2.5" />
                            <span>Verificado</span>
                          </Badge>
                        )}
                      </div>

                      <p className="text-xs font-semibold text-primary truncate">
                        {cand.headline || "Profesional Disponible"}
                      </p>

                      <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                        <MapPin className="size-3 shrink-0 text-muted-foreground/80" />
                        <span className="truncate">{cand.location || cand.preferred_zone || "Península de Yucatán"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Bio snippet */}
                  {cand.bio && (
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {cand.bio}
                    </p>
                  )}

                  {/* Skills tags */}
                  {skillsList.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {skillsList.slice(0, 4).map((skill, idx) => (
                        <Badge
                          key={idx}
                          variant="secondary"
                          className="text-[10px] font-medium"
                        >
                          {skill}
                        </Badge>
                      ))}
                      {skillsList.length > 4 && (
                        <span className="px-1.5 py-0.5 rounded-full bg-muted/40 text-[10px] font-semibold text-muted-foreground">
                          +{skillsList.length - 4}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Bottom Actions */}
                <div className="pt-3 border-t border-border/40 flex items-center justify-between gap-2">
                  <div className="text-[11px] text-muted-foreground font-medium">
                    {cand.years_experience != null
                      ? `${cand.years_experience} año(s) exp.`
                      : "Exp. disponible"}
                  </div>

                  <Button
                    size="sm"
                    onClick={() => handleOpenInvite(cand)}
                    className="font-bold gap-1 cursor-pointer"
                  >
                    <Send className="size-3" />
                    <span>Invitar a Vacante</span>
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Invite Modal */}
      <Dialog open={isInviteModalOpen} onOpenChange={setIsInviteModalOpen}>
        <DialogContent className="sm:max-w-md p-6">
          <DialogHeader className="space-y-1.5 text-left">
            <DialogTitle className="text-lg font-extrabold text-foreground flex items-center gap-2">
              <Send className="size-4 text-primary" />
              <span>Invitar a Postular</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Invita a <span className="font-bold text-foreground">{selectedCandidate?.full_name}</span> a postularse a una vacante activa de tu empresa.
            </DialogDescription>
          </DialogHeader>

          <div className="py-3 space-y-3">
            <label className="text-xs font-bold text-foreground block">Selecciona la vacante:</label>
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {vacancies.map((vac) => (
                <div
                  key={vac.id}
                  onClick={() => setSelectedVacancyId(vac.id)}
                  className={`p-3 rounded-2xl border text-xs cursor-pointer transition-all ${
                    selectedVacancyId === vac.id
                      ? "border-primary bg-primary/5 text-foreground font-bold shadow-xs"
                      : "border-border/60 bg-muted/20 text-muted-foreground hover:bg-muted/40"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="truncate">{vac.title}</span>
                    {selectedVacancyId === vac.id && <CheckCircle2 className="size-3.5 text-primary shrink-0" />}
                  </div>
                  <span className="text-[10px] text-muted-foreground block mt-0.5">{vac.location}</span>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 pt-2 border-t border-border/40">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsInviteModalOpen(false)}
              size="sm"
              className="font-bold cursor-pointer"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              onClick={handleConfirmInvite}
              disabled={isSubmittingInvite || !selectedVacancyId}
              size="sm"
              className="font-bold cursor-pointer"
            >
              {isSubmittingInvite ? "Enviando..." : "Enviar Invitación"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
