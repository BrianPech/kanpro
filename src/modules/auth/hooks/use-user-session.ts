"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { UserRole } from "@/modules/auth/types/auth.types";
import type { User } from "@supabase/supabase-js";

export interface UserSessionState {
  user: User | null;
  role: UserRole | null;
  isLoading: boolean;
  dashboardUrl: string;
}

export function useUserSession(): UserSessionState {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    async function checkSession() {
      try {
        const {
          data: { user: currentUser },
        } = await supabase.auth.getUser();

        if (currentUser) {
          setUser(currentUser);
          const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", currentUser.id)
            .maybeSingle();

          let userRole: UserRole = "candidate";
          if (profile?.role === "admin" || profile?.role === "company" || profile?.role === "candidate") {
            userRole = profile.role as UserRole;
          } else {
            const metaRole = currentUser.user_metadata?.role;
            userRole = metaRole === "company" ? "company" : "candidate";
          }

          setRole(userRole);
        } else {
          setUser(null);
          setRole(null);
        }
      } catch (error) {
        console.error("Error verificando sesión activa:", error);
      } finally {
        setIsLoading(false);
      }
    }

    checkSession();

    // Escuchar cambios de estado de autenticación en tiempo real (persistencia y reactividad)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        setUser(session.user);
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", session.user.id)
          .maybeSingle();

        let userRole: UserRole = "candidate";
        if (profile?.role === "admin" || profile?.role === "company" || profile?.role === "candidate") {
          userRole = profile.role as UserRole;
        } else {
          const metaRole = session.user.user_metadata?.role;
          userRole = metaRole === "company" ? "company" : "candidate";
        }
        setRole(userRole);
      } else {
        setUser(null);
        setRole(null);
      }
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const dashboardUrl =
    role === "admin"
      ? "/dashboard/admin"
      : role === "company"
      ? "/dashboard/company"
      : "/dashboard/candidate";

  return { user, role, isLoading, dashboardUrl };
}
