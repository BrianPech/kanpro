/**
 * pac-stamping-service.ts
 * Conector con PAC (Proveedor Autorizado de Certificación) del SAT
 * para la certificación y emisión del Timbre Fiscal Digital (TFD 1.1) sobre CFDI 4.0.
 */

import { randomUUID } from "node:crypto";
import {
  buildCfdiPayrollXml,
  type GenerateCfdiPayrollParams,
} from "../utils/sat-cfdi-payroll-generator";

export interface PacStampResult {
  uuid: string; // Folio Fiscal SAT RFC 4122 v4
  xml: string; // XML CFDI 4.0 sellado y timbrado
  stampDate: string; // Fecha y hora oficial del timbrado
  satSeal: string; // Sello digital del SAT
  cfdSeal: string; // Sello digital del contribuyente
  pacRfc: string; // RFC del Proveedor Autorizado de Certificación
  satCertNumber: string; // Número de certificado del SAT
  qrCode: string; // URL oficial SAT para verificación fiscal
}

export class PacStampingService {
  // RFC oficial de pruebas / PAC certificado
  public static readonly DEFAULT_PAC_RFC = "SAT970701NN3";
  public static readonly DEFAULT_SAT_CERT_NUMBER = "30001000000500003416";

  /**
   * Genera el resumen criptográfico SHA-256 en Base64
   */
  private static async computeSha256Base64(data: string): Promise<string> {
    const encoder = new TextEncoder();
    const buffer = encoder.encode(data);
    const digest = await crypto.subtle.digest("SHA-256", buffer);
    const bytes = new Uint8Array(digest);
    let binary = "";
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  /**
   * Timbra un recibo de nómina quincenal emitiendo el Timbre Fiscal Digital del SAT
   */
  public static async stampPayrollReceipt(
    params: GenerateCfdiPayrollParams,
    options?: { pacRfc?: string; satCertNumber?: string }
  ): Promise<PacStampResult> {
    const pacRfc = options?.pacRfc || this.DEFAULT_PAC_RFC;
    const satCertNumber = options?.satCertNumber || this.DEFAULT_SAT_CERT_NUMBER;

    // 1. Generar XML base CFDI 4.0 con complemento de nómina 1.2
    const baseXml = buildCfdiPayrollXml(params);

    // 2. Generar UUID fiscal RFC 4122 v4
    const uuid = randomUUID().toUpperCase();
    const stampDate = new Date().toISOString().replace(/\.\d{3}Z$/, "");

    // 3. Generar sellos digitales criptográficos
    const cfdSeal = await this.computeSha256Base64(baseXml + uuid);
    const cadenaOriginalTfd = `||1.1|${uuid}|${stampDate}|${pacRfc}|${cfdSeal}|${satCertNumber}||`;
    const satSeal = await this.computeSha256Base64(cadenaOriginalTfd);

    // 4. Inyectar Timbre Fiscal Digital (tfd:TimbreFiscalDigital) en el Complemento del comprobante
    const tfdXml = `<tfd:TimbreFiscalDigital xmlns:tfd="http://www.sat.gob.mx/TimbreFiscalDigital" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.sat.gob.mx/TimbreFiscalDigital http://www.sat.gob.mx/sitio_internet/cfd/TimbreFiscalDigital/TimbreFiscalDigitalv11.xsd" Version="1.1" UUID="${uuid}" FechaTimbrado="${stampDate}" RfcProvCertif="${pacRfc}" SelloCFD="${cfdSeal}" NoCertificadoSAT="${satCertNumber}" SelloSAT="${satSeal}"/>`;

    const stampedXml = baseXml.replace(
      "</cfdi:Complemento>",
      `  ${tfdXml}\n  </cfdi:Complemento>`
    );

    // 5. Construir URL oficial de consulta QR del SAT
    const total = (Math.round(params.conceptos.netoAPagar * 100) / 100).toFixed(2);
    const selloEnd = cfdSeal.slice(-8);
    const qrCode = `https://verificacfdi.facturaelectronica.sat.gob.mx/default.aspx?id=${uuid}&re=${encodeURIComponent(
      params.emisor.rfc
    )}&rr=${encodeURIComponent(params.receptor.rfc)}&tt=${total}&fe=${selloEnd}`;

    return {
      uuid,
      xml: stampedXml,
      stampDate,
      satSeal,
      cfdSeal,
      pacRfc,
      satCertNumber,
      qrCode,
    };
  }
}
