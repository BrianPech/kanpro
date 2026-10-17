import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { CompanyEmployeeService } from "@/modules/company/services/company-service";

export type EmployeeInvitationStatusResult = Awaited<
  ReturnType<typeof CompanyEmployeeService.getInvitationByToken>
>;

/**
 * Servicio de sistema para la gestión segura de tokens de invitación a empresas.
 * Al ejecutarse durante el flujo de registro/onboarding previo al establecimiento de membresía tenant,
 * utiliza de forma encapsulada el cliente administrativo del servidor.
 */
export async function getInvitationByToken(
  rawToken: string
): Promise<EmployeeInvitationStatusResult> {
  const adminClient = createAdminClient();
  return CompanyEmployeeService.getInvitationByToken(adminClient, rawToken);
}

/**
 * Acepta formalmente la invitación vinculando al usuario autenticado verificado por el servidor.
 */
export async function acceptEmployeeInvitation(input: {
  rawToken: string;
  userId: string;
  email: string;
}): Promise<{ success: boolean; message?: string }> {
  const adminClient = createAdminClient();
  return CompanyEmployeeService.acceptEmployeeInvitation(adminClient, input);
}
