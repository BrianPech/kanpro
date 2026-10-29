import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";
import type { ContactFormValues } from "../schemas/contact.schema";

export class ContactService {
  /**
   * Registra un nuevo ticket de soporte / mensaje de contacto usando el cliente inyectado.
   */
  static async submitMessage(
    adminClient: SupabaseClient<Database>,
    data: ContactFormValues,
    userId: string | null = null
  ): Promise<{ ticketNumber: string }> {
    const ticketNumber = `TICK-${Date.now().toString().slice(-6)}`;
    const subject =
      data.subject && data.subject.trim().length > 0
        ? data.subject.trim()
        : `Contacto de ${data.name.trim()}`;

    const description = `Nombre: ${data.name.trim()}\nEmail: ${data.email.trim()}\n\nMensaje:\n${data.message.trim()}`;

    const { error } = await adminClient.from("support_tickets").insert({
      ticket_number: ticketNumber,
      user_id: userId,
      subject,
      description,
      category: "general",
      priority: "media",
      status: "abierto",
    });

    if (error) {
      console.error("[ContactService] Error inserting support ticket:", error);
      throw new Error(`No se pudo registrar el mensaje de contacto: ${error.message}`);
    }

    return { ticketNumber };
  }
}

export const contactService = {
  async sendMessage(data: ContactFormValues) {
    // Para retrocompatibilidad con llamadas existentes
    const { createAdminClient } = await import("@/lib/supabase/admin");
    const admin = createAdminClient();
    return ContactService.submitMessage(admin, data);
  },
};
