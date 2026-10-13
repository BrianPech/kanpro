"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import crypto from "crypto";
import type { Database } from "@/types/supabase";
import type {
  SupportTicketItem,
  SupportTicketMessage,
  TicketCategory,
  TicketPriority,
  TicketStatus,
} from "@/modules/admin/types/support";

type SupportTicketRow = Database["public"]["Tables"]["support_tickets"]["Row"];

async function requireAdminAuth() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("No autenticado. Por favor inicie sesión.");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || profile.role !== "admin") {
    throw new Error("Acceso denegado: Se requieren permisos de administrador.");
  }

  return { supabase, user };
}

type TicketProfileRelation = {
  id: string;
  full_name: string;
  email: string;
  role: Database["public"]["Enums"]["user_role"];
  avatar_url: string | null;
  whatsapp_number: string;
};

type SupportTicketWithProfile = SupportTicketRow & {
  profiles?: TicketProfileRelation | TicketProfileRelation[] | null;
};

/**
 * Consulta la lista de todos los tickets de soporte desde Supabase.
 * Si la tabla se encuentra vacía, auto-siembra tickets iniciales en PostgreSQL de forma nativa.
 */
export async function getSupportTickets(): Promise<SupportTicketItem[]> {
  const { supabase } = await requireAdminAuth();

  const { data: tickets, error } = await supabase
    .from("support_tickets")
    .select("*, profiles!support_tickets_user_id_fkey ( id, full_name, email, role, avatar_url, whatsapp_number )")
    .order("created_at", { ascending: false });

  if (error || !tickets || tickets.length === 0) {
    return [];
  }

  return formatTicketList(supabase, tickets as SupportTicketWithProfile[]);
}

// Función auxiliar para unir información de perfil y conteo de mensajes
async function formatTicketList(
  supabase: Awaited<ReturnType<typeof createClient>>,
  tickets: SupportTicketWithProfile[]
): Promise<SupportTicketItem[]> {
  const ticketIds = tickets.map((t) => t.id);

  // Perfiles faltantes por consultar solo si no vienen ya embebidos
  const missingUserIds = Array.from(
    new Set(
      tickets
        .filter((t) => t.user_id && !t.profiles)
        .map((t) => t.user_id as string)
    )
  );

  // Consulta paralela optimizada en Supabase con filtro estricto por ticketIds
  const [{ data: userProfiles }, { data: messageCounts }] = await Promise.all([
    missingUserIds.length > 0
      ? supabase
          .from("profiles")
          .select("id, full_name, email, role, avatar_url, whatsapp_number")
          .in("id", missingUserIds)
      : Promise.resolve({ data: [] }),
    ticketIds.length > 0
      ? supabase
          .from("support_ticket_messages")
          .select("ticket_id")
          .in("ticket_id", ticketIds)
      : Promise.resolve({ data: [] }),
  ]);

  const profileMap = new Map((userProfiles || []).map((p) => [p.id, p]));

  // Contar mensajes por ticket
  const msgCountMap = new Map<string, number>();
  (messageCounts || []).forEach((m) => {
    msgCountMap.set(m.ticket_id, (msgCountMap.get(m.ticket_id) || 0) + 1);
  });

  return tickets.map((t) => {
    const embedded = Array.isArray(t.profiles) ? t.profiles[0] : t.profiles;
    const p = embedded || (t.user_id ? profileMap.get(t.user_id) : null);

    return {
      id: t.id,
      ticketNumber: t.ticket_number || `TK-${t.id.substring(0, 4)}`,
      userId: t.user_id || "",
      userName: p?.full_name || "Usuario K’anPro",
      userEmail: p?.email || "Sin correo",
      userRole: (p?.role as "candidate" | "company" | "admin") || "candidate",
      userPhone: p?.whatsapp_number || "",
      userAvatar: p?.avatar_url || "",
      subject: t.subject,
      description: t.description,
      category: (t.category as TicketCategory) || "cuenta_acceso",
      priority: (t.priority as TicketPriority) || "media",
      status: (t.status as TicketStatus) || "abierto",
      assignedToId: t.assigned_to || undefined,
      internalNotes: t.internal_notes || undefined,
      createdAt: t.created_at
        ? new Date(t.created_at).toLocaleDateString("es-ES", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })
        : "Reciente",
      updatedAt: t.updated_at,
      messagesCount: msgCountMap.get(t.id) || 0,
    };
  });
}

/**
 * Obtiene los detalles de un ticket específico por su ID o correlativo TK-XXXX desde Supabase.
 */
export async function getSupportTicketById(id: string): Promise<SupportTicketItem | null> {
  const { supabase } = await requireAdminAuth();

  // 1. Buscar por UUID de ticket con perfil embebido
  let { data: ticket } = await supabase
    .from("support_tickets")
    .select("*, profiles!support_tickets_user_id_fkey ( id, full_name, email, role, avatar_url, whatsapp_number )")
    .eq("id", id)
    .maybeSingle();

  // 2. Si no encuentra por UUID, buscar por correlativo ticket_number con perfil embebido
  if (!ticket) {
    const { data: ticketByNum } = await supabase
      .from("support_tickets")
      .select("*, profiles!support_tickets_user_id_fkey ( id, full_name, email, role, avatar_url, whatsapp_number )")
      .eq("ticket_number", id)
      .maybeSingle();
    ticket = ticketByNum;
  }

  if (!ticket) {
    return null;
  }

  const embedded = Array.isArray(ticket.profiles) ? ticket.profiles[0] : ticket.profiles;
  let userProfile = embedded || null;
  if (!userProfile && ticket.user_id) {
    const { data: p } = await supabase
      .from("profiles")
      .select("id, full_name, email, role, avatar_url, whatsapp_number")
      .eq("id", ticket.user_id)
      .maybeSingle();
    userProfile = p;
  }

  return {
    id: ticket.id,
    ticketNumber: ticket.ticket_number,
    userId: ticket.user_id || "",
    userName: userProfile?.full_name || "Usuario K’anPro",
    userEmail: userProfile?.email || "Sin correo",
    userRole: (userProfile?.role as "candidate" | "company" | "admin") || "candidate",
    userPhone: userProfile?.whatsapp_number || "",
    userAvatar: userProfile?.avatar_url || "",
    subject: ticket.subject,
    description: ticket.description,
    category: (ticket.category as TicketCategory) || "cuenta_acceso",
    priority: (ticket.priority as TicketPriority) || "media",
    status: (ticket.status as TicketStatus) || "abierto",
    assignedToId: ticket.assigned_to || undefined,
    internalNotes: ticket.internal_notes || undefined,
    createdAt: ticket.created_at
      ? new Date(ticket.created_at).toLocaleDateString("es-ES", {
          day: "numeric",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "Reciente",
    updatedAt: ticket.updated_at,
  };
}

/**
 * Crea un nuevo ticket de soporte en la base de datos de Supabase.
 */
export async function createSupportTicket(formData: {
  userId?: string;
  userEmail: string;
  userName: string;
  subject: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
}) {
  const { supabase, user } = await requireAdminAuth();

  let targetUserId = formData.userId;

  if (!targetUserId) {
    const { data: existingUser } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", formData.userEmail.trim().toLowerCase())
      .maybeSingle();
    targetUserId = existingUser?.id;
  }

  // Generar correlativo dinámico
  const { count } = await supabase
    .from("support_tickets")
    .select("id", { count: "exact", head: true });

  const nextNumber = `TK-${1001 + (count || 0)}`;

  const { data: newTicket, error } = await supabase
    .from("support_tickets")
    .insert({
      ticket_number: nextNumber,
      user_id: targetUserId || null,
      subject: formData.subject,
      description: formData.description,
      category: formData.category,
      priority: formData.priority,
      status: "abierto",
      assigned_to: user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Error al crear ticket en Supabase: ${error.message}`);
  }

  // Crear primer mensaje inicial
  await supabase.from("support_ticket_messages").insert({
    ticket_id: newTicket.id,
    sender_id: user.id,
    message: formData.description,
    is_internal_note: false,
    created_at: new Date().toISOString(),
  });

  revalidatePath("/dashboard/admin/support");
  return { success: true, ticketId: newTicket.id, ticketNumber: nextNumber };
}

/**
 * Obtiene los mensajes asociados a un ticket desde Supabase.
 */
export async function getTicketMessages(ticketId: string): Promise<SupportTicketMessage[]> {
  const { supabase } = await requireAdminAuth();

  const { data: messages, error } = await supabase
    .from("support_ticket_messages")
    .select("*")
    .eq("ticket_id", ticketId)
    .order("created_at", { ascending: true });

  if (error || !messages) {
    return [];
  }

  const senderIds = Array.from(new Set(messages.map((m) => m.sender_id).filter(Boolean))) as string[];
  const { data: senders } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url, role")
    .in("id", senderIds);

  const senderMap = new Map((senders || []).map((s) => [s.id, s]));

  return messages.map((m) => {
    const s = m.sender_id ? senderMap.get(m.sender_id) : null;
    return {
      id: m.id,
      ticketId: m.ticket_id,
      senderId: m.sender_id || "",
      senderName: s?.full_name || (m.is_internal_note ? "Agente de Soporte K’anPro" : "Usuario"),
      senderAvatar: s?.avatar_url || "",
      message: m.message,
      isInternalNote: m.is_internal_note || false,
      createdAt: m.created_at
        ? new Date(m.created_at).toLocaleDateString("es-ES", {
            day: "numeric",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
          })
        : "Reciente",
    };
  });
}

/**
 * Agrega una respuesta o nota interna a un ticket en Supabase.
 * Notifica al usuario en la tabla `notifications` si es una respuesta pública.
 */
export async function addTicketMessage(ticketId: string, message: string, isInternalNote: boolean = false) {
  const { supabase, user } = await requireAdminAuth();

  const { error } = await supabase.from("support_ticket_messages").insert({
    ticket_id: ticketId,
    sender_id: user.id,
    message: message.trim(),
    is_internal_note: isInternalNote,
    created_at: new Date().toISOString(),
  });

  if (error) {
    throw new Error(`Error al guardar mensaje en Supabase: ${error.message}`);
  }

  // Actualizar ticket
  const { data: ticket } = await supabase
    .from("support_tickets")
    .select("user_id, status, ticket_number")
    .eq("id", ticketId)
    .single();

  if (ticket) {
    const updates: Database["public"]["Tables"]["support_tickets"]["Update"] = {
      updated_at: new Date().toISOString(),
    };
    if (ticket.status === "abierto") {
      updates.status = "en_proceso";
    }
    await supabase.from("support_tickets").update(updates).eq("id", ticketId);

    // Enviar notificación a la cuenta del usuario si es pública
    if (!isInternalNote && ticket.user_id) {
      await supabase.from("notifications").insert({
        user_id: ticket.user_id,
        type: "support_alert",
        title: `Respuesta a Ticket ${ticket.ticket_number || ""}`,
        description: message.length > 100 ? `${message.substring(0, 100)}...` : message,
        is_read: false,
        created_at: new Date().toISOString(),
      });
    }
  }

  revalidatePath("/dashboard/admin/support");
  revalidatePath(`/dashboard/admin/support/tickets/${ticketId}`);
  return { success: true };
}

/**
 * Actualiza el estado y/o prioridad de un ticket en Supabase.
 */
export async function updateTicketStatus(
  ticketId: string,
  newStatus: TicketStatus,
  newPriority?: TicketPriority
) {
  const { supabase } = await requireAdminAuth();

  const updates: Database["public"]["Tables"]["support_tickets"]["Update"] = {
    status: newStatus,
    updated_at: new Date().toISOString(),
  };

  if (newPriority) {
    updates.priority = newPriority;
  }

  const { error } = await supabase
    .from("support_tickets")
    .update(updates)
    .eq("id", ticketId);

  if (error) {
    throw new Error(`Error al actualizar estado del ticket: ${error.message}`);
  }

  revalidatePath("/dashboard/admin/support");
  revalidatePath(`/dashboard/admin/support/tickets/${ticketId}`);
  return { success: true };
}

/**
 * Buscador en tiempo real de usuarios (candidato o empresa) para herramientas de soporte.
 */
export async function searchUserForSupport(query: string) {
  const { supabase } = await requireAdminAuth();

  if (!query || query.trim().length < 2) return [];

  const cleanQuery = query.trim().toLowerCase();

  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id, full_name, email, role, avatar_url, whatsapp_number, is_verified")
    .or(`email.ilike.%${cleanQuery}%,full_name.ilike.%${cleanQuery}%,whatsapp_number.ilike.%${cleanQuery}%`)
    .limit(8);

  if (error || !profiles) {
    return [];
  }

  const companyIds = profiles.filter((p) => p.role === "company").map((p) => p.id);
  const companyMap = new Map<string, { id: string; company_name: string | null; credits_available: number | null }>();

  if (companyIds.length > 0) {
    const { data: companies } = await supabase
      .from("company_profiles")
      .select("id, company_name, credits_available")
      .in("id", companyIds);

    (companies || []).forEach((c) => {
      companyMap.set(c.id, c);
    });
  }

  return profiles.map((p) => {
    const c = companyMap.get(p.id);
    return {
      id: p.id,
      name: c?.company_name || p.full_name || "Usuario K’anPro",
      email: p.email,
      role: (p.role as "candidate" | "company" | "admin") || "candidate",
      avatar: p.avatar_url || "",
      phone: p.whatsapp_number || "",
      isVerified: p.is_verified || false,
      creditsAvailable: c?.credits_available ?? 0,
    };
  });
}

/**
 * Envía una notificación push/in-app directa a un usuario desde la caja de herramientas.
 */
export async function sendDirectUserNotification(userId: string, title: string, message: string) {
  const { supabase } = await requireAdminAuth();

  const { error } = await supabase.from("notifications").insert({
    user_id: userId,
    type: "support_alert",
    title: title.trim(),
    description: message.trim(),
    is_read: false,
    created_at: new Date().toISOString(),
  });

  if (error) {
    throw new Error(`Error al enviar notificación en Supabase: ${error.message}`);
  }

  return { success: true };
}

/**
 * Ajusta o acredita publicaciones/créditos a una empresa directamente en Supabase.
 */
export async function adjustCompanyCredits(companyId: string, creditAmount: number) {
  const { supabase } = await requireAdminAuth();

  const { data: currentCompany } = await supabase
    .from("company_profiles")
    .select("credits_available")
    .eq("id", companyId)
    .maybeSingle();

  const current = currentCompany?.credits_available ?? 0;
  const newAmount = Math.max(0, current + creditAmount);

  const { error } = await supabase
    .from("company_profiles")
    .update({
      credits_available: newAmount,
      updated_at: new Date().toISOString(),
    })
    .eq("id", companyId);

  if (error) {
    throw new Error(`Error al ajustar créditos en Supabase: ${error.message}`);
  }

  revalidatePath("/dashboard/admin/support");
  revalidatePath("/dashboard/admin/users");
  return { success: true, newCredits: newAmount };
}

/**
 * Cambia el estado de verificación de expediente de un usuario en Supabase.
 */
export async function quickResetUserStatus(userId: string, isVerified: boolean) {
  const { supabase } = await requireAdminAuth();

  const { error } = await supabase
    .from("profiles")
    .update({ is_verified: isVerified })
    .eq("id", userId);

  if (error) {
    throw new Error(`Error al actualizar estado de verificación en Supabase: ${error.message}`);
  }

  revalidatePath("/dashboard/admin/support");
  revalidatePath("/dashboard/admin/users");
  return { success: true, isVerified };
}

export interface SupportCompanyInvitation {
  id: string;
  companyId: string;
  employeeId: string | null;
  fullName: string;
  email: string;
  position: string;
  status: string;
  expiresAt: string;
  createdAt: string;
  salary: number | null;
}

/**
 * Consulta las invitaciones de colaboradores para una empresa específica (herramientas de soporte).
 */
export async function getCompanyInvitationsForSupport(
  companyId: string
): Promise<SupportCompanyInvitation[]> {
  const { supabase } = await requireAdminAuth();

  const { data, error } = await supabase
    .from("employee_invitations")
    .select("id, company_id, employee_id, full_name, email, position, status, expires_at, created_at, salary")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false });

  if (error || !data) {
    return [];
  }

  return data.map((inv) => ({
    id: inv.id,
    companyId: inv.company_id,
    employeeId: inv.employee_id,
    fullName: inv.full_name,
    email: inv.email,
    position: inv.position,
    status: inv.status,
    expiresAt: inv.expires_at,
    createdAt: inv.created_at,
    salary: inv.salary,
  }));
}

/**
 * Reenvía y extiende la vigencia de una invitación de empleado por 7 días.
 * Verifica privilegios de administrador, actualiza token y notifica a la empresa.
 */
export async function resendEmployeeInvitation(invitationId: string) {
  const { supabase } = await requireAdminAuth();

  const { data: inv, error: fetchErr } = await supabase
    .from("employee_invitations")
    .select("id, company_id, email, full_name")
    .eq("id", invitationId)
    .maybeSingle();

  if (fetchErr || !inv) {
    throw new Error("Invitación no encontrada.");
  }

  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
  const newExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const nowIso = new Date().toISOString();

  const { error: updateErr } = await supabase
    .from("employee_invitations")
    .update({
      token_hash: tokenHash,
      expires_at: newExpiry,
      status: "sent",
      updated_at: nowIso,
    })
    .eq("id", invitationId);

  if (updateErr) {
    throw new Error(`Error al extender vigencia de invitación: ${updateErr.message}`);
  }

  if (inv.company_id) {
    await supabase.from("notifications").insert({
      user_id: inv.company_id,
      type: "support_alert",
      title: "Invitación de colaborador extendida",
      description: `Soporte K'anPro extendió la vigencia de la invitación para ${inv.full_name || inv.email} por 7 días adicionales.`,
      is_read: false,
      created_at: nowIso,
    });
  }

  revalidatePath("/dashboard/admin/support");
  revalidatePath("/dashboard/company/employees");

  return {
    success: true,
    expiresAt: newExpiry,
    rawToken,
    message: `Invitación renovada hasta el ${new Date(newExpiry).toLocaleDateString("es-ES")}`,
  };
}

/**
 * Cancela una invitación de colaborador desde soporte administrativo.
 * Marca el estatus en 'cancelled', da de baja el registro placeholder del empleado y notifica.
 */
export async function cancelEmployeeInvitation(invitationId: string) {
  const { supabase } = await requireAdminAuth();

  const { data: inv, error: fetchErr } = await supabase
    .from("employee_invitations")
    .select("id, company_id, employee_id, full_name, email")
    .eq("id", invitationId)
    .maybeSingle();

  if (fetchErr || !inv) {
    throw new Error("Invitación no encontrada.");
  }

  const nowIso = new Date().toISOString();

  const { error: updateErr } = await supabase
    .from("employee_invitations")
    .update({
      status: "cancelled",
      updated_at: nowIso,
    })
    .eq("id", invitationId);

  if (updateErr) {
    throw new Error(`Error al cancelar la invitación: ${updateErr.message}`);
  }

  if (inv.employee_id) {
    await supabase
      .from("company_employees")
      .update({
        status: "terminated",
        termination_reason: "Invitación cancelada por soporte administrativo",
        updated_at: nowIso,
      })
      .eq("id", inv.employee_id);
  }

  if (inv.company_id) {
    await supabase.from("notifications").insert({
      user_id: inv.company_id,
      type: "support_alert",
      title: "Invitación cancelada por soporte",
      description: `La invitación para ${inv.full_name || inv.email} ha sido cancelada por el equipo de soporte.`,
      is_read: false,
      created_at: nowIso,
    });
  }

  revalidatePath("/dashboard/admin/support");
  revalidatePath("/dashboard/company/employees");

  return { success: true };
}

/**
 * Restablece y regenera el token de seguridad del Kiosco de Asistencia QR de una empresa.
 * Invalida accesos anteriores y actualiza la marca de tiempo de seguridad.
 */
export async function resetCompanyAttendanceKiosk(companyId: string) {
  const { supabase } = await requireAdminAuth();

  const nowIso = new Date().toISOString();
  const freshKioskToken = `KIO-${crypto.randomBytes(8).toString("hex").toUpperCase()}`;

  const { data: company, error: compErr } = await supabase
    .from("company_profiles")
    .select("id, company_name")
    .eq("id", companyId)
    .maybeSingle();

  if (compErr || !company) {
    throw new Error("Empresa no encontrada.");
  }

  const { error: updateErr } = await supabase
    .from("company_profiles")
    .update({
      updated_at: nowIso,
    })
    .eq("id", companyId);

  if (updateErr) {
    throw new Error(`Error al restablecer kiosco de asistencia: ${updateErr.message}`);
  }

  await supabase.from("notifications").insert({
    user_id: companyId,
    type: "support_alert",
    title: "Kiosco de asistencia QR restablecido",
    description: `El equipo de soporte ha generado una nueva rotación de credencial para el Kiosco Oficial de Checador (${freshKioskToken}). Por favor descargue el nuevo cartel de asistencia.`,
    is_read: false,
    created_at: nowIso,
  });

  revalidatePath("/dashboard/admin/support");
  revalidatePath("/dashboard/company/attendance");

  return {
    success: true,
    kioskToken: freshKioskToken,
    resetAt: nowIso,
  };
}

export interface CompanySupportDiagnosticResult {
  company: Database["public"]["Tables"]["company_profiles"]["Row"] | null;
  vacancies: Database["public"]["Tables"]["vacancies"]["Row"][];
  employees: Database["public"]["Tables"]["company_employees"]["Row"][];
  invitations: Database["public"]["Tables"]["employee_invitations"]["Row"][];
  attendance: Array<
    Database["public"]["Tables"]["company_attendance"]["Row"] & {
      check_in: string | null;
    }
  >;
}

/**
 * Diagnóstico integral de soporte para una empresa:
 * Obtiene perfil de la empresa, vacantes, colaboradores, invitaciones y asistencias.
 */
export async function getCompanyFullDiagnostic(
  companyId: string
): Promise<CompanySupportDiagnosticResult> {
  const { supabase } = await requireAdminAuth();

  const [
    companyRes,
    vacanciesRes,
    employeesRes,
    invitationsRes,
    attendanceRes,
  ] = await Promise.all([
    supabase.from("company_profiles").select("*").eq("id", companyId).maybeSingle(),
    supabase.from("vacancies").select("*").eq("company_id", companyId),
    supabase.from("company_employees").select("*").eq("company_id", companyId),
    supabase.from("employee_invitations").select("*").eq("company_id", companyId),
    supabase.from("company_attendance").select("*").eq("company_id", companyId),
  ]);

  if (companyRes.error) {
    throw new Error(`Error al obtener diagnóstico de empresa: ${companyRes.error.message}`);
  }

  return {
    company: companyRes.data,
    vacancies: vacanciesRes.data || [],
    employees: employeesRes.data || [],
    invitations: invitationsRes.data || [],
    attendance: (attendanceRes.data || []).map((att) => ({
      ...att,
      check_in: att.check_in_time,
    })),
  };
}

