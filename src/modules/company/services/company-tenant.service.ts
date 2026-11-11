import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";
import {
  ACTIVE_COMPANY_COOKIE,
  type CreateCompanyInput,
  type CompanyMemberRole,
} from "../schemas/tenant.schema";

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
    if (!userId || !companyId) return null;

    const { data } = await supabase
      .from("company_members")
      .select("role")
      .eq("user_id", userId)
      .eq("company_id", companyId)
      .maybeSingle();

    if (data?.role) {
      return data.role as CompanyMemberRole;
    }

    // Fallback retrocompatible
    const { data: legacy } = await supabase
      .from("company_profiles")
      .select("id")
      .or(`id.eq.${companyId},owner_id.eq.${userId}`)
      .eq("id", companyId)
      .maybeSingle();

    return legacy ? "owner" : null;
  }

  /**
   * Resuelve el ID y rol de la empresa activa para operaciones en Server Actions o backend.
   * Valida pertenencia en company_members o fallback seguro a legacy.
   */
  async resolveActiveCompanyScope(
    userId: string,
    supabase: SupabaseClient<Database>,
    cookieCompanyId?: string
  ): Promise<{ companyId: string; role: CompanyMemberRole }> {
    if (!userId) {
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

    // 3. Fallback histórico
    return { companyId: userId, role: "owner" };
  }
}

export const companyTenantService = new CompanyTenantService();
