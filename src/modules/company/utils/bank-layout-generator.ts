import { PayrollEmployeeItem } from "../types/payroll";

export type BankLayoutType = "bbva" | "banorte" | "stp" | "csv_universal";

export interface GenerateLayoutResult {
  content: string;
  fileName: string;
  mimeType: string;
  includedCount?: number;
  skippedCount?: number;
}

/**
 * Contrato Strategy para la generación de archivos de dispersión bancaria
 */
export interface IBankLayoutStrategy {
  generate(
    employees: PayrollEmployeeItem[],
    periodName: string,
    companyRfc?: string
  ): GenerateLayoutResult;
}

/**
 * Estrategia de Layout para BBVA México (Pagos Interbancarios TXT)
 */
export class BbvaLayoutStrategy implements IBankLayoutStrategy {
  generate(
    employees: PayrollEmployeeItem[],
    periodName: string
  ): GenerateLayoutResult {
    const dateStr = new Date().toISOString().split("T")[0].replace(/-/g, "");
    const lines = employees.map((emp) => {
      const clabe = (emp.bankAccount?.clabe || "").padEnd(18, "0").slice(0, 18);
      const importe = emp.netPayEstimated.toFixed(2).padStart(13, "0");
      const nombre = (emp.employeeName || "COLABORADOR").toUpperCase().padEnd(30, " ").slice(0, 30);
      const concepto = `NOMINA ${periodName}`.toUpperCase().padEnd(30, " ").slice(0, 30);
      return `40\t${clabe}\t${importe}\t${nombre}\t${concepto}`;
    });

    return {
      content: lines.join("\r\n"),
      fileName: `LAYOUT_BBVA_NOMINA_${dateStr}.txt`,
      mimeType: "text/plain;charset=utf-8;",
    };
  }
}

/**
 * Estrategia de Layout para Banorte (Layout B-Net TXT)
 */
export class BanorteLayoutStrategy implements IBankLayoutStrategy {
  generate(
    employees: PayrollEmployeeItem[],
    _periodName: string
  ): GenerateLayoutResult {
    const dateStr = new Date().toISOString().split("T")[0].replace(/-/g, "");
    const lines = employees.map((emp, idx) => {
      const numConsecutivo = String(idx + 1).padStart(5, "0");
      const clabe = (emp.bankAccount?.clabe || "").padEnd(18, "0").slice(0, 18);
      const importe = emp.netPayEstimated.toFixed(2);
      const nombre = (emp.employeeName || "COLABORADOR").toUpperCase().slice(0, 40);
      return `${numConsecutivo}|${clabe}|${importe}|01|NOMINA|${nombre}`;
    });

    return {
      content: lines.join("\r\n"),
      fileName: `LAYOUT_BANORTE_NOMINA_${dateStr}.txt`,
      mimeType: "text/plain;charset=utf-8;",
    };
  }
}

/**
 * Estrategia de Layout para STP (SPEI Masivo CSV)
 */
export class StpLayoutStrategy implements IBankLayoutStrategy {
  generate(
    employees: PayrollEmployeeItem[],
    periodName: string,
    companyRfc = "KAN180101XYZ"
  ): GenerateLayoutResult {
    const dateStr = new Date().toISOString().split("T")[0].replace(/-/g, "");
    const headers = [
      "Institución",
      "Cuenta Beneficiario",
      "Nombre Beneficiario",
      "Monto",
      "Concepto de Pago",
      "Referencia Numérica",
      "RFC Beneficiario",
    ];
    const rows = employees.map((emp, idx) => {
      const clabe = emp.bankAccount?.clabe || "";
      return [
        `"90646"`,
        `"${clabe}"`,
        `"${emp.employeeName}"`,
        `${emp.netPayEstimated.toFixed(2)}`,
        `"NOMINA ${periodName.toUpperCase()}"`,
        `"${String(idx + 1).padStart(7, "0")}"`,
        `"${companyRfc}"`,
      ];
    });

    return {
      content: [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n"),
      fileName: `LAYOUT_STP_SPEI_${dateStr}.csv`,
      mimeType: "text/csv;charset=utf-8;",
    };
  }
}

/**
 * Estrategia Universal (CSV con BOM UTF-8 para Excel y Bancas Generales)
 */
export class UniversalCsvLayoutStrategy implements IBankLayoutStrategy {
  generate(
    employees: PayrollEmployeeItem[],
    periodName: string
  ): GenerateLayoutResult {
    const dateStr = new Date().toISOString().split("T")[0].replace(/-/g, "");
    const headers = [
      "No.",
      "Colaborador",
      "Puesto",
      "Departamento",
      "Banco",
      "Cuenta_CLABE_18_Digitos",
      "Sueldo_Base_Quincenal",
      "Horas_Extra",
      "Bonos_Totales",
      "Deducciones_Totales",
      "Importe_Neto_Dispersar",
      "Concepto",
    ];

    const rows = employees.map((emp, idx) => [
      `${idx + 1}`,
      `"${emp.employeeName.replace(/"/g, '""')}"`,
      `"${emp.jobTitle.replace(/"/g, '""')}"`,
      `"${emp.department.replace(/"/g, '""')}"`,
      `"${emp.bankAccount?.bankName || "BBVA México"}"`,
      `"${emp.bankAccount?.clabe || ""}"`,
      `${emp.baseSalaryPeriod.toFixed(2)}`,
      `${emp.overtimePay.toFixed(2)}`,
      `${(emp.punctualityBonus + emp.attendanceBonus + emp.performanceBonus).toFixed(2)}`,
      `${emp.totalDeductions.toFixed(2)}`,
      `${emp.netPayEstimated.toFixed(2)}`,
      `"PAGO PRE-NOMINA ${periodName.toUpperCase()}"`,
    ]);

    const csv = "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");

    return {
      content: csv,
      fileName: `DISPERSION_BANCARIA_NOMINA_${dateStr}.csv`,
      mimeType: "text/csv;charset=utf-8;",
    };
  }
}

/**
 * Factory para instanciar la estrategia de layout bancario adecuada
 */
export class BankLayoutFactory {
  static create(layoutType: BankLayoutType): IBankLayoutStrategy {
    switch (layoutType) {
      case "bbva":
        return new BbvaLayoutStrategy();
      case "banorte":
        return new BanorteLayoutStrategy();
      case "stp":
        return new StpLayoutStrategy();
      case "csv_universal":
      default:
        return new UniversalCsvLayoutStrategy();
    }
  }
}

/**
 * Fachada para generar el archivo de layout bancario para dispersión masiva de nómina
 */
export function generateBankDispersalLayout(
  employees: PayrollEmployeeItem[],
  periodName: string,
  layoutType: BankLayoutType = "csv_universal",
  companyRfc = "KAN180101XYZ"
): GenerateLayoutResult {
  // Only employees with valid 18-digit CLABE accounts can be included in bank dispersal layouts
  const validEmployees = employees.filter(
    (emp) => emp.bankAccount?.clabe && /^\d{18}$/.test(emp.bankAccount.clabe.trim())
  );

  if (validEmployees.length === 0) {
    throw new Error(
      "No hay colaboradores con cuenta CLABE interbancaria válida (18 dígitos) para generar el archivo de dispersión."
    );
  }

  const strategy = BankLayoutFactory.create(layoutType);
  const result = strategy.generate(validEmployees, periodName, companyRfc);
  return {
    ...result,
    includedCount: validEmployees.length,
    skippedCount: employees.length - validEmployees.length,
  };
}
