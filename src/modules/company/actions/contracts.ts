"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import {
  createContractSchema,
  renewContractSchema,
  signContractSchema,
  deleteContractSchema,
  type CreateContractInput,
  type RenewContractInput,
  type SignContractInput,
  type DeleteContractInput,
} from "../schemas/contracts.schema";
import { CompanyContractService } from "../services/company-service";

export type {
  CreateContractInput,
  RenewContractInput,
  SignContractInput,
  DeleteContractInput,
};

export interface ActionResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export type CreateContractActionResult =
  | {
      success: true;
      data: { contractId: string; folio: string };
      contractId: string;
      folio: string;
      error?: undefined;
    }
  | {
      success: false;
      error: string;
      data?: undefined;
      contractId?: undefined;
      folio?: undefined;
    };

/**
 * Registra un contrato formal en public.company_contracts
 */
export async function createContractAction(
  rawInput: CreateContractInput
): Promise<CreateContractActionResult> {
  const parsed = createContractSchema.safeParse(rawInput);
  if (!parsed.success) {
    const errorMsg =
      parsed.error.issues[0]?.message || "Datos de contrato inválidos.";
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
    const result = await CompanyContractService.createContract(
      supabase,
      user.id,
      parsed.data
    );

    revalidatePath("/dashboard/company/contracts");
    revalidatePath("/dashboard/company");

    return {
      success: true,
      data: result,
      contractId: result.contractId,
      folio: result.folio,
    };
  } catch (err: unknown) {
    const message =
      err instanceof Error
        ? err.message
        : "No se pudo registrar el contrato en la base de datos.";
    return { success: false, error: message };
  }
}

/**
 * Renueva un contrato existente o lo convierte a tiempo indeterminado.
 */
export async function renewContractAction(
  rawInput: RenewContractInput
): Promise<ActionResponse<void>> {
  const parsed = renewContractSchema.safeParse(rawInput);
  if (!parsed.success) {
    const errorMsg =
      parsed.error.issues[0]?.message || "Datos de renovación inválidos.";
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
    await CompanyContractService.renewContract(supabase, user.id, parsed.data);

    revalidatePath("/dashboard/company/contracts");
    revalidatePath("/dashboard/company");

    return { success: true };
  } catch (err: unknown) {
    const message =
      err instanceof Error
        ? err.message
        : "No se pudo renovar el contrato en la base de datos.";
    return { success: false, error: message };
  }
}

/**
 * Registra la firma digital de la empresa o trabajador en el contrato.
 */
export async function signContractAction(
  rawInput: SignContractInput
): Promise<ActionResponse<void>> {
  const parsed = signContractSchema.safeParse(rawInput);
  if (!parsed.success) {
    const errorMsg =
      parsed.error.issues[0]?.message || "Datos de firma digital inválidos.";
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
    await CompanyContractService.signContract(supabase, user.id, parsed.data);

    revalidatePath("/dashboard/company/contracts");
    revalidatePath("/dashboard/company");

    return { success: true };
  } catch (err: unknown) {
    const message =
      err instanceof Error
        ? err.message
        : "No se pudo registrar la firma digital en el contrato.";
    return { success: false, error: message };
  }
}

/**
 * Elimina un contrato laboral perteneciente a la empresa.
 */
export async function deleteContractAction(
  contractId: string
): Promise<ActionResponse<void>> {
  const parsed = deleteContractSchema.safeParse({ contractId });
  if (!parsed.success) {
    const errorMsg =
      parsed.error.issues[0]?.message || "Identificador de contrato inválido.";
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
    await CompanyContractService.deleteContract(
      supabase,
      user.id,
      parsed.data.contractId
    );

    revalidatePath("/dashboard/company/contracts");
    revalidatePath("/dashboard/company");

    return { success: true };
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "No se pudo eliminar el contrato.";
    return { success: false, error: message };
  }
}
