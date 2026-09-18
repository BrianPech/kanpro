"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { ContractTemplateType } from "../types/contracts";
import { Database } from "@/types/supabase";

export interface CreateContractInput {
  employeeId?: string;
  candidateId?: string;
  applicationId?: string;
  folio?: string;
  jobTitle: string;
  department: string;
  contractType: string;
  templateType: ContractTemplateType;
  startDate: string;
  endDate?: string | null;
  salary: number;
  paymentFrequency: string;
  companySigned?: boolean;
  companySignatureUrl?: string | null;
  employeeSigned?: boolean;
  employeeSignatureUrl?: string | null;
  status?: "vigente" | "proximo_a_vencer" | "imminent" | "en_firma";
  notes?: string;
}

export interface RenewContractInput {
  contractId: string;
  templateType: ContractTemplateType;
  contractType: string;
  endDate: string | null;
}

export interface SignContractInput {
  contractId: string;
  signerRole: "representante_legal" | "trabajador";
  signatureUrl: string;
  isNowFullySigned: boolean;
}

/**
 * Creates a formal employment contract in public.company_contracts
 */
export async function createContractAction(input: CreateContractInput) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("No autorizado. Inicie sesión para continuar.");
  }

  const randomFolio =
    input.folio || `KAN-CTR-2026-${Math.floor(100 + Math.random() * 900)}`;

  const isUuid = (val?: string) =>
    val &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      val
    );

  const initialStatus =
    input.status ||
    (input.companySigned && input.employeeSigned ? "vigente" : "en_firma");

  const { data: inserted, error } = await supabase
    .from("company_contracts")
    .insert({
      company_id: user.id,
      employee_id: isUuid(input.employeeId) ? input.employeeId : null,
      candidate_id: isUuid(input.candidateId) ? input.candidateId : null,
      application_id: isUuid(input.applicationId) ? input.applicationId : null,
      folio: randomFolio,
      job_title: input.jobTitle.trim(),
      department: input.department.trim(),
      contract_type: input.contractType,
      template_type: input.templateType,
      start_date: input.startDate,
      end_date:
        input.templateType === "indeterminado" || !input.endDate
          ? null
          : input.endDate,
      salary: input.salary,
      payment_frequency: input.paymentFrequency || "quincenal",
      company_signed: Boolean(input.companySigned),
      company_signature_url: input.companySignatureUrl || null,
      employee_signed: Boolean(input.employeeSigned),
      employee_signature_url: input.employeeSignatureUrl || null,
      status: initialStatus,
      notes: input.notes || null,
    })
    .select("id, folio")
    .single();

  if (error) {
    console.error("Error creating company contract:", error);
    throw new Error("No se pudo registrar el contrato en la base de datos.");
  }

  revalidatePath("/dashboard/company/contracts");
  revalidatePath("/dashboard/company");

  return { success: true, contractId: inserted.id, folio: inserted.folio };
}

/**
 * Renews an existing contract or converts it to permanent (tiempo indeterminado).
 */
export async function renewContractAction(input: RenewContractInput) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("No autorizado. Inicie sesión para continuar.");
  }

  const isIndeterminado = input.templateType === "indeterminado";

  const { error } = await supabase
    .from("company_contracts")
    .update({
      template_type: input.templateType,
      contract_type: input.contractType,
      end_date: isIndeterminado ? null : input.endDate,
      status: "vigente",
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.contractId)
    .eq("company_id", user.id);

  if (error) {
    console.error("Error renewing contract:", error);
    throw new Error("No se pudo renovar el contrato en la base de datos.");
  }

  revalidatePath("/dashboard/company/contracts");
  revalidatePath("/dashboard/company");

  return { success: true };
}

/**
 * Registers digital signature on a contract.
 */
export async function signContractAction(input: SignContractInput) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("No autorizado. Inicie sesión para continuar.");
  }

  const updates: Database["public"]["Tables"]["company_contracts"]["Update"] = {
    updated_at: new Date().toISOString(),
  };

  if (input.signerRole === "representante_legal") {
    updates.company_signed = true;
    updates.company_signature_url = input.signatureUrl;
  } else {
    updates.employee_signed = true;
    updates.employee_signature_url = input.signatureUrl;
  }

  if (input.isNowFullySigned) {
    updates.status = "vigente";
  }

  const { error } = await supabase
    .from("company_contracts")
    .update(updates)
    .eq("id", input.contractId)
    .eq("company_id", user.id);

  if (error) {
    console.error("Error signing contract:", error);
    throw new Error("No se pudo registrar la firma digital en el contrato.");
  }

  revalidatePath("/dashboard/company/contracts");
  revalidatePath("/dashboard/company");

  return { success: true };
}

/**
 * Deletes or archives a contract.
 */
export async function deleteContractAction(contractId: string) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("No autorizado. Inicie sesión para continuar.");
  }

  const { error } = await supabase
    .from("company_contracts")
    .delete()
    .eq("id", contractId)
    .eq("company_id", user.id);

  if (error) {
    console.error("Error deleting contract:", error);
    throw new Error("No se pudo eliminar el contrato.");
  }

  revalidatePath("/dashboard/company/contracts");
  revalidatePath("/dashboard/company");

  return { success: true };
}
