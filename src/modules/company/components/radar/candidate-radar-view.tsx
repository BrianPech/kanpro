"use client";

import React, { useState, useMemo } from "react";
import {
  Search,
  MapPin,
  Send,
  Users,
  CheckCircle2,
  X,
  ChevronRight,
} from "@/components/ui/icons";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  companyCity: _companyCity,
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

      // 2. Text search query (skills only)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const skillsMatch = Array.isArray(cand.skills)
          ? cand.skills.some((s) => typeof s === "string" && s.toLowerCase().includes(query))
          : false;

        if (!skillsMatch) {
          return false;
        }
      }

      return true;
    });
  }, [initialCandidates, selectedCity, searchQuery]);

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
    <div className="flex flex-col gap-[24px] w-full pb-12 font-sans animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <h1 className="text-[32px] font-semibold leading-[40px] tracking-[-0.02em] text-foreground">
          Radar de talento
        </h1>
        <p className="text-[14px] font-normal leading-[20px] text-muted-foreground mt-[4px]">
          Busca perfiles e invítalos a postularse a tus vacantes activas.
        </p>
      </div>

      {/* Search & City Filter Card */}
      <div className="bg-card border border-border rounded-[16px] p-[16px] sm:p-[20px]">
        <div className="flex flex-col lg:flex-row lg:items-end gap-[12px]">
          {/* Buscar perfiles */}
          <div className="flex flex-col gap-[6px] flex-1 min-w-0">
            <label
              htmlFor="radar-search-input"
              className="text-[14px] font-medium leading-[20px] text-foreground"
            >
              Buscar perfiles
            </label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-[12px] top-1/2 -translate-y-1/2 size-[16px] text-muted-foreground" />
              <Input
                id="radar-search-input"
                placeholder="Buscar por habilidad"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-[44px] pl-[36px] pr-[36px] rounded-[8px] border-input bg-card text-[14px] font-normal placeholder:text-muted-foreground"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  aria-label="Borrar búsqueda"
                  className="absolute right-[12px] top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <X className="size-[16px]" />
                </button>
              )}
            </div>
          </div>

          {/* Ciudad */}
          <div className="flex flex-col gap-[6px] w-full sm:w-[260px] shrink-0">
            <span className="text-[14px] font-medium leading-[20px] text-foreground">
              Ciudad
            </span>
            <Select
              value={selectedCity}
              onValueChange={(val) => setSelectedCity(val || "Todas")}
            >
              <SelectTrigger
                aria-label="Filtrar por ciudad"
                className="h-[44px] w-full rounded-[8px] border-input bg-card px-[12px] text-[14px] font-normal"
              >
                <div className="flex items-center gap-[8px] min-w-0">
                  <MapPin className="size-[16px] text-muted-foreground shrink-0" />
                  <SelectValue placeholder="Todas las ciudades">
                    {selectedCity === "Todas"
                      ? "Todas las ciudades"
                      : selectedCity}
                  </SelectValue>
                </div>
              </SelectTrigger>
              <SelectContent className="rounded-[12px] border-border bg-popover shadow-lg">
                {CITIES.map((city) => (
                  <SelectItem
                    key={city}
                    value={city}
                    className="text-[14px] font-normal rounded-[8px] cursor-pointer"
                  >
                    {city === "Todas" ? "Todas las ciudades" : city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Results Table Card */}
      <div className="bg-card border border-border rounded-[16px] overflow-hidden">
        <div className="px-[20px] py-[16px] border-b border-border">
          <h2 className="text-[18px] font-semibold leading-[24px] tracking-[-0.01em] text-foreground tabular-nums">
            {filteredCandidates.length}{" "}
            {filteredCandidates.length === 1
              ? "perfil encontrado"
              : "perfiles encontrados"}
          </h2>
        </div>

        {filteredCandidates.length === 0 ? (
          <Card className="p-12 text-center border-0 rounded-none space-y-3 bg-card shadow-none">
            <Users className="size-10 text-muted-foreground mx-auto stroke-1" />
            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground">
                No se encontraron perfiles coincidentes
              </p>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Intenta ampliando los términos de búsqueda o seleccionando &quot;Todas las ciudades&quot;.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchQuery("");
                setSelectedCity("Todas");
              }}
              className="font-medium cursor-pointer"
            >
              Limpiar filtros
            </Button>
          </Card>
        ) : (
          <div className="overflow-x-auto">
            <Table className="w-full">
              <TableHeader className="bg-muted/30 border-b border-border">
                <TableRow className="hover:bg-transparent border-border">
                  <TableHead className="h-[44px] px-[20px] text-[12px] font-medium leading-[16px] text-muted-foreground">
                    Perfil
                  </TableHead>
                  <TableHead className="h-[44px] px-[16px] text-[12px] font-medium leading-[16px] text-muted-foreground">
                    Ubicación
                  </TableHead>
                  <TableHead className="h-[44px] px-[16px] text-[12px] font-medium leading-[16px] text-muted-foreground">
                    Experiencia
                  </TableHead>
                  <TableHead className="h-[44px] px-[16px] text-[12px] font-medium leading-[16px] text-muted-foreground">
                    Habilidades
                  </TableHead>
                  <TableHead className="h-[44px] w-[48px] px-[16px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCandidates.map((cand) => {
                  const skillsList = Array.isArray(cand.skills)
                    ? cand.skills.filter((s): s is string => typeof s === "string")
                    : [];

                  return (
                    <TableRow
                      key={cand.id || cand.full_name}
                      onClick={() => handleOpenInvite(cand)}
                      className="border-b border-border last:border-b-0 hover:bg-muted/30 transition-colors cursor-pointer"
                    >
                      <TableCell className="px-[20px] py-[14px] align-middle">
                        <div className="flex items-center gap-[12px] min-w-[220px]">
                          <Avatar className="size-[40px] rounded-[8px] bg-sidebar-accent text-link shrink-0 after:hidden">
                            <AvatarImage
                              src={cand.avatar_url || ""}
                              alt={cand.full_name || "Candidato"}
                              className="object-cover"
                            />
                            <AvatarFallback className="rounded-[8px] bg-sidebar-accent text-link font-semibold text-[13px]">
                              {(cand.full_name || "C")
                                .split(" ")
                                .map((p) => p[0])
                                .slice(0, 2)
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="text-[14px] font-semibold leading-[20px] text-link truncate">
                              {cand.full_name || "Candidato Registrado"}
                            </p>
                            <p className="text-[12px] font-normal leading-[16px] text-muted-foreground truncate">
                              {cand.headline || "Profesional disponible"}
                            </p>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="px-[16px] py-[14px] align-middle text-[14px] font-normal leading-[20px] text-foreground whitespace-nowrap">
                        {cand.location || cand.preferred_zone || "Península de Yucatán"}
                      </TableCell>

                      <TableCell className="px-[16px] py-[14px] align-middle text-[14px] font-normal leading-[20px] text-foreground whitespace-nowrap">
                        {cand.years_experience != null
                          ? `${cand.years_experience} ${cand.years_experience === 1 ? "año" : "años"}`
                          : "Disponible"}
                      </TableCell>

                      <TableCell className="px-[16px] py-[14px] align-middle">
                        <div className="flex flex-wrap items-center gap-[6px]">
                          {skillsList.slice(0, 3).map((skill, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center rounded-[6px] bg-muted px-[8px] py-[4px] text-[12px] font-medium leading-[16px] text-foreground whitespace-nowrap"
                            >
                              {skill}
                            </span>
                          ))}
                          {skillsList.length > 3 && (
                            <span className="inline-flex items-center rounded-[6px] bg-muted px-[8px] py-[4px] text-[12px] font-medium leading-[16px] text-muted-foreground whitespace-nowrap">
                              +{skillsList.length - 3}
                            </span>
                          )}
                        </div>
                      </TableCell>

                      <TableCell className="px-[16px] py-[14px] align-middle text-right">
                        <ChevronRight className="size-[16px] text-muted-foreground inline-block" />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

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
