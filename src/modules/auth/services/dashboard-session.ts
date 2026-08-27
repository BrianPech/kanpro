import { createClient } from "@/lib/supabase/server"

export async function getDashboardSession() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let userName = "Invitado"
  let userInitials = "G"
  let role: "company" | "candidate" | "admin" = "candidate"
  let plan = "Plan Básico"

  if (user) {
    // 1. Authoritative source of truth: database profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, full_name')
      .eq('id', user.id)
      .maybeSingle()

    // Determine role: strictly rely on database profile role
    if (profile?.role === "admin" || profile?.role === "company" || profile?.role === "candidate") {
      role = profile.role
    } else {
      // Fallback for when profile doesn't exist yet: ONLY allow 'company' from metadata, NEVER 'admin'
      const metaRole = user.user_metadata?.role
      role = metaRole === "company" ? "company" : "candidate"
    }

    const rawFullName = profile?.full_name || user.user_metadata?.full_name || user.user_metadata?.name || ""

    // 2. Set plan and display name according to authoritative role
    if (role === "admin") {
      plan = "Administrador"
      userName = rawFullName || "Admin"
    } else if (role === "company") {
      plan = "Empresa"
      userName = rawFullName || "Compañía"
    } else if (role === "candidate") {
      plan = "Candidato"
      userName = rawFullName || "Candidato"
    }

    if ((!userName || userName === "Invitado") && user.email) {
      userName = user.email.split("@")[0]
    }
    userInitials = userName.substring(0, 2).toUpperCase()
  }

  return {
    userName,
    userInitials,
    role,
    plan,
  }
}
