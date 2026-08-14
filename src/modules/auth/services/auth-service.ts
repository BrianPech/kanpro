import { createClient } from "@/lib/supabase/client";
import { loginSchema, type LoginFormValues } from "../schemas/login.schema";
import {
  companyRegisterSchema,
  candidateRegisterSchema,
  type CompanyRegisterValues,
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

      // Fallback: Si no hay rol en metadata, verificar en la tabla profiles
      if (!role) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", authData.user.id)
          .maybeSingle();

        if (profile?.role) {
          role = profile.role as UserRole;
        }
      }

      role = role || "candidate";
      return { user: authData.user, session: authData.session, role };
    }

    throw new Error("No se pudieron obtener los datos del usuario");
  },

  async signUpCompany(
    data: CompanyRegisterValues
  ): Promise<AuthSuccessResponse> {
    // 1. Validar estrictamente datos de entrada con Zod
    const validatedData = companyRegisterSchema.parse(data);

    const supabase = createClient();
    const origin =
      typeof window !== "undefined"
        ? window.location.origin
        : process.env.NEXT_PUBLIC_APP_URL || "";

    // 2. Crear usuario en Supabase Auth con metadata de rol 'company'
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: validatedData.email,
      password: validatedData.password,
      options: {
        emailRedirectTo: `${origin}/auth/callback`,
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
      return { user: authData.user, session: authData.session, role: "company" };
    }

    throw new Error("No se pudieron obtener los datos del usuario");
  },

  async signUpCandidate(
    data: CandidateRegisterValues
  ): Promise<AuthSuccessResponse> {
    // 1. Validar estrictamente datos de entrada con Zod
    const validatedData = candidateRegisterSchema.parse(data);

    const supabase = createClient();
    const origin =
      typeof window !== "undefined"
        ? window.location.origin
        : process.env.NEXT_PUBLIC_APP_URL || "";

    // 2. Crear usuario en Supabase Auth con metadata de rol 'candidate'
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: validatedData.email,
      password: validatedData.password,
      options: {
        emailRedirectTo: `${origin}/auth/callback`,
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
      return { user: authData.user, session: authData.session, role: "candidate" };
    }

    throw new Error("No se pudieron obtener los datos del usuario");
  },

  async resendVerificationEmail(email: string): Promise<void> {
    const supabase = createClient();
    const origin =
      typeof window !== "undefined"
        ? window.location.origin
        : process.env.NEXT_PUBLIC_APP_URL || "";

    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: {
        emailRedirectTo: `${origin}/auth/callback`,
      },
    });

    if (error) throw error;
  },

  async resetPasswordForEmail(email: string): Promise<void> {
    const origin =
      typeof window !== "undefined"
        ? window.location.origin
        : process.env.NEXT_PUBLIC_SITE_URL || "";

    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${origin}/auth/callback?next=/reset-password`,
    });

    if (error) throw error;
  },

  async updatePassword(password: string): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });

    if (error) throw error;
  },

  async signInWithPhoneOtp(
    phone: string,
    channel: "whatsapp" | "sms" = "whatsapp"
  ): Promise<void> {
    const supabase = createClient();
    const cleanPhone = phone.replace(/[\s\-\(\)]/g, "");
    const formattedPhone = cleanPhone.startsWith("+")
      ? cleanPhone
      : `+52${cleanPhone}`;

    const { error } = await supabase.auth.signInWithOtp({
      phone: formattedPhone,
      options: {
        channel,
      },
    });

    if (error) throw error;
  },

  async verifyPhoneOtp(
    phone: string,
    token: string
  ): Promise<AuthSuccessResponse> {
    const supabase = createClient();
    const cleanPhone = phone.replace(/[\s\-\(\)]/g, "");
    const formattedPhone = cleanPhone.startsWith("+")
      ? cleanPhone
      : `+52${cleanPhone}`;

    const { data, error } = await supabase.auth.verifyOtp({
      phone: formattedPhone,
      token,
      type: "sms",
    });

    if (error) throw error;

    if (data.user) {
      let role: UserRole | undefined = data.user.user_metadata?.role as
        | UserRole
        | undefined;

      if (!role) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", data.user.id)
          .maybeSingle();

        if (profile?.role) {
          role = profile.role as UserRole;
        }
      }

      role = role || "candidate";
      return { user: data.user, session: data.session, role };
    }

    throw new Error("No se pudieron obtener los datos del usuario");
  },

  async signInWithOAuth(
    provider: "google" | "linkedin_oidc",
    role?: UserRole,
    redirectTo?: string
  ): Promise<void> {
    const supabase = createClient();
    const origin =
      typeof window !== "undefined"
        ? window.location.origin
        : process.env.NEXT_PUBLIC_APP_URL || "";

    const callbackUrl = `${origin}/auth/callback?role=${role || "candidate"}${
      redirectTo ? `&redirectTo=${encodeURIComponent(redirectTo)}` : ""
    }`;

    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: callbackUrl,
      },
    });

    if (error) throw error;
  },
};
