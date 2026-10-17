import QRCode from "qrcode";

export interface GenerateQrSvgOptions {
  margin?: number;
  width?: number;
  color?: {
    dark?: string;
    light?: string;
  };
}

/**
 * Generates an SVG string representation of a QR code.
 */
export async function generateQrSvg(
  text: string,
  options?: GenerateQrSvgOptions
): Promise<string> {
  return QRCode.toString(text, {
    type: "svg",
    margin: options?.margin ?? 2,
    width: options?.width ?? 256,
    color: {
      dark: options?.color?.dark ?? "#0f172a",
      light: options?.color?.light ?? "#ffffff",
    },
  });
}

/**
 * Generates a base64 DataURL representation of a QR code.
 */
export async function generateQrDataUrl(
  text: string,
  options?: GenerateQrSvgOptions
): Promise<string> {
  return QRCode.toDataURL(text, {
    margin: options?.margin ?? 2,
    width: options?.width ?? 256,
    color: {
      dark: options?.color?.dark ?? "#0f172a",
      light: options?.color?.light ?? "#ffffff",
    },
  });
}
