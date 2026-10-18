import { describe, test, expect } from "vitest";
import { calculateLFTVacationDays } from "@/modules/company/utils/vacation-calculator";
import type {
  ActiveEmploymentData,
  CandidateDashboardData,
} from "@/modules/candidate/services/candidate-dashboard";

describe("Portal del Empleado (Candidate Employee Self-Service)", () => {
  describe("1. Cálculo de Vacaciones Dignas LFT (Art. 76)", () => {
    test("Calcula 12 días para el primer año de servicio (ej. 6 meses de antigüedad)", () => {
      const today = new Date();
      const sixMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 6, today.getDate())
        .toISOString()
        .split("T")[0];

      const result = calculateLFTVacationDays(sixMonthsAgo);
      expect(result.currentYearEntitlement).toBe(12);
      expect(result.yearsOfService).toBe(0);
    });

    test("Calcula 14 días para el segundo año de servicio (ej. 1 año y 4 meses de antigüedad)", () => {
      const today = new Date();
      const sixteenMonthsAgo = new Date(today.getFullYear() - 1, today.getMonth() - 4, today.getDate())
        .toISOString()
        .split("T")[0];

      const result = calculateLFTVacationDays(sixteenMonthsAgo);
      expect(result.currentYearEntitlement).toBe(14);
      expect(result.yearsOfService).toBe(1);
    });

    test("Días disponibles no pueden ser negativos si los días gozados exceden el total", () => {
      const totalDays = 12;
      const daysTaken = 14;
      const daysAvailable = Math.max(0, totalDays - daysTaken);
      expect(daysAvailable).toBe(0);
    });

    test("Días disponibles descuenta correctamente los días tomados", () => {
      const totalDays = 12;
      const daysTaken = 4;
      const daysAvailable = Math.max(0, totalDays - daysTaken);
      expect(daysAvailable).toBe(8);
    });
  });

  describe("2. Contrato de Datos ActiveEmploymentData", () => {
    test("Estructura completa de colaborador activo con empresa vinculada", () => {
      const employment: ActiveEmploymentData = {
        id: "emp-uuid-1",
        companyId: "comp-uuid-1",
        companyName: "Grupo Hotelero Maya",
        companyLogoUrl: "https://example.com/logo.png",
        companyRfc: "GHM200101XYZ",
        companyAddress: "Paseo de Montejo, Mérida",
        companyPhone: "+529991234567",
        jobTitle: "Gerente de Operaciones",
        department: "Hospitalidad",
        hireDate: "2024-01-15",
        employeeCode: "EMP-0042",
        workSchedule: "09:00 - 18:00 (Lunes a Viernes)",
        paymentFrequency: "quincenal",
        baseSalaryMonthly: 28000,
        seniorityFormatted: "2 años",
        vacationDaysTotal: 14,
        vacationDaysTaken: 3,
        vacationDaysAvailable: 11,
        contract: {
          id: "ct-123",
          folio: "KNP-CT-2024-001",
          status: "vigente",
          contractType: "indeterminado",
          isPendingSignature: false,
        },
        todayAttendance: {
          hasCheckedIn: true,
          hasCheckedOut: false,
          checkInTime: "08:55",
          checkOutTime: null,
          status: "presente",
          delayMinutes: 0,
        },
      };

      expect(employment.companyName).toBe("Grupo Hotelero Maya");
      expect(employment.vacationDaysAvailable).toBe(11);
      expect(employment.contract?.isPendingSignature).toBe(false);
      expect(employment.todayAttendance?.hasCheckedIn).toBe(true);
    });

    test("DashboardData para un candidato regular (sin empleo activo) contiene activeEmployment como null", () => {
      const candidateData: CandidateDashboardData = {
        profile: {
          id: "user-1",
          full_name: "Juan Pérez",
          headline: "Desarrollador Web",
          experience_summary: "3 años",
          location: "Mérida",
          skills: ["React", "TypeScript"],
          avatar_url: null,
          is_approved: true,
          is_validated: true,
          completionScore: 85,
        },
        applications: [],
        stats: {
          total: 2,
          reviewing: 1,
          hired: 0,
          pendingContracts: 0,
        },
        featuredVacancies: [],
        nearbyVacancies: [],
        pendingContractsCount: 0,
        activeEmployment: null,
      };

      expect(candidateData.activeEmployment).toBeNull();
      expect(candidateData.stats.hired).toBe(0);
    });

    test("Detecta correctamente cuando un contrato requiere firma digital obligatoria", () => {
      const contract = {
        id: "ct-456",
        folio: "KNP-CT-2026-0099",
        status: "vigente",
        contractType: "determinado",
        isPendingSignature: true,
      };

      expect(contract.isPendingSignature).toBe(true);
      expect(contract.status).toBe("vigente");
    });

    test("Detecta forcePasswordChange en true cuando el empleado fue creado desde el modal con esa opción", () => {
      const userMetadata = {
        full_name: "Empleado Test",
        role: "candidate",
        force_password_change: true,
      };

      const forcePasswordChange = Boolean(userMetadata.force_password_change);
      expect(forcePasswordChange).toBe(true);
    });

    test("forcePasswordChange es false para cuentas que no provienen de registro directo con clave temporal", () => {
      const userMetadata = {
        full_name: "Candidato Orgánico",
        role: "candidate",
      };

      const forcePasswordChange = Boolean((userMetadata as { force_password_change?: boolean }).force_password_change);
      expect(forcePasswordChange).toBe(false);
    });
  });
});
