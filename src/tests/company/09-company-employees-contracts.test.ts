import { describe, test, expect, vi } from "vitest";
import {
  MexicanRFC,
  MexicanCURP,
  MexicanNSS,
} from "@/modules/company/utils/mexican-identifiers";
import {
  companyEmployeeSchema,
  terminateEmployeeSchema,
  reactivateEmployeeSchema,
  updateEmployeeStartDateSchema,
  hireCandidateSchema,
} from "@/modules/company/schemas/employee.schema";
import {
  createContractSchema,
  renewContractSchema,
  signContractSchema,
  deleteContractSchema,
} from "@/modules/company/schemas/contracts.schema";
import {
  CompanyEmployeeService,
  CompanyContractService,
  type CompanyEmployeeRow,
  type CompanyContractRow,
  type EmployeeInvitationRow,
} from "@/modules/company/services/company-service";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

describe("Fase 18: Gestión de Colaboradores y Contratos - Patrón Schema -> Handler -> Service", () => {
  describe("1. Value Objects de Dominio (mexican-identifiers.ts)", () => {
    test("MexicanRFC: Valida correctamente personas físicas y morales oficiales", () => {
      // Persona Moral: 12 caracteres
      const rfcMoral = new MexicanRFC("ABC010101AB1");
      expect(rfcMoral.getValue()).toBe("ABC010101AB1");
      expect(rfcMoral.isMoral()).toBe(true);
      expect(rfcMoral.isFisica()).toBe(false);

      // Persona Física: 13 caracteres
      const rfcFisica = new MexicanRFC("PEPB900101AB1");
      expect(rfcFisica.getValue()).toBe("PEPB900101AB1");
      expect(rfcFisica.isMoral()).toBe(false);
      expect(rfcFisica.isFisica()).toBe(true);

      // Inválidos
      expect(MexicanRFC.isValid("RFC_CORTO")).toBe(false);
      expect(MexicanRFC.isValid("1234567890123")).toBe(false);
      expect(() => new MexicanRFC("INVALID_RFC")).toThrow(/formato fiscal oficial/);
    });

    test("MexicanCURP: Valida estructura oficial de RENAPO y extrae atributos", () => {
      // CURP válida de 18 caracteres
      const curpHombre = new MexicanCURP("PEPB900101HDFRRN01");
      expect(curpHombre.getValue()).toBe("PEPB900101HDFRRN01");
      expect(curpHombre.getGender()).toBe("H");
      expect(curpHombre.getBirthDateShort()).toBe("900101");

      const curpMujer = new MexicanCURP("GARM920515MDFRRN02");
      expect(curpMujer.getGender()).toBe("M");

      // Inválidos
      expect(MexicanCURP.isValid("CURP_DEMASIADO_CORTA")).toBe(false);
      expect(MexicanCURP.isValid("PEPB900101XDFRRN01")).toBe(false); // X no es H ni M
      expect(() => new MexicanCURP("INVALIDA")).toThrow(/formato oficial de RENAPO/);
    });

    test("MexicanNSS: Valida que contenga exactamente 11 dígitos numéricos", () => {
      const nss = new MexicanNSS("12345678901");
      expect(nss.getValue()).toBe("12345678901");

      expect(MexicanNSS.isValid("1234567890")).toBe(false); // 10 dígitos
      expect(MexicanNSS.isValid("123456789012")).toBe(false); // 12 dígitos
      expect(MexicanNSS.isValid("1234567890A")).toBe(false); // Letra
      expect(() => new MexicanNSS("ABC")).toThrow(/11 dígitos numéricos/);
    });
  });

  describe("2. Validación de Esquemas Zod (employee.schema.ts y contracts.schema.ts)", () => {
    test("companyEmployeeSchema: Valida RFC, CURP y salario mensual", () => {
      const validEmployee = {
        full_name: "Mariana Gómez López",
        job_title: "Gerente de Operaciones",
        department: "Operaciones",
        email: "mariana.gomez@empresa.com",
        phone: "9981234567",
        hire_date: "2026-01-15",
        base_salary_monthly: 35000,
        payment_frequency: "quincenal" as const,
        rfc: "GOLM900101AB1",
        curp: "GOLM900101MDFRRN01",
        nss: "12345678901",
      };

      const result = companyEmployeeSchema.safeParse(validEmployee);
      expect(result.success).toBe(true);

      const invalidRFC = {
        ...validEmployee,
        rfc: "RFC_INVALIDO_MALO",
      };
      const badRfcResult = companyEmployeeSchema.safeParse(invalidRFC);
      expect(badRfcResult.success).toBe(false);

      const invalidCURP = {
        ...validEmployee,
        curp: "CURP_INVALIDA_XX",
      };
      const badCurpResult = companyEmployeeSchema.safeParse(invalidCURP);
      expect(badCurpResult.success).toBe(false);
    });

    test("terminateEmployeeSchema: Exige motivo válido y UUID", () => {
      const valid = {
        employeeId: "123e4567-e89b-12d3-a456-426614174000",
        reason: "Renuncia voluntaria del colaborador",
        notes: "Entregó equipo en perfectas condiciones.",
      };
      expect(terminateEmployeeSchema.safeParse(valid).success).toBe(true);

      const invalidReason = {
        employeeId: "123e4567-e89b-12d3-a456-426614174000",
        reason: "No", // menos de 3 chars
      };
      expect(terminateEmployeeSchema.safeParse(invalidReason).success).toBe(false);
    });

    test("createContractSchema: Valida coherencia de fechas y tipos de contrato", () => {
      const validContract = {
        employeeId: "123e4567-e89b-12d3-a456-426614174000",
        jobTitle: "Recepcionista Bilingüe",
        department: "Hospitalidad",
        contractType: "Contrato Determinado",
        templateType: "determinado" as const,
        startDate: "2026-03-01",
        endDate: "2026-06-01",
        salary: 18000,
        paymentFrequency: "quincenal",
        companySigned: true,
      };

      expect(createContractSchema.safeParse(validContract).success).toBe(true);

      // Fecha fin anterior a fecha inicio
      const invalidDates = {
        ...validContract,
        startDate: "2026-06-01",
        endDate: "2026-03-01",
      };
      const dateResult = createContractSchema.safeParse(invalidDates);
      expect(dateResult.success).toBe(false);
    });

    test("renewContractSchema: Exige fecha de fin para contratos de tiempo determinado", () => {
      const validRenewal = {
        contractId: "123e4567-e89b-12d3-a456-426614174000",
        templateType: "determinado" as const,
        contractType: "Renovación 6 meses",
        endDate: "2026-12-31",
      };
      expect(renewContractSchema.safeParse(validRenewal).success).toBe(true);

      const invalidRenewal = {
        contractId: "123e4567-e89b-12d3-a456-426614174000",
        templateType: "determinado" as const,
        contractType: "Renovación sin fecha",
        endDate: null,
      };
      expect(renewContractSchema.safeParse(invalidRenewal).success).toBe(false);
    });

    test("signContractSchema: Exige rol y URL de firma", () => {
      const valid = {
        contractId: "123e4567-e89b-12d3-a456-426614174000",
        signerRole: "representante_legal" as const,
        signatureUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
        isNowFullySigned: true,
      };
      expect(signContractSchema.safeParse(valid).success).toBe(true);

      const invalidUrl = {
        ...valid,
        signatureUrl: "corta",
      };
      expect(signContractSchema.safeParse(invalidUrl).success).toBe(false);
    });
  });

  describe("3. Servicio de Colaboradores (CompanyEmployeeService)", () => {
    function createMockSupabase(initialEmployees: Partial<CompanyEmployeeRow>[] = []) {
      const employees = [...initialEmployees] as CompanyEmployeeRow[];
      const invitations: Partial<EmployeeInvitationRow>[] = [];
      const contracts: Partial<CompanyContractRow>[] = [];
      const notifications: { user_id: string; title: string; type: string }[] = [];

      const client = {
        from: vi.fn((table: string) => {
          if (table === "company_employees") {
            return {
              insert: vi.fn((payload: any) => ({
                select: vi.fn(() => ({
                  single: vi.fn(async () => {
                    const id = payload.id || `emp-${Date.now()}-${Math.random()}`;
                    const row = { id, created_at: new Date().toISOString(), ...payload };
                    employees.push(row);
                    return { data: row, error: null };
                  }),
                })),
              })),
              select: vi.fn((fields?: string) => ({
                eq: vi.fn((fieldA: string, valA: string) => ({
                  eq: vi.fn((fieldB: string, valB: string) => ({
                    maybeSingle: vi.fn(async () => {
                      const found = employees.find(
                        (e) => (e as any)[fieldA] === valA && (e as any)[fieldB] === valB
                      );
                      return { data: found || null, error: null };
                    }),
                    single: vi.fn(async () => {
                      const found = employees.find(
                        (e) => (e as any)[fieldA] === valA && (e as any)[fieldB] === valB
                      );
                      return found ? { data: found, error: null } : { data: null, error: { message: "Not found" } };
                    }),
                  })),
                  maybeSingle: vi.fn(async () => {
                    const found = employees.find((e) => (e as any)[fieldA] === valA);
                    return { data: found || null, error: null };
                  }),
                })),
              })),
              update: vi.fn((payload: any) => ({
                eq: vi.fn((fieldA: string, valA: string) => ({
                  eq: vi.fn((fieldB: string, valB: string) => ({
                    select: vi.fn(() => ({
                      maybeSingle: vi.fn(async () => {
                        const idx = employees.findIndex(
                          (e) => (e as any)[fieldA] === valA && (e as any)[fieldB] === valB
                        );
                        if (idx === -1) return { data: null, error: null };
                        employees[idx] = { ...employees[idx], ...payload };
                        return { data: employees[idx], error: null };
                      }),
                      single: vi.fn(async () => {
                        const idx = employees.findIndex(
                          (e) => (e as any)[fieldA] === valA && (e as any)[fieldB] === valB
                        );
                        if (idx === -1) return { data: null, error: { message: "Not found" } };
                        employees[idx] = { ...employees[idx], ...payload };
                        return { data: employees[idx], error: null };
                      }),
                    })),
                    then: vi.fn(async (cb: any) => {
                      const idx = employees.findIndex(
                        (e) => (e as any)[fieldA] === valA && (e as any)[fieldB] === valB
                      );
                      if (idx !== -1) employees[idx] = { ...employees[idx], ...payload };
                      return cb ? cb({ error: null }) : { error: null };
                    }),
                  })),
                  select: vi.fn(() => ({
                    maybeSingle: vi.fn(async () => {
                      const idx = employees.findIndex((e) => (e as any)[fieldA] === valA);
                      if (idx === -1) return { data: null, error: null };
                      employees[idx] = { ...employees[idx], ...payload };
                      return { data: employees[idx], error: null };
                    }),
                  })),
                })),
              })),
              delete: vi.fn(() => ({
                eq: vi.fn((field: string, val: string) => {
                  const idx = employees.findIndex((e) => (e as any)[field] === val);
                  if (idx !== -1) employees.splice(idx, 1);
                  return { error: null };
                }),
              })),
            };
          }

          if (table === "employee_invitations") {
            return {
              insert: vi.fn((payload: any) => ({
                select: vi.fn(() => ({
                  single: vi.fn(async () => {
                    const id = `inv-${Date.now()}`;
                    const row = { id, created_at: new Date().toISOString(), ...payload };
                    invitations.push(row);
                    return { data: row, error: null };
                  }),
                })),
                then: vi.fn(async (cb: any) => {
                  const id = `inv-${Date.now()}`;
                  const row = { id, created_at: new Date().toISOString(), ...payload };
                  invitations.push(row);
                  return cb ? cb({ error: null }) : { error: null };
                }),
              })),
              select: vi.fn(() => ({
                eq: vi.fn((fieldA: string, valA: string) => ({
                  ilike: vi.fn((fieldB: string, valB: string) => ({
                    in: vi.fn(() => ({
                      maybeSingle: vi.fn(async () => {
                        const found = invitations.find(
                          (i) =>
                            (i as any)[fieldA] === valA &&
                            (i as any)[fieldB]?.toLowerCase() === valB.toLowerCase()
                        );
                        return { data: found || null, error: null };
                      }),
                    })),
                  })),
                  order: vi.fn(async () => {
                    const found = invitations.filter((i) => (i as any)[fieldA] === valA);
                    return { data: found, error: null };
                  }),
                  single: vi.fn(async () => {
                    const found = invitations.find((i) => (i as any)[fieldA] === valA);
                    return found ? { data: found, error: null } : { data: null, error: { message: "Not found" } };
                  }),
                  maybeSingle: vi.fn(async () => {
                    const found = invitations.find((i) => (i as any)[fieldA] === valA);
                    return { data: found || null, error: null };
                  }),
                })),
              })),
              update: vi.fn((payload: any) => ({
                eq: vi.fn((fieldA: string, valA: string) => ({
                  eq: vi.fn(async (fieldB: string, valB: string) => {
                    const idx = invitations.findIndex(
                      (i) => (i as any)[fieldA] === valA && (i as any)[fieldB] === valB
                    );
                    if (idx !== -1) invitations[idx] = { ...invitations[idx], ...payload };
                    return { error: null };
                  }),
                  then: vi.fn(async (cb: any) => {
                    const idx = invitations.findIndex((i) => (i as any)[fieldA] === valA);
                    if (idx !== -1) invitations[idx] = { ...invitations[idx], ...payload };
                    return cb ? cb({ error: null }) : { error: null };
                  }),
                })),
              })),
            };
          }

          if (table === "company_contracts") {
            return {
              insert: vi.fn((payload: any) => ({
                select: vi.fn(() => ({
                  single: vi.fn(async () => {
                    const id = `ctr-${Date.now()}`;
                    const row = { id, folio: payload.folio || "KAN-CTR-TEST", ...payload };
                    contracts.push(row);
                    return { data: row, error: null };
                  }),
                })),
                then: vi.fn(async (cb: any) => {
                  const id = `ctr-${Date.now()}`;
                  const row = { id, folio: payload.folio || "KAN-CTR-TEST", ...payload };
                  contracts.push(row);
                  return cb ? cb({ error: null }) : { error: null };
                }),
              })),
              update: vi.fn((payload: any) => ({
                eq: vi.fn((fieldA: string, valA: string) => ({
                  eq: vi.fn(async (fieldB: string, valB: string) => {
                    const idx = contracts.findIndex(
                      (c) => (c as any)[fieldA] === valA && (c as any)[fieldB] === valB
                    );
                    if (idx !== -1) contracts[idx] = { ...contracts[idx], ...payload };
                    return { error: null };
                  }),
                })),
              })),
              delete: vi.fn(() => ({
                eq: vi.fn((fieldA: string, valA: string) => ({
                  eq: vi.fn(async (fieldB: string, valB: string) => {
                    const idx = contracts.findIndex(
                      (c) => (c as any)[fieldA] === valA && (c as any)[fieldB] === valB
                    );
                    if (idx !== -1) contracts.splice(idx, 1);
                    return { error: null };
                  }),
                })),
              })),
            };
          }

          if (table === "applications") {
            return {
              select: vi.fn(() => ({
                eq: vi.fn((field: string, val: string) => ({
                  single: vi.fn(async () => {
                    return {
                      data: {
                        id: val,
                        status: "En revisión",
                        candidate_id: "cand-123",
                        vacancy_id: "vac-456",
                        vacancies: {
                          id: "vac-456",
                          title: "Capitán de Meseros",
                          company_id: "comp-1",
                          recruiter_id: "comp-1",
                        },
                        candidate: {
                          id: "cand-123",
                          profiles: {
                            id: "cand-123",
                            full_name: "Carlos Mendoza",
                            whatsapp_number: "9981234567",
                            email: "carlos@candidato.com",
                            avatar_url: null,
                          },
                        },
                      },
                      error: null,
                    };
                  }),
                })),
              })),
              update: vi.fn(() => ({
                eq: vi.fn(async () => ({ error: null })),
              })),
            };
          }

          if (table === "company_profiles") {
            return {
              select: vi.fn(() => ({
                eq: vi.fn(() => ({
                  maybeSingle: vi.fn(async () => ({
                    data: { company_name: "Riviera Resort & Spa" },
                    error: null,
                  })),
                })),
              })),
            };
          }

          if (table === "notifications") {
            return {
              insert: vi.fn(async (n: any) => {
                notifications.push(n);
                return { error: null };
              }),
            };
          }

          return {};
        }),
      } as unknown as SupabaseClient<Database>;

      return { client, employees, invitations, contracts, notifications };
    }

    test("createEmployee: Inserta un colaborador y garantiza estado active", async () => {
      const { client, employees } = createMockSupabase();

      const newEmp = await CompanyEmployeeService.createEmployee(client, "comp-1", {
        full_name: "Ana Patricia Morales",
        job_title: "Chef Ejecutiva",
        department: "Alimentos y Bebidas",
        base_salary_monthly: 42000,
        payment_frequency: "quincenal",
        phone: "9982345678",
        email: "ana.morales@riviera.com",
        hire_date: "2026-02-01",
      });

      expect(newEmp.id).toBeDefined();
      expect(newEmp.full_name).toBe("Ana Patricia Morales");
      expect(newEmp.status).toBe("active");
      expect(employees.length).toBe(1);
    });

    test("updateEmployee: Modifica los datos del colaborador respetando company_id", async () => {
      const initial: Partial<CompanyEmployeeRow>[] = [
        {
          id: "emp-101",
          company_id: "comp-1",
          full_name: "Roberto Méndez",
          job_title: "Mesero",
          department: "Restaurante",
          status: "active",
        },
      ];
      const { client, employees } = createMockSupabase(initial);

      await CompanyEmployeeService.updateEmployee(client, "comp-1", "emp-101", {
        job_title: "Capitán de Meseros",
        base_salary_monthly: 22000,
      });

      const updated = employees.find((e) => e.id === "emp-101");
      expect(updated?.job_title).toBe("Capitán de Meseros");
      expect(updated?.base_salary_monthly).toBe(22000);
    });

    test("terminateEmployee: Cambia el estado a terminated con motivo y fecha", async () => {
      const initial: Partial<CompanyEmployeeRow>[] = [
        {
          id: "emp-102",
          company_id: "comp-1",
          full_name: "Esteban Quiroz",
          job_title: "Hostess",
          status: "active",
        },
      ];
      const { client, employees } = createMockSupabase(initial);

      await CompanyEmployeeService.terminateEmployee(client, "comp-1", {
        employeeId: "emp-102",
        reason: "Mutuo acuerdo por reubicación familiar",
        notes: "Sin adeudos pendientes",
      });

      const terminated = employees.find((e) => e.id === "emp-102");
      expect(terminated?.status).toBe("terminated");
      expect(terminated?.termination_reason).toBe("Mutuo acuerdo por reubicación familiar");
      expect(terminated?.termination_date).toBeDefined();
    });

    test("reactivateEmployee: Reactiva a un colaborador dado de baja", async () => {
      const initial: Partial<CompanyEmployeeRow>[] = [
        {
          id: "emp-103",
          company_id: "comp-1",
          full_name: "Lorena Silva",
          status: "terminated",
          termination_reason: "Baja temporal",
        },
      ];
      const { client, employees } = createMockSupabase(initial);

      await CompanyEmployeeService.reactivateEmployee(client, "comp-1", "emp-103");

      const reactivated = employees.find((e) => e.id === "emp-103");
      expect(reactivated?.status).toBe("active");
      expect(reactivated?.termination_reason).toBeNull();
    });

    test("hireCandidate: Convierte postulación a empleado activo, genera contrato y notifica", async () => {
      const { client, employees, contracts, notifications } = createMockSupabase();

      const result = await CompanyEmployeeService.hireCandidate(client, "comp-1", {
        applicationId: "123e4567-e89b-12d3-a456-426614174001",
        candidateId: "cand-123",
        jobTitle: "Capitán de Meseros",
        department: "Alimentos y Bebidas",
        templateType: "indeterminado",
        startDate: "2026-03-01",
        salary: 25000,
        paymentFrequency: "quincenal",
      });

      expect(result.employeeRecordId).toBeDefined();
      expect(result.folio).toBeDefined();
      expect(employees.length).toBe(1);
      expect(employees[0].status).toBe("active");
      expect(contracts.length).toBe(1);
      expect(contracts[0].status).toBe("vigente");
      expect(notifications.length).toBe(1);
      expect(notifications[0].type).toBe("hired");
    });

    test("createEmployeeInvitation: Crea invitación y placeholder con token seguro", async () => {
      const { client, employees, invitations } = createMockSupabase();

      const result = await CompanyEmployeeService.createEmployeeInvitation(client, "comp-1", {
        full_name: "Daniela Rivas",
        email: "daniela.rivas@empresa.com",
        position: "Concierge",
        salary: 19000,
        department: "Atención al Huésped",
        contract_type: "tiempo_indeterminado",
      });

      expect(result.employee.id).toBeDefined();
      expect(result.employee.status).toBe("pending");
      expect(result.invitation.id).toBeDefined();
      expect(result.rawToken).toBeDefined();
      expect(result.rawToken.length).toBe(64); // 32 bytes hex
      expect(employees.length).toBe(1);
      expect(invitations.length).toBe(1);
    });
  });

  describe("4. Servicio de Contratos (CompanyContractService)", () => {
    function createMockSupabase() {
      const contracts: Partial<CompanyContractRow>[] = [];

      const client = {
        from: vi.fn((table: string) => {
          if (table === "company_contracts") {
            return {
              insert: vi.fn((payload: any) => ({
                select: vi.fn(() => ({
                  single: vi.fn(async () => {
                    const id = `ctr-${Date.now()}`;
                    const row = { id, folio: payload.folio || "KAN-CTR-2026-999", ...payload };
                    contracts.push(row);
                    return { data: row, error: null };
                  }),
                })),
              })),
              update: vi.fn((payload: any) => ({
                eq: vi.fn((fieldA: string, valA: string) => ({
                  eq: vi.fn(async (fieldB: string, valB: string) => {
                    const idx = contracts.findIndex(
                      (c) => (c as any)[fieldA] === valA && (c as any)[fieldB] === valB
                    );
                    if (idx !== -1) contracts[idx] = { ...contracts[idx], ...payload };
                    return { error: null };
                  }),
                })),
              })),
              delete: vi.fn(() => ({
                eq: vi.fn((fieldA: string, valA: string) => ({
                  eq: vi.fn(async (fieldB: string, valB: string) => {
                    const idx = contracts.findIndex(
                      (c) => (c as any)[fieldA] === valA && (c as any)[fieldB] === valB
                    );
                    if (idx !== -1) contracts.splice(idx, 1);
                    return { error: null };
                  }),
                })),
              })),
            };
          }
          return {};
        }),
      } as unknown as SupabaseClient<Database>;

      return { client, contracts };
    }

    test("createContract: Genera folio automático y persiste el contrato", async () => {
      const { client, contracts } = createMockSupabase();

      const result = await CompanyContractService.createContract(client, "comp-1", {
        jobTitle: "Sommelier",
        department: "Vinos",
        contractType: "Contrato Indeterminado",
        templateType: "indeterminado",
        startDate: "2026-03-01",
        salary: 28000,
        paymentFrequency: "quincenal",
        companySigned: true,
        employeeSigned: true,
      });

      expect(result.contractId).toBeDefined();
      expect(result.folio).toMatch(/^KAN-CTR-/);
      expect(contracts.length).toBe(1);
      expect(contracts[0].status).toBe("vigente");
    });

    test("signContract: Registra firma digital y pasa a vigente si está completamente firmado", async () => {
      const { client, contracts } = createMockSupabase();
      contracts.push({
        id: "ctr-201",
        company_id: "comp-1",
        status: "en_firma",
        company_signed: true,
        employee_signed: false,
      });

      await CompanyContractService.signContract(client, "comp-1", {
        contractId: "ctr-201",
        signerRole: "trabajador",
        signatureUrl: "data:image/png;base64,signature123",
        isNowFullySigned: true,
      });

      const updated = contracts.find((c) => c.id === "ctr-201");
      expect(updated?.employee_signed).toBe(true);
      expect(updated?.employee_signature_url).toBe("data:image/png;base64,signature123");
      expect(updated?.status).toBe("vigente");
    });

    test("renewContract: Modifica tipo y fecha fin del contrato", async () => {
      const { client, contracts } = createMockSupabase();
      contracts.push({
        id: "ctr-202",
        company_id: "comp-1",
        contract_type: "Determinado 3 meses",
        template_type: "determinado",
        end_date: "2026-03-31",
      });

      await CompanyContractService.renewContract(client, "comp-1", {
        contractId: "ctr-202",
        contractType: "Planta Indeterminada",
        templateType: "indeterminado",
        endDate: null,
      });

      const renewed = contracts.find((c) => c.id === "ctr-202");
      expect(renewed?.contract_type).toBe("Planta Indeterminada");
      expect(renewed?.template_type).toBe("indeterminado");
      expect(renewed?.end_date).toBeNull();
      expect(renewed?.status).toBe("vigente");
    });

    test("deleteContract: Elimina el contrato perteneciente a la empresa", async () => {
      const { client, contracts } = createMockSupabase();
      contracts.push({
        id: "ctr-203",
        company_id: "comp-1",
      });

      await CompanyContractService.deleteContract(client, "comp-1", "ctr-203");
      expect(contracts.length).toBe(0);
    });
  });

  describe("5. Aislamiento Multitenant (Cross-Tenant Boundary Security)", () => {
    test("Una empresa B no puede modificar ni dar de baja colaboradores de Empresa A", async () => {
      const employees: Partial<CompanyEmployeeRow>[] = [
        {
          id: "emp-comp-a",
          company_id: "empresa-a",
          full_name: "Colaborador de Empresa A",
          status: "active",
        },
      ];

      const client = {
        from: vi.fn((table: string) => {
          if (table === "company_employees") {
            return {
              update: vi.fn((payload: any) => ({
                eq: vi.fn((fieldA: string, valA: string) => ({
                  eq: vi.fn((fieldB: string, valB: string) => ({
                    select: vi.fn(() => ({
                      maybeSingle: vi.fn(async () => {
                        // Verifica company_id estricto
                        const found = employees.find(
                          (e) => (e as any)[fieldA] === valA && (e as any)[fieldB] === valB
                        );
                        if (!found) return { data: null, error: null };
                        return { data: { ...found, ...payload }, error: null };
                      }),
                    })),
                    then: vi.fn(async (cb: any) => {
                      const found = employees.find(
                        (e) => (e as any)[fieldA] === valA && (e as any)[fieldB] === valB
                      );
                      if (found) Object.assign(found, payload);
                      return cb ? cb({ error: null }) : { error: null };
                    }),
                  })),
                })),
              })),
            };
          }
          if (table === "applications") {
            return {
              update: vi.fn(() => ({
                eq: vi.fn(async () => ({ error: null })),
              })),
            };
          }
          return {};
        }),
      } as unknown as SupabaseClient<Database>;

      // Empresa B intenta actualizar a un colaborador de Empresa A
      await CompanyEmployeeService.updateEmployee(client, "empresa-b", "emp-comp-a", {
        job_title: "Hackeado",
      });

      // El colaborador de Empresa A permanece intacto
      expect(employees[0].job_title).toBeUndefined();
    });

    test("Una empresa B no puede firmar ni eliminar contratos de Empresa A", async () => {
      const contracts: Partial<CompanyContractRow>[] = [
        {
          id: "ctr-comp-a",
          company_id: "empresa-a",
          status: "en_firma",
        },
      ];

      const client = {
        from: vi.fn((table: string) => {
          if (table === "company_contracts") {
            return {
              update: vi.fn((payload: any) => ({
                eq: vi.fn((fieldA: string, valA: string) => ({
                  eq: vi.fn(async (fieldB: string, valB: string) => {
                    const found = contracts.find(
                      (c) => (c as any)[fieldA] === valA && (c as any)[fieldB] === valB
                    );
                    if (found) Object.assign(found, payload);
                    return { error: null };
                  }),
                })),
              })),
              delete: vi.fn(() => ({
                eq: vi.fn((fieldA: string, valA: string) => ({
                  eq: vi.fn(async (fieldB: string, valB: string) => {
                    const idx = contracts.findIndex(
                      (c) => (c as any)[fieldA] === valA && (c as any)[fieldB] === valB
                    );
                    if (idx !== -1) contracts.splice(idx, 1);
                    return { error: null };
                  }),
                })),
              })),
            };
          }
          return {};
        }),
      } as unknown as SupabaseClient<Database>;

      // Empresa B intenta firmar contrato de Empresa A
      await CompanyContractService.signContract(client, "empresa-b", {
        contractId: "ctr-comp-a",
        signerRole: "representante_legal",
        signatureUrl: "data:malicious",
        isNowFullySigned: true,
      });

      // El contrato no cambió de estado ni de firma
      expect(contracts[0].company_signed).toBeUndefined();
      expect(contracts[0].status).toBe("en_firma");

      // Empresa B intenta eliminar contrato de Empresa A
      await CompanyContractService.deleteContract(client, "empresa-b", "ctr-comp-a");
      expect(contracts.length).toBe(1);
    });
  });
});
