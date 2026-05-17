import { createClient } from "@/lib/supabase/server"

export async function getDashboardSession() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let userName = "Invitado"
  let userInitials = "G"
  let role: "pro" | "company" | "candidate" | "admin" = "pro"
  let plan = "Plan Básico"

  if (user) {
    // 1. Obtener rol y nombre de la metadata del usuario
    role = (user.user_metadata?.role as "pro" | "company" | "candidate" | "admin") || "pro"
    const metaFullName = user.user_metadata?.full_name
    
    // 2. Obtener nombre según rol
    if (role === "admin") {
      plan = "Administrador"
      userName = metaFullName || "Admin"
    } else if (role === "pro") {
      plan = "Plan Pro"
      const { data: proProfile } = await supabase
        .from("professional_profiles")
        .select("full_name")
        .eq("id", user.id)
        .single()
        
      userName = proProfile?.full_name || metaFullName || "Profesional"
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
