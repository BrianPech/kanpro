"use client";

import React, { useState, useTransition } from "react";
import { Search, MapPin, BadgeCheck, ShieldAlert, Filter } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toggleCandidateVerification } from "./actions";
import { toast } from "sonner";

interface Profile {
  id: string;
  full_name: string | null;
  role: string | null;
  location: string | null;
  skills: string[] | null;
  is_validated: boolean;
  avatar_url: string | null;
}

interface AdminProfilesManagerProps {
  initialProfiles: Profile[];
}

export function AdminProfilesManager({ initialProfiles }: AdminProfilesManagerProps) {
  const [profiles, setProfiles] = useState<Profile[]>(initialProfiles);
  const [search, setSearch] = useState("");
  const [cityFilter, setCityFilter] = useState<"all" | "merida" | "playa">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "verified" | "pending">("all");
  
  const [isPending, startTransition] = useTransition();

  const handleToggleVerification = (profileId: string, currentStatus: boolean) => {
    const newStatus = !currentStatus;
    
    // Optimistic UI state toggle
    setProfiles((prev) =>
      prev.map((p) => (p.id === profileId ? { ...p, is_validated: newStatus } : p))
    );

    startTransition(async () => {
      try {
        await toggleCandidateVerification(profileId, newStatus);
        toast.success(
          newStatus
            ? "Perfil verificado: Sello de Calidad otorgado con éxito."
            : "Verificación de perfil desactivada."
        );
      } catch (err: any) {
        // Rollback optimistic update on error
        setProfiles((prev) =>
          prev.map((p) => (p.id === profileId ? { ...p, is_validated: currentStatus } : p))
        );
        toast.error("Error al actualizar verificación", {
          description: err.message || "Ocurrió un error inesperado.",
        });
      }
    });
  };

  const filteredProfiles = profiles.filter((profile) => {
    // 1. Search text filter
    const name = (profile.full_name || "").toLowerCase();
    const skillsText = (profile.skills || []).join(" ").toLowerCase();
    const matchesSearch = name.includes(search.toLowerCase()) || skillsText.includes(search.toLowerCase());

    // 2. City filter
    const location = (profile.location || "").toLowerCase();
    let matchesCity = true;
    if (cityFilter === "merida") {
      matchesCity = location.includes("mérida");
    } else if (cityFilter === "playa") {
      matchesCity = location.includes("playa del carmen");
    }

    // 3. Status filter
    let matchesStatus = true;
    if (statusFilter === "verified") {
      matchesStatus = profile.is_validated === true;
    } else if (statusFilter === "pending") {
      matchesStatus = profile.is_validated === false;
    }

    return matchesSearch && matchesCity && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Filters and Search Bar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center bg-white/50 dark:bg-zinc-900/30 p-4 border border-border/40 rounded-2xl shadow-xs">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre o habilidades..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-11 bg-white dark:bg-zinc-950/40 rounded-xl"
          />
        </div>

        {/* Filter Badges group */}
        <div className="flex flex-wrap gap-3 items-center">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1 mr-1">
            <Filter className="h-3.5 w-3.5" /> Filtrar:
          </span>
          
          {/* City Toggle */}
          <div className="flex bg-slate-100 dark:bg-zinc-800 p-0.5 rounded-xl text-xs font-bold">
            <button
              onClick={() => setCityFilter("all")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                cityFilter === "all" ? "bg-white dark:bg-zinc-900 shadow-xs text-foreground" : "text-muted-foreground"
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setCityFilter("merida")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                cityFilter === "merida" ? "bg-white dark:bg-zinc-900 shadow-xs text-foreground" : "text-muted-foreground"
              }`}
            >
              Mérida
            </button>
            <button
              onClick={() => setCityFilter("playa")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                cityFilter === "playa" ? "bg-white dark:bg-zinc-900 shadow-xs text-foreground" : "text-muted-foreground"
              }`}
            >
              Playa del Carmen
            </button>
          </div>

          {/* Validation Status Toggle */}
          <div className="flex bg-slate-100 dark:bg-zinc-800 p-0.5 rounded-xl text-xs font-bold">
            <button
              onClick={() => setStatusFilter("all")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                statusFilter === "all" ? "bg-white dark:bg-zinc-900 shadow-xs text-foreground" : "text-muted-foreground"
              }`}
            >
              Cualquiera
            </button>
            <button
              onClick={() => setStatusFilter("verified")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                statusFilter === "verified" ? "bg-white dark:bg-zinc-900 shadow-xs text-foreground" : "text-muted-foreground"
              }`}
            >
              Verificados
            </button>
            <button
              onClick={() => setStatusFilter("pending")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                statusFilter === "pending" ? "bg-white dark:bg-zinc-900 shadow-xs text-foreground" : "text-muted-foreground"
              }`}
            >
              Pendientes
            </button>
          </div>
        </div>
      </div>

      {/* Directory Count Info */}
      <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider text-muted-foreground px-1">
        <span>Mostrando {filteredProfiles.length} perfiles</span>
      </div>

      {/* Responsive Grid/Cards List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredProfiles.length > 0 ? (
          filteredProfiles.map((profile) => (
            <Card
              key={profile.id}
              className={`relative overflow-hidden rounded-[20px] border transition-all duration-300 ${
                profile.is_validated
                  ? "border-indigo-500/20 bg-indigo-500/[0.01] dark:bg-indigo-500/[0.005]"
                  : "border-border/40 bg-white/60 dark:bg-zinc-900/40"
              }`}
            >
              <CardContent className="p-5 flex flex-col justify-between h-full gap-4">
                
                {/* Profile Header */}
                <div className="flex items-start gap-4">
                  <Avatar className="w-12 h-12 rounded-xl ring-2 ring-transparent">
                    <AvatarImage src={profile.avatar_url || ""} className="object-cover" />
                    <AvatarFallback className="font-extrabold text-xs uppercase bg-muted text-muted-foreground">
                      {(profile.full_name || "??").substring(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h5 className="font-extrabold text-sm text-foreground truncate">
                        {profile.full_name || "Usuario Sin Nombre"}
                      </h5>
                      {profile.is_validated ? (
                        <BadgeCheck className="h-4.5 w-4.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                      ) : (
                        <ShieldAlert className="h-4 w-4 text-amber-600 dark:text-amber-500 shrink-0" />
                      )}
                    </div>
                    
                    <p className="text-xs font-medium text-muted-foreground flex items-center gap-1 mt-1">
                      <MapPin className="h-3 w-3 shrink-0" />
                      {profile.location || "Ubicación no configurada"}
                    </p>
                  </div>

                  <Badge className="capitalize text-[10px] font-bold tracking-wider px-2 py-0.5 rounded-md border-none shrink-0 bg-slate-100 text-slate-800 dark:bg-zinc-800 dark:text-zinc-300">
                    {profile.role === "candidate" ? "Candidato" : profile.role === "company" ? "Empresa" : profile.role}
                  </Badge>
                </div>

                {/* Skills Section */}
                <div className="space-y-1.5 flex-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/85">
                    Habilidades / Giro
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {profile.skills && profile.skills.length > 0 ? (
                      profile.skills.map((skill, index) => (
                        <span
                          key={index}
                          className="text-[10px] font-semibold bg-white dark:bg-zinc-950 border border-border/60 px-2 py-0.5 rounded-md text-foreground/80"
                        >
                          {skill}
                        </span>
                      ))
                    ) : (
                      <span className="text-[11px] italic text-muted-foreground/60">
                        No especificadas
                      </span>
                    )}
                  </div>
                </div>

                {/* Footer Validation Switch */}
                <div className="pt-3 border-t border-border/20 flex items-center justify-between mt-1 shrink-0">
                  <div className="flex flex-col">
                    <span className="text-[11px] font-bold text-foreground">
                      Sello de Calidad
                    </span>
                    <span className="text-[9px] text-muted-foreground mt-0.5">
                      {profile.is_validated ? "Verificado & Destacado" : "Pendiente de revisión"}
                    </span>
                  </div>

                  <Switch
                    checked={profile.is_validated}
                    onCheckedChange={() => handleToggleVerification(profile.id, profile.is_validated)}
                    disabled={isPending}
                  />
                </div>

              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full py-16 px-6 border border-dashed border-border/80 rounded-2xl text-center bg-white/30 dark:bg-zinc-900/10">
            <p className="text-sm font-bold text-foreground">
              No se encontraron perfiles
            </p>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
              Prueba borrando tu búsqueda o cambiando los filtros rápidos superiores.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
