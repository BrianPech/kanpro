import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";
import {
  SupabaseIncidentsRepository,
  type IncidentsRepository,
} from "../repositories/incidents.repository";
import { INCIDENT_EVIDENCE_BUCKET } from "../types/incidents";
import { isStorageEvidencePath } from "./company-incidents";

export const MAX_EVIDENCE_BYTES = 5 * 1024 * 1024;
export const ALLOWED_EVIDENCE_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
];
const SIGNED_URL_TTL_SECONDS = 300;

export interface EvidenceUploadTarget {
  path: string;
  token: string;
}

/**
 * Evidencias de incidencias en Storage privado, aisladas por carpeta de empresa.
 */
export class IncidentEvidenceService {
  private readonly repository: IncidentsRepository;

  constructor(
    private readonly supabase: SupabaseClient<Database>,
    repository?: IncidentsRepository
  ) {
    this.repository = repository ?? new SupabaseIncidentsRepository(supabase);
  }

  /**
   * Valida el archivo y emite una URL firmada de subida; el navegador sube directo a Storage
   * (evita el límite de cuerpo de las Server Actions).
   */
  async createUploadTarget(
    companyId: string,
    file: { fileName: string; mimeType: string; size: number }
  ): Promise<EvidenceUploadTarget> {
    if (!companyId) {
      throw new Error("ID de empresa requerido.");
    }
    if (!ALLOWED_EVIDENCE_MIME_TYPES.includes(file.mimeType)) {
      throw new Error("Formato no permitido. Usa PDF, JPG, PNG o WebP.");
    }
    if (file.size > MAX_EVIDENCE_BYTES) {
      throw new Error("La evidencia excede el límite de 5 MB.");
    }

    const safeName = file.fileName
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\w.-]+/g, "_")
      .slice(-80);
    const path = `${companyId}/${crypto.randomUUID()}-${safeName}`;

    const { data, error } = await this.supabase.storage
      .from(INCIDENT_EVIDENCE_BUCKET)
      .createSignedUploadUrl(path);

    if (error || !data) {
      throw new Error(error?.message || "No se pudo preparar la subida de la evidencia.");
    }

    return { path, token: data.token };
  }

  /**
   * URL temporal de lectura de la evidencia de una incidencia de la empresa.
   */
  async getEvidenceUrl(companyId: string, incidentId: string): Promise<string> {
    const incident = await this.repository.getById(companyId, incidentId);
    if (!incident?.evidence_url) {
      throw new Error("La incidencia no tiene evidencia adjunta.");
    }
    if (!isStorageEvidencePath(incident.evidence_url)) {
      return incident.evidence_url;
    }

    const { data, error } = await this.supabase.storage
      .from(INCIDENT_EVIDENCE_BUCKET)
      .createSignedUrl(incident.evidence_url, SIGNED_URL_TTL_SECONDS);

    if (error || !data) {
      throw new Error(error?.message || "No se pudo abrir la evidencia.");
    }

    return data.signedUrl;
  }
}
