"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CATEGORY_LABELS,
  PRIORITY_CONFIG,
  STATUS_CONFIG,
  type SupportTicketItem,
  type SupportTicketMessage,
  type TicketStatus,
  type TicketPriority,
} from "@/modules/admin/types/support";
import {
  getTicketMessages,
  addTicketMessage,
  updateTicketStatus,
  quickResetUserStatus,
  adjustCompanyCredits,
} from "@/app/(dashboard)/dashboard/admin/support/actions";
import {
  SendIcon,
  LockIcon,
  UserIcon,
  PhoneIcon,
  Building2Icon,
  CheckCircle2Icon,
  MessageSquareIcon,
  SparklesIcon,
  ExternalLinkIcon,
  UserCheckIcon,
  CoinsIcon,
  ClockIcon,
  ShieldCheckIcon,
} from "lucide-react";

interface TicketDetailModalProps {
  ticket: SupportTicketItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const QUICK_TEMPLATES = [
  {
    label: "Solicitud de Documento Legible",
    icon: "📄",
    text: "Estimado usuario, para proceder con la verificación de su expediente digital, le solicitamos adjuntar una versión más legible y completa de su identificación oficial (INE o Pasaporte). Quedamos atentos.",
  },
  {
    label: "Instrucciones de Restablecimiento de Acceso",
    icon: "🔐",
    text: "Hola. Para recuperar el acceso a su cuenta K’anPro, por favor diríjase a la pantalla de inicio de sesión y seleccione '¿Olvidó su contraseña?'. Recibirá un código seguro en su correo registrado.",
  },
  {
    label: "Acreditación de Créditos de Cortesía",
    icon: "🪙",
    text: "Estimado equipo corporativo, nos complace informarle que hemos acreditado exitosamente sus créditos de publicación en la plataforma. Ya puede proceder a publicar sus vacantes destacadas.",
  },
  {
    label: "Expediente Validado y Cuenta Activa",
    icon: "✅",
    text: "¡Buenas noticias! Su perfil y documentación han sido revisados y aprobados por nuestro equipo de verificación. Su cuenta K’anPro se encuentra 100% activa.",
  },
];

export function TicketDetailModal({ ticket, open, onOpenChange, onSuccess }: TicketDetailModalProps) {
  if (!ticket) return null;

  return (
    <TicketDetailModalContent
      key={ticket.id}
      ticket={ticket}
      open={open}
      onOpenChange={onOpenChange}
      onSuccess={onSuccess}
    />
  );
}

function TicketDetailModalContent({
  ticket,
  open,
  onOpenChange,
  onSuccess,
}: {
  ticket: SupportTicketItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}) {
  const [messages, setMessages] = React.useState<SupportTicketMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = React.useState(true);
  const [newMessage, setNewMessage] = React.useState("");
  const [isInternalNote, setIsInternalNote] = React.useState(false);
  const [sending, setSending] = React.useState(false);
  const [resolving, setResolving] = React.useState(false);

  const [status, setStatus] = React.useState<TicketStatus>(ticket.status);
  const [priority, setPriority] = React.useState<TicketPriority>(ticket.priority);
  const [updatingTicket, setUpdatingTicket] = React.useState(false);

  // Quick Action States
  const [isUserVerified, setIsUserVerified] = React.useState(true);
  const [updatingUserStatus, setUpdatingUserStatus] = React.useState(false);

  React.useEffect(() => {
    let isMounted = true;
    async function load() {
      setLoadingMessages(true);
      try {
        const list = await getTicketMessages(ticket.id);
        if (isMounted) setMessages(list);
      } catch (err: unknown) {
        toast.error((err as Error).message || "Error al cargar mensajes del ticket");
      } finally {
        if (isMounted) setLoadingMessages(false);
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, [ticket.id]);

  const handleStatusChange = async (newStatus: TicketStatus) => {
    setStatus(newStatus);
    setUpdatingTicket(true);
    try {
      await updateTicketStatus(ticket.id, newStatus, priority);
      toast.success(`Estado del ticket actualizado a ${STATUS_CONFIG[newStatus].label}`);
      onSuccess?.();
    } catch (err: unknown) {
      toast.error((err as Error).message || "Error al actualizar estado");
    } finally {
      setUpdatingTicket(false);
    }
  };

  const handlePriorityChange = async (newPriority: TicketPriority) => {
    setPriority(newPriority);
    setUpdatingTicket(true);
    try {
      await updateTicketStatus(ticket.id, status, newPriority);
      toast.success(`Prioridad actualizada a ${PRIORITY_CONFIG[newPriority].label}`);
      onSuccess?.();
    } catch (err: unknown) {
      toast.error((err as Error).message || "Error al actualizar prioridad");
    } finally {
      setUpdatingTicket(false);
    }
  };

  const handleSendReply = async (andResolve: boolean = false) => {
    if (!newMessage.trim()) return;

    if (andResolve) setResolving(true);
    else setSending(true);

    try {
      await addTicketMessage(ticket.id, newMessage, isInternalNote);
      
      if (andResolve && status !== "resuelto") {
        await updateTicketStatus(ticket.id, "resuelto", priority);
        setStatus("resuelto");
        toast.success("Respuesta enviada y ticket marcado como Resuelto");
      } else {
        toast.success(isInternalNote ? "Nota interna guardada" : "Respuesta enviada al usuario");
      }

      setNewMessage("");
      const updatedList = await getTicketMessages(ticket.id);
      setMessages(updatedList);
      onSuccess?.();
    } catch (err: unknown) {
      toast.error((err as Error).message || "Error al enviar mensaje");
    } finally {
      setSending(false);
      setResolving(false);
    }
  };

  const handleQuickVerify = async () => {
    if (!ticket.userId) return;
    setUpdatingUserStatus(true);
    try {
      await quickResetUserStatus(ticket.userId, !isUserVerified);
      setIsUserVerified(!isUserVerified);
      toast.success(!isUserVerified ? "Cuenta de usuario verificada" : "Verificación revocada");
    } catch (err: unknown) {
      toast.error((err as Error).message || "Error al actualizar cuenta.");
    } finally {
      setUpdatingUserStatus(false);
    }
  };

  const formattedWhatsAppNumber = ticket.userPhone?.replace(/[^0-9]/g, "");
  const priorityInfo = PRIORITY_CONFIG[priority];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[92vh] p-0 gap-0 rounded-2xl overflow-hidden border border-border/40 shadow-2xl flex flex-col">
        {/* Top Sticky Header */}
        <DialogHeader className="px-6 py-4 border-b border-border/30 bg-card flex flex-row items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="font-mono text-xs font-bold bg-primary/10 text-primary border-primary/20 px-2.5 py-1">
              {ticket.ticketNumber}
            </Badge>
            <DialogTitle className="text-base font-bold tracking-tight text-foreground line-clamp-1">
              {ticket.subject}
            </DialogTitle>
          </div>

          <div className="flex items-center gap-3 pr-6">
            <Badge variant="outline" className={`px-2.5 py-0.5 text-xs ${priorityInfo.badgeClass}`}>
              Prioridad: {priorityInfo.label}
            </Badge>
            <div className="flex items-center gap-1.5">
              <Label className="text-xs font-semibold text-muted-foreground">Estado:</Label>
              <Select value={status} onValueChange={(val) => handleStatusChange(val as TicketStatus)} disabled={updatingTicket}>
                <SelectTrigger className="h-8 text-xs font-semibold w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="abierto" className="text-xs text-amber-600 font-semibold">Abierto</SelectItem>
                    <SelectItem value="en_proceso" className="text-xs text-purple-600 font-semibold">En Atención</SelectItem>
                    <SelectItem value="resuelto" className="text-xs text-green-600 font-semibold">Resuelto</SelectItem>
                    <SelectItem value="cerrado" className="text-xs text-muted-foreground font-medium">Cerrado</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>
        </DialogHeader>

        {/* 2-Column Split Workbench Layout */}
        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* Left Main Column: Conversation Thread & Response Suite (65% Width) */}
          <div className="flex flex-col flex-1 min-w-0 bg-muted/10 border-r border-border/30 overflow-y-auto">
            
            {/* Initial User Issue Box */}
            <div className="p-5 border-b border-border/20 bg-card/60 flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="font-semibold text-foreground flex items-center gap-1.5">
                  <MessageSquareIcon className="size-4 text-purple-500" />
                  Solicitud Original del Usuario:
                </span>
                <span className="text-[11px] font-medium flex items-center gap-1">
                  <ClockIcon className="size-3" />
                  {ticket.createdAt}
                </span>
              </div>
              <p className="text-xs text-foreground/90 leading-relaxed whitespace-pre-wrap bg-muted/30 p-3 rounded-xl border border-border/20">
                {ticket.description}
              </p>
            </div>

            {/* Chat Thread Messages Stream */}
            <div className="flex flex-col gap-4 p-5 flex-1 overflow-y-auto">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider text-[10px]">
                Historial de Conversación ({messages.length})
              </span>

              {loadingMessages ? (
                <div className="p-6 text-center text-xs text-muted-foreground">Cargando mensajes...</div>
              ) : messages.length === 0 ? (
                <div className="p-6 text-center text-xs text-muted-foreground border border-dashed rounded-xl">
                  Aún no se han registrado mensajes de respuesta en este ticket. Use el editor inferior para enviar la primera atención.
                </div>
              ) : (
                messages.map((m) => {
                  const isAgent = m.senderName.includes("Soporte") || m.senderName.includes("Admin");
                  
                  if (m.isInternalNote) {
                    return (
                      <div
                        key={m.id}
                        className="my-1 p-3 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-950 dark:text-amber-200 text-xs flex flex-col gap-1 shadow-xs"
                      >
                        <div className="flex items-center justify-between font-semibold text-[11px] text-amber-800 dark:text-amber-300">
                          <span className="flex items-center gap-1.5">
                            <LockIcon className="size-3.5 text-amber-600" />
                            Nota Interna de Equipo de Soporte — {m.senderName}
                          </span>
                          <span className="text-[10px] font-normal opacity-80">{m.createdAt}</span>
                        </div>
                        <p className="whitespace-pre-wrap leading-relaxed text-xs">{m.message}</p>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={m.id}
                      className={`flex gap-3 max-w-[85%] ${isAgent ? "ml-auto flex-row-reverse" : "mr-auto"}`}
                    >
                      <Avatar className="h-8 w-8 shrink-0 border mt-0.5">
                        <AvatarImage src={m.senderAvatar} />
                        <AvatarFallback className="bg-primary/10 text-primary font-bold text-[10px]">
                          {m.senderName?.substring(0, 2)?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col gap-1">
                        <div className={`flex items-center gap-2 text-[10px] ${isAgent ? "justify-end" : "justify-start"}`}>
                          <span className="font-semibold text-foreground">{m.senderName}</span>
                          <span className="text-muted-foreground">{m.createdAt}</span>
                        </div>
                        <div
                          className={`p-3 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap shadow-xs ${
                            isAgent
                              ? "bg-purple-600 text-white rounded-tr-xs"
                              : "bg-card border border-border/40 text-foreground rounded-tl-xs"
                          }`}
                        >
                          {m.message}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Response Suite Editor Box */}
            <div className="p-5 border-t border-border/30 bg-card flex flex-col gap-3 shrink-0">
              
              {/* Quick Canned Templates Bar */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground">
                  <SparklesIcon className="size-3.5 text-purple-500" />
                  <span>Plantillas de Respuesta Rápida:</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_TEMPLATES.map((tmpl, idx) => (
                    <Button
                      key={idx}
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-7 text-[11px] font-medium px-2.5 rounded-full border-border/40 hover:border-purple-500/40 hover:bg-purple-500/5 transition-colors gap-1 text-muted-foreground hover:text-foreground"
                      onClick={() => setNewMessage(tmpl.text)}
                    >
                      <span>{tmpl.icon}</span>
                      <span>{tmpl.label}</span>
                    </Button>
                  ))}
                </div>
              </div>

              {/* Mode Toggle Bar */}
              <div className="flex items-center justify-between pt-1">
                <Label htmlFor="reply-input" className="text-xs font-semibold text-foreground">
                  Escribir Atención al Usuario:
                </Label>
                <div className="flex items-center gap-2">
                  <Switch
                    id="internal-note-toggle"
                    checked={isInternalNote}
                    onCheckedChange={setIsInternalNote}
                  />
                  <Label
                    htmlFor="internal-note-toggle"
                    className="text-xs font-medium cursor-pointer flex items-center gap-1.5 text-amber-600 dark:text-amber-400"
                  >
                    <LockIcon className="size-3.5" />
                    Nota Interna (Privado)
                  </Label>
                </div>
              </div>

              {/* Textarea */}
              <Textarea
                id="reply-input"
                placeholder={
                  isInternalNote
                    ? "Escriba una observación interna para el equipo de soporte (No visible para el usuario)..."
                    : "Redacte la respuesta que recibirá el usuario en su portal..."
                }
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="text-xs min-h-[80px] rounded-xl focus-visible:ring-purple-500"
              />

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-muted-foreground">
                  {isInternalNote ? "🔒 Guardará como nota privada" : "📧 Envia la respuesta al usuario"}
                </span>

                <div className="flex items-center gap-2">
                  {!isInternalNote && status !== "resuelto" && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={sending || resolving || !newMessage.trim()}
                      onClick={() => handleSendReply(true)}
                      className="h-9 px-3.5 text-xs font-semibold border-green-500/30 text-green-600 dark:text-green-400 hover:bg-green-500/10 gap-1.5"
                    >
                      <CheckCircle2Icon className="size-4" />
                      {resolving ? "Resolviendo..." : "Enviar Respuesta y Resolver"}
                    </Button>
                  )}

                  <Button
                    type="button"
                    size="sm"
                    disabled={sending || resolving || !newMessage.trim()}
                    onClick={() => handleSendReply(false)}
                    className={`h-9 px-4 text-xs font-semibold gap-1.5 ${
                      isInternalNote
                        ? "bg-amber-600 hover:bg-amber-700 text-white"
                        : "bg-purple-600 hover:bg-purple-700 text-white"
                    }`}
                  >
                    <SendIcon className="size-3.5" />
                    {sending ? "Guardando..." : isInternalNote ? "Guardar Nota" : "Enviar Respuesta"}
                  </Button>
                </div>
              </div>
            </div>

          </div>

          {/* Right Sidebar Column: User Context & Quick Support Tools (35% Width) */}
          <div className="w-80 shrink-0 bg-card p-5 flex flex-col gap-5 overflow-y-auto border-l border-border/20">
            
            {/* User Profile Overview */}
            <div className="flex flex-col gap-3 rounded-xl border border-border/40 bg-muted/20 p-4">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                Perfil del Solicitante
              </span>

              <div className="flex items-center gap-3">
                <Avatar className="h-11 w-11 border border-primary/20 shrink-0">
                  <AvatarImage src={ticket.userAvatar} />
                  <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm">
                    {ticket.userName?.substring(0, 2)?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col min-w-0">
                  <span className="font-bold text-sm text-foreground truncate">{ticket.userName}</span>
                  <span className="text-xs text-muted-foreground truncate">{ticket.userEmail}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <Badge
                  variant="outline"
                  className={`px-2 py-0.5 text-xs font-semibold ${
                    ticket.userRole === "company"
                      ? "border-amber-500/30 bg-amber-500/10 text-amber-600"
                      : "border-blue-500/30 bg-blue-500/10 text-blue-600"
                  }`}
                >
                  {ticket.userRole === "company" ? <Building2Icon className="size-3 mr-1" /> : <UserIcon className="size-3 mr-1" />}
                  {ticket.userRole === "company" ? "Empresa" : "Candidato"}
                </Badge>

                {isUserVerified && (
                  <Badge variant="outline" className="border-green-500/30 bg-green-500/10 text-green-600 text-xs font-semibold gap-1">
                    <UserCheckIcon className="size-3" />
                    Verificado
                  </Badge>
                )}
              </div>

              {/* Direct WhatsApp Action Button */}
              {ticket.userPhone ? (
                <a
                  href={`https://wa.me/${formattedWhatsAppNumber}?text=${encodeURIComponent(`Hola ${ticket.userName}, le contactamos del Soporte Técnico de K'anPro con relación al ticket #${ticket.ticketNumber}: "${ticket.subject}".`)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 flex items-center justify-center gap-2 h-9 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors"
                >
                  <PhoneIcon className="size-3.5 fill-current" />
                  <span>Contactar por WhatsApp</span>
                  <ExternalLinkIcon className="size-3 opacity-80" />
                </a>
              ) : (
                <div className="text-[11px] text-muted-foreground flex items-center gap-1.5 pt-1">
                  <PhoneIcon className="size-3" /> Teléfono no registrado
                </div>
              )}
            </div>

            {/* Quick Actions Panel */}
            <div className="flex flex-col gap-3">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                Herramientas Exprés de Asistencia
              </span>

              {/* Quick Verify Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleQuickVerify}
                disabled={updatingUserStatus}
                className="h-9 justify-start text-xs font-semibold gap-2 border-border/40"
              >
                <ShieldCheckIcon className="size-4 text-blue-500" />
                <span>{isUserVerified ? "Revocar Verificación" : "Validar Cuenta del Usuario"}</span>
              </Button>

              {/* Adjust Credits if Company */}
              {ticket.userRole === "company" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    if (!ticket.userId) return;
                    try {
                      await adjustCompanyCredits(ticket.userId, 5);
                      toast.success("Se agregaron +5 créditos de publicación a la empresa");
                    } catch (err: unknown) {
                      toast.error((err as Error).message || "Error al acreditar.");
                    }
                  }}
                  className="h-9 justify-start text-xs font-semibold gap-2 border-amber-500/30 text-amber-700 dark:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20"
                >
                  <CoinsIcon className="size-4 text-amber-500" />
                  <span>Acreditar +5 Créditos de Cortesía</span>
                </Button>
              )}
            </div>

            {/* Ticket Management Controls */}
            <div className="flex flex-col gap-3 pt-2 border-t border-border/20">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                Control de Incidencia
              </span>

              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-semibold text-foreground">Cambiar Prioridad:</Label>
                <Select value={priority} onValueChange={(val) => handlePriorityChange(val as TicketPriority)}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="baja" className="text-xs">Baja</SelectItem>
                      <SelectItem value="media" className="text-xs">Media</SelectItem>
                      <SelectItem value="alta" className="text-xs text-amber-600 font-semibold">Alta</SelectItem>
                      <SelectItem value="urgente" className="text-xs text-red-600 font-bold">Urgente</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-semibold text-foreground">Categoría:</Label>
                <Badge variant="outline" className="px-2.5 py-1 text-xs font-medium text-muted-foreground w-fit">
                  {CATEGORY_LABELS[ticket.category]}
                </Badge>
              </div>
            </div>

          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
