import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";
import type {
  CreateDepartmentInput,
  UpdateDepartmentInput,
} from "../schemas/areas.schema";

export type CompanyDepartmentRow = Database["public"]["Tables"]["company_departments"]["Row"];

export interface DepartmentWithStats extends CompanyDepartmentRow {
  employee_count: number;
}

export class CompanyAreasService {
  /**
   * Obtiene todos los departamentos/áreas de la empresa con el recuento de colaboradores asignados.
   */
  static async getCompanyDepartments(
    supabase: SupabaseClient<Database>,
    companyId: string
  ): Promise<DepartmentWithStats[]> {
    // 1. Obtener departamentos de la empresa
    const { data: departments, error: deptError } = await supabase
      .from("company_departments")
      .select("*")
      .eq("company_id", companyId)
      .order("name", { ascending: true });

    if (deptError) {
      console.error(
        "Error al obtener departamentos:",
        deptError.message || deptError,
        deptError.details,
        deptError.code
      );
      throw new Error(deptError.message || "No se pudieron cargar las áreas de la empresa.");
    }

    if (!departments || departments.length === 0) {
      return [];
    }

    // 2. Obtener recuento de empleados por departamento
    const { data: employees, error: empError } = await supabase
      .from("company_employees")
      .select("department, status")
      .eq("company_id", companyId)
      .eq("status", "active");

    const countMap: Record<string, number> = {};
    if (!empError && employees) {
      employees.forEach((emp) => {
        if (emp.department) {
          const key = emp.department.trim().toLowerCase();
          countMap[key] = (countMap[key] || 0) + 1;
        }
      });
    }

    return departments.map((dept) => {
      const key = dept.name.trim().toLowerCase();
      return {
        ...dept,
        employee_count: countMap[key] || 0,
      };
    });
  }

  /**
   * Obtiene un departamento específico por ID.
   */
  static async getDepartmentById(
    supabase: SupabaseClient<Database>,
    companyId: string,
    departmentId: string
  ): Promise<DepartmentWithStats | null> {
    const { data: dept, error } = await supabase
      .from("company_departments")
      .select("*")
      .eq("company_id", companyId)
      .eq("id", departmentId)
      .maybeSingle();

    if (error || !dept) {
      return null;
    }

    const { count } = await supabase
      .from("company_employees")
      .select("*", { count: "exact", head: true })
      .eq("company_id", companyId)
      .eq("status", "active")
      .ilike("department", dept.name);

    return {
      ...dept,
      employee_count: count || 0,
    };
  }

  /**
   * Crea una nueva área / departamento para la empresa.
   */
  static async createDepartment(
    supabase: SupabaseClient<Database>,
    companyId: string,
    input: CreateDepartmentInput
  ): Promise<CompanyDepartmentRow> {
    const cleanName = input.name.trim();

    // Validar duplicado case-insensitive
    const { data: existing } = await supabase
      .from("company_departments")
      .select("id, name")
      .eq("company_id", companyId)
      .ilike("name", cleanName)
      .maybeSingle();

    if (existing) {
      throw new Error(`El área "${existing.name}" ya se encuentra registrada en tu empresa.`);
    }

    const { data, error } = await supabase
      .from("company_departments")
      .insert({
        company_id: companyId,
        name: cleanName,
        description: input.description?.trim() || null,
        color: input.color || "#6366f1",
        manager_name: input.manager_name?.trim() || null,
        is_active: true,
      })
      .select("*")
      .single();

    if (error || !data) {
      console.error("Error al crear departamento:", error);
      throw new Error(error?.message || "Error al registrar el área.");
    }

    return data;
  }

  /**
   * Crea en lote áreas predeterminadas seleccionadas por el usuario.
   */
  static async createPresetDepartments(
    supabase: SupabaseClient<Database>,
    companyId: string,
    names: string[]
  ): Promise<CompanyDepartmentRow[]> {
    // 1. Obtener existentes para evitar duplicados
    const { data: existing } = await supabase
      .from("company_departments")
      .select("name")
      .eq("company_id", companyId);

    const existingNames = new Set(
      (existing || []).map((e) => e.name.trim().toLowerCase())
    );

    const palette = [
      "#6366f1",
      "#3b82f6",
      "#10b981",
      "#f59e0b",
      "#8b5cf6",
      "#06b6d4",
      "#ec4899",
      "#64748b",
    ];

    const toInsert = names
      .map((name) => name.trim())
      .filter((name) => name.length >= 2 && !existingNames.has(name.toLowerCase()))
      .map((name, index) => ({
        company_id: companyId,
        name,
        color: palette[index % palette.length],
        is_active: true,
      }));

    if (toInsert.length === 0) {
      return [];
    }

    const { data, error } = await supabase
      .from("company_departments")
      .insert(toInsert)
      .select("*");

    if (error) {
      console.error("Error al crear áreas predeterminadas:", error);
      throw new Error("No se pudieron registrar las áreas sugeridas.");
    }

    return data || [];
  }

  /**
   * Actualiza los datos de un área.
   * Si el nombre cambió, actualiza en cascada el campo department en company_employees.
   */
  static async updateDepartment(
    supabase: SupabaseClient<Database>,
    companyId: string,
    input: UpdateDepartmentInput
  ): Promise<CompanyDepartmentRow> {
    // 1. Obtener área actual
    const { data: current, error: findError } = await supabase
      .from("company_departments")
      .select("*")
      .eq("company_id", companyId)
      .eq("id", input.id)
      .single();

    if (findError || !current) {
      throw new Error("El área solicitada no existe o no pertenece a tu empresa.");
    }

    const newName = input.name.trim();
    const oldName = current.name.trim();

    // 2. Si el nombre cambió, revisar que no colisione con otra área
    if (newName.toLowerCase() !== oldName.toLowerCase()) {
      const { data: duplicate } = await supabase
        .from("company_departments")
        .select("id")
        .eq("company_id", companyId)
        .ilike("name", newName)
        .neq("id", input.id)
        .maybeSingle();

      if (duplicate) {
        throw new Error(`Ya existe otra área con el nombre "${newName}".`);
      }
    }

    // 3. Actualizar registro
    const updatePayload: Database["public"]["Tables"]["company_departments"]["Update"] = {
      name: newName,
      updated_at: new Date().toISOString(),
    };

    if (input.description !== undefined) {
      updatePayload.description = input.description?.trim() || null;
    }
    if (input.color !== undefined) {
      updatePayload.color = input.color;
    }
    if (input.manager_name !== undefined) {
      updatePayload.manager_name = input.manager_name?.trim() || null;
    }
    if (input.is_active !== undefined) {
      updatePayload.is_active = input.is_active;
    }

    const { data: updated, error: updateError } = await supabase
      .from("company_departments")
      .update(updatePayload)
      .eq("company_id", companyId)
      .eq("id", input.id)
      .select("*")
      .single();

    if (updateError || !updated) {
      console.error("Error al actualizar área:", updateError);
      throw new Error("No se pudo actualizar la información del área.");
    }

    // 4. Si el nombre cambió, sincronizar empleados con el nombre anterior
    if (newName !== oldName) {
      await supabase
        .from("company_employees")
        .update({ department: newName })
        .eq("company_id", companyId)
        .eq("department", oldName);
    }

    return updated;
  }

  /**
   * Elimina un área.
   * Si tiene empleados asignados, lanza una excepción de negocio informativa.
   */
  static async deleteDepartment(
    supabase: SupabaseClient<Database>,
    companyId: string,
    departmentId: string
  ): Promise<{ success: boolean; deletedName: string }> {
    const { data: dept, error: findError } = await supabase
      .from("company_departments")
      .select("id, name")
      .eq("company_id", companyId)
      .eq("id", departmentId)
      .single();

    if (findError || !dept) {
      throw new Error("El área a eliminar no existe.");
    }

    // Comprobar si hay empleados activos asignados
    const { count } = await supabase
      .from("company_employees")
      .select("*", { count: "exact", head: true })
      .eq("company_id", companyId)
      .eq("status", "active")
      .eq("department", dept.name);

    if (count && count > 0) {
      throw new Error(
        `No se puede eliminar el área "${dept.name}" porque tiene ${count} empleado(s) activo(s) asignado(s). Reasigna a los colaboradores antes de eliminarla.`
      );
    }

    const { error: deleteError } = await supabase
      .from("company_departments")
      .delete()
      .eq("company_id", companyId)
      .eq("id", departmentId);

    if (deleteError) {
      console.error("Error al eliminar área:", deleteError);
      throw new Error("No se pudo eliminar el área.");
    }

    return { success: true, deletedName: dept.name };
  }
}
