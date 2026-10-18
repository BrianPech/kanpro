import { describe, test, expect, vi, beforeEach } from "vitest";
import {
  createDepartmentSchema,
  updateDepartmentSchema,
  deleteDepartmentSchema,
  createPresetDepartmentsSchema,
} from "@/modules/company/schemas/areas.schema";
import { CompanyAreasService } from "@/modules/company/services/company-areas";

describe("Gestor de Áreas y Departamentos para Empresas", () => {
  const companyId = "11111111-1111-1111-1111-111111111111";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // =========================================================================
  // 1. VALIDACIÓN DE ESQUEMAS ZOD
  // =========================================================================
  describe("1. Validación de Esquemas Zod (areas.schema.ts)", () => {
    test("Acepta un área válida con nombre y color personalizado", () => {
      const valid = {
        name: "Cocina y Alimentos",
        description: "Línea caliente, preparación y banquetes",
        color: "#10b981",
        manager_name: "Chef Roberto Morales",
      };
      const result = createDepartmentSchema.safeParse(valid);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe("Cocina y Alimentos");
        expect(result.data.color).toBe("#10b981");
      }
    });

    test("Rechaza un área con nombre menor a 2 caracteres", () => {
      const result = createDepartmentSchema.safeParse({
        name: "A",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("al menos 2 caracteres");
      }
    });

    test("Rechaza un color que no sea formato hexadecimal válido", () => {
      const result = createDepartmentSchema.safeParse({
        name: "Recepción",
        color: "blue-color",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("Color hexadecimal inválido");
      }
    });

    test("Valida esquema de actualización con ID uuid", () => {
      const result = updateDepartmentSchema.safeParse({
        id: "a1b2c3d4-e5f6-4a1b-8c2d-3e4f5a6b7c8d",
        name: "Ventas & Mostrador Actualizado",
      });
      expect(result.success).toBe(true);
    });

    test("Rechaza actualización sin UUID válido", () => {
      const result = updateDepartmentSchema.safeParse({
        id: "id-invalido",
        name: "Operaciones",
      });
      expect(result.success).toBe(false);
    });

    test("Valida creación en lote de sugerencias predeterminadas", () => {
      const result = createPresetDepartmentsSchema.safeParse({
        names: ["Operaciones", "Ventas", "Cocina"],
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.names.length).toBe(3);
      }
    });
  });

  // =========================================================================
  // 2. LÓGICA DE NEGOCIO (CompanyAreasService)
  // =========================================================================
  describe("2. Servicio de Áreas (CompanyAreasService)", () => {
    test("Calcula correctamente el recuento de empleados por área", async () => {
      const mockDepartments = [
        {
          id: "dept-1",
          company_id: companyId,
          name: "Cocina",
          description: "Cocina general",
          color: "#ef4444",
          manager_name: null,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: "dept-2",
          company_id: companyId,
          name: "Ventas",
          description: "Atención al cliente",
          color: "#3b82f6",
          manager_name: null,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      const mockEmployees = [
        { department: "Cocina", status: "active" },
        { department: "cocina", status: "active" }, // Case-insensitive match
        { department: "Ventas", status: "active" },
        { department: "Sin área", status: "active" },
      ];

      const mockSupabase = {
        from: vi.fn((table: string) => {
          if (table === "company_departments") {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              order: vi.fn().mockResolvedValue({ data: mockDepartments, error: null }),
            };
          }
          if (table === "company_employees") {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockImplementation((col: string, val: string) => {
                return {
                  eq: vi.fn().mockResolvedValue({ data: mockEmployees, error: null }),
                };
              }),
            };
          }
          return {};
        }),
      } as any;

      const result = await CompanyAreasService.getCompanyDepartments(mockSupabase, companyId);
      expect(result.length).toBe(2);
      expect(result[0].name).toBe("Cocina");
      expect(result[0].employee_count).toBe(2); // 2 en Cocina
      expect(result[1].name).toBe("Ventas");
      expect(result[1].employee_count).toBe(1); // 1 en Ventas
    });

    test("Evita duplicados case-insensitive al crear un área", async () => {
      const mockSupabase = {
        from: vi.fn(() => ({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          ilike: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({
            data: { id: "existing-id", name: "Operaciones" },
            error: null,
          }),
        })),
      } as any;

      await expect(
        CompanyAreasService.createDepartment(mockSupabase, companyId, {
          name: "operaciones", // Mismo nombre en minúsculas
          color: "#6366f1",
        })
      ).rejects.toThrow('El área "Operaciones" ya se encuentra registrada en tu empresa.');
    });

    test("Bloquea la eliminación de un área si tiene colaboradores activos asignados", async () => {
      const mockSupabase = {
        from: vi.fn((table: string) => {
          if (table === "company_departments") {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              single: vi.fn().mockResolvedValue({
                data: { id: "dept-1", name: "Mantenimiento" },
                error: null,
              }),
            };
          }
          if (table === "company_employees") {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              count: 3, // 3 empleados activos asignados
            };
          }
          return {};
        }),
      } as any;

      // Mock select with count
      mockSupabase.from = vi.fn((table: string) => {
        if (table === "company_departments") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: { id: "dept-1", name: "Mantenimiento" },
                    error: null,
                  }),
                }),
              }),
            }),
          };
        }
        if (table === "company_employees") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockResolvedValue({ count: 3, error: null }),
                }),
              }),
            }),
          };
        }
        return {};
      });

      await expect(
        CompanyAreasService.deleteDepartment(mockSupabase, companyId, "dept-1")
      ).rejects.toThrow(
        'No se puede eliminar el área "Mantenimiento" porque tiene 3 empleado(s) activo(s) asignado(s).'
      );
    });

    test("Permite eliminar un área si no tiene empleados asignados", async () => {
      const mockDelete = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      });

      const mockSupabase = {
        from: vi.fn((table: string) => {
          if (table === "company_departments") {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({
                      data: { id: "dept-empty", name: "Área Temporal" },
                      error: null,
                    }),
                  }),
                }),
              }),
              delete: mockDelete,
            };
          }
          if (table === "company_employees") {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    eq: vi.fn().mockResolvedValue({ count: 0, error: null }),
                  }),
                }),
              }),
            };
          }
          return {};
        }),
      } as any;

      const res = await CompanyAreasService.deleteDepartment(mockSupabase, companyId, "dept-empty");
      expect(res.success).toBe(true);
      expect(res.deletedName).toBe("Área Temporal");
    });

    test("Sincroniza en cascada el campo department de los colaboradores al renombrar un área", async () => {
      const mockUpdateEmployees = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      });

      const mockSupabase = {
        from: vi.fn((table: string) => {
          if (table === "company_departments") {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({
                      data: { id: "dept-1", name: "Sistemas" },
                      error: null,
                    }),
                    maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
                  }),
                  ilike: vi.fn().mockReturnValue({
                    neq: vi.fn().mockReturnValue({
                      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
                    }),
                  }),
                }),
              }),
              update: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    select: vi.fn().mockReturnValue({
                      single: vi.fn().mockResolvedValue({
                        data: { id: "dept-1", name: "Tecnología & TI" },
                        error: null,
                      }),
                    }),
                  }),
                }),
              }),
            };
          }
          if (table === "company_employees") {
            return {
              update: mockUpdateEmployees,
            };
          }
          return {};
        }),
      } as any;

      const updated = await CompanyAreasService.updateDepartment(mockSupabase, companyId, {
        id: "dept-1",
        name: "Tecnología & TI",
      });

      expect(updated.name).toBe("Tecnología & TI");
      expect(mockUpdateEmployees).toHaveBeenCalledWith({ department: "Tecnología & TI" });
    });
  });
});
