import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";
import { formatMexicoDateShort } from "@/lib/formatters";
import type { RespondToIncidentInput } from "../schemas/incidents.schema";

export type CandidateIncidentRow = Database["public"]["Tables"]["company_incidents"]["Row"];

export interface CandidateIncident {
  id: string;
  category: string;
  categoryLabel: string;
  title: string;
  description: string;
  incidentDate: string;
  severity: string;
  status: string;
  evidenceFileName?: string;
  resolutionNotes?: string;
  acknowledgedAt?: string;
  employeeStatement?: string;
  employeeStatementAt?: string;
  isRecognition: boolean;
}

function mapIncident(row: CandidateIncidentRow): CandidateIncident {
  return {
    id: row.id,
    category: row.category,
    categoryLabel: row.category_label || row.category,
    title: row.title,
    description: row.description,
    incidentDate: formatMexicoDateShort(row.incident_date),
    severity: row.severity,
    status: row.status,
    evidenceFileName: row.evidence_file_name || undefined,
    resolutionNotes: row.resolution_notes || undefined,
    acknowledgedAt: row.acknowledged_at ? formatMexicoDateShort(row.acknowledged_at) : undefined,
    employeeStatement: row.employee_statement || undefined,
    employeeStatementAt: row.employee_statement_at
      ? formatMexicoDateShort(row.employee_statement_at)
      : undefined,
    isRecognition: row.category === "reconocimiento",
  };
}

/**
 * Incidencias del propio colaborador. La política RLS "Employees can view own labor incidents"
 * limita las filas; la respuesta se escribe solo mediante la función employee_respond_to_incident.
 */
export class CandidateIncidentsService {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  async listMyIncidents(): Promise<CandidateIncident[]> {
    const { data, error } = await this.supabase
      .from("company_incidents")
      .select("*")
      .order("incident_date", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(error.message || "No se pudieron cargar tus incidencias.");
    }

    return (data ?? []).map(mapIncident);
  }

  async respond(input: RespondToIncidentInput): Promise<CandidateIncident> {
    const { data, error } = await this.supabase.rpc("employee_respond_to_incident", {
      p_incident_id: input.incidentId,
      p_acknowledge: input.acknowledge,
      p_statement: input.statement ?? null,
    });

    if (error || !data) {
      throw new Error(error?.message || "No se pudo registrar tu respuesta.");
    }

    return mapIncident(data as CandidateIncidentRow);
  }
}
