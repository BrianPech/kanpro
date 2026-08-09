import { createClient } from "@/lib/supabase/client"
import { type ContactFormValues } from "../schemas/contact.schema"

export const contactService = {
  async sendMessage(data: ContactFormValues) {
    const supabase = createClient()

    const { error } = await (supabase.from as any)("contact_messages").insert({
      name: data.name,
      email: data.email,
      subject: data.subject || null,
      message: data.message,
    })

    if (error) throw error
  },
}
