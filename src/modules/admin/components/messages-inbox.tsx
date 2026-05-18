"use client"

import * as React from "react"
import { Search, Mail, MailOpen, Trash2, ChevronRight, Inbox, MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Message {
  id: string
  name: string
  email: string
  subject: string | null
  message: string
  is_read: boolean
  created_at: string
}

export function MessagesInbox() {
  const [messages, setMessages] = React.useState<Message[]>([])
  const [searchQuery, setSearchQuery] = React.useState("")
  const [selectedMessage, setSelectedMessage] = React.useState<Message | null>(null)

  React.useEffect(() => {
    import("../data/mock").then((mod) => setMessages(mod.contactMessages as Message[]))
  }, [])

  const filtered = messages.filter(
    (m) =>
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.subject && m.subject.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const unreadCount = messages.filter((m) => !m.is_read).length

  const toggleRead = (id: string) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, is_read: !m.is_read } : m))
    )
    if (selectedMessage?.id === id) {
      setSelectedMessage((prev) => prev ? { ...prev, is_read: !prev.is_read } : null)
    }
  }

  const deleteMessage = (id: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== id))
    if (selectedMessage?.id === id) {
      setSelectedMessage(null)
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (days === 0) {
      return date.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })
    }
    if (days === 1) return "Ayer"
    if (days < 7) return `hace ${days} días`
    return date.toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" })
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-muted-foreground bg-muted/50 rounded-full h-11 px-5 max-w-[320px] w-full border border-border/50">
          <Search className="w-4 h-4 flex-shrink-0" />
          <input
            placeholder="Buscar mensajes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent text-[14px] text-foreground placeholder:text-muted-foreground w-full h-full focus:outline-none"
          />
        </div>
        <span className="text-[13px] text-muted-foreground">
          {unreadCount > 0 ? `${unreadCount} no leídos` : "Todos leídos"}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border/50 rounded-[24px] overflow-hidden shadow-sm max-h-[600px] flex flex-col">
          <div className="px-8 pt-8 pb-4 flex items-center justify-between border-b border-border/30">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-[#007bc2]/10 text-[#007bc2] flex items-center justify-center">
                <Inbox className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-[18px] font-semibold text-foreground tracking-tight">Bandeja de Entrada</h3>
                <p className="text-[12px] text-muted-foreground">{messages.length} mensajes</p>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center px-6">
                <MessageSquare className="h-10 w-10 text-muted-foreground/30 mb-4" />
                <p className="text-[16px] text-muted-foreground">No hay mensajes</p>
                <p className="text-[14px] text-muted-foreground/60 mt-1">
                  {searchQuery ? "Intenta con otros términos" : "Los mensajes aparecerán aquí"}
                </p>
              </div>
            ) : (
              filtered.map((msg) => (
                <button
                  key={msg.id}
                  onClick={() => setSelectedMessage(msg)}
                  className={`w-full text-left px-8 py-5 flex items-start gap-4 transition-colors hover:bg-muted/20 border-b border-border/30 ${
                    selectedMessage?.id === msg.id ? "bg-muted/30" : ""
                  }`}
                >
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                    msg.is_read
                      ? "bg-muted text-muted-foreground"
                      : "bg-[#007bc2]/10 text-[#007bc2]"
                  }`}>
                    {msg.is_read ? <MailOpen className="h-5 w-5" /> : <Mail className="h-5 w-5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-[14px] ${msg.is_read ? "text-muted-foreground" : "text-foreground font-semibold"}`}>
                        {msg.name}
                      </span>
                      <span className="text-[11px] text-muted-foreground/60 whitespace-nowrap">
                        {formatDate(msg.created_at)}
                      </span>
                    </div>
                    <p className={`text-[13px] mt-0.5 truncate ${msg.is_read ? "text-muted-foreground/70" : "text-foreground font-medium"}`}>
                      {msg.subject || "Sin asunto"}
                    </p>
                    <p className="text-[12px] text-muted-foreground/60 mt-0.5 truncate">
                      {msg.message.substring(0, 80)}...
                    </p>
                  </div>
                  <ChevronRight className={`h-4 w-4 flex-shrink-0 mt-2 ${selectedMessage?.id === msg.id ? "text-foreground" : "text-muted-foreground/40"}`} />
                </button>
              ))
            )}
          </div>
        </div>

        <div className="bg-card border border-border/50 rounded-[24px] overflow-hidden shadow-sm max-h-[600px] flex flex-col">
          {selectedMessage ? (
            <>
              <div className="px-8 pt-8 pb-4 flex items-center justify-between border-b border-border/30">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#007bc2] to-[#007bc2]/60 flex items-center justify-center text-white text-[14px] font-bold">
                    {selectedMessage.name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-[18px] font-semibold text-foreground tracking-tight">{selectedMessage.name}</h3>
                    <p className="text-[13px] text-muted-foreground">{selectedMessage.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => toggleRead(selectedMessage.id)}
                    className="h-9 w-9 rounded-full text-muted-foreground hover:text-foreground"
                    title={selectedMessage.is_read ? "Marcar como no leído" : "Marcar como leído"}
                  >
                    {selectedMessage.is_read ? <Mail className="h-4 w-4" /> : <MailOpen className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteMessage(selectedMessage.id)}
                    className="h-9 w-9 rounded-full text-muted-foreground hover:text-destructive"
                    title="Eliminar mensaje"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-8">
                <div className="flex items-center gap-2 mb-6">
                  {selectedMessage.subject && (
                    <span className="text-[20px] font-semibold text-foreground tracking-tight">
                      {selectedMessage.subject}
                    </span>
                  )}
                  <span className="text-[13px] text-muted-foreground/60 ml-auto">
                    {new Date(selectedMessage.created_at).toLocaleDateString("es-ES", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <p className="text-[15px] text-foreground/90 leading-relaxed whitespace-pre-wrap">
                  {selectedMessage.message}
                </p>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full py-16 text-center px-6">
              <div className="h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center mb-6">
                <MessageSquare className="h-8 w-8 text-muted-foreground/40" />
              </div>
              <p className="text-[18px] text-muted-foreground font-medium">Selecciona un mensaje</p>
              <p className="text-[14px] text-muted-foreground/60 mt-1 max-w-[280px]">
                Elige un mensaje de la bandeja de entrada para ver su contenido
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
