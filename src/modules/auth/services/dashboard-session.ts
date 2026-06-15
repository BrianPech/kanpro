import { createClient } from "@/lib/supabase/server"

export async function getDashboardSession() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let userName = "Invitado"
  let userInitials = "G"
  let role: "company" | "candidate" | "admin" = "candidate"
  let plan = "Plan Básico"

  if (user) {
    // 1. Obtener rol y nombre de la metadata del usuario
    role = (user.user_metadata?.role as "company" | "candidate" | "admin") || "candidate"
    const metaFullName = user.user_metadata?.full_name
    
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

    if (userName === "Invitado" && user.email) {
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
