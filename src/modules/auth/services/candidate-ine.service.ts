import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";
import {
  candidateAddressSchema,
  candidatePersonalReviewSchema,
  type CandidateAddressValues,
  type CandidateOnboardingDraft,
  type CandidatePersonalReviewInput,
  type ExtractedIneData,
} from "../schemas/candidate-onboarding.schema";

const PROFILE_DOCUMENTS_BUCKET = "profile_documents";
const MAX_INE_IMAGE_BYTES = 2 * 1024 * 1024; // 2 MB (matches bucket file_size_limit)
const ALLOWED_INE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const CURP_STATE_MAP: Record<string, string> = {
  AS: "Aguascalientes",
  BC: "Baja California",
  BS: "Baja California Sur",
  CC: "Campeche",
  CL: "Coahuila",
  CM: "Colima",
  CS: "Chiapas",
  CH: "Chihuahua",
  DF: "Ciudad de México",
  DG: "Durango",
  GT: "Guanajuato",
  GR: "Guerrero",
  HG: "Hidalgo",
  JC: "Jalisco",
  MC: "Estado de México",
  MN: "Michoacán",
  MS: "Morelos",
  NT: "Nayarit",
  NL: "Nuevo León",
  OC: "Oaxaca",
  PL: "Puebla",
  QT: "Querétaro",
  QR: "Quintana Roo",
  SP: "San Luis Potosí",
  SL: "Sinaloa",
  SR: "Sonora",
  TC: "Tabasco",
  TS: "Tamaulipas",
  TL: "Tlaxcala",
  VZ: "Veracruz",
  YN: "Yucatán",
  ZS: "Zacatecas",
  NE: "Nacido en el Extranjero",
};

const CURP_REGEX = /[A-Z]{4}(\d{2})(\d{2})(\d{2})([HMX])([A-Z]{2})[A-Z]{3}([A-Z0-9])\d/;
const ELECTOR_KEY_REGEX = /\b[A-Z]{6}\d{8}[HM]\d{3}\b/;

const INE_STATE_PATTERNS: ReadonlyArray<{ pattern: RegExp; name: string }> = [
  { pattern: /\bQ\.?\s*ROO\b|\bQUINTANA\s*ROO\b/i, name: "Quintana Roo" },
  { pattern: /\bYUC\.?\b|\bYUCAT[AÁ]N\b/i, name: "Yucatán" },
  { pattern: /\bCDMX\b|\bD\.?\s*F\.?\b|\bCIUDAD\s+DE\s+M[EÉ]XICO\b/i, name: "Ciudad de México" },
  { pattern: /\bEDOMEX\b|\bEDO\.?\s*DE\s*M[EÉ]X\b|\bESTADO\s+DE\s+M[EÉ]XICO\b|\bM[EÉ]X\.?\b/i, name: "Estado de México" },
  { pattern: /\bB\.?\s*C\.?\s*S\.?\b|\bBAJA\s+CALIFORNIA\s+SUR\b/i, name: "Baja California Sur" },
  { pattern: /\bB\.?\s*C\.?\b|\bBAJA\s+CALIFORNIA\b/i, name: "Baja California" },
  { pattern: /\bN\.?\s*L\.?\b|\bNUEVO\s+LE[OÓ]N\b/i, name: "Nuevo León" },
  { pattern: /\bS\.?\s*L\.?\s*P\.?\b|\bSAN\s+LUIS\s+POTOS[IÍ]\b/i, name: "San Luis Potosí" },
  { pattern: /\bAGS\.?\b|\bAGUASCALIENTES\b/i, name: "Aguascalientes" },
  { pattern: /\bCAMP\.?\b|\bCAMPECHE\b/i, name: "Campeche" },
  { pattern: /\bCOAH\.?\b|\bCOAHUILA\b/i, name: "Coahuila" },
  { pattern: /\bCOL\.?\b|\bCOLIMA\b/i, name: "Colima" },
  { pattern: /\bCHIS\.?\b|\bCHIAPAS\b/i, name: "Chiapas" },
  { pattern: /\bCHIH\.?\b|\bCHIHUAHUA\b/i, name: "Chihuahua" },
  { pattern: /\bDGO\.?\b|\bDURANGO\b/i, name: "Durango" },
  { pattern: /\bGTO\.?\b|\bGUANAJUATO\b/i, name: "Guanajuato" },
  { pattern: /\bGRO\.?\b|\bGUERRERO\b/i, name: "Guerrero" },
  { pattern: /\bHGO\.?\b|\bHIDALGO\b/i, name: "Hidalgo" },
  { pattern: /\bJAL\.?\b|\bJALISCO\b/i, name: "Jalisco" },
  { pattern: /\bMICH\.?\b|\bMICHOAC[AÁ]N\b/i, name: "Michoacán" },
  { pattern: /\bMOR\.?\b|\bMORELOS\b/i, name: "Morelos" },
  { pattern: /\bNAY\.?\b|\bNAYARIT\b/i, name: "Nayarit" },
  { pattern: /\bOAX\.?\b|\bOAXACA\b/i, name: "Oaxaca" },
  { pattern: /\bPUE\.?\b|\bPUEBLA\b/i, name: "Puebla" },
  { pattern: /\bQRO\.?\b|\bQUER[EÉ]TARO\b/i, name: "Querétaro" },
  { pattern: /\bSIN\.?\b|\bSINALOA\b/i, name: "Sinaloa" },
  { pattern: /\bSON\.?\b|\bSONORA\b/i, name: "Sonora" },
  { pattern: /\bTAB\.?\b|\bTABASCO\b/i, name: "Tabasco" },
  { pattern: /\bTAMPS\.?\b|\bTAMAULIPAS\b/i, name: "Tamaulipas" },
  { pattern: /\bTLAX\.?\b|\bTLAXCALA\b/i, name: "Tlaxcala" },
  { pattern: /\bVER\.?\b|\bVERACRUZ\b/i, name: "Veracruz" },
  { pattern: /\bZAC\.?\b|\bZACATECAS\b/i, name: "Zacatecas" },
];

function toTitleCase(input: string): string {
  return input
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .map((word) => {
      if (!word) return "";
      if (["de", "del", "la", "las", "los", "y"].includes(word)) return word;
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");
}

/**
 * Strips short OCR artifacts emitted along the left portrait photo edge
 * (e.g. "El A ", "El Ae ", "El de ") and trailing 1-2 char hologram noise (" D", " Mu").
 */
function stripIneEdgeNoise(raw: string): string {
  let cleaned = raw.replace(/\s+/g, " ").trim();
  // Strip repeated short 1-2 letter leading tokens (e.g. "El A ", "El Ae ", "El de "), preserving "AV"/"MZ"/"LT"
  cleaned = cleaned.replace(
    /^(?:(?!(?:AV|MZ|LT)\b)(?:EL|LA|DE|AE|AL|EN|A|E|I|O|U|[A-Z]{1,2})\s+){1,3}(?=[A-ZÁÉÍÓÚÑ]{3,}|AV\.?|C\.?\s*\d|CALLE\b)/i,
    ""
  );
  // Strip trailing isolated 1-2 letter noise tokens (except valid short street directions like N, S, E, O)
  cleaned = cleaned.replace(/\s+(?:[A-Z]{1,2})\.?$/i, (match) => {
    const token = match.trim().replace(/\.$/, "").toUpperCase();
    if (["N", "S", "E", "O", "NE", "NO", "SE", "SO"].includes(token)) {
      return match;
    }
    return "";
  });
  // Fix common glued Spanish words from OCR (e.g. "PLAYADEL CARMEN" -> "PLAYA DEL CARMEN")
  cleaned = cleaned.replace(/\b([A-ZÁÉÍÓÚÑ]{3,})DEL\b/gi, "$1 DEL");
  return cleaned.trim();
}

function normalizeStateName(raw: string): string {
  const cleaned = raw.replace(/[.,]+$/g, "").trim();
  for (const { pattern, name } of INE_STATE_PATTERNS) {
    if (pattern.test(cleaned)) return name;
  }
  return toTitleCase(stripIneEdgeNoise(cleaned));
}

export function parseIneMrzText(rawText: string): Partial<ExtractedIneData> {
  const extracted: Partial<ExtractedIneData> = {};
  const lines = rawText
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+/g, "").toUpperCase())
    .filter(Boolean);

  // Line 2 of Mexican INE TD1 MRZ: YYMMDD[check][M/H/F]YYMMDD[check]MEX...
  for (const line of lines) {
    const mrzLine2 = line.match(/(\d{6})\d([HMF])(\d{6})\d?MEX/);
    if (mrzLine2) {
      const [, birthYYMMDD, genderChar, expYYMMDD] = mrzLine2;
      const bYY = Number(birthYYMMDD.slice(0, 2));
      const bMM = Number(birthYYMMDD.slice(2, 4));
      const bDD = Number(birthYYMMDD.slice(4, 6));
      const currentTwoDigitYear = new Date().getFullYear() % 100;
      const birthYear = bYY > currentTwoDigitYear ? 1900 + bYY : 2000 + bYY;
      if (bMM >= 1 && bMM <= 12 && bDD >= 1 && bDD <= 31) {
        extracted.birthDate = `${birthYear}-${String(bMM).padStart(2, "0")}-${String(bDD).padStart(2, "0")}`;
      }
      extracted.gender = genderChar === "F" ? "M" : (genderChar as "H" | "M");
      const expYear = 2000 + Number(expYYMMDD.slice(0, 2));
      if (expYear >= 2020 && expYear <= 2060) {
        extracted.ineValidityYear = expYear;
      }
    }

    // Line 3 of Mexican INE TD1 MRZ: APELLIDO1<APELLIDO2<<NOMBRE1<NOMBRE2<<<
    const mrzLine3 = line.match(/^([A-ZÑ<]+?)<<([A-ZÑ<]+)$/);
    if (mrzLine3 && !line.startsWith("IDMEX")) {
      const surnames = mrzLine3[1].replace(/<+/g, " ").trim();
      const givenNames = mrzLine3[2].replace(/<+/g, " ").trim();
      if (surnames.length >= 2 && givenNames.length >= 2) {
        extracted.fullName = toTitleCase(`${givenNames} ${surnames}`);
      }
    }
  }

  return extracted;
}

export function parseIneFrontText(rawText: string): Partial<ExtractedIneData> {
  const extracted: Partial<ExtractedIneData> = {};
  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.replace(/\s+/g, " ").trim())
    .filter(Boolean);
  const upperFull = lines.join("\n").toUpperCase();

  // 1. CURP (gives birthDate, gender, and fallback birth state)
  const curpParsed = parseMexicanCurp(upperFull);
  if (curpParsed) {
    extracted.curp = curpParsed.curp;
    if (curpParsed.birthDate) extracted.birthDate = curpParsed.birthDate;
    if (curpParsed.gender) extracted.gender = curpParsed.gender;
  }

  // 2. Clave de Elector
  const electorMatch = upperFull.match(ELECTOR_KEY_REGEX);
  if (electorMatch) {
    extracted.electorKey = electorMatch[0];
  }

  // 3. Fallback Birth Date printed as DD/MM/YYYY
  if (!extracted.birthDate) {
    const dateMatch = upperFull.match(/\b(\d{2})\/(\d{2})\/((?:19|20)\d{2})\b/);
    if (dateMatch) {
      extracted.birthDate = `${dateMatch[3]}-${dateMatch[2]}-${dateMatch[1]}`;
    }
  }

  // 4. Vigencia (e.g., 2031 or 2021-2031)
  const vigenciaMatch = upperFull.match(/VIGENCIA[^\d]*(?:20\d{2}\s*[-–]\s*)?(20\d{2})\b/);
  if (vigenciaMatch) {
    const yr = Number(vigenciaMatch[1]);
    if (yr >= 2020 && yr <= 2060) extracted.ineValidityYear = yr;
  }

  // 5. Nombre block (lines right after NOMBRE before DOMICILIO / CLAVE / CURP)
  const nombreIdx = lines.findIndex((l) => /\bNOMBRE\b/i.test(l));
  if (nombreIdx !== -1) {
    const nameLines: string[] = [];
    for (let i = nombreIdx + 1; i < Math.min(lines.length, nombreIdx + 5); i++) {
      const candidate = lines[i];
      if (
        /\b(DOMICILIO|CLAVE|CURP|FECHA|SEXO|AÑO|VIGENCIA|SECCION|SECCIÓN)\b/i.test(
          candidate
        )
      ) {
        break;
      }
      const cleaned = candidate.replace(/[^A-ZÁÉÍÓÚÑ\s]/gi, "").trim();
      if (cleaned.length >= 2) {
        nameLines.push(cleaned);
      }
    }
    if (nameLines.length === 3) {
      // Mexican INE prints: Paterno / Materno / Nombre(s)
      extracted.fullName = toTitleCase(
        `${nameLines[2]} ${nameLines[0]} ${nameLines[1]}`
      );
    } else if (nameLines.length === 2) {
      extracted.fullName = toTitleCase(`${nameLines[1]} ${nameLines[0]}`);
    }
  }

  // 6. Domicilio block (lines after DOMICILIO before CLAVE / CURP / AÑO)
  const domIdx = lines.findIndex((l) => /\bDOMICILIO\b/i.test(l));
  if (domIdx !== -1) {
    const addrLines: string[] = [];
    for (let i = domIdx + 1; i < Math.min(lines.length, domIdx + 6); i++) {
      const candidate = lines[i];
      if (
        /\b(CLAVE|CURP|AÑO DE REGISTRO|VIGENCIA|SECCION|SECCIÓN|EMISION|EMISIÓN)\b/i.test(
          candidate
        )
      ) {
        break;
      }
      addrLines.push(candidate);
    }

    if (addrLines.length > 0) {
      // First line: street + exterior (including Mz/Lt in Southeast Mexico) + optional interior
      const streetLine = stripIneEdgeNoise(addrLines[0]);
      const intMatch = streetLine.match(/\b(?:INT\.?|INTERIOR)\s*([A-Z0-9-]+)\b/i);
      if (intMatch) {
        extracted.interiorNumber = intMatch[1].toUpperCase();
      }
      const withoutInt = streetLine
        .replace(/\b(?:INT\.?|INTERIOR)\s*[A-Z0-9-]+\b/gi, "")
        .trim();

      const mzLtMatch = withoutInt.match(
        /^(.*?)\s+((?:MZ|MZA|MANZANA)[-.\s]*[A-Z0-9]+(?:\s+(?:LT|LOTE)[-.\s]*[A-Z0-9]+)?|(?:LT|LOTE)[-.\s]*[A-Z0-9]+)\s*$/i
      );
      const extMatch = withoutInt.match(
        /^(.*?)(?:\s+(?:NO\.?|NUM\.?|#)?\s*(\d+[A-Z]?|S\/N))\s*$/i
      );

      if (mzLtMatch && mzLtMatch[1].trim().length >= 2) {
        extracted.street = toTitleCase(mzLtMatch[1].trim());
        extracted.exteriorNumber = mzLtMatch[2].replace(/\s+/g, " ").trim().toUpperCase();
      } else if (extMatch && extMatch[1].trim().length >= 2) {
        extracted.street = toTitleCase(extMatch[1].trim());
        extracted.exteriorNumber = extMatch[2].toUpperCase();
      } else {
        extracted.street = toTitleCase(withoutInt);
      }

      // Remaining lines: neighborhood + CP + municipality, state
      for (const rawLine of addrLines.slice(1)) {
        const line = stripIneEdgeNoise(rawLine);
        const cpMatch = line.match(/\b(\d{5})\b/);
        if (cpMatch) {
          extracted.postalCode = cpMatch[1];
          const colPart = stripIneEdgeNoise(
            line
              .replace(cpMatch[0], "")
              .replace(/^\s*(?:COL\.?|FRACC\.?|RES\.?)\s*/i, "")
              .replace(/^COL(?=[A-ZÁÉÍÓÚÑ]{4,})/i, "")
              .replace(/[,\s]+$/g, "")
          );
          if (colPart.length >= 2 && !extracted.neighborhood) {
            extracted.neighborhood = toTitleCase(colPart);
          }
          continue;
        }

        const commaParts = line.split(",");
        if (commaParts.length >= 2) {
          const munPart = stripIneEdgeNoise(commaParts[0]);
          const statePart = commaParts.slice(1).join(",").trim();
          if (munPart.length >= 2) {
            extracted.municipality = toTitleCase(munPart);
          }
          if (statePart.length >= 2) {
            extracted.state = normalizeStateName(statePart);
          }
        } else if (!extracted.neighborhood && line.length >= 3) {
          const cleanedCol = stripIneEdgeNoise(
            line
              .replace(/^\s*(?:COL\.?|FRACC\.?)\s*/i, "")
              .replace(/^COL(?=[A-ZÁÉÍÓÚÑ]{4,})/i, "")
          );
          if (cleanedCol.length >= 2) {
            extracted.neighborhood = toTitleCase(cleanedCol);
          }
        }
      }
    }
  }

  return extracted;
}

async function extractIneWithTesseract(
  front: RawIneUploadFile,
  back?: RawIneUploadFile | null
): Promise<Partial<ExtractedIneData> | null> {
  const { createWorker } = await import("tesseract.js");
  const worker = await createWorker("spa");

  try {
    const frontResult = await worker.recognize(Buffer.from(front.bytes));
    const frontParsed = parseIneFrontText(frontResult.data.text || "");

    let backParsed: Partial<ExtractedIneData> = {};
    if (back) {
      const backResult = await worker.recognize(Buffer.from(back.bytes));
      backParsed = parseIneMrzText(backResult.data.text || "");
    }

    const combined: Partial<ExtractedIneData> = {
      ...frontParsed,
      ...backParsed,
      // Prefer front name only when MRZ didn't yield one
      fullName: backParsed.fullName || frontParsed.fullName,
      birthDate: backParsed.birthDate || frontParsed.birthDate,
      gender: backParsed.gender || frontParsed.gender,
      ineValidityYear:
        backParsed.ineValidityYear || frontParsed.ineValidityYear,
    };

    const hasAnyField = Object.values(combined).some(
      (v) => v !== undefined && v !== ""
    );
    return hasAnyField ? combined : null;
  } catch (error) {
    console.warn("[candidate-ine.service] Tesseract OCR failed:", error);
    return null;
  } finally {
    await worker.terminate();
  }
}

export function parseMexicanCurp(rawCurp: string): {
  curp: string;
  birthDate?: string;
  gender?: "H" | "M" | "X";
  state?: string;
} | null {
  const upper = rawCurp.trim().toUpperCase();
  const match = upper.match(CURP_REGEX);
  if (!match) return null;

  const [curp, yyStr, mmStr, ddStr, genderChar, stateCode, centuryChar] = match;
  const yy = Number(yyStr);
  const mm = Number(mmStr);
  const dd = Number(ddStr);

  // Per RENAPO CURP specification: digit 0-9 in pos 17 => 1900s, letter A-Z => 2000s
  const century = /^\d$/.test(centuryChar) ? 1900 : 2000;
  const fullYear = century + yy;

  let birthDate: string | undefined;
  if (mm >= 1 && mm <= 12 && dd >= 1 && dd <= 31) {
    birthDate = `${fullYear}-${String(mm).padStart(2, "0")}-${String(dd).padStart(2, "0")}`;
  }

  const gender: "H" | "M" | "X" | undefined =
    genderChar === "H" || genderChar === "M" || genderChar === "X"
      ? genderChar
      : undefined;

  return {
    curp,
    birthDate,
    gender,
    state: CURP_STATE_MAP[stateCode],
  };
}

export function parseIneQrPayload(rawPayload: string | null | undefined): Partial<ExtractedIneData> {
  if (!rawPayload || !rawPayload.trim()) return {};
  const text = rawPayload.trim();
  const upper = text.toUpperCase();
  const extracted: Partial<ExtractedIneData> = {};

  const curpParsed = parseMexicanCurp(upper);
  if (curpParsed) {
    extracted.curp = curpParsed.curp;
    if (curpParsed.birthDate) extracted.birthDate = curpParsed.birthDate;
    if (curpParsed.gender) extracted.gender = curpParsed.gender;
    if (curpParsed.state) extracted.state = curpParsed.state;
  }

  const electorMatch = upper.match(ELECTOR_KEY_REGEX);
  if (electorMatch) {
    extracted.electorKey = electorMatch[0];
  }

  // Try structured JSON or key=value pairs if QR contains them
  if (text.startsWith("{")) {
    try {
      const parsed = JSON.parse(text) as Record<string, unknown>;
      if (typeof parsed.nombre === "string") extracted.fullName = parsed.nombre.trim();
      if (typeof parsed.fullName === "string") extracted.fullName = parsed.fullName.trim();
      if (typeof parsed.cp === "string" && /^\d{5}$/.test(parsed.cp.trim())) {
        extracted.postalCode = parsed.cp.trim();
      }
      if (typeof parsed.vigencia === "number") {
        extracted.ineValidityYear = parsed.vigencia;
      }
    } catch {
      // ignore non-JSON payloads
    }
  } else {
    const cpMatch = upper.match(/(?:C\.?P\.?|CP)[\s:]*(\d{5})\b/);
    if (cpMatch) {
      extracted.postalCode = cpMatch[1];
    }
    const validityMatch = upper.match(/VIGENCIA[\s:]*(20\d{2})\b/);
    if (validityMatch) {
      extracted.ineValidityYear = Number(validityMatch[1]);
    }
  }

  return extracted;
}

interface RawIneUploadFile {
  bytes: Uint8Array;
  mimeType: string;
  fileName: string;
}

function extensionFromMime(mimeType: string): string {
  if (mimeType === "image/png") return "png";
  if (mimeType === "image/webp") return "webp";
  return "jpg";
}

function validateIneImage(file: RawIneUploadFile, label: string): void {
  if (!ALLOWED_INE_MIME_TYPES.has(file.mimeType)) {
    throw new Error(
      `Formato inválido para ${label}. Usa JPG, PNG o WEBP.`
    );
  }
  if (file.bytes.byteLength === 0) {
    throw new Error(`La imagen de ${label} está vacía.`);
  }
  if (file.bytes.byteLength > MAX_INE_IMAGE_BYTES) {
    throw new Error(
      `La imagen de ${label} supera el límite de 2 MB.`
    );
  }
}

async function extractIneWithGeminiVision(
  front: RawIneUploadFile,
  back?: RawIneUploadFile | null
): Promise<Partial<ExtractedIneData> | null> {
  const apiKey =
    process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) return null;

  const parts: Array<
    | { text: string }
    | { inline_data: { mime_type: string; data: string } }
  > = [
    {
      text: [
        "Extrae los datos visibles de esta credencial para votar INE de México.",
        "Devuelve SOLO un objeto JSON válido sin markdown con las llaves opcionales:",
        "fullName (nombre completo en formato Título, ej. Ana Martínez López),",
        "birthDate (YYYY-MM-DD),",
        "curp (18 caracteres mayúsculas),",
        "gender ('H' o 'M'),",
        "electorKey (Clave de Elector mayúsculas),",
        "ineValidityYear (año numérico de vigencia, ej. 2031),",
        "postalCode (5 dígitos),",
        "state (estado),",
        "municipality (municipio o alcaldía),",
        "neighborhood (colonia),",
        "street (calle),",
        "exteriorNumber (número exterior),",
        "interiorNumber (número interior si existe).",
        "Omite cualquier campo que no sea claramente legible.",
      ].join(" "),
    },
    {
      inline_data: {
        mime_type: front.mimeType,
        data: Buffer.from(front.bytes).toString("base64"),
      },
    },
  ];

  if (back) {
    parts.push({
      inline_data: {
        mime_type: back.mimeType,
        data: Buffer.from(back.bytes).toString("base64"),
      },
    });
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts }],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0,
          },
        }),
      }
    );

    if (!response.ok) return null;

    const payload = (await response.json()) as {
      candidates?: Array<{
        content?: { parts?: Array<{ text?: string }> };
      }>;
    };
    const rawText = payload.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) return null;

    const parsed = JSON.parse(rawText) as Record<string, unknown>;
    const result: Partial<ExtractedIneData> = {};

    const assignStr = (
      key: keyof ExtractedIneData,
      value: unknown
    ) => {
      if (typeof value === "string" && value.trim()) {
        (result as Record<string, unknown>)[key] = value.trim();
      }
    };

    assignStr("fullName", parsed.fullName);
    assignStr("birthDate", parsed.birthDate);
    assignStr("curp", parsed.curp);
    assignStr("electorKey", parsed.electorKey);
    assignStr("postalCode", parsed.postalCode);
    assignStr("state", parsed.state);
    assignStr("municipality", parsed.municipality);
    assignStr("neighborhood", parsed.neighborhood);
    assignStr("street", parsed.street);
    assignStr("exteriorNumber", parsed.exteriorNumber);
    assignStr("interiorNumber", parsed.interiorNumber);

    if (
      parsed.gender === "H" ||
      parsed.gender === "M" ||
      parsed.gender === "X"
    ) {
      result.gender = parsed.gender;
    }
    if (
      typeof parsed.ineValidityYear === "number" &&
      parsed.ineValidityYear >= 2020 &&
      parsed.ineValidityYear <= 2060
    ) {
      result.ineValidityYear = Math.trunc(parsed.ineValidityYear);
    }

    return result;
  } catch {
    return null;
  }
}

export async function processCandidateIneCapture(
  supabase: SupabaseClient<Database>,
  userId: string,
  input: {
    front: RawIneUploadFile;
    back?: RawIneUploadFile | null;
    qrData?: string | null;
  }
): Promise<{
  frontPath: string;
  backPath: string | null;
  documentId: string;
  extracted: ExtractedIneData;
}> {
  validateIneImage(input.front, "frente de la INE");
  if (input.back) {
    validateIneImage(input.back, "reverso de la INE");
  }

  const frontExt = extensionFromMime(input.front.mimeType);
  const frontPath = `${userId}/ine_front.${frontExt}`;

  const { error: frontUploadError } = await supabase.storage
    .from(PROFILE_DOCUMENTS_BUCKET)
    .upload(frontPath, input.front.bytes, {
      upsert: true,
      contentType: input.front.mimeType,
      cacheControl: "86400",
    });

  if (frontUploadError) {
    throw new Error(
      `No se pudo guardar la foto del frente de tu INE: ${frontUploadError.message}`
    );
  }

  let backPath: string | null = null;
  if (input.back) {
    const backExt = extensionFromMime(input.back.mimeType);
    backPath = `${userId}/ine_back.${backExt}`;
    const { error: backUploadError } = await supabase.storage
      .from(PROFILE_DOCUMENTS_BUCKET)
      .upload(backPath, input.back.bytes, {
        upsert: true,
        contentType: input.back.mimeType,
        cacheControl: "86400",
      });

    if (backUploadError) {
      throw new Error(
        `No se pudo guardar la foto del reverso de tu INE: ${backUploadError.message}`
      );
    }
  }

  // Upsert ine_passport metadata row in profile_documents
  const { data: existingDoc } = await supabase
    .from("profile_documents")
    .select("id")
    .eq("owner_id", userId)
    .eq("doc_type", "ine_passport")
    .is("company_id", null)
    .maybeSingle();

  const docPayload = {
    owner_id: userId,
    doc_type: "ine_passport" as const,
    file_url: frontPath,
    file_name: input.front.fileName || `ine_front.${frontExt}`,
    file_size_bytes: input.front.bytes.byteLength,
    status: "pending" as const,
    rejection_reason: null,
    company_id: null,
    updated_at: new Date().toISOString(),
  };

  let documentId = "";
  if (existingDoc?.id) {
    const { error: updateDocError } = await supabase
      .from("profile_documents")
      .update(docPayload)
      .eq("id", existingDoc.id);
    if (updateDocError) {
      throw new Error(
        `No se pudo actualizar el registro de tu INE: ${updateDocError.message}`
      );
    }
    documentId = existingDoc.id;
  } else {
    const { data: insertedDoc, error: insertDocError } = await supabase
      .from("profile_documents")
      .insert(docPayload)
      .select("id")
      .single();
    if (insertDocError || !insertedDoc) {
      throw new Error(
        `No se pudo registrar tu INE: ${insertDocError?.message ?? "Error desconocido"}`
      );
    }
    documentId = insertedDoc.id;
  }

  // Extract structured INE fields: Gemini Vision (if key configured) -> Tesseract local OCR -> QR/CURP
  const qrExtracted = parseIneQrPayload(input.qrData);
  const visionExtracted = await extractIneWithGeminiVision(
    input.front,
    input.back
  );
  const tesseractExtracted = visionExtracted
    ? null
    : await extractIneWithTesseract(input.front, input.back);

  const ocrExtracted = visionExtracted ?? tesseractExtracted ?? {};

  const merged: ExtractedIneData = {
    ...qrExtracted,
    ...ocrExtracted,
    extractionSource: visionExtracted
      ? "gemini"
      : tesseractExtracted
        ? "tesseract"
        : Object.keys(qrExtracted).length > 0
          ? "qr_curp"
          : "none",
  };

  // Persist extracted fields into candidate_private_profiles (non-destructive)
  const privateUpdate: Database["public"]["Tables"]["candidate_private_profiles"]["Insert"] =
    {
      id: userId,
      updated_at: new Date().toISOString(),
    };

  if (merged.curp) privateUpdate.curp = merged.curp;
  if (merged.birthDate) privateUpdate.birth_date = merged.birthDate;
  if (merged.gender) privateUpdate.gender = merged.gender;
  if (merged.electorKey) privateUpdate.elector_key = merged.electorKey;
  if (merged.ineValidityYear) {
    privateUpdate.ine_validity_year = merged.ineValidityYear;
  }
  if (input.qrData?.trim()) {
    privateUpdate.ine_qr_payload = input.qrData.trim();
  }
  if (merged.postalCode) privateUpdate.address_postal_code = merged.postalCode;
  if (merged.state) privateUpdate.address_state = merged.state;
  if (merged.municipality) {
    privateUpdate.address_municipality = merged.municipality;
  }
  if (merged.neighborhood) {
    privateUpdate.address_neighborhood = merged.neighborhood;
  }
  if (merged.street) privateUpdate.address_street = merged.street;
  if (merged.exteriorNumber) {
    privateUpdate.address_exterior_number = merged.exteriorNumber;
  }
  if (merged.interiorNumber) {
    privateUpdate.address_interior_number = merged.interiorNumber;
  }

  const { error: privateError } = await supabase
    .from("candidate_private_profiles")
    .upsert(privateUpdate, { onConflict: "id" });

  if (privateError) {
    throw new Error(
      `No se pudieron guardar los datos extraídos de la INE: ${privateError.message}`
    );
  }

  return {
    frontPath,
    backPath,
    documentId,
    extracted: merged,
  };
}

export async function saveCandidatePersonalReview(
  supabase: SupabaseClient<Database>,
  userId: string,
  rawInput: CandidatePersonalReviewInput
): Promise<{ fullName: string; birthDate: string; whatsappNumber: string }> {
  const validated = candidatePersonalReviewSchema.parse(rawInput);
  const nowIso = new Date().toISOString();

  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      full_name: validated.fullName,
      whatsapp_number: validated.whatsappNumber || null,
      updated_at: nowIso,
    })
    .eq("id", userId);

  if (profileError) {
    throw new Error(
      `No se pudo actualizar tu perfil: ${profileError.message}`
    );
  }

  const privatePayload: Database["public"]["Tables"]["candidate_private_profiles"]["Insert"] =
    {
      id: userId,
      birth_date: validated.birthDate,
      ine_verified_at: nowIso,
      updated_at: nowIso,
    };

  if (validated.curp) privatePayload.curp = validated.curp;
  if (validated.rfc) privatePayload.rfc = validated.rfc;
  if (validated.gender) privatePayload.gender = validated.gender;
  if (validated.electorKey) privatePayload.elector_key = validated.electorKey;
  if (validated.ineValidityYear) {
    privatePayload.ine_validity_year = validated.ineValidityYear;
  }

  const { error: privateError } = await supabase
    .from("candidate_private_profiles")
    .upsert(privatePayload, { onConflict: "id" });

  if (privateError) {
    throw new Error(
      `No se pudieron guardar tus datos privados: ${privateError.message}`
    );
  }

  return {
    fullName: validated.fullName,
    birthDate: validated.birthDate,
    whatsappNumber: validated.whatsappNumber || "",
  };
}

export async function saveCandidateAddress(
  supabase: SupabaseClient<Database>,
  userId: string,
  rawInput: CandidateAddressValues
): Promise<CandidateAddressValues> {
  const validated = candidateAddressSchema.parse(rawInput);
  const nowIso = new Date().toISOString();

  const { error: privateError } = await supabase
    .from("candidate_private_profiles")
    .upsert(
      {
        id: userId,
        address_postal_code: validated.postalCode,
        address_state: validated.state,
        address_municipality: validated.municipality,
        address_neighborhood: validated.neighborhood,
        address_street: validated.street,
        address_exterior_number: validated.exteriorNumber,
        address_interior_number: validated.interiorNumber || null,
        updated_at: nowIso,
      },
      { onConflict: "id" }
    );

  if (privateError) {
    throw new Error(
      `No se pudo guardar tu dirección: ${privateError.message}`
    );
  }

  const formattedLocation = `${validated.municipality}, ${validated.state}`;
  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      location: formattedLocation,
      updated_at: nowIso,
    })
    .eq("id", userId);

  if (profileError) {
    throw new Error(
      `No se pudo actualizar tu ubicación: ${profileError.message}`
    );
  }

  await supabase
    .from("candidate_profiles")
    .upsert(
      {
        id: userId,
        preferred_zone: `${validated.neighborhood}, ${validated.municipality}`,
        updated_at: nowIso,
      },
      { onConflict: "id" }
    );

  return validated;
}

export async function getCandidateOnboardingDraft(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<CandidateOnboardingDraft> {
  const [{ data: profile }, { data: privateProfile }] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name, whatsapp_number")
      .eq("id", userId)
      .maybeSingle(),
    supabase
      .from("candidate_private_profiles")
      .select(
        "birth_date, curp, gender, elector_key, ine_validity_year, address_postal_code, address_state, address_municipality, address_neighborhood, address_street, address_exterior_number, address_interior_number"
      )
      .eq("id", userId)
      .maybeSingle(),
  ]);

  const rawName = (profile?.full_name ?? "").trim();
  const isPlaceholderName =
    rawName.toLowerCase() === "usuario k’anpro" ||
    rawName.toLowerCase() === "usuario k'anpro";

  let formattedBirthDate = "";
  if (privateProfile?.birth_date) {
    const [year, month, day] = privateProfile.birth_date.split("-");
    if (year && month && day) {
      formattedBirthDate = `${day} / ${month} / ${year}`;
    }
  }

  const rawGender = privateProfile?.gender;
  const gender: "H" | "M" | "X" | undefined =
    rawGender === "H" || rawGender === "M" || rawGender === "X"
      ? rawGender
      : undefined;

  return {
    personal: {
      fullName: isPlaceholderName ? "" : rawName,
      birthDate: formattedBirthDate,
      whatsappNumber: profile?.whatsapp_number ?? "",
      curp: privateProfile?.curp ?? undefined,
      gender,
      electorKey: privateProfile?.elector_key ?? undefined,
      ineValidityYear: privateProfile?.ine_validity_year ?? undefined,
    },
    address: {
      postalCode: privateProfile?.address_postal_code ?? "",
      state: privateProfile?.address_state ?? "",
      municipality: privateProfile?.address_municipality ?? "",
      neighborhood: privateProfile?.address_neighborhood ?? "",
      street: privateProfile?.address_street ?? "",
      exteriorNumber: privateProfile?.address_exterior_number ?? "",
      interiorNumber: privateProfile?.address_interior_number ?? "",
    },
  };
}
