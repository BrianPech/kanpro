import { createClient } from "@/lib/supabase/client";
import { type LoginFormValues } from "../schemas/login.schema";
import { type CompanyRegisterValues, type AdminRegisterValues, type CandidateRegisterValues } from "../schemas/register.schema";

export const authService = {
  async signIn(data: LoginFormValues) {
    const supabase = createClient();
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (authError) throw authError;

    if (authData.user) {
      // Leer el rol de la metadata del usuario
      let role = authData.user.user_metadata?.role;

      // Fallback: Si no hay rol en metadata, verificar si existe en admin_profiles o company_profiles
      if (!role) {
        const { data: adminProfile } = await supabase
          .from("admin_profiles")
          .select("id")
          .eq("id", authData.user.id)
          .maybeSingle();
        
        if (adminProfile) {
          role = "admin";
        } else {
          const { data: companyProfile } = await supabase
            .from("company_profiles")
            .select("id")
            .eq("id", authData.user.id)
            .maybeSingle();
          
          if (companyProfile) {
            role = "company";
          }
        }
      }

      role = role || "candidate";
      return { user: authData.user, role };
    }
    
    throw new Error("No se pudieron obtener los datos del usuario");
  },

  async signUpCompany(data: CompanyRegisterValues) {
    const supabase = createClient();
    
    // 1. Crear usuario en Supabase Auth con metadata de rol
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          role: "company",
          full_name: data.full_name,
        }
      }
    });

    if (authError) throw authError;

    // Auto sign-in to establish authenticated session if session is not returned immediately
    if (authData.user && !authData.session) {
      try {
        await supabase.auth.signInWithPassword({
          email: data.email,
          password: data.password,
        });
      } catch (err) {
        console.warn("Auto sign-in after company registration skipped:", err);
      }
    }

    if (authData.user) {
      return { user: authData.user };
    }
    
    throw new Error("No se pudieron obtener los datos del usuario");
  },

  async signUpAdmin(data: AdminRegisterValues) {
    const supabase = createClient();
    
    // 1. Crear usuario en Supabase Auth con metadata de rol 'admin'
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          role: "admin",
          full_name: data.fullName,
        }
      }
    });

    if (authError) throw authError;

    // Auto sign-in to establish authenticated session if session is not returned immediately
    if (authData.user && !authData.session) {
      try {
        await supabase.auth.signInWithPassword({
          email: data.email,
          password: data.password,
        });
      } catch (err) {
        console.warn("Auto sign-in after admin registration skipped:", err);
      }
    }

    if (authData.user) {
      return { user: authData.user };
    }
    
    throw new Error("No se pudieron obtener los datos del usuario");
  },

  async signUpCandidate(data: CandidateRegisterValues) {
    const supabase = createClient();
    
    // 1. Crear usuario en Supabase Auth con metadata de rol 'candidate'
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          role: "candidate",
          full_name: data.fullName,
          birth_date: data.birthDate,
          whatsapp_number: data.whatsappNumber,
        }
      }
    });

    if (authError) throw authError;

    // Auto sign-in to establish authenticated session if session is not returned immediately
    if (authData.user && !authData.session) {
      try {
        await supabase.auth.signInWithPassword({
          email: data.email,
          password: data.password,
        });
      } catch (err) {
        console.warn("Auto sign-in after candidate registration skipped:", err);
      }
    }

    if (authData.user) {
      return { user: authData.user };
    }
    
    throw new Error("No se pudieron obtener los datos del usuario");
  }
};
