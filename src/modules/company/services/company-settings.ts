import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/types/supabase";
import type {
  BranchGeofenceInput,
} from "../schemas/settings.schema";
import { getSubscriptionPlan } from "@/config/subscriptions";

export interface CompanyInvoiceRecord {
  id: string;
  company_id: string;
  plan_name: string;
  amount: number;
  currency: string;
  status: string;
  payment_method: string | null;
  created_at: string;
}

export interface UpdateSubscriptionPlanResult {
  success: boolean;
  plan: "basic" | "pro" | "enterprise";
  planPrice: number;
  featuredAllowance: number;
}

export class CompanySettingsService {
  /**
   * Pausa o reactiva todas las vacantes de la empresa (control de reclutamiento global).
   */
  static async toggleGlobalRecruitment(
    supabase: SupabaseClient<Database>,
    companyId: string,
    pause: boolean
  ): Promise<{ success: boolean }> {
    const { error } = await supabase
      .from("vacancies")
      .update({ is_active: !pause })
      .eq("company_id", companyId);

    if (error) {
      console.error("Error toggling global recruitment:", error);
      throw new Error("No se pudo actualizar el estado de reclutamiento.");
    }

    return { success: true };
  }

  /**
   * Actualiza el canal preferido de contacto (WhatsApp, Teléfono o Bandeja interna).
   */
  static async updateContactChannel(
    supabase: SupabaseClient<Database>,
    companyId: string,
    channel: string
  ): Promise<{ success: boolean }> {
    const { error } = await supabase
      .from("company_profiles")
      // @ts-expect-error contact_channel is an extended column in company_profiles
      .update({ contact_channel: channel, updated_at: new Date().toISOString() })
      .eq("id", companyId);

    if (error) {
      console.error("Error updating contact channel:", error);
      throw new Error("No se pudo actualizar el canal de contacto preferido.");
    }

    return { success: true };
  }

  /**
   * Actualiza el teléfono de contacto corporativo y sincroniza el WhatsApp del titular.
   */
  static async updateAccountPhone(
    supabase: SupabaseClient<Database>,
    userId: string,
    companyId: string,
    phone: string
  ): Promise<{ success: boolean; phone: string }> {
    const cleanPhone = phone.trim();
    const now = new Date().toISOString();

    const { error: companyErr } = await supabase
      .from("company_profiles")
      .update({ contact_phone: cleanPhone, updated_at: now })
      .eq("id", companyId);

    if (companyErr) {
      console.error("Error updating company contact_phone:", companyErr);
      throw new Error("No se pudo guardar el teléfono de contacto de la empresa.");
    }

    const { error: profileErr } = await supabase
      .from("profiles")
      .update({ whatsapp_number: cleanPhone, updated_at: now })
      .eq("id", userId);

    if (profileErr) {
      console.warn("Warning syncing profile whatsapp_number:", profileErr.message);
    }

    return { success: true, phone: cleanPhone };
  }

  /**
   * Actualiza el plan de suscripción de la empresa, calcula vigencia y genera factura contable.
   * Los planes de pago ("pro" | "enterprise") requieren un ID de transacción verificado.
   */
  static async updateSubscriptionPlan(
    supabase: SupabaseClient<Database>,
    companyId: string,
    plan: "basic" | "pro" | "enterprise",
    options?: { verifiedTransactionId?: string }
  ): Promise<UpdateSubscriptionPlanResult> {
    const verifiedTransactionId = options?.verifiedTransactionId?.trim();

    if (plan !== "basic" && !verifiedTransactionId) {
      throw new Error(
        "No se permite activar planes de pago sin un ID de transacción verificado por el proveedor de pagos."
      );
    }

    const planConfig = getSubscriptionPlan(plan);
    const featuredAllowance = planConfig.featuredVacanciesAllowance;
    const planPrice = planConfig.price;
    const planName = planConfig.name;

    const periodEnd = new Date();
    periodEnd.setDate(periodEnd.getDate() + 30);

    const { error: updateErr } = await supabase
      .from("company_profiles")
      .update({
        subscription_plan: plan,
        subscription_status: "active",
        subscription_period_end: periodEnd.toISOString(),
        featured_vacancies_allowance: featuredAllowance,
        updated_at: new Date().toISOString(),
      })
      .eq("id", companyId);

    if (updateErr) {
      console.error("Error updating subscription plan:", updateErr);
      throw new Error("No se pudo actualizar el plan de suscripción.");
    }

    // Registrar factura contable como 'paid' únicamente si existe una transacción de pago verificada
    if (planPrice > 0 && verifiedTransactionId) {
      await supabase.from("company_invoices").insert({
        company_id: companyId,
        plan_name: planName,
        amount: planPrice,
        currency: "MXN",
        status: "paid",
        payment_method: `Transacción Verificada (${verifiedTransactionId})`,
      });
    }

    return {
      success: true,
      plan,
      planPrice,
      featuredAllowance,
    };
  }

  /**
   * Consulta el historial de facturas y recibos de suscripción de la empresa.
   */
  static async getCompanyInvoices(
    supabase: SupabaseClient<Database>,
    companyId: string
  ): Promise<CompanyInvoiceRecord[]> {
    const { data, error } = await supabase
      .from("company_invoices")
      .select("*")
      .eq("company_id", companyId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching company invoices:", error);
      return [];
    }

    return (data || []) as unknown as CompanyInvoiceRecord[];
  }

  /**
   * Guarda las sucursales del centro de trabajo con sus coordenadas GPS y radio de geocercas.
   */
  static async updateCompanyBranches(
    supabase: SupabaseClient<Database>,
    companyId: string,
    branches: BranchGeofenceInput[]
  ): Promise<{ success: boolean; count: number; branches: BranchGeofenceInput[] }> {
    const { error } = await supabase
      .from("company_profiles")
      .update({
        branch_addresses: branches as unknown as Json,
        updated_at: new Date().toISOString(),
      })
      .eq("id", companyId);

    if (error) {
      console.error("Error updating company branches:", error);
      throw new Error("No se pudo actualizar la configuración de sucursales.");
    }

    return {
      success: true,
      count: branches.length,
      branches,
    };
  }

  /**
   * Obtiene la lista de sucursales configuradas para la empresa.
   */
  static async getCompanyBranches(
    supabase: SupabaseClient<Database>,
    companyId: string
  ): Promise<BranchGeofenceInput[]> {
    const { data, error } = await supabase
      .from("company_profiles")
      .select("branch_addresses, company_name, fiscal_address, address_details")
      .eq("id", companyId)
      .maybeSingle();

    if (error || !data) {
      return [];
    }

    if (Array.isArray(data.branch_addresses) && data.branch_addresses.length > 0) {
      return data.branch_addresses as unknown as BranchGeofenceInput[];
    }

    // Si no tiene sucursales registradas, construir sucursal matriz por defecto
    const defaultAddress = data.address_details || data.fiscal_address || "Dirección no registrada";
    return [
      {
        branchName: `Matriz - ${data.company_name || "Oficina Central"}`,
        address: defaultAddress,
        latitude: 20.6296,
        longitude: -87.0739,
        radiusMeters: 150,
      },
    ];
  }

  /**
   * Actualiza la configuración unificada de reglas de trabajo (payroll_impact_config)
   * y opcionalmente el modo de aprobación de permisos (leave_approval_config).
   */
  static async updateWorkRulesConfig(
    supabase: SupabaseClient<Database>,
    companyId: string,
    payrollImpactConfig: Json,
    leaveApprovalMode?: "single_step" | "two_step"
  ): Promise<void> {
    const payload: Database["public"]["Tables"]["company_profiles"]["Update"] = {
      payroll_impact_config: payrollImpactConfig,
    };
    if (leaveApprovalMode) {
      payload.leave_approval_config = { approvalMode: leaveApprovalMode };
    }

    const { error } = await supabase
      .from("company_profiles")
      .update(payload)
      .eq("id", companyId);

    if (error) {
      throw new Error(error.message || "No se pudo guardar la configuración de reglas de la empresa.");
    }
  }
}
