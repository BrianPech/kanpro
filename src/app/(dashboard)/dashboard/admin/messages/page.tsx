import * as React from "react"
import { MessageSquare } from "lucide-react"
import { MessagesInbox } from "@/modules/admin/components/messages-inbox"

export default function AdminMessagesPage() {
  return (
    <div className="flex flex-col gap-10 p-6 md:p-12 lg:p-16 max-w-[1400px] mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-[#007bc2]/10 text-[#007bc2] flex items-center justify-center">
            <MessageSquare className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-[28px] md:text-[36px] font-medium tracking-tighter leading-[1.0]">
              Mensajes
            </h1>
            <p className="text-[15px] text-muted-foreground mt-1">
              Bandeja de entrada de mensajes enviados por los usuarios
            </p>
          </div>
        </div>
      </div>

      <MessagesInbox />
    </div>
  )
}
