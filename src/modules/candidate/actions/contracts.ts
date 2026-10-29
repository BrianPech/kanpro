"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import {
  signCandidateContractSchema,
  type SignCandidateContractInput,
} from "../schemas/contracts.schema";
import { CandidateContractsService } from "../services/candidate-contracts";

type SignCandidateContractActionResult =
  | {
      success: true;
      data: { folio: string; contractId: string };
      folio: string;
      contractId: string;
      message?: string;
      error?: undefined;
    }
  | {
      success: false;
      error: string;
      data?: undefined;
      folio?: undefined;
      contractId?: undefined;
      message?: undefined;
    };

/**
 * Server Action: Signs an employment contract from the employee/candidate side.
 * Validates payload with Zod schema, checks session, and delegates logic to CandidateContractsService.
 */
export async function signCandidateContractAction(
  rawInput: SignCandidateContractInput
): Promise<SignCandidateContractActionResult> {
  const parsed = signCandidateContractSchema.safeParse(rawInput);
  if (!parsed.success) {
    const errorMsg =
      parsed.error.issues[0]?.message || "Parámetros de firma inválidos o incompletos.";
    return { success: false, error: errorMsg };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "No autorizado. Inicie sesión para continuar." };
  }

  try {
    const headersList = await headers();
    const forwardedFor = headersList.get("x-forwarded-for");
    const clientIp = forwardedFor
      ? forwardedFor.split(",")[0].trim()
      : (headersList.get("x-real-ip") || "127.0.0.1");

    const result = await CandidateContractsService.signContract(
      supabase,
      user.id,
      parsed.data,
      clientIp
    );

    revalidatePath("/dashboard/candidate/applications");
    revalidatePath("/dashboard/candidate/contracts");
    revalidatePath("/dashboard/candidate");
    revalidatePath("/dashboard/company/contracts");
    revalidatePath("/dashboard/company/employees");
    revalidatePath("/dashboard/company");

    return {
      success: true,
      data: {
        folio: result.folio,
        contractId: result.contractId,
      },
      folio: result.folio,
      contractId: result.contractId,
      message: result.message,
    };
  } catch (err: unknown) {
    const message =
      err instanceof Error
        ? err.message
        : "No se pudo registrar la firma digital del contrato.";
    return { success: false, error: message };
  }
}
