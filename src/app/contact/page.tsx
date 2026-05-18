import * as React from "react"
import { ContactForm } from "@/modules/contact/components/contact-form"

export default function ContactPage() {
  return (
    <main className="flex flex-col min-h-screen w-full items-center justify-center bg-background font-sans p-6 md:p-12 transition-colors duration-300">
      <ContactForm />
    </main>
  )
}
