import { describe, test, expect, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";
import { CompanyDocumentAccessService } from "@/modules/company/services/company-document-access";
import { getCandidateCvDocumentSchema } from "@/modules/company/schemas/document-access.schema";

interface MockDocument {
  id: string;
  owner_id: string;
  doc_type: string;
  file_name: string;
  file_url: string;
  created_at: string;
}

interface MockVacancy {
  company_id: string;
  recruiter_id: string;
}

interface MockApplication {
  id: string;
  candidate_id: string;
  vacancies: MockVacancy;
}

function createMockSupabase(params?: {
  application?: MockApplication | null;
  profileDocument?: MockDocument | null;
  storageSignedUrl?: string | null;
  storageError?: Error | null;
}) {
  const application = params?.application !== undefined ? params.application : {
    id: "app-100",
    candidate_id: "cand-200",
    vacancies: {
      company_id: "company-alpha",
      recruiter_id: "company-alpha",
    },
  };

  const profileDocument = params?.profileDocument !== undefined ? params.profileDocument : {
    id: "doc-cv-1",
    owner_id: "cand-200",
    doc_type: "cv",
    file_name: "Curriculum_Vitae.pdf",
    file_url: "cand-200/cv_12345.pdf",
    created_at: "2026-11-10T10:00:00Z",
  };

  const client = {
    from: vi.fn((table: string) => {
      if (table === "applications") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                maybeSingle: vi.fn(async () => ({
                  data: application,
                  error: null,
                })),
              })),
            })),
          })),
        };
      }

      if (table === "profile_documents") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                order: vi.fn(() => ({
                  maybeSingle: vi.fn(async () => ({
                    data: profileDocument,
                    error: null,
                  })),
                })),
              })),
            })),
          })),
        };
      }

      return {};
    }),
    storage: {
      from: vi.fn(() => ({
        createSignedUrl: vi.fn(async (path: string) => {
          if (params?.storageError) {
            throw params.storageError;
          }
          if (params?.storageSignedUrl === null) {
            return { data: null, error: new Error("Storage not found") };
          }
          return {
            data: { signedUrl: params?.storageSignedUrl || `https://storage.supabase.co/signed/${path}` },
            error: null,
          };
        }),
      })),
    },
  } as unknown as SupabaseClient<Database>;

  return { client };
}

describe("Task 5: Previsualización de CV y Firmado de Storage", () => {
  describe("CompanyDocumentAccessService.getCandidateCvDocument", () => {
    test("Genera URL firmada correctamente cuando la ruta es relativa y se provee storageClient", async () => {
      const { client } = createMockSupabase();
      const mockStorageClient = {
        storage: {
          from: vi.fn(() => ({
            createSignedUrl: vi.fn(async (path: string) => ({
              data: { signedUrl: `https://admin-storage.supabase.co/signed/${path}?token=admin_sig` },
              error: null,
            })),
          })),
        },
      };

      const input = getCandidateCvDocumentSchema.parse({
        applicationId: "app-100",
        candidateId: "cand-200",
      });

      const result = await CompanyDocumentAccessService.getCandidateCvDocument(
        client,
        "company-alpha",
        input,
        mockStorageClient
      );

      expect(result.hasUploadedCv).toBe(true);
      expect(result.cvUrl).toBe("https://admin-storage.supabase.co/signed/cand-200/cv_12345.pdf?token=admin_sig");
      expect(result.fileName).toBe("Curriculum_Vitae.pdf");
      expect(result.uploadedAt).toBe("2026-11-10T10:00:00Z");
      expect(mockStorageClient.storage.from).toHaveBeenCalledWith("profile_documents");
    });

    test("Usa fallback a supabase.storage cuando storageClient devuelve error", async () => {
      const { client } = createMockSupabase({
        storageSignedUrl: "https://user-storage.supabase.co/signed/cand-200/cv_12345.pdf",
      });

      const failingStorageClient = {
        storage: {
          from: vi.fn(() => ({
            createSignedUrl: vi.fn(async () => ({
              data: null,
              error: new Error("Admin storage error"),
            })),
          })),
        },
      };

      const input = getCandidateCvDocumentSchema.parse({
        applicationId: "app-100",
        candidateId: "cand-200",
      });

      const result = await CompanyDocumentAccessService.getCandidateCvDocument(
        client,
        "company-alpha",
        input,
        failingStorageClient
      );

      expect(result.hasUploadedCv).toBe(true);
      expect(result.cvUrl).toBe("https://user-storage.supabase.co/signed/cand-200/cv_12345.pdf");
    });

    test("Erradica fallback a ruta relativa si el firmado falla: retorna cvUrl: null y hasUploadedCv: false", async () => {
      const { client } = createMockSupabase({
        storageSignedUrl: null, // Ambos fallan
      });

      const failingStorageClient = {
        storage: {
          from: vi.fn(() => ({
            createSignedUrl: vi.fn(async () => {
              throw new Error("Storage unavailable");
            }),
          })),
        },
      };

      const input = getCandidateCvDocumentSchema.parse({
        applicationId: "app-100",
        candidateId: "cand-200",
      });

      const result = await CompanyDocumentAccessService.getCandidateCvDocument(
        client,
        "company-alpha",
        input,
        failingStorageClient
      );

      // Nunca debe retornar "cand-200/cv_12345.pdf" para evitar 404 en el iframe de producción
      expect(result.hasUploadedCv).toBe(false);
      expect(result.cvUrl).toBeNull();
      expect(result.fileName).toBe("Curriculum_Vitae.pdf");
    });

    test("No intenta firmar si la URL almacenada ya es una URL HTTP(S) absoluta", async () => {
      const { client } = createMockSupabase({
        profileDocument: {
          id: "doc-cv-2",
          owner_id: "cand-200",
          doc_type: "cv",
          file_name: "External_CV.pdf",
          file_url: "https://s3.amazonaws.com/company/cv.pdf",
          created_at: "2026-11-01T08:00:00Z",
        },
      });

      const mockStorageClient = {
        storage: {
          from: vi.fn(() => ({
            createSignedUrl: vi.fn(),
          })),
        },
      };

      const input = getCandidateCvDocumentSchema.parse({
        applicationId: "app-100",
        candidateId: "cand-200",
      });

      const result = await CompanyDocumentAccessService.getCandidateCvDocument(
        client,
        "company-alpha",
        input,
        mockStorageClient
      );

      expect(result.hasUploadedCv).toBe(true);
      expect(result.cvUrl).toBe("https://s3.amazonaws.com/company/cv.pdf");
      expect(mockStorageClient.storage.from).not.toHaveBeenCalled();
    });

    test("Aislamiento de Empresa: Rechaza acceso si la vacante pertenece a otra empresa", async () => {
      const { client } = createMockSupabase({
        application: {
          id: "app-100",
          candidate_id: "cand-200",
          vacancies: {
            company_id: "company-beta", // Diferente a company-alpha
            recruiter_id: "company-beta",
          },
        },
      });

      const input = getCandidateCvDocumentSchema.parse({
        applicationId: "app-100",
        candidateId: "cand-200",
      });

      const result = await CompanyDocumentAccessService.getCandidateCvDocument(
        client,
        "company-alpha", // Intento de acceso cross-tenant
        input
      );

      expect(result.hasUploadedCv).toBe(false);
      expect(result.cvUrl).toBeNull();
    });

    test("Retorna hasUploadedCv: false si el candidato no tiene documento tipo 'cv'", async () => {
      const { client } = createMockSupabase({
        profileDocument: null,
      });

      const input = getCandidateCvDocumentSchema.parse({
        applicationId: "app-100",
        candidateId: "cand-200",
      });

      const result = await CompanyDocumentAccessService.getCandidateCvDocument(
        client,
        "company-alpha",
        input
      );

      expect(result.hasUploadedCv).toBe(false);
      expect(result.cvUrl).toBeNull();
    });
  });

  describe("Validación de esquema getCandidateCvDocumentSchema", () => {
    test("Acepta IDs válidos", () => {
      const parsed = getCandidateCvDocumentSchema.safeParse({
        applicationId: "app-valid-123",
        candidateId: "cand-valid-456",
      });
      expect(parsed.success).toBe(true);
    });

    test("Rechaza strings vacíos", () => {
      const parsed = getCandidateCvDocumentSchema.safeParse({
        applicationId: "",
        candidateId: "cand-valid-456",
      });
      expect(parsed.success).toBe(false);
    });
  });
});
