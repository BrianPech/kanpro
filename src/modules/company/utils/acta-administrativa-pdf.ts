/**
 * Generador mínimo de PDF (Helvetica, A4) sin dependencias para el Acta Administrativa.
 * shortcut: solo texto latin-1 y ajuste de línea aproximado, cambiar a una librería PDF si se requiere diseño rico.
 */

export interface ActaAdministrativaData {
  folio: string;
  companyName: string;
  issuedOn: string;
  employeeName: string;
  jobTitle: string;
  department: string;
  categoryLabel: string;
  title: string;
  incidentDate: string;
  severity: string;
  description: string;
  responsibleSupervisor: string;
  evidenceFileName?: string;
  employeeStatement?: string;
  acknowledgedAt?: string;
  resolutionNotes?: string;
}

const PAGE_WIDTH = 595;
const PAGE_HEIGHT = 842;
const MARGIN = 56;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

interface TextOp {
  kind: "text";
  text: string;
  size: number;
  bold: boolean;
  x: number;
  y: number;
}
interface LineOp {
  kind: "line";
  x1: number;
  x2: number;
  y: number;
}
type PageOp = TextOp | LineOp;

function toLatin1(value: string): string {
  return value
    .replace(/[\r\t]/g, " ")
    .replace(/[^\n\x20-\x7e\xa0-\xff]/g, "?");
}

function escapePdf(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function wrap(text: string, size: number, bold: boolean, width = CONTENT_WIDTH): string[] {
  const maxChars = Math.max(10, Math.floor(width / (size * (bold ? 0.56 : 0.52))));
  const lines: string[] = [];
  for (const paragraph of toLatin1(text).split("\n")) {
    let current = "";
    for (const word of paragraph.split(" ")) {
      const candidate = current ? `${current} ${word}` : word;
      if (candidate.length > maxChars && current) {
        lines.push(current);
        current = word;
      } else {
        current = candidate;
      }
    }
    lines.push(current);
  }
  return lines;
}

class PageBuilder {
  readonly pages: PageOp[][] = [[]];
  private y = PAGE_HEIGHT - MARGIN;

  private ensure(height: number): void {
    if (this.y - height < MARGIN) {
      this.pages.push([]);
      this.y = PAGE_HEIGHT - MARGIN;
    }
  }

  private get ops(): PageOp[] {
    return this.pages[this.pages.length - 1];
  }

  text(text: string, size = 10, bold = false, gapBefore = 0): void {
    this.y -= gapBefore;
    for (const line of wrap(text, size, bold)) {
      this.ensure(size * 1.4);
      this.y -= size * 1.4;
      this.ops.push({ kind: "text", text: line, size, bold, x: MARGIN, y: this.y });
    }
  }

  heading(text: string): void {
    this.text(text.toUpperCase(), 10, true, 14);
    this.ensure(6);
    this.y -= 3;
    this.ops.push({ kind: "line", x1: MARGIN, x2: PAGE_WIDTH - MARGIN, y: this.y });
  }

  field(label: string, value: string): void {
    this.text(`${label}: ${value || "N/D"}`, 10, false, 2);
  }

  signatures(labels: string[]): void {
    this.ensure(90);
    this.y -= 60;
    const slot = CONTENT_WIDTH / labels.length;
    labels.forEach((label, index) => {
      const x1 = MARGIN + slot * index + 8;
      const x2 = MARGIN + slot * (index + 1) - 8;
      this.ops.push({ kind: "line", x1, x2, y: this.y });
      for (const [lineIndex, line] of wrap(label, 8, false, slot - 16).entries()) {
        this.ops.push({ kind: "text", text: line, size: 8, bold: false, x: x1, y: this.y - 12 - lineIndex * 10 });
      }
    });
    this.y -= 40;
  }
}

function renderPage(ops: PageOp[]): string {
  return ops
    .map((op) =>
      op.kind === "line"
        ? `0.5 w ${op.x1} ${op.y} m ${op.x2} ${op.y} l S`
        : `BT /${op.bold ? "F2" : "F1"} ${op.size} Tf ${op.x} ${op.y.toFixed(2)} Td (${escapePdf(op.text)}) Tj ET`
    )
    .join("\n");
}

export function buildActaAdministrativaPdf(data: ActaAdministrativaData): Uint8Array {
  const doc = new PageBuilder();

  doc.text("ACTA ADMINISTRATIVA", 16, true);
  doc.text(data.companyName, 11, true, 2);
  doc.text(`Folio ${data.folio}  |  Fecha de elaboración: ${data.issuedOn}`, 9, false, 2);

  doc.heading("Datos del trabajador");
  doc.field("Nombre", data.employeeName);
  doc.field("Puesto", data.jobTitle);
  doc.field("Departamento", data.department);

  doc.heading("Datos de la incidencia");
  doc.field("Tipo", data.categoryLabel);
  doc.field("Asunto", data.title);
  doc.field("Fecha de los hechos", data.incidentDate);
  doc.field("Severidad", data.severity);
  doc.field("Supervisor responsable", data.responsibleSupervisor);
  doc.field("Evidencia anexa", data.evidenceFileName || "Sin evidencia");

  doc.heading("Hechos");
  doc.text(data.description, 10, false, 2);

  doc.heading("Manifestación del trabajador");
  doc.text(
    data.acknowledgedAt
      ? `El trabajador manifestó estar enterado de la incidencia el ${data.acknowledgedAt}.`
      : "El trabajador aún no ha manifestado estar enterado de la incidencia.",
    10,
    false,
    2
  );
  doc.text(data.employeeStatement ? `Descargo: ${data.employeeStatement}` : "Sin descargo registrado.", 10, false, 2);

  if (data.resolutionNotes) {
    doc.heading("Resolución");
    doc.text(data.resolutionNotes, 10, false, 2);
  }

  doc.signatures(["Trabajador", "Representante de la empresa", "Testigo 1", "Testigo 2"]);
  doc.text(
    "Documento generado por K'anPro. Las firmas autógrafas le dan validez; consulte a su asesor jurídico antes de aplicar sanciones.",
    7,
    false,
    10
  );

  const objects: string[] = [];
  objects[1] = "<< /Type /Catalog /Pages 2 0 R >>";
  objects[3] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>";
  objects[4] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>";

  const pageRefs: string[] = [];
  doc.pages.forEach((ops, index) => {
    const pageNum = 5 + index * 2;
    const contentNum = pageNum + 1;
    const stream = renderPage(ops);
    objects[pageNum] =
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] ` +
      `/Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentNum} 0 R >>`;
    objects[contentNum] = `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`;
    pageRefs.push(`${pageNum} 0 R`);
  });
  objects[2] = `<< /Type /Pages /Kids [${pageRefs.join(" ")}] /Count ${pageRefs.length} >>`;

  let out = "%PDF-1.4\n";
  const offsets: number[] = [];
  for (let i = 1; i < objects.length; i++) {
    offsets[i] = out.length;
    out += `${i} 0 obj\n${objects[i]}\nendobj\n`;
  }
  const xrefAt = out.length;
  out += `xref\n0 ${objects.length}\n0000000000 65535 f \n`;
  for (let i = 1; i < objects.length; i++) {
    out += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }
  out += `trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xrefAt}\n%%EOF`;

  // Todo el contenido es latin-1, así que 1 carácter = 1 byte y los offsets son exactos.
  return Uint8Array.from(out, (char) => char.charCodeAt(0));
}
