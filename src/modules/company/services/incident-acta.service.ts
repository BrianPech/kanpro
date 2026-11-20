import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";
import { getMexicoDateISO, formatMexicoDateShort } from "@/lib/formatters";
import {
  SupabaseIncidentsRepository,
  type IncidentsRepository,
} from "../repositories/incidents.repository";
import {
  buildActaAdministrativaPdf,
  type ActaAdministrativaData,
} from "../utils/acta-administrativa-pdf";

/**
 * Genera el Acta Administrativa en PDF de una incidencia de la empresa.
 */
export class IncidentActaService {
  private readonly repository: IncidentsRepository;

  constructor(
    private readonly supabase: SupabaseClient<Database>,
    repository?: IncidentsRepository
  ) {
    this.repository = repository ?? new SupabaseIncidentsRepository(supabase);
  }

  async generate(
    companyId: string,
    incidentId: string
  ): Promise<{ fileName: string; pdf: Uint8Array }> {
    const incident = await this.repository.getById(companyId, incidentId);
    if (!incident) {
      throw new Error("Incidencia no encontrada o no autorizada.");
    }

    const { data: company } = await this.supabase
      .from("company_profiles")
      .select("company_name, legal_name")
      .eq("id", companyId)
      .maybeSingle();

    const data: ActaAdministrativaData = {
      folio: incident.id.slice(0, 8).toUpperCase(),
      companyName: company?.legal_name || company?.company_name || "Empresa",
      issuedOn: formatMexicoDateShort(getMexicoDateISO()),
      employeeName: incident.employee_name,
      jobTitle: incident.job_title || "Colaborador",
      department: incident.department || "Operaciones",
      categoryLabel: incident.category_label || incident.category,
      title: incident.title,
      incidentDate: formatMexicoDateShort(incident.incident_date),
      severity: incident.severity,
      description: incident.description,
      responsibleSupervisor: incident.responsible_supervisor || "Recursos Humanos",
      evidenceFileName: incident.evidence_file_name || undefined,
      employeeStatement: incident.employee_statement || undefined,
      acknowledgedAt: incident.acknowledged_at
        ? formatMexicoDateShort(incident.acknowledged_at)
        : undefined,
      resolutionNotes: incident.resolution_notes || undefined,
    };

    return {
      fileName: `acta-administrativa-${data.folio}.pdf`,
      pdf: buildActaAdministrativaPdf(data),
    };
  }
}
