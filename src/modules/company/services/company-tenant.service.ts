import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/types/supabase";
import {
  DEFAULT_COMPANY_WORK_RULES_CONFIG,
  parseCompanyWorkRulesConfig,
} from "../strategies/company-policies.parser";
import {
  ACTIVE_COMPANY_COOKIE,
  type CreateCompanyInput,
  type CompanyMemberRole,
} from "../schemas/tenant.schema";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isValidUuid(value: string | null | undefined): value is string {
  return typeof value === "string" && UUID_REGEX.test(value.trim());
}

export function isCompanyAdminRole(
  role: CompanyMemberRole | null | undefined
): boolean {
  return role === "owner" || role === "admin";
}

export interface UserCompanyItem {
  companyId: string;
  companyName: string;
  legalName: string | null;
  logoUrl: string | null;
  industry: string;
  role: CompanyMemberRole;
  verificationStatus: string | null;
}

export class CompanyTenantService {
  /**
   * Obtiene todas las empresas a las que pertenece el usuario autenticado.
   * Incluye recuperación resiliente para registros históricos.
   */
  async getUserCompanies(
    userId: string,
    supabase: SupabaseClient<Database>
  ): Promise<UserCompanyItem[]> {
    if (!userId) return [];

    // 1. Consultar membresías activas
    const { data: members, error } = await supabase
      .from("company_members")
      .select(`
        role,
        company_id,
        company:company_profiles(
          id,
          company_name,
          legal_name,
          logo_url,
          industry,
          verification_status
        )
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("[CompanyTenantService.getUserCompanies] Error querying company_members:", error);
    }

    const items: UserCompanyItem[] = [];

    if (members && members.length > 0) {
      for (const m of members) {
        const comp = Array.isArray(m.company) ? m.company[0] : m.company;
        if (comp) {
          items.push({
            companyId: comp.id,
            companyName: comp.company_name || "Empresa",
            legalName: comp.legal_name || null,
            logoUrl: comp.logo_url || null,
            industry: comp.industry || "General",
            role: (m.role as CompanyMemberRole) || "owner",
            verificationStatus: comp.verification_status || null,
          });
        }
      }
    }

    // 2. Resiliencia: Si no tiene membresías en la tabla nueva pero sí existe un perfil histórico con id = userId
    if (items.length === 0) {
      const { data: legacyComp } = await supabase
        .from("company_profiles")
        .select("id, company_name, legal_name, logo_url, industry, verification_status")
        .or(`id.eq.${userId},owner_id.eq.${userId}`)
        .maybeSingle();

      if (legacyComp) {
        // Auto-sincronizar membresía silenciosamente
        try {
          await supabase.from("company_members").upsert({
            company_id: legacyComp.id,
            user_id: userId,
            role: "owner",
          });
        } catch {
          // Si falla inserción (por permisos de vista restringida), continuamos
        }

        items.push({
          companyId: legacyComp.id,
          companyName: legacyComp.company_name || "Empresa",
          legalName: legacyComp.legal_name || null,
          logoUrl: legacyComp.logo_url || null,
          industry: legacyComp.industry || "General",
          role: "owner",
          verificationStatus: legacyComp.verification_status || null,
        });
      }
    }

    return items;
  }

  /**
   * Crea una nueva organización/empresa y asocia al usuario creador como 'owner'.
   */
  async createCompany(
    userId: string,
    input: CreateCompanyInput,
    supabase: SupabaseClient<Database>
  ): Promise<{ companyId: string; companyName: string }> {
    if (!userId) {
      throw new Error("Usuario no autenticado");
    }

    const fiscalAddress = input.location || input.address_details || "Mérida, Yucatán";
    const rfcValue = input.rfc && input.rfc.trim() !== "" ? input.rfc.trim().toUpperCase() : "XAXX010101000";

    // 1. Insertar en company_profiles con owner_id
    const { data: newCompany, error: compError } = await supabase
      .from("company_profiles")
      .insert({
        company_name: input.company_name.trim(),
        legal_name: input.legal_name?.trim() || null,
        rfc: rfcValue,
        fiscal_address: fiscalAddress,
        address_details: input.address_details?.trim() || null,
        industry: input.industry.trim(),
        company_size: input.company_size || "1-10",
        contact_phone: input.contact_phone?.trim() || null,
        website_url: input.website_url?.trim() || null,
        description: input.description?.trim() || null,
        leave_approval_config: {
          approvalMode: input.leave_approval_mode || "single_step",
        },
        payroll_impact_config: parseCompanyWorkRulesConfig(
          DEFAULT_COMPANY_WORK_RULES_CONFIG
        ) as unknown as Json,
        owner_id: userId,
      })
      .select("id, company_name")
      .single();

    if (compError || !newCompany) {
      throw new Error(compError?.message || "Error al crear el perfil de la empresa");
    }

    // 2. Asociar al usuario como Owner en company_members
    const { error: memberError } = await supabase
      .from("company_members")
      .insert({
        company_id: newCompany.id,
        user_id: userId,
        role: "owner",
      });

    if (memberError) {
      console.error("[CompanyTenantService.createCompany] Error creating membership:", memberError);
      // Intentar borrado de limpieza si falló la membresía
      await supabase.from("company_profiles").delete().eq("id", newCompany.id);
      throw new Error("No se pudo asignar el rol de propietario a la empresa.");
    }

    return {
      companyId: newCompany.id,
      companyName: newCompany.company_name,
    };
  }

  /**
   * Verifica si un usuario tiene acceso a una empresa y su rol respectivo.
   */
  async verifyUserMembership(
    userId: string,
    companyId: string,
    supabase: SupabaseClient<Database>
  ): Promise<CompanyMemberRole | null> {
    if (!isValidUuid(userId) || !isValidUuid(companyId)) return null;

    const cleanUserId = userId.trim();
    const cleanCompanyId = companyId.trim();

    const { data } = await supabase
      .from("company_members")
      .select("role")
      .eq("user_id", cleanUserId)
      .eq("company_id", cleanCompanyId)
      .maybeSingle();

    if (data?.role) {
      return data.role as CompanyMemberRole;
    }

    // Fallback retrocompatible: solo si el usuario es dueño legítimo de la empresa solicitada
    const { data: legacy } = await supabase
      .from("company_profiles")
      .select("id")
      .or(`id.eq.${cleanUserId},owner_id.eq.${cleanUserId}`)
      .eq("id", cleanCompanyId)
      .maybeSingle();

    return legacy ? "owner" : null;
  }

  /**
   * Resuelve el scope activo verificando membresía real y rol permitido.
   * Rechaza cookies `kanpro_active_company` manipuladas en lugar de degradar silenciosamente.
   */
  async resolveAuthorizedCompanyScope(
    userId: string,
    supabase: SupabaseClient<Database>,
    allowedRoles: readonly CompanyMemberRole[] = ["owner", "admin"],
    cookieCompanyId?: string
  ): Promise<{ companyId: string; role: CompanyMemberRole } | null> {
    if (!isValidUuid(userId)) {
      return null;
    }

    let preferredId = cookieCompanyId;
    if (preferredId === undefined) {
      try {
        const { cookies } = await import("next/headers");
        const cookieStore = await cookies();
        preferredId = cookieStore.get(ACTIVE_COMPANY_COOKIE)?.value;
      } catch {
        // fuera de contexto de cookies
      }
    }

    if (preferredId !== undefined && preferredId !== "") {
      const role = await this.verifyUserMembership(userId, preferredId, supabase);
      if (!role || !allowedRoles.includes(role)) {
        return null;
      }
      return { companyId: preferredId.trim(), role };
    }

    const companies = await this.getUserCompanies(userId, supabase);
    if (companies.length === 0) {
      return null;
    }

    const primary = companies[0];
    if (!allowedRoles.includes(primary.role)) {
      return null;
    }

    return { companyId: primary.companyId, role: primary.role };
  }

  /**
   * Resuelve el ID y rol de la empresa activa para operaciones en Server Actions o backend.
   * Valida pertenencia en company_members o recuperación legacy de company_profiles.
   */
  async resolveActiveCompanyScope(
    userId: string,
    supabase: SupabaseClient<Database>,
    cookieCompanyId?: string
  ): Promise<{ companyId: string; role: CompanyMemberRole }> {
    if (!userId || !userId.trim()) {
      throw new Error("Usuario no autenticado");
    }

    let preferredId = cookieCompanyId;
    if (!preferredId) {
      try {
        const { cookies } = await import("next/headers");
        const cookieStore = await cookies();
        preferredId = cookieStore.get(ACTIVE_COMPANY_COOKIE)?.value;
      } catch {
        // fuera de contexto de cookies
      }
    }

    // 1. Si hay ID preferido en cookie, verificar que pertenezca a esa empresa
    if (preferredId) {
      const role = await this.verifyUserMembership(userId, preferredId, supabase);
      if (role) {
        return { companyId: preferredId, role };
      }
    }

    // 2. Si no hay cookie o ya no tiene acceso, obtener las empresas del usuario
    const companies = await this.getUserCompanies(userId, supabase);
    if (companies.length > 0) {
      return { companyId: companies[0].companyId, role: companies[0].role };
    }

    throw new Error("No tienes una empresa activa asociada.");
  }

  /**
   * Actualiza el nombre personal del titular en profiles y sincroniza metadata de auth.
   */
  async updateOwnerPersonalName(
    userId: string,
    fullName: string,
    supabase: SupabaseClient<Database>
  ): Promise<{ fullName: string }> {
    if (!userId) {
      throw new Error("Usuario no autenticado");
    }

    const newFullName = fullName.trim();

    const { error: profileErr } = await supabase
      .from("profiles")
      .update({
        full_name: newFullName,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (profileErr) {
      throw new Error(profileErr.message);
    }

    try {
      await supabase.auth.updateUser({
        data: {
          full_name: newFullName,
          name: newFullName,
        },
      });
    } catch {
      // Ignorar fallback secundario si no tiene permisos
    }

    return { fullName: newFullName };
  }
}

export const companyTenantService = new CompanyTenantService();
