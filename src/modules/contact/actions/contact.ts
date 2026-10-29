"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  contactFormSchema,
  type ContactFormValues,
} from "../schemas/contact.schema";
import { ContactService } from "../services/contact-service";

export type SubmitContactActionResult =
  | { success: true; ticketNumber: string; error?: undefined }
  | { success: false; error: string; ticketNumber?: undefined };

/**
 * Server Action: Procesa y persiste mensajes de contacto anónimos o autenticados.
 * Utiliza el cliente administrativo para asegurar la persistencia incluso sin sesión activa.
 */
export async function submitContactMessageAction(
  rawInput: ContactFormValues
): Promise<SubmitContactActionResult> {
  const parsed = contactFormSchema.safeParse(rawInput);
  if (!parsed.success) {
    const errorMsg =
      parsed.error.issues[0]?.message || "Datos del formulario de contacto inválidos.";
    return { success: false, error: errorMsg };
  }

  try {
    let userId: string | null = null;
    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        userId = user.id;
      }
    } catch {
      // Sesión anónima permitida para el formulario de contacto público
    }

    const adminClient = createAdminClient();
    const { ticketNumber } = await ContactService.submitMessage(
      adminClient,
      parsed.data,
      userId
    );

    return { success: true, ticketNumber };
  } catch (err: unknown) {
    const message =
      err instanceof Error
        ? err.message
        : "Error inesperado al enviar el mensaje de contacto.";
    return { success: false, error: message };
  }
}
