import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";
import type { SignCandidateContractInput } from "../schemas/contracts.schema";

export interface CandidateContractItem {
  id: string;
  folio: string;
  companyId: string;
  companyName: string;
  companyLegalName?: string | null;
  companyRfc?: string | null;
  companyAddress?: string | null;
  companyLegalRep?: string | null;
  companyLogo?: string | null;
  jobTitle: string;
  department: string;
  contractType: string;
  templateType: string;
  startDate: string;
  endDate?: string | null;
  salary: number;
  paymentFrequency: string;
  companySigned: boolean;
  companySignatureUrl?: string | null;
  employeeSigned: boolean;
  employeeSignatureUrl?: string | null;
  status: string;
  createdAt: string;
  applicationId?: string | null;
  vacancyTitle?: string | null;
}

export interface CandidateContractsResult {
  contracts: CandidateContractItem[];
  pendingSignatureCount: number;
}

export interface SignContractResult {
  success: boolean;
  folio: string;
  contractId: string;
  message?: string;
}

interface RawCompanyContract {
  id: string;
  folio: string;
  company_id: string;
  candidate_id: string;
  employee_id: string | null;
  application_id: string | null;
  job_title: string;
  department: string;
  contract_type: string;
  template_type: string;
  start_date: string;
  end_date: string | null;
  salary: number | string;
  payment_frequency: string | null;
  company_signed: boolean | null;
  company_signature_url: string | null;
  employee_signed: boolean | null;
  employee_signature_url: string | null;
  status: string | null;
  created_at: string;
  company:
    | {
        id: string;
        company_name: string;
        legal_name: string | null;
        rfc: string;
        fiscal_address: string;
        legal_rep_name: string | null;
        logo_url: string | null;
      }
    | Array<{
        id: string;
        company_name: string;
        legal_name: string | null;
        rfc: string;
        fiscal_address: string;
        legal_rep_name: string | null;
        logo_url: string | null;
      }>
    | null;
  application:
    | {
        id: string;
        status: string;
        vacancies:
          | { id: string; title: string }
          | Array<{ id: string; title: string }>
          | null;
      }
    | Array<{
        id: string;
        status: string;
        vacancies:
          | { id: string; title: string }
          | Array<{ id: string; title: string }>
          | null;
      }>
    | null;
}

export class CandidateContractsService {
  /**
   * Obtiene todos los contratos laborales asociados al candidato/colaborador.
   */
  static async getCandidateContracts(
    supabase: SupabaseClient<Database>,
    userId: string
  ): Promise<CandidateContractsResult> {
    if (!userId) {
      return { contracts: [], pendingSignatureCount: 0 };
    }

    const { data: employeeRow } = await supabase
      .from("company_employees")
      .select("id")
      .eq("employee_id", userId)
      .maybeSingle();

    let query = supabase
      .from("company_contracts")
      .select(`
        id,
        folio,
        company_id,
        candidate_id,
        employee_id,
        application_id,
        job_title,
        department,
        contract_type,
        template_type,
        start_date,
        end_date,
        salary,
        payment_frequency,
        company_signed,
        company_signature_url,
        employee_signed,
        employee_signature_url,
        status,
        created_at,
        company:company_profiles (
          id,
          company_name,
          legal_name,
          rfc,
          fiscal_address,
          legal_rep_name,
          logo_url
        ),
        application:applications (
          id,
          status,
          vacancies (
            id,
            title
          )
        )
      `)
    if (employeeRow?.id) {
      query = query.or(`candidate_id.eq.${userId},employee_id.eq.${employeeRow.id}`);
    } else {
      query = query.eq("candidate_id", userId);
    }

    const { data: dbContracts, error } = await query.order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching candidate contracts:", error);
      return { contracts: [], pendingSignatureCount: 0 };
    }

    const rawList = (dbContracts || []) as unknown as RawCompanyContract[];

    const contracts: CandidateContractItem[] = rawList.map((c) => {
      const comp = Array.isArray(c.company) ? c.company[0] : c.company;
      const app = Array.isArray(c.application) ? c.application[0] : c.application;
      const vac = app?.vacancies
        ? Array.isArray(app.vacancies)
          ? app.vacancies[0]
          : app.vacancies
        : null;

      return {
        id: c.id,
        folio: c.folio,
        companyId: c.company_id,
        companyName: comp?.company_name || comp?.legal_name || "Empresa Contratante",
        companyLegalName: comp?.legal_name || null,
        companyRfc: comp?.rfc || null,
        companyAddress: comp?.fiscal_address || null,
        companyLegalRep: comp?.legal_rep_name || null,
        companyLogo: comp?.logo_url || null,
        jobTitle: c.job_title,
        department: c.department,
        contractType: c.contract_type,
        templateType: c.template_type,
        startDate: c.start_date,
        endDate: c.end_date || null,
        salary: Number(c.salary) || 0,
        paymentFrequency: c.payment_frequency || "quincenal",
        companySigned: Boolean(c.company_signed),
        companySignatureUrl: c.company_signature_url || null,
        employeeSigned: Boolean(c.employee_signed),
        employeeSignatureUrl: c.employee_signature_url || null,
        status: c.status || "vigente",
        createdAt: c.created_at,
        applicationId: c.application_id || null,
        vacancyTitle: vac?.title || null,
      };
    });

    const pendingSignatureCount = contracts.filter(
      (c) => !c.employeeSigned && c.status !== "cancelado"
    ).length;

    return {
      contracts,
      pendingSignatureCount,
    };
  }

  /**
   * Registra la firma digital del contrato laboral por parte del trabajador/candidato.
   */
  static async signContract(
    supabase: SupabaseClient<Database>,
    userId: string,
    input: SignCandidateContractInput,
    clientIp?: string
  ): Promise<SignContractResult> {
    // 1. Obtener y validar propiedad del contrato
    const { data: contract, error: contractErr } = await supabase
      .from("company_contracts")
      .select(`
        id,
        folio,
        company_id,
        candidate_id,
        employee_id,
        job_title,
        company_signed,
        employee_signed,
        status
      `)
      .eq("id", input.contractId)
      .single();

    if (contractErr || !contract) {
      throw new Error("No se encontró el contrato laboral especificado.");
    }

    let isAuthorized = contract.candidate_id === userId;
    if (!isAuthorized && contract.employee_id) {
      const { data: empRecord } = await supabase
        .from("company_employees")
        .select("id")
        .eq("id", contract.employee_id)
        .eq("employee_id", userId)
        .maybeSingle();

      if (empRecord) {
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      throw new Error("No tienes permisos para firmar este contrato.");
    }

    if (contract.employee_signed) {
      return {
        success: true,
        message: "El contrato ya se encontraba firmado por el trabajador.",
        folio: contract.folio,
        contractId: contract.id,
      };
    }

    const now = new Date().toISOString();

    // 2. Actualizar contrato con la firma del empleado y sello de auditoría de red
    const auditLog = clientIp ? `[Sello Digital Colaborador] IP: ${clientIp} | Fecha: ${now}` : undefined;

    let updateErr: { message?: string; code?: string } | null = null;
    if (typeof supabase.rpc === "function") {
      const rpcRes = await supabase.rpc("sign_employee_contract", {
        p_contract_id: input.contractId,
        p_signature_url: input.signatureData,
        p_notes: auditLog ?? null,
      });
      if (rpcRes?.error && rpcRes.error.code !== "PGRST202") {
        updateErr = rpcRes.error;
      } else if (!rpcRes || rpcRes.error?.code === "PGRST202") {
        const fallbackRes = await supabase
          .from("company_contracts")
          .update({
            employee_signed: true,
            employee_signature_url: input.signatureData,
            status: "vigente",
            ...(auditLog ? { notes: auditLog } : {}),
            updated_at: now,
          })
          .eq("id", input.contractId);
        updateErr = fallbackRes.error;
      }
    } else {
      const fallbackRes = await supabase
        .from("company_contracts")
        .update({
          employee_signed: true,
          employee_signature_url: input.signatureData,
          status: "vigente",
          ...(auditLog ? { notes: auditLog } : {}),
          updated_at: now,
        })
        .eq("id", input.contractId);
      updateErr = fallbackRes.error;
    }

    if (updateErr) {
      console.error("Error signing candidate contract:", updateErr);
      throw new Error(
        updateErr.message || "No se pudo registrar la firma digital del contrato."
      );
    }

    // 3. Obtener nombre del colaborador para notificar a la empresa
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", userId)
      .maybeSingle();

    const candidateName = profile?.full_name || "El colaborador";

    // 4. Enviar notificación in-app a la empresa empleadora
    try {
      await supabase.from("notifications").insert({
        user_id: contract.company_id,
        title: "¡Contrato firmado por el colaborador!",
        description: `${candidateName} ha firmado electrónicamente su contrato laboral (Folio: ${contract.folio}) para el puesto de "${contract.job_title}". El contrato está ahora formalizado al 100%.`,
        type: "contract_signed",
      });
    } catch (notifErr) {
      console.error("Error creating company notification:", notifErr);
    }

    return {
      success: true,
      folio: contract.folio,
      contractId: contract.id,
    };
  }
}

/**
 * Función desacoplada retrocompatible
 */
export async function getCandidateContracts(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<CandidateContractsResult> {
  return CandidateContractsService.getCandidateContracts(supabase, userId);
}
