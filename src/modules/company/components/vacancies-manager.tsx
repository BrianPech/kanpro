"use client";

import * as React from "react";
import {
  Plus,
  Search,
  Briefcase,
  MapPin,
  CheckCircle2,
  PauseCircle,
  Loader2,
  Trash2,
  X,
  FileCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useVacancyManager, type VacancyRow } from "@/hooks/use-vacancy-manager";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// Custom Switch component for local use (avoiding external install of shadcn switch)
function Switch({
  checked,
  onCheckedChange,
  disabled,
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50",
        checked ? "bg-primary" : "bg-slate-200 dark:bg-slate-800"
      )}
    >
      <span
        className={cn(
          "pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform duration-200",
          checked ? "translate-x-5" : "translate-x-0"
        )}
      />
    </button>
  );
}

const zones = [
  "Centro, Playa del Carmen",
  "Playacar, Playa del Carmen",
  "Felipe Carrillo Puerto Centro",
  "Zona Turística, Playa del Carmen",
] as const;

const categories = [
  "Restaurantes / Alimentos",
  "Hotelería / Hospedaje",
  "Atención al Cliente",
  "Administración / Oficina",
  "Mantenimiento / Limpieza",
  "Ventas / Comercio",
  "Tecnología",
] as const;

export function VacanciesManager({ userId }: { userId: string }) {
  const [isCreating, setIsCreating] = React.useState(false);
  const [vacancies, setVacancies] = React.useState<VacancyRow[]>([]);
  const [searchQuery, setSearchQuery] = React.useState("");

  const {
    createExpressVacancy,
    toggleVacancyStatus,
    fetchCompanyVacancies,
    loading: isLoading,
  } = useVacancyManager();

  // Form states for express vacancy creation (exactly 4 core fields + 1 optional)
  const [title, setTitle] = React.useState("");
  const [zone, setZone] = React.useState<string>(zones[0]);
  const [category, setCategory] = React.useState<string>(categories[0]);
  const [requirements, setRequirements] = React.useState("");
  const [salaryRange, setSalaryRange] = React.useState("");
  const [publishing, setPublishing] = React.useState(false);

  const loadVacancies = React.useCallback(async () => {
    try {
      const data = await fetchCompanyVacancies();
      setVacancies(data);
    } catch (err) {
      console.error(err);
    }
  }, [fetchCompanyVacancies]);

  React.useEffect(() => {
    loadVacancies();
  }, [loadVacancies]);

  const handleToggleActive = async (vacancyId: string, currentActive: boolean) => {
    const nextState = !currentActive;
    try {
      const success = await toggleVacancyStatus(vacancyId, nextState);
      if (success) {
        setVacancies((prev) =>
          prev.map((v) =>
            v.id === vacancyId
              ? { ...v, is_active: nextState, status: nextState ? "Activa" : "Cerrada" }
              : v
          )
        );
        toast.success(
          nextState ? "Vacante activada con éxito" : "¡Vacante Cubierta!",
          {
            description: nextState
              ? "La oferta vuelve a estar visible para candidatos."
              : "Se ha marcado como cubierta (felicidades por la colocación).",
          }
        );
      }
    } catch (err: any) {
      toast.error("Error al actualizar la vacante", {
        description: err.message,
      });
    }
  };

  const handleCreateVacancy = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !requirements.trim()) {
      toast.error("Campos incompletos", {
        description: "Por favor rellena el título y los requisitos obligatorios.",
      });
      return;
    }

    setPublishing(true);
    try {
      const newVac = await createExpressVacancy({
        title,
        zone,
        category,
        requirements,
        salary_range: salaryRange || null,
        modality: "Presencial", // Default local
      });

      setVacancies((prev) => [newVac, ...prev]);
      toast.success("¡Vacante publicada!", {
        description: `Se registró "${title}" en tus puestos activos.`,
      });

      // Reset form and return to list
      setTitle("");
      setRequirements("");
      setSalaryRange("");
      setIsCreating(false);
    } catch (err: any) {
      toast.error("Error al publicar vacante", {
        description: err.message,
      });
    } finally {
      setPublishing(false);
    }
  };

  // Filtered vacancies for list view
  const filteredVacancies = React.useMemo(() => {
    return vacancies.filter(
      (v) =>
        v.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.zone?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [vacancies, searchQuery]);

  return (
    <div className="flex-grow min-h-screen bg-slate-50/50 dark:bg-slate-950/20 px-4 py-8 md:px-10 lg:px-12 space-y-8 animate-in fade-in duration-300">
      
      {/* HEADER BARS */}
      <div className="flex items-center justify-between gap-4 shrink-0">
        <div>
          <h2 className="text-2xl font-extrabold text-foreground tracking-tight md:text-3xl">
            Gestionar Vacantes
          </h2>
          <p className="text-xs md:text-sm text-muted-foreground mt-1 font-semibold">
            Controla las ofertas activas y marca las plazas cubiertas.
          </p>
        </div>

        {!isCreating && (
          <Button
            onClick={() => setIsCreating(true)}
            className="bg-primary hover:bg-primary/90 text-white font-extrabold px-5 h-12 rounded-xl flex items-center gap-2 active:scale-95 transition-all text-xs uppercase tracking-wider"
          >
            <Plus className="size-4" />
            <span>Nueva Vacante</span>
          </Button>
        )}
      </div>

      {isCreating ? (
        /* ================= VISTA C: FORMULARIO EXPRESS DE PUBLICACIÓN ================= */
        <Card className="max-w-2xl mx-auto rounded-3xl border-border/50 shadow-sm animate-in zoom-in-95 duration-200">
          <CardHeader className="p-6 md:p-8">
            <CardTitle className="text-xl font-extrabold text-foreground">
              Publicar Vacante Exprés
            </CardTitle>
            <CardDescription className="text-xs font-semibold">
              Publica tu oferta de empleo local en la Riviera Maya en 30 segundos.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 md:p-8 pt-0">
            <form onSubmit={handleCreateVacancy} className="space-y-6">
              
              {/* Field 1: Título de la Vacante */}
              <div className="space-y-2">
                <Label htmlFor="title" className="text-xs font-bold text-foreground uppercase tracking-wider">
                  Título del Puesto *
                </Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ej: Ayudante de Cocina B, Recepcionista de Noche"
                  className="h-12 rounded-xl text-sm font-semibold border-border/60 focus-visible:ring-primary/20"
                  required
                />
              </div>

              {/* Field 2 & 3: Zona y Categoría (2 columnas en pantallas medianas) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label htmlFor="zone" className="text-xs font-bold text-foreground uppercase tracking-wider">
                    Zona de Trabajo *
                  </Label>
                  <select
                    id="zone"
                    value={zone}
                    onChange={(e) => setZone(e.target.value)}
                    className="w-full h-12 px-3 bg-card border border-border/60 rounded-xl text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
                  >
                    {zones.map((z, idx) => (
                      <option key={idx} value={z}>
                        {z}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category" className="text-xs font-bold text-foreground uppercase tracking-wider">
                    Categoría *
                  </Label>
                  <select
                    id="category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full h-12 px-3 bg-card border border-border/60 rounded-xl text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
                  >
                    {categories.map((c, idx) => (
                      <option key={idx} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Field 4: Requisitos / Descripción */}
              <div className="space-y-2">
                <Label htmlFor="requirements" className="text-xs font-bold text-foreground uppercase tracking-wider">
                  Requisitos / Descripción Breve *
                </Label>
                <Textarea
                  id="requirements"
                  value={requirements}
                  onChange={(e) => setRequirements(e.target.value)}
                  placeholder="Ej: Experiencia de 6 meses en hoteles, disponibilidad de horario rotativo, manejo de cuchillos..."
                  className="min-h-28 rounded-xl text-sm font-semibold border-border/60 focus-visible:ring-primary/20"
                  required
                />
              </div>

              {/* Optional Field: Salario mensual o rango */}
              <div className="space-y-2">
                <Label htmlFor="salary" className="text-xs font-bold text-foreground uppercase tracking-wider">
                  Salario Mensual o Rango (Opcional)
                </Label>
                <Input
                  id="salary"
                  value={salaryRange}
                  onChange={(e) => setSalaryRange(e.target.value)}
                  placeholder="Ej: MXN 12,000 + Propinas, Competitivo"
                  className="h-12 rounded-xl text-sm font-semibold border-border/60 focus-visible:ring-primary/20"
                />
              </div>

              {/* Action Buttons (Touch friendly size minimum 44px / h-12) */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button
                  type="submit"
                  disabled={publishing}
                  className="flex-grow bg-primary hover:bg-primary/95 text-white font-extrabold h-12 rounded-xl text-xs uppercase tracking-wider"
                >
                  {publishing ? (
                    <>
                      <Loader2 className="size-4 animate-spin mr-2" />
                      <span>Publicando...</span>
                    </>
                  ) : (
                    <span>Publicar en 30s</span>
                  )}
                </Button>
                <Button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  variant="ghost"
                  className="border border-border h-12 rounded-xl font-bold text-xs uppercase tracking-wider"
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        /* ================= VISTA B: EL GESTOR DE VACANTES EXPRESS ================= */
        <div className="space-y-6">
          {/* Search bar list controller */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground size-4" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 h-12 bg-card border-border/60 rounded-xl text-sm font-semibold focus-visible:ring-primary/20"
              placeholder="Buscar por título, categoría o zona..."
            />
          </div>

          {/* Vacancies Feed / List */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1, 2, 3].map((n) => (
                <Card key={n} className="border border-border/40 p-6 bg-card">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-5 w-24 animate-pulse" />
                      <Skeleton className="h-5 w-16 animate-pulse" />
                    </div>
                    <div className="space-y-2">
                      <Skeleton className="h-5 w-40 animate-pulse" />
                      <Skeleton className="h-3 w-28 animate-pulse" />
                    </div>
                    <Skeleton className="h-4 w-32 animate-pulse" />
                    <Skeleton className="h-10 w-full animate-pulse" />
                    <div className="pt-4 border-t border-border/20 flex items-center justify-between">
                      <Skeleton className="h-6 w-16 animate-pulse" />
                      <Skeleton className="h-5 w-20 animate-pulse" />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : filteredVacancies.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground border-2 border-dashed border-border/40 rounded-3xl bg-card/20">
              <Briefcase className="size-12 stroke-[1.5] mx-auto mb-2 text-slate-300" />
              <p className="text-sm font-semibold">Aún no tienes vacantes publicadas</p>
              <p className="text-xs mt-1">Presiona "Nueva Vacante" para iniciar en 30 segundos.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredVacancies.map((vacancy) => (
                <Card
                  key={vacancy.id}
                  className={cn(
                    "border border-border/50 rounded-3xl overflow-hidden transition-all duration-300 shadow-sm",
                    !vacancy.is_active ? "opacity-75 bg-slate-50/50 dark:bg-slate-900/10" : "bg-card"
                  )}
                >
                  <CardContent className="p-6 flex flex-col justify-between h-full gap-5">
                    <div className="space-y-3">
                      {/* Badge / Status Tag */}
                      <div className="flex items-center justify-between gap-3">
                        <Badge
                          variant="secondary"
                          className={cn(
                            "text-[9px] font-bold tracking-wider uppercase px-2 h-5 flex items-center border",
                            vacancy.is_active
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                              : "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"
                          )}
                        >
                          {vacancy.is_active ? "Activa / Buscando" : "Vacante Cubierta"}
                        </Badge>
                        
                        {!vacancy.is_active && (
                          <Badge className="bg-emerald-600/15 hover:bg-emerald-600/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-extrabold text-[9px] uppercase tracking-wider px-2 h-5 flex items-center gap-1">
                            <FileCheck className="size-3" />
                            <span>Colocación Exitosa</span>
                          </Badge>
                        )}
                      </div>

                      {/* Info principal */}
                      <div className="space-y-1">
                        <h3 className="font-extrabold text-base md:text-lg text-foreground line-clamp-1">
                          {vacancy.title}
                        </h3>
                        <p className="text-xs font-semibold text-primary">{vacancy.category}</p>
                      </div>

                      {/* Locación */}
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-semibold">
                        <MapPin className="size-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{vacancy.zone || vacancy.location}</span>
                      </div>

                      {/* Requisitos extracto */}
                      <p className="text-xs text-slate-600 dark:text-slate-400 font-medium line-clamp-3 leading-relaxed">
                        {vacancy.requirements || vacancy.description}
                      </p>
                    </div>

                    {/* Footer Actions (Toggles and Metrics) */}
                    <div className="pt-4 border-t border-border/40 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={vacancy.is_active}
                          onCheckedChange={() => handleToggleActive(vacancy.id, vacancy.is_active)}
                        />
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          {vacancy.is_active ? "Activa" : "Cubierta"}
                        </span>
                      </div>

                      {vacancy.salary_range && (
                        <span className="text-xs font-extrabold text-foreground px-3 py-1 bg-muted/60 dark:bg-muted/20 rounded-md">
                          {vacancy.salary_range}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
