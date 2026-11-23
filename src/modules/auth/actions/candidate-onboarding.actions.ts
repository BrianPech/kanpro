"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  candidateAddressSchema,
  candidatePersonalReviewSchema,
  type CandidateAddressValues,
  type ExtractedIneData,
} from "../schemas/candidate-onboarding.schema";
import {
  processCandidateIneCapture,
  saveCandidateAddress,
  saveCandidatePersonalReview,
} from "../services/candidate-ine.service";

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export async function processCandidateIneAction(
  formData: FormData
): Promise<
  ActionResult<{
    frontPath: string;
    backPath: string | null;
    documentId: string;
    extracted: ExtractedIneData;
  }>
> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        error: "Debes iniciar sesión para procesar tu INE.",
      };
    }

    const frontFile = formData.get("front");
    const backFile = formData.get("back");
    const rawQrData = formData.get("qrData");

    if (!(frontFile instanceof File) || frontFile.size === 0) {
      return {
        success: false,
        error: "Adjunta la fotografía del frente de tu INE.",
      };
    }

    const frontBytes = new Uint8Array(await frontFile.arrayBuffer());
    let backPayload: {
      bytes: Uint8Array;
      mimeType: string;
      fileName: string;
    } | null = null;

    if (backFile instanceof File && backFile.size > 0) {
      backPayload = {
        bytes: new Uint8Array(await backFile.arrayBuffer()),
        mimeType: backFile.type || "image/jpeg",
        fileName: backFile.name || "ine_back.jpg",
      };
    }

    const result = await processCandidateIneCapture(supabase, user.id, {
      front: {
        bytes: frontBytes,
        mimeType: frontFile.type || "image/jpeg",
        fileName: frontFile.name || "ine_front.jpg",
      },
      back: backPayload,
      qrData: typeof rawQrData === "string" ? rawQrData : null,
    });

    revalidatePath("/register/candidate/review");
    revalidatePath("/register/candidate/address");
    revalidatePath("/dashboard/candidate");

    return { success: true, data: result };
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : "No se pudo procesar tu INE. Inténtalo de nuevo.";
    return { success: false, error: message };
  }
}

export async function saveCandidatePersonalReviewAction(
  input: unknown
): Promise<
  ActionResult<{ fullName: string; birthDate: string; whatsappNumber: string }>
> {
  const parsed = candidatePersonalReviewSchema.safeParse(input);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0]?.message;
    return {
      success: false,
      error: firstIssue || "Revisa los datos ingresados.",
    };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        error: "Tu sesión expiró. Inicia sesión para continuar.",
      };
    }

    const saved = await saveCandidatePersonalReview(
      supabase,
      user.id,
      parsed.data
    );

    revalidatePath("/register/candidate/review");
    revalidatePath("/dashboard/candidate");

    return { success: true, data: saved };
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : "No se pudieron guardar tus datos personales.";
    return { success: false, error: message };
  }
}

export async function saveCandidateAddressAction(
  input: unknown
): Promise<ActionResult<CandidateAddressValues>> {
  const parsed = candidateAddressSchema.safeParse(input);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0]?.message;
    return {
      success: false,
      error: firstIssue || "Revisa los campos de tu dirección.",
    };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        error: "Tu sesión expiró. Inicia sesión para continuar.",
      };
    }

    const saved = await saveCandidateAddress(supabase, user.id, parsed.data);

    revalidatePath("/register/candidate/address");
    revalidatePath("/dashboard/candidate");

    return { success: true, data: saved };
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : "No se pudo guardar tu dirección.";
    return { success: false, error: message };
  }
}
