import { z } from "zod";

export const periodTypeEnum = z.enum(["semanal", "quincenal", "mensual"]);

export const adjustBonusesSchema = z.object({
  employeeId: z.string().min(1, "El ID del colaborador es obligatorio"),
  punctualityBonus: z.number().nonnegative("El bono de puntualidad no puede ser negativo"),
  attendanceBonus: z.number().nonnegative("El bono de asistencia no puede ser negativo"),
  performanceBonus: z.number().nonnegative("El bono de desempeño no puede ser negativo"),
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Formato de fecha inválido (YYYY-MM-DD)")
    .optional(),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Formato de fecha inválido (YYYY-MM-DD)")
    .optional(),
});

export const payrollEmployeeItemSchema = z.object({
  employeeId: z.string().min(1, "ID de colaborador requerido"),
  employeeName: z.string().min(1, "Nombre de colaborador requerido"),
  jobTitle: z.string(),
  department: z.string(),
  baseSalaryPeriod: z.number().nonnegative(),
  daysWorked: z.number().nonnegative(),
  overtimeHours: z.number().nonnegative(),
  overtimePay: z.number().nonnegative(),
  punctualityBonus: z.number().nonnegative(),
  attendanceBonus: z.number().nonnegative(),
  performanceBonus: z.number().nonnegative(),
  unjustifiedAbsences: z.number().nonnegative(),
  absenceDeductions: z.number().nonnegative(),
  lateArrivals: z.number().int().nonnegative(),
  delayDeductions: z.number().nonnegative(),
  imssDeduction: z.number().nonnegative(),
  isrEstimated: z.number().nonnegative(),
  totalPerceptions: z.number().nonnegative(),
  totalDeductions: z.number().nonnegative(),
  netPayEstimated: z.number().nonnegative(),
  bankAccount: z
    .object({
      bankName: z.string().optional().nullable(),
      clabe: z.string().optional().nullable(),
    })
    .optional()
    .nullable(),
  hasValidBankDetails: z.boolean().optional(),
});

export const dispersePayrollSchema = z.object({
  periodName: z.string().min(1, "El nombre del periodo es obligatorio"),
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Formato de fecha inválido (YYYY-MM-DD)"),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Formato de fecha inválido (YYYY-MM-DD)"),
  payoutDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Formato de fecha inválido (YYYY-MM-DD)"),
  periodType: periodTypeEnum.optional(),
  totalGross: z.number().nonnegative("El total bruto no puede ser negativo"),
  totalOvertime: z.number().nonnegative("El total de horas extras no puede ser negativo"),
  totalBonuses: z.number().nonnegative("El total de bonos no puede ser negativo"),
  totalDeductions: z.number().nonnegative("El total de deducciones no puede ser negativo"),
  totalNet: z.number().nonnegative("El total neto no puede ser negativo"),
  employees: z.array(payrollEmployeeItemSchema).min(1, "Debe haber al menos un colaborador para dispersar"),
});

export const updateEmployeeBankDetailsSchema = z.object({
  employeeId: z.string().min(1, "El ID del colaborador es obligatorio"),
  bankName: z.string().min(1, "El nombre del banco es obligatorio").max(100),
  clabeAccount: z
    .string()
    .regex(/^\d{18}$/, "La cuenta CLABE debe tener exactamente 18 dígitos numéricos"),
});

export const closePayrollPeriodSchema = z.object({
  payrollId: z.string().min(1, "El ID de nómina es obligatorio"),
  notes: z.string().max(500, "Las notas no pueden exceder 500 caracteres").optional(),
});

export const stampPayrollPeriodSchema = z.object({
  payrollId: z.string().min(1, "El ID de nómina es obligatorio para timbrado fiscal"),
});

export const stampPayrollItemSchema = z.object({
  itemId: z.string().uuid("El identificador del recibo debe ser un UUID válido"),
});

export type AdjustBonusesInput = z.infer<typeof adjustBonusesSchema>;
export type DispersePayrollInput = z.infer<typeof dispersePayrollSchema>;
export type UpdateEmployeeBankDetailsInput = z.infer<typeof updateEmployeeBankDetailsSchema>;
export type ClosePayrollPeriodInput = z.infer<typeof closePayrollPeriodSchema>;
export type StampPayrollPeriodInput = z.infer<typeof stampPayrollPeriodSchema>;
export type StampPayrollItemInput = z.infer<typeof stampPayrollItemSchema>;
