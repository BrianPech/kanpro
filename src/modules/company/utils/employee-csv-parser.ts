import {
  bulkEmployeeImportRowSchema,
  type BulkEmployeeImportRow,
  type BulkImportPreviewItem,
} from "../schemas/employee-invitation.schema";

export const CSV_TEMPLATE_HEADERS = [
  "nombre_completo",
  "email",
  "puesto",
  "salario_mensual",
  "fecha_ingreso",
  "tipo_contrato",
  "departamento",
  "telefono",
];

export const CSV_SAMPLE_ROWS = [
  "Carlos Mendoza Pech,carlos.mendoza@ejemplo.com,Supervisor de Obra,18500,2026-10-01,tiempo_indeterminado,Operaciones,9991234567",
  "María Elena Chan,elena.chan@ejemplo.com,Auxiliar Contable,14000,2026-10-05,periodo_prueba,Administración & Finanzas,9997654321",
  "Rodrigo Morales,rodrigo.morales@ejemplo.com,Cocinero Principal,13500,2026-09-15,tiempo_determinado,Cocina & Producción,9993334455",
];

/**
 * Downloads a sample CSV template for bulk employee import.
 */
export function downloadEmployeeCsvTemplate() {
  const content = [CSV_TEMPLATE_HEADERS.join(","), ...CSV_SAMPLE_ROWS].join("\n");
  const blob = new Blob(["\uFEFF" + content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", "plantilla_importacion_empleados_kanpro.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Parses raw CSV text into validated preview items.
 * Handles commas, semicolons, and basic quoted strings.
 */
export function parseEmployeeCsvText(csvText: string): BulkImportPreviewItem[] {
  const lines = csvText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length < 2) return [];

  // Determine separator: comma or semicolon
  const headerLine = lines[0];
  const separator = headerLine.includes(";") && !headerLine.includes(",") ? ";" : ",";

  const rawHeaders = splitCsvLine(headerLine, separator).map((h) =>
    h.toLowerCase().trim().replace(/[\s_-]+/g, "")
  );

  // Map header column indices
  const colIndex = {
    full_name: rawHeaders.findIndex((h) => h.includes("nombre") || h.includes("name")),
    email: rawHeaders.findIndex((h) => h.includes("email") || h.includes("correo")),
    position: rawHeaders.findIndex((h) => h.includes("puesto") || h.includes("cargo") || h.includes("position")),
    salary: rawHeaders.findIndex((h) => h.includes("salario") || h.includes("sueldo") || h.includes("salary")),
    hire_date: rawHeaders.findIndex((h) => h.includes("fecha") || h.includes("ingreso") || h.includes("hire")),
    contract_type: rawHeaders.findIndex((h) => h.includes("contrato") || h.includes("contract")),
    department: rawHeaders.findIndex((h) => h.includes("depto") || h.includes("departamento") || h.includes("area")),
    phone: rawHeaders.findIndex((h) => h.includes("tel") || h.includes("cel") || h.includes("phone")),
  };

  const results: BulkImportPreviewItem[] = [];

  for (let i = 1; i < lines.length; i++) {
    const rawCols = splitCsvLine(lines[i], separator);
    if (rawCols.length === 0 || (rawCols.length === 1 && !rawCols[0])) continue;

    const full_name = (colIndex.full_name >= 0 ? rawCols[colIndex.full_name] : rawCols[0]) || "";
    const email = (colIndex.email >= 0 ? rawCols[colIndex.email] : rawCols[1]) || "";
    const position = (colIndex.position >= 0 ? rawCols[colIndex.position] : rawCols[2]) || "";
    const rawSalary = colIndex.salary >= 0 ? rawCols[colIndex.salary] : rawCols[3];
    const rawHireDate = colIndex.hire_date >= 0 ? rawCols[colIndex.hire_date] : rawCols[4];
    const contract_type = (colIndex.contract_type >= 0 ? rawCols[colIndex.contract_type] : rawCols[5]) || "tiempo_indeterminado";
    const department = (colIndex.department >= 0 ? rawCols[colIndex.department] : rawCols[6]) || "Operaciones";
    const phone = colIndex.phone >= 0 ? rawCols[colIndex.phone] : rawCols[7];

    const parsedSalary = rawSalary && !isNaN(Number(rawSalary.replace(/[^0-9.]/g, "")))
      ? Number(rawSalary.replace(/[^0-9.]/g, ""))
      : undefined;

    const rowObj: BulkEmployeeImportRow = {
      full_name: full_name.trim(),
      email: email.trim().toLowerCase(),
      position: position.trim(),
      salary: parsedSalary,
      hire_date: rawHireDate?.trim() || undefined,
      contract_type: contract_type.trim() || "tiempo_indeterminado",
      department: department.trim() || "Operaciones",
      phone: phone?.trim() || undefined,
    };

    const validation = bulkEmployeeImportRowSchema.safeParse(rowObj);
    const errors: string[] = [];

    if (!validation.success) {
      validation.error.issues.forEach((issue) => {
        errors.push(`${issue.path.join(".")}: ${issue.message}`);
      });
    }

    results.push({
      ...rowObj,
      rowIndex: i + 1,
      isValid: errors.length === 0,
      errors,
    });
  }

  return results;
}

/**
 * Splits a CSV line handling double quotes and commas.
 */
function splitCsvLine(line: string, separator = ","): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === separator && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}
