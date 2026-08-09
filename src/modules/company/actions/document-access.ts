"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

/**
 * Sends a document access request from a company to a candidate for hiring purposes.
 */
export async function requestDocumentAccess(
  applicationId: string,
  candidateId: string,
  requestedDocuments: string[] = ["curp", "rfc", "ine"]
) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    throw new Error("No autorizado. Inicie sesión para continuar.")
  }

  // Check if a request already exists for this application
  const { data: existingRequest } = await supabase
    .from("document_access_requests")
    .select("id, status")
    .eq("company_id", user.id)
    .eq("application_id", applicationId)
    .maybeSingle()

  if (existingRequest) {
    if (existingRequest.status === "approved") {
      return { success: true, message: "La documentación ya fue autorizada por el candidato.", status: "approved" }
    }
    if (existingRequest.status === "pending") {
      return { success: true, message: "Ya existe una solicitud pendiente enviada al candidato.", status: "pending" }
    }
  }

  // Insert new request
  const { data: inserted, error } = await supabase
    .from("document_access_requests")
    .insert({
      company_id: user.id,
      candidate_id: candidateId,
      application_id: applicationId,
      requested_documents: requestedDocuments,
      status: "pending"
    })
    .select("id")
    .single()

  if (error) {
    console.error("Error creating document access request:", error)
    throw new Error("No se pudo enviar la solicitud de documentos.")
  }

  // Send platform notification to candidate
  const { data: companyProfile } = await supabase
    .from("company_profiles")
    .select("company_name")
    .eq("id", user.id)
    .single()

  const companyName = companyProfile?.company_name || "La empresa"

  await supabase.from("notifications").insert({
    user_id: candidateId,
    title: "Solicitud de Documentos de Contratación",
    description: `${companyName} solicita tu autorización para revisar tus documentos (INE, CURP, RFC) para tu proceso de contratación.`,
    type: "document_request",
  })

  revalidatePath("/dashboard/company/applications")

  return { success: true, requestId: inserted.id, status: "pending" }
}

/**
 * Responds to a document access request (for candidate use).
 */
export async function respondDocumentAccessRequest(
  requestId: string,
  status: "approved" | "rejected"
) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    throw new Error("No autorizado.")
  }

  const payload: any = {
    status,
    updated_at: new Date().toISOString()
  }

  if (status === "approved") {
    payload.approved_at = new Date().toISOString()
  } else {
    payload.rejected_at = new Date().toISOString()
  }

  const { error } = await supabase
    .from("document_access_requests")
    .update(payload)
    .eq("id", requestId)
    .eq("candidate_id", user.id)

  if (error) {
    console.error("Error responding to document access request:", error)
    throw new Error("No se pudo actualizar la respuesta.")
  }

  revalidatePath("/dashboard/candidate/applications")
  revalidatePath("/dashboard/company/applications")

  return { success: true }
}

/**
 * Gets document access status for a specific application.
 */
export async function getDocumentAccessStatus(applicationId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("document_access_requests")
    .select("*")
    .eq("application_id", applicationId)
    .order("created_at", { ascending: false })
    .maybeSingle()

  if (error) {
    console.error("Error fetching document access status:", error)
    return null
  }

  return data
}
