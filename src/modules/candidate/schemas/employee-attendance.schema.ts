import { z } from "zod";

export const employeeQrCheckInSchema = z.object({
  qrUrlOrToken: z.string().min(1, "Código o enlace QR requerido"),
  coordinates: z
    .object({
      lat: z.number().min(-90).max(90),
      lng: z.number().min(-180).max(180),
      accuracy: z.number().nonnegative().optional(),
    })
    .optional(),
});

export type EmployeeQrCheckInInput = z.infer<typeof employeeQrCheckInSchema>;

export interface EmployeeQrCheckInResult {
  timeStr: string;
  isLate: boolean;
  delayMinutes: number;
  employeeName: string;
  actionType: "check_in" | "check_out";
  branchName?: string;
  companyName?: string;
}
