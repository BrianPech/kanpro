"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface SignCandidateContractInput {
  contractId: string;
  signatureData: string;
}

/**
 * Server Action: Signs an employment contract from the employee/candidate side.
 * Validates ownership, updates employee_signed to true with timestamp and signature data URL,
 * updates contract status to 'vigente', and sends an in-app notification to the company.
 */
export async function signCandidateContractAction(
  input: SignCandidateContractInput
) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("No autorizado. Inicie sesión para continuar.");
  }

  if (!input.contractId || !input.signatureData) {
    throw new Error("Parámetros de firma inválidos o incompletos.");
  }

  // 1. Fetch contract verifying candidate ownership
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

  // Verify that the logged in user is indeed the candidate or the associated employee
  let isAuthorized = contract.candidate_id === user.id;
  if (!isAuthorized && contract.employee_id) {
    const { data: empRecord } = await supabase
      .from("company_employees")
      .select("id")
      .eq("id", contract.employee_id)
      .eq("employee_id", user.id)
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
    };
  }

  const now = new Date().toISOString();

  // 2. Update contract with employee signature
  const { error: updateErr } = await supabase
    .from("company_contracts")
    .update({
      employee_signed: true,
      employee_signature_url: input.signatureData,
      status: "vigente",
      updated_at: now,
    })
    .eq("id", input.contractId);

  if (updateErr) {
    console.error("Error signing candidate contract:", updateErr);
    throw new Error(
      updateErr.message || "No se pudo registrar la firma digital del contrato."
    );
  }

  // 3. Fetch candidate name for company notification
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .maybeSingle();

  const candidateName = profile?.full_name || "El colaborador";

  // 4. Send notification to the company employer
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

  // 5. Revalidate all relevant routes for both candidate and company
  revalidatePath("/dashboard/candidate/applications");
  revalidatePath("/dashboard/candidate/contracts");
  revalidatePath("/dashboard/candidate");
  revalidatePath("/dashboard/company/contracts");
  revalidatePath("/dashboard/company/employees");
  revalidatePath("/dashboard/company");

  return {
    success: true,
    folio: contract.folio,
    contractId: contract.id,
  };
}
