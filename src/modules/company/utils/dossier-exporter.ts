import type { EmployeeDossier } from "../types/employee-dossier";

/**
 * Genera y despliega el expediente 360 integral en una vista imprimible de alta fidelidad,
 * lista para ser guardada como PDF oficial o impresa conforme a normativas de RRHH y LFT.
 */
export function exportDossierToPrintableDocument(dossier: EmployeeDossier): void {
  if (typeof window === "undefined") return;

  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    throw new Error("La ventana emergente de generación de expediente fue bloqueada por el navegador.");
  }

  const currentDate = new Date().toLocaleDateString("es-MX", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>Expediente Digital 360 - ${dossier.fullName}</title>
  <style>
    @page { size: letter; margin: 16mm 14mm; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #0f172a;
      line-height: 1.45;
      margin: 0;
      padding: 24px;
      background: #ffffff;
      font-size: 11.5px;
    }
    .header {
      border-bottom: 2px solid #0f172a;
      padding-bottom: 12px;
      margin-bottom: 18px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    .title { font-size: 19px; font-weight: 800; color: #0f172a; margin: 0 0 4px 0; letter-spacing: -0.3px; }
    .subtitle { font-size: 10.5px; color: #64748b; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
    .badge {
      display: inline-block;
      padding: 3px 10px;
      border-radius: 9999px;
      font-size: 9.5px;
      font-weight: 700;
      text-transform: uppercase;
      background: #ecfdf5;
      color: #047857;
      border: 1px solid #a7f3d0;
    }
    .section { margin-bottom: 18px; page-break-inside: avoid; }
    .section-title {
      font-size: 12px;
      font-weight: 800;
      color: #1e293b;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 5px;
      margin-bottom: 10px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
    .field { background: #f8fafc; padding: 7px 10px; border-radius: 6px; border: 1px solid #f1f5f9; }
    .label { font-size: 9.5px; color: #64748b; font-weight: 700; text-transform: uppercase; margin-bottom: 2px; }
    .value { font-size: 11.5px; font-weight: 600; color: #0f172a; word-break: break-word; }
    table { width: 100%; border-collapse: collapse; margin-top: 6px; font-size: 10.5px; }
    th { background: #f1f5f9; text-align: left; padding: 6px 8px; font-size: 9.5px; font-weight: 700; color: #475569; text-transform: uppercase; border-bottom: 1px solid #cbd5e1; }
    td { padding: 7px 8px; border-bottom: 1px solid #f1f5f9; color: #334155; }
    .footer {
      margin-top: 32px;
      padding-top: 14px;
      border-top: 1px dashed #cbd5e1;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 9.5px;
      color: #94a3b8;
    }
    .signature-box {
      margin-top: 36px;
      display: flex;
      justify-content: space-around;
      page-break-inside: avoid;
    }
    .signature-line {
      width: 220px;
      text-align: center;
      border-top: 1px solid #0f172a;
      padding-top: 6px;
      font-size: 11px;
      font-weight: 600;
    }
    @media print {
      body { padding: 0; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1 class="title">EXPEDIENTE LABORAL DIGITAL 360°</h1>
      <div class="subtitle">K'ANPRO HUMAN RESOURCES & PAYROLL MANAGEMENT</div>
      <div style="font-size: 10.5px; color: #64748b; margin-top: 3px;">Fecha de emisión: ${currentDate}</div>
    </div>
    <div style="text-align: right;">
      <span class="badge">${dossier.status === "activo" ? "Colaborador Activo" : "Baja Registrada"}</span>
      <div style="font-size: 11px; color: #475569; font-weight: 700; margin-top: 5px;">${dossier.branchName}</div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">1. Datos Personales y Fiscales</div>
    <div class="grid">
      <div class="field"><div class="label">Nombre Completo</div><div class="value">${dossier.fullName}</div></div>
      <div class="field"><div class="label">RFC Oficial</div><div class="value">${dossier.rfc}</div></div>
      <div class="field"><div class="label">CURP</div><div class="value">${dossier.curp}</div></div>
      <div class="field"><div class="label">NSS (IMSS)</div><div class="value">${dossier.nss}</div></div>
      <div class="field"><div class="label">Correo Electrónico</div><div class="value">${dossier.email || "No registrado"}</div></div>
      <div class="field"><div class="label">Teléfono</div><div class="value">${dossier.phone || "No registrado"}</div></div>
      <div class="field"><div class="label">Nacionalidad</div><div class="value">${dossier.nationality}</div></div>
      <div class="field" style="grid-column: span 2;"><div class="label">Domicilio Registrado</div><div class="value">${dossier.address}</div></div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">2. Relación Laboral y Condiciones de Contrato</div>
    <div class="grid">
      <div class="field"><div class="label">Puesto / Cargo</div><div class="value">${dossier.jobTitle}</div></div>
      <div class="field"><div class="label">Departamento</div><div class="value">${dossier.department}</div></div>
      <div class="field"><div class="label">Tipo de Contrato</div><div class="value">${dossier.contractTypeLabel}</div></div>
      <div class="field"><div class="label">Fecha de Ingreso</div><div class="value">${dossier.hireDate}</div></div>
      <div class="field"><div class="label">Antigüedad Acreditada</div><div class="value">${dossier.yearsOfServiceFormatted}</div></div>
      <div class="field"><div class="label">Frecuencia de Pago</div><div class="value" style="text-transform: capitalize;">${dossier.paymentFrequency}</div></div>
      <div class="field"><div class="label">Salario Base Mensual</div><div class="value">$${dossier.baseSalaryMonthly.toLocaleString("es-MX", { minimumFractionDigits: 2 })} MXN</div></div>
      <div class="field"><div class="label">Salario Diario Integrado (SDI)</div><div class="value">$${dossier.dailyIntegratedSalary.toLocaleString("es-MX", { minimumFractionDigits: 2 })} MXN</div></div>
      <div class="field"><div class="label">Jornada Laboral</div><div class="value">${dossier.workSchedule}</div></div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">3. Saldo de Vacaciones Conforme a LFT</div>
    <div class="grid">
      <div class="field"><div class="label">Días Devengados (LFT)</div><div class="value">${dossier.vacationBalance.totalDaysAccruedLFT} días</div></div>
      <div class="field"><div class="label">Días Disfrutados</div><div class="value">${dossier.vacationBalance.daysTaken} días</div></div>
      <div class="field"><div class="label">Días Disponibles</div><div class="value" style="color: #047857;">${dossier.vacationBalance.daysAvailable} días</div></div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">4. Documentación Digitalizada en Bóveda (${dossier.documents.length} archivos)</div>
    <table>
      <thead>
        <tr>
          <th>Documento</th>
          <th>Tipo</th>
          <th>Nombre de Archivo</th>
          <th>Fecha Indexación</th>
          <th>Estado</th>
        </tr>
      </thead>
      <tbody>
        ${dossier.documents.map(d => `
          <tr>
            <td><strong>${d.title}</strong></td>
            <td>${d.docType}</td>
            <td>${d.fileName}</td>
            <td>${d.uploadedAt}</td>
            <td>${d.status === "validado" ? "Validado" : "Pendiente"}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  </div>

  <div class="signature-box">
    <div class="signature-line">
      <div>Recursos Humanos / Empresa</div>
      <div style="font-size: 9px; color: #64748b; margin-top: 2px;">Firma y Sello de Certificación</div>
    </div>
    <div class="signature-line">
      <div>${dossier.fullName}</div>
      <div style="font-size: 9px; color: #64748b; margin-top: 2px;">Firma del Colaborador</div>
    </div>
  </div>

  <div class="footer">
    <div>K'anPro Plataforma Integral • Certificación conforme a la LFT y Código de Comercio</div>
    <div>Expediente Digital Inmutable</div>
  </div>

  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 350);
    };
  </script>
</body>
</html>`;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}
