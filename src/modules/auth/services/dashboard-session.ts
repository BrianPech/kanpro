import { cache } from "react"
import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase/server"
import { getImpersonationState } from "@/lib/auth/impersonation"
import {
  DEFAULT_DEMO_ROLLOUT,
  normalizeDemoRollout,
  type CompanyModuleKey,
  type DemoRolloutConfig,
} from "@/modules/company/config/demo-rollout"
import {
  companyTenantService,
  type UserCompanyItem,
} from "@/modules/company/services/company-tenant.service"
import {
  ACTIVE_COMPANY_COOKIE,
  type CompanyMemberRole,
} from "@/modules/company/schemas/tenant.schema"

let rolloutCacheEntry: { data: DemoRolloutConfig; expiresAt: number } | null = null
const ROLLOUT_CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes

export function invalidateDemoRolloutMemoryCache(): void {
  rolloutCacheEntry = null
}

async function resolveDashboardSession() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let userName = "Invitado"
  let userInitials = "G"
  let role: "company" | "candidate" | "admin" = "candidate"
  let plan = "Plan Básico"
  let isImpersonated = false
  let targetUserId: string | undefined = undefined
  let demoPhase: 1 | 2 | 3 | 4 = DEFAULT_DEMO_ROLLOUT.activePhase
  let enabledCompanyModules: CompanyModuleKey[] = DEFAULT_DEMO_ROLLOUT.enabledModules
  let userCompanies: UserCompanyItem[] = []
  let activeCompany: UserCompanyItem | null = null
  let activeCompanyId: string | undefined = undefined
  let activeCompanyRole: CompanyMemberRole | undefined = undefined

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

      try {
        const { data: empRecord } = await supabase
          .from('company_employees')
          .select('company:company_profiles(company_name, legal_name)')
          .eq('employee_id', user.id)
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (empRecord) {
          interface CompRecord {
            company_name: string | null;
            legal_name: string | null;
          }
          const comp = (Array.isArray(empRecord.company) ? empRecord.company[0] : empRecord.company) as CompRecord | null;
          const compName = comp?.company_name || comp?.legal_name;
          plan = compName ? `Empleado • ${compName}` : "Empleado Activo";
        }
      } catch {
        // Ignorar si la tabla no está disponible o el cliente de pruebas tiene un mock parcial
      }
    }

    if ((!userName || userName === "Invitado") && user.email) {
      userName = user.email.split("@")[0]
    }
    userInitials = userName.substring(0, 2).toUpperCase()

    // 3. Functional Impersonation Engine: If admin is impersonating another user
    try {
      const impersonationState = await getImpersonationState()
      if (impersonationState.isImpersonating && impersonationState.targetUserId) {
        const { data: targetProfile } = await supabase
          .from('profiles')
          .select('id, role, full_name, email')
          .eq('id', impersonationState.targetUserId)
          .maybeSingle()

        const effectiveRole = targetProfile?.role || impersonationState.targetUserRole
        const effectiveName = targetProfile?.full_name || impersonationState.targetUserName || targetProfile?.email?.split("@")[0] || ""
        const effectiveEmail = targetProfile?.email || impersonationState.targetUserEmail

        if (effectiveRole === "admin" || effectiveRole === "company" || effectiveRole === "candidate") {
          isImpersonated = true
          targetUserId = impersonationState.targetUserId
          role = effectiveRole

          if (role === "admin") {
            plan = "Administrador"
            userName = effectiveName || "Admin"
          } else if (role === "company") {
            plan = "Empresa"
            userName = effectiveName || "Compañía"
          } else if (role === "candidate") {
            plan = "Candidato"
            userName = effectiveName || "Candidato"

            const { data: empRecord } = await supabase
              .from('company_employees')
              .select('company:company_profiles(company_name, legal_name)')
              .eq('employee_id', impersonationState.targetUserId)
              .eq('status', 'active')
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle();

            if (empRecord) {
              interface CompRecord {
                company_name: string | null;
                legal_name: string | null;
              }
              const comp = (Array.isArray(empRecord.company) ? empRecord.company[0] : empRecord.company) as CompRecord | null;
              const compName = comp?.company_name || comp?.legal_name;
              plan = compName ? `Empleado • ${compName}` : "Empleado Activo";
            }
          }

          if ((!userName || userName === "Invitado") && effectiveEmail) {
            userName = effectiveEmail.split("@")[0]
          }
          userInitials = userName.substring(0, 2).toUpperCase()
        }
      }
    } catch {
      // Graceful fallback if outside request context or cookies unavailable
    }

    // 4. Resolve multi-tenant companies if role is company
    if (role === "company") {
      const effectiveCompanyUserId = targetUserId || user.id
      try {
        userCompanies = await companyTenantService.getUserCompanies(effectiveCompanyUserId, supabase)

        let preferredCompanyId: string | undefined = undefined
        try {
          const cookieStore = await cookies()
          preferredCompanyId = cookieStore.get(ACTIVE_COMPANY_COOKIE)?.value
        } catch {
          // Graceful fallback outside cookies context
        }

        if (preferredCompanyId) {
          activeCompany = userCompanies.find((c) => c.companyId === preferredCompanyId) || null
        }

        if (!activeCompany && userCompanies.length > 0) {
          activeCompany = userCompanies[0]
        }

        if (activeCompany) {
          activeCompanyId = activeCompany.companyId
          activeCompanyRole = activeCompany.role
          plan = `Empresa • ${activeCompany.companyName}`
        }
      } catch (compErr) {
        console.warn("[resolveDashboardSession] Error resolving company tenant context:", compErr)
      }
    }

    if (role === "company" || role === "admin") {
      const now = Date.now()
      if (!process.env.VITEST && rolloutCacheEntry && rolloutCacheEntry.expiresAt > now) {
        demoPhase = rolloutCacheEntry.data.activePhase
        enabledCompanyModules = rolloutCacheEntry.data.enabledModules
      } else {
        try {
          const { data: rolloutRow } = await supabase
            .from("system_settings")
            .select("value")
            .eq("key", "demo_rollout")
            .maybeSingle()

          if (rolloutRow?.value) {
            const normalized = normalizeDemoRollout(rolloutRow.value)
            demoPhase = normalized.activePhase
            enabledCompanyModules = normalized.enabledModules
            rolloutCacheEntry = {
              data: normalized,
              expiresAt: now + ROLLOUT_CACHE_TTL_MS,
            }
          }
        } catch {
          // Fallback to DEFAULT_DEMO_ROLLOUT
        }
      }
    }
  }

  return {
    userName,
    userInitials,
    role,
    plan,
    isImpersonated,
    targetUserId,
    demoPhase,
    enabledCompanyModules,
    userCompanies,
    activeCompany,
    activeCompanyId,
    activeCompanyRole,
  }
}

const cachedDashboardSession = cache(resolveDashboardSession)

export async function getDashboardSession() {
  if (process.env.VITEST) {
    return resolveDashboardSession()
  }
  return cachedDashboardSession()
}
