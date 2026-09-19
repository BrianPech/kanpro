import { PayrollEmployeeItem } from "../types/payroll";

export type BankLayoutType = "bbva" | "banorte" | "stp" | "csv_universal";

export interface GenerateLayoutResult {
  content: string;
  fileName: string;
  mimeType: string;
}

/**
 * Genera el archivo de layout bancario para dispersión masiva de nómina
 */
export function generateBankDispersalLayout(
  employees: PayrollEmployeeItem[],
  periodName: string,
  layoutType: BankLayoutType = "csv_universal",
  companyRfc = "KAN180101XYZ"
): GenerateLayoutResult {
  const dateStr = new Date().toISOString().split("T")[0].replace(/-/g, "");

  if (layoutType === "bbva") {
    // Formato TXT BBVA Pagos Interbancarios
    // Longitud fija o delimitado por tabuladores: [Cuenta Cargo (10 o 18)] [Tipo de Cuenta (01/40)] [Cuenta Abono (18)] [Importe] [Beneficiario (30)] [Concepto (40)]
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

  if (layoutType === "banorte") {
    // Formato Banorte Nómina (Layout B-Net)
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

  if (layoutType === "stp") {
    // Formato Layout STP SPEI Masivo
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

  // Por defecto: CSV Universal con UTF-8 BOM para Excel / Cualquier Banca Empresarial
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
