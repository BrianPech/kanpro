import { createClient } from "@/lib/supabase/client";

export class AccountSecurityService {
  private getSupabase() {
    return createClient();
  }

  /**
   * Updates the user's password. Supports:
   * - updatePassword(newPassword: string)
   * - updatePassword(currentPassword: string, newPassword: string)
   */
  async updatePassword(arg1: string, arg2?: string): Promise<void> {
    const supabase = this.getSupabase();

    let currentPassword: string | undefined;
    let newPassword: string;

    if (arg2 !== undefined) {
      currentPassword = arg1;
      newPassword = arg2;
    } else {
      newPassword = arg1;
    }

    if (currentPassword) {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user || !user.email) {
        throw new Error(
          "No se pudo obtener la sesión actual. Por favor vuelve a iniciar sesión."
        );
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });

      if (signInError) {
        throw new Error("La contraseña actual es incorrecta.");
      }
    }

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      throw new Error(error.message || "No se pudo actualizar la contraseña.");
    }
  }

  /**
   * Updates the user's email address in Supabase Auth.
   */
  async updateEmail(newEmail: string, currentPassword?: string): Promise<void> {
    const supabase = this.getSupabase();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user || !user.email) {
      throw new Error(
        "No se pudo obtener la sesión actual. Por favor vuelve a iniciar sesión."
      );
    }

    if (user.email.toLowerCase() === newEmail.toLowerCase()) {
      throw new Error("El nuevo correo debe ser diferente al correo actual.");
    }

    if (currentPassword) {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });

      if (signInError) {
        throw new Error("La contraseña actual es incorrecta.");
      }
    }

    const origin =
      typeof window !== "undefined"
        ? window.location.origin
        : process.env.NEXT_PUBLIC_APP_URL || "";

    const { error } = await supabase.auth.updateUser(
      { email: newEmail },
      { emailRedirectTo: `${origin}/auth/callback` }
    );

    if (error) {
      throw new Error(
        error.message || "No se pudo solicitar el cambio de correo electrónico."
      );
    }
  }

  /**
   * Revokes all active sessions except the current one.
   */
  async revokeOtherSessions(): Promise<void> {
    const supabase = this.getSupabase();
    const { error } = await supabase.auth.signOut({ scope: "others" });
    if (error) {
      throw new Error(
        error.message || "No se pudieron cerrar las demás sesiones."
      );
    }
  }

  /**
   * Exports all user data in JSON format (ARCO Right of Access).
   */
  async exportUserData(): Promise<Record<string, unknown>> {
    const supabase = this.getSupabase();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      throw new Error("No se pudieron exportar los datos del usuario.");
    }

    return {
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        created_at: user.created_at,
        last_sign_in_at: user.last_sign_in_at,
        user_metadata: user.user_metadata,
        app_metadata: user.app_metadata,
      },
      exported_at: new Date().toISOString(),
    };
  }

  /**
   * Requests account deletion and deactivates the user account (ARCO Right of Cancellation).
   * Registers audit trail in arco_requests, marks profile as suspended/pending_deletion,
   * invokes admin API to anonymize user data, and terminates the session.
   */
  async requestAccountDeletion(reason?: string): Promise<void> {
    const supabase = this.getSupabase();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      throw new Error("No se pudo obtener la sesión actual.");
    }

    const { requestAccountDeletionAction } = await import("../actions/account-actions");
    const result = await requestAccountDeletionAction(reason);

    if (!result.success) {
      throw new Error(result.error || "Error al procesar la cancelación de cuenta ARCO.");
    }

    const { error: signOutError } = await supabase.auth.signOut({ scope: "local" });
    if (signOutError) {
      console.warn("SignOut after account deletion warning:", signOutError.message);
    }
  }

  /**
   * MFA / 2FA helper methods
   */
  async getMFAFactors() {
    const supabase = this.getSupabase();
    const { data, error } = await supabase.auth.mfa.listFactors();
    if (error) throw error;
    return data;
  }

  async enrollTOTP() {
    const supabase = this.getSupabase();
    const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp" });
    if (error) throw error;
    return data;
  }

  async verifyTOTP(factorId: string, arg2: string, arg3?: string) {
    const supabase = this.getSupabase();
    let challengeId: string | undefined;
    let code: string;

    if (arg3 !== undefined) {
      challengeId = arg2;
      code = arg3;
    } else {
      code = arg2;
    }

    if (challengeId && challengeId.length > 0) {
      const { data, error } = await supabase.auth.mfa.verify({
        factorId,
        challengeId,
        code,
      });
      if (error) throw error;
      return data;
    } else {
      const { data, error } = await supabase.auth.mfa.challengeAndVerify({
        factorId,
        code,
      });
      if (error) throw error;
      return data;
    }
  }

  async unenrollTOTP(factorId: string) {
    const supabase = this.getSupabase();
    const { data, error } = await supabase.auth.mfa.unenroll({ factorId });
    if (error) throw error;
    return data;
  }
}

export const accountSecurityService = new AccountSecurityService();

export const revokeOtherSessions = (
  ...args: Parameters<typeof accountSecurityService.revokeOtherSessions>
) => accountSecurityService.revokeOtherSessions(...args);

export const updatePassword = (
  ...args: Parameters<typeof accountSecurityService.updatePassword>
) => accountSecurityService.updatePassword(...args);

export const updateEmail = (
  ...args: Parameters<typeof accountSecurityService.updateEmail>
) => accountSecurityService.updateEmail(...args);

export const getMFAFactors = (
  ...args: Parameters<typeof accountSecurityService.getMFAFactors>
) => accountSecurityService.getMFAFactors(...args);

export const enrollTOTP = (
  ...args: Parameters<typeof accountSecurityService.enrollTOTP>
) => accountSecurityService.enrollTOTP(...args);

export const verifyTOTP = (
  ...args: Parameters<typeof accountSecurityService.verifyTOTP>
) => accountSecurityService.verifyTOTP(...args);

export const unenrollTOTP = (
  ...args: Parameters<typeof accountSecurityService.unenrollTOTP>
) => accountSecurityService.unenrollTOTP(...args);
