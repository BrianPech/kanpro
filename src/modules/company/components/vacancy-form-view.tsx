"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, ArrowLeft, Briefcase, Plus, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useVacancyManager } from "@/hooks/use-vacancy-manager";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GEO_CONFIG } from "@/config/geo";
import { createClient } from "@/lib/supabase/client";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
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
  const [city, setCity] = React.useState<string>("Mérida");
  const [zone, setZone] = React.useState<string>("Centro Mérida");
  const [category, setCategory] = React.useState<string>(categories[0]);
  const [requirements, setRequirements] = React.useState("");
  const [salaryRange, setSalaryRange] = React.useState("");

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

    try {
      await createExpressVacancy({
        title,
        zone: `${city} - ${zone}`,
        category,
        requirements,
        salary_range: salaryRange || null,
        modality: "Presencial",
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
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
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

      <Card className="rounded-3xl border-border/50 shadow-xs bg-white dark:bg-zinc-900 overflow-hidden">
        <CardHeader className="p-6 md:p-8 border-b border-border/20 bg-zinc-50/50 dark:bg-zinc-900/50">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Plus className="size-5" />
            </div>
            <div>
              <CardTitle className="text-lg font-extrabold text-zinc-900 dark:text-zinc-50">
                Publicar Vacante Exprés
              </CardTitle>
              <CardDescription className="text-xs font-semibold text-muted-foreground mt-0.5">
                Publica tu oferta de empleo local en la Riviera Maya en 30 segundos.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 md:p-8">
          <form onSubmit={handleCreateVacancy} className="space-y-6">
            {/* Field 1: Título de la Vacante */}
            <div className="space-y-2">
              <Label htmlFor="title" className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                Título del Puesto *
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej: Ayudante de Cocina B, Recepcionista de Noche"
                className="h-12 rounded-xl text-sm font-semibold border-border/60 focus-visible:ring-blue-500/20 focus-visible:border-blue-500 transition-all"
                required
                disabled={isProfileIncomplete}
              />
            </div>

            {/* Field 2 & 3: Ciudad, Zona y Categoría (3 columnas) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="space-y-2 flex flex-col justify-end">
                <Label htmlFor="city" className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
                  Ciudad *
                </Label>
                <Select
                  value={city}
                  onValueChange={(val) => {
                    setCity(val);
                    const firstZone = Object.keys(GEO_CONFIG[val]?.zones || {})[0] || "";
                    setZone(firstZone);
                  }}
                  disabled={isProfileIncomplete}
                >
                  <SelectTrigger id="city" className="w-full h-12 bg-card border border-border/60 rounded-xl px-3 text-sm font-semibold cursor-pointer text-left focus:ring-blue-500/20 focus:border-blue-500">
                    <SelectValue placeholder="Seleccionar Ciudad" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl bg-card border-border/40">
                    {Object.keys(GEO_CONFIG).map((cityKey) => (
                      <SelectItem key={cityKey} value={cityKey}>
                        {cityKey}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 flex flex-col justify-end">
                <Label htmlFor="zone" className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
                  Zona de Trabajo *
                </Label>
                <Select
                  value={zone}
                  onValueChange={setZone}
                  disabled={!city || isProfileIncomplete}
                >
                  <SelectTrigger id="zone" className="w-full h-12 bg-card border border-border/60 rounded-xl px-3 text-sm font-semibold cursor-pointer text-left focus:ring-blue-500/20 focus:border-blue-500">
                    <SelectValue placeholder="Seleccionar Zona" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl bg-card border-border/40">
                    {city &&
                      Object.keys(GEO_CONFIG[city]?.zones || {}).map((zoneKey) => (
                        <SelectItem key={zoneKey} value={zoneKey}>
                          {GEO_CONFIG[city].zones[zoneKey].name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category" className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5 block">
                  Categoría *
                </Label>
                <Select
                  value={category}
                  onValueChange={setCategory}
                  disabled={isProfileIncomplete}
                >
                  <SelectTrigger id="category" className="w-full h-12 bg-card border border-border/60 rounded-xl px-3 text-sm font-semibold cursor-pointer text-left focus:ring-blue-500/20 focus:border-blue-500">
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
            </div>

            {/* Field 4: Requisitos / Descripción */}
            <div className="space-y-2">
              <Label htmlFor="requirements" className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                Requisitos / Descripción Breve *
              </Label>
              <Textarea
                id="requirements"
                value={requirements}
                onChange={(e) => setRequirements(e.target.value)}
                placeholder="Ej: Experiencia de 6 meses en hoteles, disponibilidad de horario rotativo, manejo de cuchillos..."
                className="min-h-28 rounded-xl text-sm font-semibold border-border/60 focus-visible:ring-blue-500/20 focus-visible:border-blue-500 transition-all"
                required
                disabled={isProfileIncomplete}
              />
            </div>

            {/* Optional Field: Salario mensual o rango */}
            <div className="space-y-2">
              <Label htmlFor="salary" className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                Salario Mensual o Rango (Opcional)
              </Label>
              <Input
                id="salary"
                value={salaryRange}
                onChange={(e) => setSalaryRange(e.target.value)}
                placeholder="Ej: MXN 12,000 + Propinas, Competitivo"
                className="h-12 rounded-xl text-sm font-semibold border-border/60 focus-visible:ring-blue-500/20 focus-visible:border-blue-500 transition-all"
                disabled={isProfileIncomplete}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button
                type="submit"
                disabled={publishing || isProfileIncomplete}
                className="flex-grow bg-blue-600 hover:bg-blue-700 text-white font-extrabold h-12 rounded-xl text-xs uppercase tracking-wider transition-all"
              >
                {publishing ? (
                  <>
                    <Loader2 className="size-4 animate-spin mr-2" />
                    <span>Publicando...</span>
                  </>
                ) : (
                  <span>Publicar Vacante</span>
                )}
              </Button>
              <Button
                type="button"
                variant="ghost"
                asChild
                className="border border-border h-12 rounded-xl font-bold text-xs uppercase tracking-wider"
              >
                <Link href="/dashboard/company/vacancies">
                  Cancelar
                </Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
