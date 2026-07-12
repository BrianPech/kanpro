"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, ArrowLeft, Plus, MapPin, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useVacancyManager } from "@/hooks/use-vacancy-manager";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { revalidateVacancies } from "../actions/vacancies";

const categories = [
  "Restaurantes / Alimentos",
  "Hotelería / Hospedaje",
  "Atención al Cliente",
  "Administración / Oficina",
  "Mantenimiento / Limpieza",
  "Ventas / Comercio",
  "Tecnología",
] as const;

export function VacancyFormView({ userId }: { userId: string }) {
  const router = useRouter();
  const { createExpressVacancy, loading: publishing } = useVacancyManager();

  // Form states
  const [title, setTitle] = React.useState("");
  const [category, setCategory] = React.useState<string>(categories[0]);
  const [requirements, setRequirements] = React.useState("");
  const [minSalary, setMinSalary] = React.useState("");
  const [maxSalary, setMaxSalary] = React.useState("");
  const [employmentType, setEmploymentType] = React.useState<string>("Tiempo Completo");

  // States for company profile checking
  const [profile, setProfile] = React.useState<any>(null);
  const [loadingProfile, setLoadingProfile] = React.useState(true);

  const loadProfile = React.useCallback(async () => {
    try {
      setLoadingProfile(true);
      const supabase = createClient();
      
      const { data, error } = await supabase
        .from("profiles_view")
        .select("company_name, phone, logo_url, location, is_validated")
        .eq("id", userId)
        .single();

      if (!error && data) {
        setProfile({
          company_name: data.company_name,
          phone: data.phone,
          logo_url: data.logo_url,
          location: data.location,
          is_validated: data.is_validated ?? false
        });
      }
    } catch (err) {
      console.error("Error loading company profile:", err);
    } finally {
      setLoadingProfile(false);
    }
  }, [userId]);

  React.useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const isProfileIncomplete = React.useMemo(() => {
    if (loadingProfile) return false;
    if (!profile) return true;

    const name = profile.company_name?.trim() || "";
    const wp = profile.phone?.trim() || "";
    const addr = profile.location?.trim() || "";

    return !name || !wp || !addr;
  }, [profile, loadingProfile]);

  const handleCreateVacancy = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !requirements.trim()) {
      toast.error("Campos incompletos", {
        description: "Por favor rellena el título y los requisitos obligatorios.",
      });
      return;
    }

    // Format salary range
    let salaryRangeText: string | null = null;
    const minVal = minSalary.trim();
    const maxVal = maxSalary.trim();
    if (minVal && maxVal) {
      salaryRangeText = `MXN ${Number(minVal).toLocaleString()} - ${Number(maxVal).toLocaleString()}`;
    } else if (minVal) {
      salaryRangeText = `Desde MXN ${Number(minVal).toLocaleString()}`;
    } else if (maxVal) {
      salaryRangeText = `Hasta MXN ${Number(maxVal).toLocaleString()}`;
    }

    try {
      await createExpressVacancy({
        title,
        zone: profile?.location || "Mérida - Centro Mérida",
        category,
        requirements,
        salary_range: salaryRangeText,
        salary_min: minVal ? Number(minVal) : null,
        salary_max: maxVal ? Number(maxVal) : null,
        modality: "Presencial",
        employment_type: employmentType,
      });

      toast.success("¡Vacante publicada!", {
        description: `Se registró "${title}" en tus puestos activos.`,
      });

      // Revalidate cache on server and redirect
      await revalidateVacancies();
      router.push("/dashboard/company/vacancies");
    } catch (err: any) {
      toast.error("Error al publicar vacante", {
        description: err.message,
      });
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          asChild
          className="rounded-full border border-border/50 bg-background/50 hover:bg-muted"
        >
          <Link href="/dashboard/company/vacancies">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight">
            Gestión de Vacantes
          </h1>
          <p className="text-xs text-muted-foreground font-semibold">
            Publica puestos activos y conecta con el talento local.
          </p>
        </div>
      </div>

      {isProfileIncomplete && !loadingProfile && (
        <Alert variant="destructive" className="bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-400 p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in duration-300">
          <div className="flex items-start gap-3">
            <span className="text-xl shrink-0 mt-0.5">⚠️</span>
            <div className="space-y-1">
              <AlertTitle className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                Perfil de Empresa Incompleto
              </AlertTitle>
              <AlertDescription className="text-xs font-semibold leading-relaxed text-amber-600 dark:text-amber-300/90">
                Para comenzar a publicar ofertas express y activar tu radar, primero completa la información esencial de tu negocio (Nombre, WhatsApp y Dirección) en la sección de Mi Perfil.
              </AlertDescription>
            </div>
          </div>
          <Button
            asChild
            className="w-full sm:w-fit h-12 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs uppercase tracking-wider shrink-0"
          >
            <Link href="/dashboard/company/profile">
              Completar Perfil
            </Link>
          </Button>
        </Alert>
      )}

      <Card className="rounded-3xl border border-border/50 shadow-xs bg-white dark:bg-zinc-900 overflow-hidden">
        <CardHeader className="p-8 border-b border-border/20 bg-zinc-50/50 dark:bg-zinc-900/50">
          <div className="flex items-center gap-3.5">
            <div className="size-11 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
              <Plus className="size-5" />
            </div>
            <div>
              <CardTitle className="text-xl font-extrabold text-zinc-900 dark:text-zinc-50">
                Publicar Vacante Exprés
              </CardTitle>
              <CardDescription className="text-xs font-semibold text-muted-foreground mt-0.5">
                Publica tu oferta de empleo local en la Riviera Maya en 30 segundos.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-8">
          <form onSubmit={handleCreateVacancy} className="space-y-8">
            
            {/* SECCIÓN 1: DETALLES DEL PUESTO */}
            <div className="space-y-6">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 flex items-center gap-2">
                <Sparkles className="size-4 text-blue-500" />
                <span>Detalles del Puesto</span>
              </h3>

              {/* Título del Puesto (Input Grande) */}
              <div className="space-y-2">
                <Label htmlFor="title" className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                  Título del Puesto *
                </Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ej: Ayudante de Cocina B, Recepcionista de Noche"
                  className="h-14 rounded-xl text-base px-4 font-bold border-border/60 focus-visible:ring-blue-500/20 focus-visible:border-blue-500 transition-all placeholder:text-muted-foreground/45"
                  required
                  disabled={isProfileIncomplete}
                />
              </div>

              {/* Banner de Ubicación Automática */}
              <div className="flex items-start gap-2.5 p-3.5 bg-blue-500/5 dark:bg-blue-500/10 rounded-xl border border-blue-500/10 text-xs font-semibold text-blue-600 dark:text-blue-400 select-none">
                <MapPin className="size-4 shrink-0 mt-0.5" />
                <span>
                  Esta vacante se publicará automáticamente en:{" "}
                  <strong className="font-extrabold underline decoration-blue-500/30">
                    {profile?.location || "Cargando ubicación..."}
                  </strong>{" "}
                  (Configurada en tu perfil comercial)
                </span>
              </div>

              {/* Categoría (Select) */}
              <div className="space-y-2">
                <Label htmlFor="category" className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider block">
                  Categoría *
                </Label>
                <Select
                  value={category}
                  onValueChange={setCategory}
                  disabled={isProfileIncomplete}
                >
                  <SelectTrigger id="category" className="w-full h-12 bg-card border border-border/60 rounded-xl px-3.5 text-sm font-semibold cursor-pointer text-left focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all">
                    <SelectValue placeholder="Seleccionar Categoría" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl bg-card border-border/40">
                    {categories.map((c, idx) => (
                      <SelectItem key={idx} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Tipo de Jornada */}
              <div className="space-y-2.5">
                <Label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                  Tipo de Jornada *
                </Label>
                <div className="flex flex-wrap gap-2">
                  {[
                    "Tiempo Completo",
                    "Medio Tiempo",
                    "Turno Rotativo",
                    "Turno Nocturno",
                  ].map((type) => {
                    const isActive = employmentType === type;
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setEmploymentType(type)}
                        disabled={isProfileIncomplete}
                        className={cn(
                          "px-4 py-2 text-sm font-medium rounded-full transition-all duration-200 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 select-none",
                          isActive
                            ? "bg-blue-600 text-white shadow-sm shadow-blue-500/15"
                            : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700/80"
                        )}
                      >
                        {type}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Requisitos / Descripción */}
              <div className="space-y-2">
                <Label htmlFor="requirements" className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                  Requisitos / Descripción Breve *
                </Label>
                <Textarea
                  id="requirements"
                  value={requirements}
                  onChange={(e) => setRequirements(e.target.value)}
                  placeholder="Ej: Experiencia de 6 meses en hoteles, disponibilidad de horario rotativo, manejo de cuchillos..."
                  className="min-h-32 rounded-xl text-sm font-semibold border-border/60 focus-visible:ring-blue-500/20 focus-visible:border-blue-500 transition-all leading-relaxed"
                  required
                  disabled={isProfileIncomplete}
                />
              </div>
            </div>

            <Separator className="bg-border/40 my-6" />

            {/* SECCIÓN 2: COMPENSACIÓN Y BENEFICIOS */}
            <div className="space-y-6">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 flex items-center gap-2">
                💰 Compensación y Beneficios
              </h3>

              {/* Bloque de Rango Salarial Numérico Estricto */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label htmlFor="minSalary" className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                    Salario Mínimo Mensual (Opcional)
                  </Label>
                  <div className="relative rounded-xl border border-border/60 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all flex items-center bg-background overflow-hidden">
                    <span className="pl-3.5 pr-2 py-3 bg-zinc-50 dark:bg-zinc-800/40 text-xs font-bold text-zinc-400 dark:text-zinc-500 border-r border-border/40 select-none shrink-0">
                      $ MXN
                    </span>
                    <input
                      id="minSalary"
                      type="number"
                      min="0"
                      placeholder="Ej: 10000"
                      value={minSalary}
                      onChange={(e) => setMinSalary(e.target.value)}
                      className="w-full h-12 px-3 text-sm font-semibold bg-transparent border-none outline-none focus:ring-0 focus:outline-none text-zinc-900 dark:text-zinc-50"
                      disabled={isProfileIncomplete}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxSalary" className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                    Salario Máximo Mensual (Opcional)
                  </Label>
                  <div className="relative rounded-xl border border-border/60 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all flex items-center bg-background overflow-hidden">
                    <span className="pl-3.5 pr-2 py-3 bg-zinc-50 dark:bg-zinc-800/40 text-xs font-bold text-zinc-400 dark:text-zinc-500 border-r border-border/40 select-none shrink-0">
                      $ MXN
                    </span>
                    <input
                      id="maxSalary"
                      type="number"
                      min="0"
                      placeholder="Ej: 18000"
                      value={maxSalary}
                      onChange={(e) => setMaxSalary(e.target.value)}
                      className="w-full h-12 px-3 text-sm font-semibold bg-transparent border-none outline-none focus:ring-0 focus:outline-none text-zinc-900 dark:text-zinc-50"
                      disabled={isProfileIncomplete}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3.5 pt-4">
              <Button
                type="button"
                variant="ghost"
                asChild
                className="font-bold text-xs uppercase tracking-wider text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 px-5 h-12 rounded-xl transition-all"
              >
                <Link href="/dashboard/company/vacancies">
                  Cancelar
                </Link>
              </Button>
              
              <Button
                type="submit"
                disabled={publishing || isProfileIncomplete}
                className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold px-6 h-12 rounded-xl text-xs uppercase tracking-wider transition-all shadow-sm shadow-blue-500/10 active:scale-[0.98]"
              >
                {publishing ? (
                  <>
                    <Loader2 className="size-4 animate-spin mr-2" />
                    <span>Publicando...</span>
                  </>
                ) : (
                  <span>Publicar vacante</span>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
