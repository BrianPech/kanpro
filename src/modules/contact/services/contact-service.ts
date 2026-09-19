import { createClient } from "@/lib/supabase/client"
import { type ContactFormValues } from "../schemas/contact.schema"

export const contactService = {
  async sendMessage(data: ContactFormValues) {
    const supabase = createClient()
    const ticketNumber = `TICK-${Date.now().toString().slice(-6)}`
    const { data: { user } } = await supabase.auth.getUser()

    const { error } = await supabase.from("support_tickets").insert({
      ticket_number: ticketNumber,
      user_id: user?.id || null,
      subject: data.subject || `Contacto de ${data.name}`,
      description: `Nombre: ${data.name}\nEmail: ${data.email}\n\nMensaje:\n${data.message}`,
      category: "general",
      priority: "media",
      status: "abierto",
    })

    if (error) {
      console.error("[contactService] Error sending message:", error)
      throw error
    }
  },
}
