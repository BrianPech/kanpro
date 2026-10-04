/**
 * Value Objects para identificación fiscal y laboral mexicana (RFC, CURP, NSS)
 * Conforme a .agents/rules/domain-patterns.md
 */

const RFC_MORAL_REGEX = /^[A-ZÑ&]{3}[0-9]{6}[A-Z0-9]{3}$/i;
const RFC_FISICA_REGEX = /^[A-ZÑ&]{4}[0-9]{6}[A-Z0-9]{3}$/i;
const CURP_REGEX = /^[A-Z]{4}[0-9]{6}[HM][A-Z]{5}[A-Z0-9][0-9]$/i;
const NSS_REGEX = /^[0-9]{11}$/;

export class MexicanRFC {
  private readonly value: string;

  constructor(raw: string) {
    const trimmed = raw.trim().toUpperCase();
    if (!MexicanRFC.isValid(trimmed)) {
      throw new Error(`El RFC '${raw}' no cumple con el formato fiscal oficial del SAT.`);
    }
    this.value = trimmed;
  }

  public static isValid(raw?: string | null): boolean {
    if (!raw) return false;
    const clean = raw.trim().toUpperCase();
    return RFC_MORAL_REGEX.test(clean) || RFC_FISICA_REGEX.test(clean);
  }

  public getValue(): string {
    return this.value;
  }

  public isMoral(): boolean {
    return this.value.length === 12;
  }

  public isFisica(): boolean {
    return this.value.length === 13;
  }
}

export class MexicanCURP {
  private readonly value: string;

  constructor(raw: string) {
    const trimmed = raw.trim().toUpperCase();
    if (!MexicanCURP.isValid(trimmed)) {
      throw new Error(`La CURP '${raw}' no cumple con el formato oficial de RENAPO (18 caracteres alfanuméricos).`);
    }
    this.value = trimmed;
  }

  public static isValid(raw?: string | null): boolean {
    if (!raw) return false;
    const clean = raw.trim().toUpperCase();
    return CURP_REGEX.test(clean);
  }

  public getValue(): string {
    return this.value;
  }

  public getGender(): "H" | "M" | null {
    const char = this.value.charAt(10);
    return char === "H" || char === "M" ? char : null;
  }

  public getBirthDateShort(): string {
    // Digits 4 to 9: AAMMDD
    return this.value.substring(4, 10);
  }
}

export class MexicanNSS {
  private readonly value: string;

  constructor(raw: string) {
    const trimmed = raw.trim();
    if (!MexicanNSS.isValid(trimmed)) {
      throw new Error(`El NSS '${raw}' debe contener exactamente 11 dígitos numéricos.`);
    }
    this.value = trimmed;
  }

  public static isValid(raw?: string | null): boolean {
    if (!raw) return false;
    const clean = raw.trim();
    return NSS_REGEX.test(clean);
  }

  public getValue(): string {
    return this.value;
  }
}
