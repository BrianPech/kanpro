/**
 * sat-cfdi-payroll-generator.ts
 * Generador estándar de comprobantes fiscales digitales por internet (CFDI 4.0)
 * con Complemento de Nómina 1.2 oficial del SAT (Servicio de Administración Tributaria).
 */

export interface CfdiPayrollEmitter {
  rfc: string;
  nombre: string;
  regimenFiscal: string; // ej. "601" (General de Ley Personas Morales)
  lugarExpedicion: string; // Código postal matriz (ej. "77500")
}

export interface CfdiPayrollReceiver {
  rfc: string;
  curp?: string;
  nombre: string;
  codigoPostal: string; // CP fiscal del empleado
  regimenFiscal: string; // "605" (Sueldos y Salarios)
  numEmpleado: string;
  departamento: string;
  puesto: string;
  nss?: string;
  fechaInicioRelaboral?: string;
  banco?: string;
  clabe?: string;
}

export interface CfdiPayrollConcepts {
  diasTrabajados: number;
  sueldoBasePeriodo: number;
  horasExtras: number;
  importeHorasExtras: number;
  bonoPuntualidad: number;
  bonoAsistencia: number;
  bonoDesempeno: number;
  descuentoFaltas: number;
  descuentoRetardos: number;
  retencionImss: number;
  retencionIsr: number;
  totalPercepciones: number;
  totalDeducciones: number;
  netoAPagar: number;
}

export interface GenerateCfdiPayrollParams {
  folio: string;
  serie?: string;
  fechaEmision: string; // Formato ISO AAAA-MM-DDThh:mm:ss
  fechaPago: string;
  fechaInicioPeriodo: string;
  fechaFinPeriodo: string;
  emisor: CfdiPayrollEmitter;
  receptor: CfdiPayrollReceiver;
  conceptos: CfdiPayrollConcepts;
}

/**
 * Escapa caracteres especiales para XML seguro
 */
function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Formatea importes con 2 decimales para el SAT
 */
function formatSatAmount(amount: number): string {
  return (Math.round(amount * 100) / 100).toFixed(2);
}

/**
 * Genera el XML del comprobante CFDI 4.0 con Complemento de Nómina 1.2
 */
export function buildCfdiPayrollXml(params: GenerateCfdiPayrollParams): string {
  const {
    folio,
    serie = "NOM",
    fechaEmision,
    fechaPago,
    fechaInicioPeriodo,
    fechaFinPeriodo,
    emisor,
    receptor,
    conceptos,
  } = params;

  const totalPercepciones = formatSatAmount(conceptos.totalPercepciones);
  const totalDeducciones = formatSatAmount(conceptos.totalDeducciones);
  const totalNeto = formatSatAmount(conceptos.netoAPagar);

  const curp = receptor.curp || "XXXX010101HXXXXX00";
  const clabeAttr = receptor.clabe && /^\d{18}$/.test(receptor.clabe) ? `CuentaBancaria="${receptor.clabe}"` : "";
  const nssAttr = receptor.nss ? `NumSeguridadSocial="${escapeXml(receptor.nss)}"` : `NumSeguridadSocial="00000000000"`;
  const fechaInicioLab = receptor.fechaInicioRelaboral || fechaInicioPeriodo;

  return `<?xml version="1.0" encoding="UTF-8"?>
<cfdi:Comprobante xmlns:cfdi="http://www.sat.gob.mx/cfd/4" xmlns:nom12="http://www.sat.gob.mx/nomina12" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.sat.gob.mx/cfd/4 http://www.sat.gob.mx/sitio_internet/cfd/4/cfdv40.xsd http://www.sat.gob.mx/nomina12 http://www.sat.gob.mx/sitio_internet/cfd/nomina/nomina12.xsd" Version="4.0" Serie="${escapeXml(serie)}" Folio="${escapeXml(folio)}" Fecha="${fechaEmision}" SubTotal="${totalPercepciones}" Descuento="${totalDeducciones}" Total="${totalNeto}" Moneda="MXN" TipoDeComprobante="N" Exportacion="01" MetodoPago="PUE" LugarExpedicion="${escapeXml(emisor.lugarExpedicion || "77500")}">
  <cfdi:Emisor Rfc="${escapeXml(emisor.rfc)}" Nombre="${escapeXml(emisor.nombre)}" RegimenFiscal="${escapeXml(emisor.regimenFiscal || "601")}"/>
  <cfdi:Receptor Rfc="${escapeXml(receptor.rfc)}" Nombre="${escapeXml(receptor.nombre)}" DomicilioFiscalReceptor="${escapeXml(receptor.codigoPostal || "77500")}" RegimenFiscalReceptor="${escapeXml(receptor.regimenFiscal || "605")}" UsoCFDI="CN01"/>
  <cfdi:Conceptos>
    <cfdi:Concepto ClaveProdServ="84111505" Cantidad="1" ClaveUnidad="ACT" Descripcion="Pago de nómina quincenal" ValorUnitario="${totalPercepciones}" Importe="${totalPercepciones}" Descuento="${totalDeducciones}" ObjetoImp="01"/>
  </cfdi:Conceptos>
  <cfdi:Complemento>
    <nom12:Nomina Version="1.2" TipoNomina="O" FechaPago="${fechaPago}" FechaInicialPago="${fechaInicioPeriodo}" FechaFinalPago="${fechaFinPeriodo}" NumDiasPagados="${conceptos.diasTrabajados.toFixed(3)}" TotalPercepciones="${totalPercepciones}" TotalDeducciones="${totalDeducciones}">
      <nom12:Emisor RfcPatronOrigen="${escapeXml(emisor.rfc)}"/>
      <nom12:Receptor Curp="${escapeXml(curp)}" ${nssAttr} FechaInicioRelLaboral="${fechaInicioLab}" TipoContrato="01" TipoRegimen="02" NumEmpleado="${escapeXml(receptor.numEmpleado)}" Departamento="${escapeXml(receptor.departamento)}" Puesto="${escapeXml(receptor.puesto)}" PeriodicidadPago="04" ${clabeAttr}/>
      <nom12:Percepciones TotalSueldos="${totalPercepciones}" TotalGravado="${totalPercepciones}" TotalExento="0.00">
        <nom12:Percepcion TipoPercepcion="001" Clave="SUELDO" Concepto="Sueldo Base Quincenal" ImporteGravado="${formatSatAmount(conceptos.sueldoBasePeriodo)}" ImporteExento="0.00"/>
        ${conceptos.bonoPuntualidad > 0 ? `<nom12:Percepcion TipoPercepcion="049" Clave="PUNTUALIDAD" Concepto="Premio por Puntualidad" ImporteGravado="${formatSatAmount(conceptos.bonoPuntualidad)}" ImporteExento="0.00"/>` : ""}
        ${conceptos.bonoAsistencia > 0 ? `<nom12:Percepcion TipoPercepcion="049" Clave="ASISTENCIA" Concepto="Premio por Asistencia" ImporteGravado="${formatSatAmount(conceptos.bonoAsistencia)}" ImporteExento="0.00"/>` : ""}
        ${conceptos.bonoDesempeno > 0 ? `<nom12:Percepcion TipoPercepcion="038" Clave="BONO_METAS" Concepto="Bono de Desempeño y Productividad" ImporteGravado="${formatSatAmount(conceptos.bonoDesempeno)}" ImporteExento="0.00"/>` : ""}
        ${conceptos.importeHorasExtras > 0 ? `<nom12:Percepcion TipoPercepcion="019" Clave="HORAS_EXTRA" Concepto="Horas Extras Dobles/Triples" ImporteGravado="${formatSatAmount(conceptos.importeHorasExtras)}" ImporteExento="0.00"/>` : ""}
      </nom12:Percepciones>
      <nom12:Deducciones TotalOtrasDeducciones="${formatSatAmount(conceptos.retencionImss + conceptos.descuentoFaltas + conceptos.descuentoRetardos)}" TotalImpuestosRetenidos="${formatSatAmount(conceptos.retencionIsr)}">
        <nom12:Deduccion TipoDeduccion="002" Clave="ISR" Concepto="Retención Impuesto Sobre la Renta (ISR)" Importe="${formatSatAmount(conceptos.retencionIsr)}"/>
        <nom12:Deduccion TipoDeduccion="001" Clave="IMSS" Concepto="Seguridad Social Cuota Obrera IMSS" Importe="${formatSatAmount(conceptos.retencionImss)}"/>
        ${conceptos.descuentoFaltas > 0 ? `<nom12:Deduccion TipoDeduccion="020" Clave="FALTAS" Concepto="Deducción por Inasistencias Injustificadas" Importe="${formatSatAmount(conceptos.descuentoFaltas)}"/>` : ""}
        ${conceptos.descuentoRetardos > 0 ? `<nom12:Deduccion TipoDeduccion="020" Clave="RETARDOS" Concepto="Deducción por Retardos Acumulados" Importe="${formatSatAmount(conceptos.descuentoRetardos)}"/>` : ""}
      </nom12:Deducciones>
    </nom12:Nomina>
  </cfdi:Complemento>
</cfdi:Comprobante>`.trim();
}
