import { createClient } from "@/lib/supabase/client";
import { loginSchema, type LoginFormValues } from "../schemas/login.schema";
import {
  companyRegisterSchema,
  adminRegisterSchema,
  candidateRegisterSchema,
  type CompanyRegisterValues,
  type AdminRegisterValues,
  type CandidateRegisterValues,
} from "../schemas/register.schema";
import type { UserRole, AuthSuccessResponse } from "../types/auth.types";

export const authService = {
  async signIn(data: LoginFormValues): Promise<AuthSuccessResponse> {
    // 1. Validar estrictamente datos de entrada con Zod
    const validatedData = loginSchema.parse(data);

    const supabase = createClient();
    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({
        email: validatedData.email,
        password: validatedData.password,
      });

    if (authError) throw authError;

    if (authData.user) {
      // Leer el rol de la metadata del usuario
      let role: UserRole | undefined = authData.user.user_metadata?.role as
        | UserRole
        | undefined;

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

  async signUpCompany(
    data: CompanyRegisterValues
  ): Promise<AuthSuccessResponse> {
    // 1. Validar estrictamente datos de entrada con Zod
    const validatedData = companyRegisterSchema.parse(data);

    const supabase = createClient();

    // 2. Crear usuario en Supabase Auth con metadata de rol 'company'
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: validatedData.email,
      password: validatedData.password,
      options: {
        data: {
          role: "company" satisfies UserRole,
          full_name: validatedData.full_name,
        },
      },
    });

    if (authError) throw authError;

    // Auto sign-in to establish authenticated session if session is not returned immediately
    if (authData.user && !authData.session) {
      try {
        await supabase.auth.signInWithPassword({
          email: validatedData.email,
          password: validatedData.password,
        });
      } catch (err) {
        console.warn("Auto sign-in after company registration skipped:", err);
      }
    }

    if (authData.user) {
      return { user: authData.user, role: "company" };
    }

    throw new Error("No se pudieron obtener los datos del usuario");
  },

  async signUpAdmin(
    data: AdminRegisterValues
  ): Promise<AuthSuccessResponse> {
    // 1. Validar estrictamente datos de entrada con Zod
    const validatedData = adminRegisterSchema.parse(data);

    const supabase = createClient();

    // 2. Crear usuario en Supabase Auth con metadata de rol 'admin'
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: validatedData.email,
      password: validatedData.password,
      options: {
        data: {
          role: "admin" satisfies UserRole,
          full_name: validatedData.fullName,
        },
      },
    });

    if (authError) throw authError;

    // Auto sign-in to establish authenticated session if session is not returned immediately
    if (authData.user && !authData.session) {
      try {
        await supabase.auth.signInWithPassword({
          email: validatedData.email,
          password: validatedData.password,
        });
      } catch (err) {
        console.warn("Auto sign-in after admin registration skipped:", err);
      }
    }

    if (authData.user) {
      return { user: authData.user, role: "admin" };
    }

    throw new Error("No se pudieron obtener los datos del usuario");
  },

  async signUpCandidate(
    data: CandidateRegisterValues
  ): Promise<AuthSuccessResponse> {
    // 1. Validar estrictamente datos de entrada con Zod
    const validatedData = candidateRegisterSchema.parse(data);

    const supabase = createClient();

    // 2. Crear usuario en Supabase Auth con metadata de rol 'candidate'
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: validatedData.email,
      password: validatedData.password,
      options: {
        data: {
          role: "candidate" satisfies UserRole,
          full_name: validatedData.fullName,
          birth_date: validatedData.birthDate,
          whatsapp_number: validatedData.whatsappNumber,
        },
      },
    });

    if (authError) throw authError;

    // Auto sign-in to establish authenticated session if session is not returned immediately
    if (authData.user && !authData.session) {
      try {
        await supabase.auth.signInWithPassword({
          email: validatedData.email,
          password: validatedData.password,
        });
      } catch (err) {
        console.warn("Auto sign-in after candidate registration skipped:", err);
      }
    }

    if (authData.user) {
      return { user: authData.user, role: "candidate" };
    }

    throw new Error("No se pudieron obtener los datos del usuario");
  },
};
