import { createClient } from "@/lib/supabase/client";
import { type LoginFormValues } from "../schemas/login.schema";
import { type CompanyRegisterValues } from "../schemas/register.schema";

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

      // Fallback: Si no hay rol en metadata, verificar si existe en company_profiles
      if (!role) {
        const { data: companyProfile } = await supabase
          .from("company_profiles")
          .select("id")
          .eq("id", authData.user.id)
          .maybeSingle();
        
        if (companyProfile) {
          role = "company";
        }
      }

      role = role || "pro";
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
          full_name: data.companyName,
        }
      }
    });

    if (authError) throw authError;

    if (authData.user) {
      // 2. Insertar en company_profiles
      const { error: profileError } = await supabase
        .from("company_profiles")
        .insert({
          id: authData.user.id,
          company_name: data.companyName,
          industry: data.industry,
          website_or_linkedin: data.websiteOrLinkedin,
          location: data.location,
        });

      if (profileError) throw profileError;

      return { user: authData.user };
    }
    
    throw new Error("No se pudieron obtener los datos del usuario");
  }
};
