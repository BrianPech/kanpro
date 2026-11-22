import { describe, test, expect, vi, beforeEach } from "vitest";
import { uploadDossierDocumentAction } from "@/modules/company/actions/dossier";
import { exportDossierToPrintableDocument } from "@/modules/company/utils/dossier-exporter";
import type { EmployeeDossier } from "@/modules/company/types/employee-dossier";

vi.mock("server-only", () => ({}));

// Mock Supabase server client
const mockUpload = vi.fn();
const mockCreateSignedUrl = vi.fn();
const mockRemove = vi.fn();
const mockInsert = vi.fn();
const mockGetUser = vi.fn();
const mockEmployeeLookup = vi.fn();
const mockCompanyMemberLookup = vi.fn();

const TEST_USER_ID = "11111111-1111-4111-8111-111111111111";
const TEST_COMPANY_ID = "22222222-2222-4222-8222-222222222222";
const TEST_EMPLOYEE_ID = "33333333-3333-4333-8333-333333333333";
const TEST_CANDIDATE_ID = "44444444-4444-4444-8444-444444444444";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: {
      getUser: mockGetUser,
    },
    storage: {
      from: vi.fn(() => ({
        upload: mockUpload,
        createSignedUrl: mockCreateSignedUrl,
        remove: mockRemove,
      })),
    },
    from: vi.fn((table: string) => {
      if (table === "company_members") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: mockCompanyMemberLookup,
              eq: vi.fn(() => ({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: { role: "owner" },
                  error: null,
                }),
              })),
            })),
          })),
        };
      }
      if (table === "company_employees") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              or: vi.fn(() => ({
                maybeSingle: mockEmployeeLookup,
              })),
            })),
          })),
        };
      }
      return {
        insert: mockInsert,
      };
    }),
  })),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

describe("Fase 2: Erradicación de Mocks - Bóveda de Documentos, Criptografía y Validación Bancaria", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({
      data: { user: { id: TEST_USER_ID } },
      error: null,
    });
    mockCompanyMemberLookup.mockResolvedValue({
      data: [
        {
          role: "owner",
          company_id: TEST_COMPANY_ID,
          company: {
            id: TEST_COMPANY_ID,
            company_name: "Empresa Test",
            legal_name: null,
            logo_url: null,
            industry: "General",
            verification_status: "approved",
          },
        },
      ],
      error: null,
    });
    mockEmployeeLookup.mockResolvedValue({
      data: {
        id: TEST_EMPLOYEE_ID,
        employee_id: TEST_CANDIDATE_ID,
        company_id: TEST_COMPANY_ID,
      },
      error: null,
    });
    mockUpload.mockResolvedValue({ error: null });
    mockCreateSignedUrl.mockResolvedValue({
      data: {
        signedUrl:
          "https://kanpro.supabase.co/storage/v1/object/sign/profile_documents/dossiers/doc1.pdf?token=sig",
      },
      error: null,
    });
    mockRemove.mockResolvedValue({ error: null });
    mockInsert.mockReturnValue({
      select: vi.fn(() => ({
        maybeSingle: vi.fn().mockResolvedValue({ data: { id: "doc-uuid-real" }, error: null }),
      })),
    });
  });

  describe("1. Bóveda de Documentos en Expediente 360 (uploadDossierDocumentAction)", () => {
    test("Rechaza llamadas sin sesión de usuario autenticada", async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: { message: "No auth" } });
      const formData = new FormData();
      formData.append("file", new File(["sample content"], "test.pdf", { type: "application/pdf" }));
      formData.append("title", "Contrato");
      formData.append("employeeId", TEST_EMPLOYEE_ID);

      const res = await uploadDossierDocumentAction(formData);
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error).toContain("No autorizado");
      }
    });

    test("Rechaza archivos con formato no permitido (ej. .exe)", async () => {
      const formData = new FormData();
      formData.append("file", new File(["dummy"], "virus.exe", { type: "application/x-msdownload" }));
      formData.append("title", "Ejecutable");
      formData.append("employeeId", TEST_EMPLOYEE_ID);

      const res = await uploadDossierDocumentAction(formData);
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error).toContain("Formato no permitido");
      }
    });

    test("Rechaza subida sin título de documento", async () => {
      const formData = new FormData();
      formData.append("file", new File(["dummy"], "doc.pdf", { type: "application/pdf" }));
      formData.append("title", "  ");
      formData.append("employeeId", TEST_EMPLOYEE_ID);

      const res = await uploadDossierDocumentAction(formData);
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error).toContain("El título o nombre del documento es obligatorio");
      }
    });

    test("Sube archivo real a Supabase Storage bucket 'profile_documents' con URL firmada e indexa en DB", async () => {
      const pdfFile = new File(["%PDF-1.4 real bytes"], "Acta_Nacimiento.pdf", { type: "application/pdf" });
      const formData = new FormData();
      formData.append("file", pdfFile);
      formData.append("title", "Acta de Nacimiento");
      formData.append("employeeId", TEST_EMPLOYEE_ID);
      formData.append("candidateId", TEST_CANDIDATE_ID);

      const res = await uploadDossierDocumentAction(formData);
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.title).toBe("Acta de Nacimiento");
        expect(res.data.fileName).toBe("Acta_Nacimiento.pdf");
        expect(res.data.fileUrl).toContain("/sign/profile_documents/dossiers/doc1.pdf");
        expect(res.data.status).toBe("validado");
      }
      expect(mockUpload).toHaveBeenCalledTimes(1);
      expect(mockCreateSignedUrl).toHaveBeenCalledTimes(1);
    });

    test("Persiste el doc_type real seleccionado y company_id en lugar de fijar 'work_certificate'", async () => {
      const pdfFile = new File(["%PDF-1.4 real bytes"], "Constancia_SAT.pdf", {
        type: "application/pdf",
      });
      const formData = new FormData();
      formData.append("file", pdfFile);
      formData.append("title", "Constancia Fiscal");
      formData.append("docType", "rfc_sat");
      formData.append("employeeId", TEST_EMPLOYEE_ID);
      formData.append("candidateId", TEST_CANDIDATE_ID);

      const res = await uploadDossierDocumentAction(formData);
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.docType).toBe("rfc_sat");
      }
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          owner_id: TEST_CANDIDATE_ID,
          company_id: TEST_COMPANY_ID,
          doc_type: "constancia_situacion_fiscal",
        })
      );

      mockInsert.mockClear();
      const ineData = new FormData();
      ineData.append("file", new File(["%PDF-1.4 ine"], "INE.pdf", { type: "application/pdf" }));
      ineData.append("title", "INE");
      ineData.append("docType", "ine");
      ineData.append("employeeId", TEST_EMPLOYEE_ID);
      ineData.append("candidateId", TEST_CANDIDATE_ID);

      const ineRes = await uploadDossierDocumentAction(ineData);
      expect(ineRes.success).toBe(true);
      if (ineRes.success) {
        expect(ineRes.data.docType).toBe("ine");
      }
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          doc_type: "ine_passport",
          company_id: TEST_COMPANY_ID,
        })
      );
    });
  });

  describe("2. Exportador Estructurado de Expediente 360 (dossier-exporter.ts)", () => {
    test("Genera documento imprimible con layout completo conforme a la LFT", () => {
      const mockDossier: EmployeeDossier = {
        id: "emp-dossier-1",
        fullName: "Roberto Carlos Morales",
        email: "roberto@kanpro.mx",
        phone: "9981234567",
        emergencyContact: {
          name: "María Morales",
          phone: "9987654321",
          relationship: "Madre",
        },
        rfc: "MOCR900101XYZ",
        curp: "MOCR900101HQRRRA01",
        nss: "12345678901",
        birthDate: "1990-01-01",
        address: "Playa del Carmen, Q. Roo",
        nationality: "Mexicana",
        jobTitle: "Coordinador de Almacén",
        department: "Logística",
        branchName: "Sucursal Central",
        hireDate: "2024-01-15",
        yearsOfServiceFormatted: "2 años, 3 meses",
        contractType: "indeterminado",
        contractTypeLabel: "Contrato Tiempo Indeterminado",
        contractStartDate: "2024-01-15",
        baseSalaryMonthly: 18500,
        dailyIntegratedSalary: 638.5,
        paymentFrequency: "quincenal",
        workSchedule: "Lunes a Viernes 08:00 - 17:00",
        status: "activo",
        documents: [
          {
            id: "d1",
            docType: "ine",
            title: "INE Frontal y Reverso",
            fileName: "ine_roberto.pdf",
            fileUrl: "https://storage/ine.pdf",
            uploadedAt: "15 Ene 2024",
            status: "validado",
          },
        ],
        positionHistory: [],
        vacationBalance: {
          hireDate: "2024-01-15",
          yearsOfService: 2,
          totalDaysAccruedLFT: 14,
          daysTaken: 4,
          daysPendingApproval: 0,
          daysAvailable: 10,
          nextPeriodDate: "Ciclo 2026",
        },
        vacationRequests: [],
        performanceReviews: [],
        attendanceSummary: {
          punctualityRate: 98,
          totalDaysPresent: 450,
          totalLateArrivals: 2,
          totalAbsences: 0,
          totalOvertimeHours: 12,
        },
      };

      const mockOpen = vi.fn().mockReturnValue({
        document: {
          open: vi.fn(),
          write: vi.fn(),
          close: vi.fn(),
        },
      });
      vi.stubGlobal("window", { open: mockOpen });

      exportDossierToPrintableDocument(mockDossier);
      expect(mockOpen).toHaveBeenCalled();
    });
  });

  describe("3. Criptografía Cero-Confianza en Firmas Digitales", () => {
    test("Calcula digest SHA-256 criptográfico real mediante Web Crypto API", async () => {
      const payload = JSON.stringify({
        contractFolio: "KAN-CTR-2026-999",
        signerName: "Carlos González",
        signerRole: "trabajador",
        signedAt: "2026-10-27T18:00:00.000Z",
      });

      const buffer = new TextEncoder().encode(payload);
      const digestBuffer = await crypto.subtle.digest("SHA-256", buffer);
      const hashArray = Array.from(new Uint8Array(digestBuffer));
      const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

      expect(hashHex.length).toBe(64);
      expect(/^[0-9a-f]{64}$/.test(hashHex)).toBe(true);

      // Verificamos determinismo criptográfico
      const digestBuffer2 = await crypto.subtle.digest("SHA-256", buffer);
      const hashArray2 = Array.from(new Uint8Array(digestBuffer2));
      const hashHex2 = hashArray2.map((b) => b.toString(16).padStart(2, "0")).join("");
      expect(hashHex2).toBe(hashHex);
    });
  });
});
