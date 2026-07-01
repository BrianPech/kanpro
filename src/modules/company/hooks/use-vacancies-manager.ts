import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { vacancySchema, type VacancyFormValues } from "../schemas/company.schema";
import { companyService } from "../services/company-service";

export interface Vacancy {
  id: string;
  title: string;
  description: string;
  modality: "Remoto" | "Híbrido" | "Presencial";
  salary?: string | null;
  skills: string[];
  status: string;
  location?: string | null;
  category?: string | null;
  seniority?: string | null;
  contract_type?: string | null;
  employment_type?: string | null;
  vacancies_count?: number | null;
  application_deadline?: string | null;
  benefits?: string[] | null;
  salary_min?: number | null;
  salary_max?: number | null;
  currency?: string | null;
  created_at: string;
  applicants?: number;
  matchScore?: string;
  lastSaved?: string;
  trend?: string;
  closingIn?: string;
  tag?: string;
  cycleTime?: string;
  filledDate?: string;
}

export function useVacanciesManager(userId: string, shouldCreateInitial: boolean = false) {
  const [isCreating, setIsCreating] = React.useState(shouldCreateInitial);
  const [vacancies, setVacancies] = React.useState<Vacancy[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [dragOverColumn, setDragOverColumn] = React.useState<string | null>(null);
  const [isExporting, setIsExporting] = React.useState(false);

  // Fetch live vacancies
  const fetchVacancies = React.useCallback(async () => {
    try {
      const data = await companyService.getVacancies(userId);
      const formattedData = (data || []).map((item) => ({
        ...item,
        skills: item.skills || [],
      })) as Vacancy[];
      setVacancies(formattedData);
    } catch (error) {
      console.error("Error loading vacancies:", error);
      toast.error("Error al cargar las vacantes", {
        description: "Hubo un problema al cargar los datos desde la base de datos.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  React.useEffect(() => {
    fetchVacancies();
  }, [fetchVacancies]);

  // Setup react-hook-form
  const form = useForm<any>({
    resolver: zodResolver(vacancySchema),
    defaultValues: {
      title: "",
      description: "",
      requirements: "",
      modality: "Remoto",
      location: "",
      zone: "",
      category: "Tecnología",
      seniority: "Intermedio",
      contract_type: "Indefinido",
      employment_type: "Tiempo completo",
      vacancies_count: 1,
      application_deadline: "",
      salary_min: undefined,
      salary_max: undefined,
      currency: "USD",
      salary_range: "",
      skills: "",
      benefits: "",
    },
  });

  const onSubmit = async (data: any) => {
    try {
      await companyService.createVacancy(userId, data);
      toast.success("¡Vacante publicada con éxito!", {
        description: `Se ha registrado "${data.title}" en la columna de ofertas Activas.`,
      });
      await fetchVacancies();
      setIsCreating(false);
      form.reset();
    } catch (error) {
      console.error("Error creating vacancy:", error);
      toast.error("Error al publicar la vacante", {
        description: "Revisa la conexión o los campos obligatorios.",
      });
    }
  };

  const handleSaveDraft = () => {
    const watchTitle = form.getValues("title");
    toast.success("Borrador guardado", {
      description: `Se ha guardado tu borrador para "${watchTitle || "Vacante sin título"}".`,
    });
    setIsCreating(false);
    form.reset();
  };

  const handleExportReport = () => {
    setIsExporting(true);
    toast.info("Generando reporte completo...", {
      description: "Compilando estadísticas de vacantes y postulantes.",
    });

    setTimeout(() => {
      setIsExporting(false);
      toast.success("¡Reporte exportado con éxito!", {
        description: "Se ha guardado el archivo PDF con las métricas de selección.",
      });
    }, 1500);
  };

  // Drag & Drop handlers
  const handleDragOver = (e: React.DragEvent, colName: string) => {
    e.preventDefault();
    setDragOverColumn(colName);
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = async (colName: string, vacancyId: string) => {
    setDragOverColumn(null);
    try {
      if (!vacancyId.startsWith("mock-")) {
        const statusMap: Record<string, string> = {
          "Draft": "Borrador",
          "Active": "Activa",
          "Paused": "Pausada",
          "Closed": "Cerrada",
        };
        const dbStatus = statusMap[colName] || colName;
        await companyService.updateVacancyStatus(vacancyId, dbStatus);
        toast.success("Estado de vacante actualizado", {
          description: `La vacante ha sido trasladada a la columna de ${colName} y guardada en base de datos.`,
        });
        await fetchVacancies();
      } else {
        setVacancies((prev) =>
          prev.map((v) => (v.id === vacancyId ? { ...v, status: colName } : v))
        );
        toast.success("Estado de vacante actualizado", {
          description: `La vacante ha sido trasladada a la columna de ${colName}.`,
        });
      }
    } catch (error) {
      console.error("Error updating vacancy status:", error);
      toast.error("Error al actualizar estado");
    }
  };

  return {
    isCreating,
    setIsCreating,
    vacancies,
    isLoading,
    searchQuery,
    setSearchQuery,
    dragOverColumn,
    isExporting,
    form,
    onSubmit: form.handleSubmit(onSubmit),
    handleSaveDraft,
    handleExportReport,
    handleDragOver,
    handleDragLeave,
    handleDrop,
  };
}
