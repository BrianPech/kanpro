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
          let userRole: UserRole =
            (currentUser.user_metadata?.role as UserRole) || "candidate";

          // Fallback if role is not directly in metadata
          if (!currentUser.user_metadata?.role) {
            const { data: profile } = await supabase
              .from("profiles")
              .select("role")
              .eq("id", currentUser.id)
              .maybeSingle();

            if (profile?.role) {
              userRole = profile.role as UserRole;
            }
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
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
        const userRole: UserRole =
          (session.user.user_metadata?.role as UserRole) || "candidate";
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
