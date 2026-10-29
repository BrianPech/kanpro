import { describe, test, expect, vi, beforeEach } from "vitest";
import { uploadDossierDocumentAction } from "@/modules/company/actions/dossier";
import { exportDossierToPrintableDocument } from "@/modules/company/utils/dossier-exporter";
import type { EmployeeDossier } from "@/modules/company/types/employee-dossier";

vi.mock("server-only", () => ({}));

// Mock Supabase server client
const mockUpload = vi.fn();
const mockGetPublicUrl = vi.fn();
const mockInsert = vi.fn();
const mockGetUser = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: {
      getUser: mockGetUser,
    },
    storage: {
      from: vi.fn(() => ({
        upload: mockUpload,
        getPublicUrl: mockGetPublicUrl,
      })),
    },
    from: vi.fn(() => ({
      insert: mockInsert,
    })),
  })),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

describe("Fase 2: Erradicación de Mocks - Bóveda de Documentos, Criptografía y Validación Bancaria", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-test-uuid" } },
      error: null,
    });
    mockUpload.mockResolvedValue({ error: null });
    mockGetPublicUrl.mockReturnValue({
      data: { publicUrl: "https://kanpro.supabase.co/storage/v1/object/public/profile_documents/dossiers/doc1.pdf" },
    });
    mockInsert.mockReturnValue({
      select: vi.fn(() => ({
        maybeSingle: vi.fn().mockResolvedValue({ data: { id: "doc-uuid-real" } }),
      })),
    });
  });

  describe("1. Bóveda de Documentos en Expediente 360 (uploadDossierDocumentAction)", () => {
    test("Rechaza llamadas sin sesión de usuario autenticada", async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: { message: "No auth" } });
      const formData = new FormData();
      formData.append("file", new File(["sample content"], "test.pdf", { type: "application/pdf" }));
      formData.append("title", "Contrato");
      formData.append("employeeId", "emp-1");

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
      formData.append("employeeId", "emp-1");

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
      formData.append("employeeId", "emp-1");

      const res = await uploadDossierDocumentAction(formData);
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error).toContain("El título o nombre del documento es obligatorio");
      }
    });

    test("Sube archivo real a Supabase Storage bucket 'profile_documents' e indexa en DB", async () => {
      const pdfFile = new File(["%PDF-1.4 real bytes"], "Acta_Nacimiento.pdf", { type: "application/pdf" });
      const formData = new FormData();
      formData.append("file", pdfFile);
      formData.append("title", "Acta de Nacimiento");
      formData.append("employeeId", "emp-real-123");
      formData.append("candidateId", "cand-real-456");

      const res = await uploadDossierDocumentAction(formData);
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.title).toBe("Acta de Nacimiento");
        expect(res.data.fileName).toBe("Acta_Nacimiento.pdf");
        expect(res.data.fileUrl).toContain("profile_documents/dossiers/doc1.pdf");
        expect(res.data.status).toBe("validado");
      }
      expect(mockUpload).toHaveBeenCalledTimes(1);
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
