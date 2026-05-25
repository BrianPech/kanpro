import * as React from "react"
import { MessageSquare } from "lucide-react"
import { MessagesInbox } from "@/modules/admin/components/messages-inbox"

export default function AdminMessagesPage() {
  return (
    <div className="flex flex-col gap-6 p-6 md:p-8 w-full max-w-[1600px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-[28px] md:text-[36px] font-bold tracking-tight text-foreground">
          Bandeja de Soporte
        </h1>
        <p className="text-[14px] text-muted-foreground">
          Supervisa consultas, valida requerimientos y asiste a los profesionales del ecosistema K'anPro.
        </p>
      </div>

      <MessagesInbox />
    </div>
  )
}
