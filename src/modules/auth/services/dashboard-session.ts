import { createClient } from "@/lib/supabase/server"

export async function getDashboardSession() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let userName = "Invitado"
  let userInitials = "G"
  let role: "company" | "candidate" | "admin" = "candidate"
  let plan = "Plan Básico"

  if (user) {
    let metaRole = user.user_metadata?.role as "company" | "candidate" | "admin" | undefined
    let metaFullName = user.user_metadata?.full_name

    if (!metaRole || !metaFullName) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, full_name')
        .eq('id', user.id)
        .maybeSingle()

      if (profile) {
        if (!metaRole && profile.role) {
          metaRole = profile.role as "company" | "candidate" | "admin"
        }
        if (!metaFullName && profile.full_name) {
          metaFullName = profile.full_name
        }
      }
    }

    role = metaRole || "candidate"
    
    // 2. Obtener nombre según rol
    if (role === "admin") {
      plan = "Administrador"
      userName = metaFullName || "Admin"
    } else if (role === "company") {
      plan = "Empresa"
      userName = metaFullName || "Compañía"
    } else if (role === "candidate") {
      plan = "Candidato"
      userName = metaFullName || "Candidato"
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
