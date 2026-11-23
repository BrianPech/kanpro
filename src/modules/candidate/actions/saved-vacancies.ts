"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const toggleSavedVacancySchema = z.object({
  vacancyId: z.string().uuid("ID de vacante inválido"),
});

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export async function toggleSavedVacancyAction(
  input: unknown
): Promise<ActionResult<{ saved: boolean; vacancyId: string }>> {
  const parsed = toggleSavedVacancySchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Vacante inválida.",
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
        error: "Inicia sesión para guardar vacantes.",
      };
    }

    const { vacancyId } = parsed.data;
    const { data: existing } = await supabase
      .from("saved_vacancies")
      .select("vacancy_id")
      .eq("candidate_id", user.id)
      .eq("vacancy_id", vacancyId)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase
        .from("saved_vacancies")
        .delete()
        .eq("candidate_id", user.id)
        .eq("vacancy_id", vacancyId);
      if (error) {
        return {
          success: false,
          error: "No se pudo quitar de guardados.",
        };
      }
      revalidatePath("/dashboard/candidate");
      revalidatePath("/dashboard/candidate/saved");
      return { success: true, data: { saved: false, vacancyId } };
    }

    const { error } = await supabase.from("saved_vacancies").insert({
      candidate_id: user.id,
      vacancy_id: vacancyId,
    });

    if (error) {
      return {
        success: false,
        error: "No se pudo guardar la vacante.",
      };
    }

    revalidatePath("/dashboard/candidate");
    revalidatePath("/dashboard/candidate/saved");
    return { success: true, data: { saved: true, vacancyId } };
  } catch (error: unknown) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "No se pudo actualizar tus vacantes guardadas.",
    };
  }
}
