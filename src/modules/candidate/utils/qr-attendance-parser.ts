export interface ParsedQrAttendance {
  token: string;
  companyId?: string;
  companyName?: string;
  branchName?: string;
  branchLat?: number;
  branchLng?: number;
  radiusMeters?: number;
}

/**
 * Extracts structured attendance parameters from a scanned QR payload or URL.
 * Supports:
 * - Direct URLs: `/checkin?...` or `https://.../checkin?...`
 * - Legacy deep-links: `KANPRO://CHECKIN?...`
 * - JSON string payloads: `{"token": "...", ...}`
 * - Plain token strings: `V1234`
 */
export function parseQrAttendancePayload(rawInput: string): ParsedQrAttendance {
  const trimmed = rawInput.trim();
  if (!trimmed) {
    return { token: "" };
  }

  // 1. JSON payload support
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    try {
      const obj = JSON.parse(trimmed);
      return {
        token: String(obj.token || obj.qrToken || obj.t || trimmed),
        companyId: obj.companyId || obj.company || obj.c,
        companyName: obj.companyName || obj.company || obj.c,
        branchName: obj.branchName || obj.branch || obj.b,
        branchLat: obj.lat != null ? Number(obj.lat) : undefined,
        branchLng: obj.lng != null ? Number(obj.lng) : undefined,
        radiusMeters: obj.radius != null ? Number(obj.radius) : undefined,
      };
    } catch {
      // Continue with URL parser
    }
  }

  // 2. URL parsing (HTTP, HTTPS, relative path, or KANPRO:// custom scheme)
  let urlObj: URL | null = null;
  try {
    if (trimmed.startsWith("KANPRO://CHECKIN")) {
      urlObj = new URL(trimmed.replace(/^KANPRO:\/\/CHECKIN/i, "https://kanpro.internal/checkin"));
    } else if (trimmed.startsWith("/") || trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
      urlObj = new URL(trimmed, "https://kanpro.internal");
    }
  } catch {
    urlObj = null;
  }

  if (urlObj && (urlObj.pathname.includes("checkin") || urlObj.searchParams.has("t") || urlObj.searchParams.has("token"))) {
    const sp = urlObj.searchParams;
    const token = sp.get("t") || sp.get("token") || sp.get("tokenVersion") || "";
    const company = sp.get("c") || sp.get("company") || sp.get("companyId") || undefined;
    const branch = sp.get("b") || sp.get("branch") || sp.get("branchName") || undefined;
    const latStr = sp.get("lat");
    const lngStr = sp.get("lng");
    const rStr = sp.get("r") || sp.get("radius") || sp.get("radiusMeters");

    return {
      token,
      companyId: company,
      companyName: company,
      branchName: branch,
      branchLat: latStr ? parseFloat(latStr) : undefined,
      branchLng: lngStr ? parseFloat(lngStr) : undefined,
      radiusMeters: rStr ? parseFloat(rStr) : undefined,
    };
  }

  // 3. Fallback: treat as direct plain token (only if not a URL)
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://") || trimmed.startsWith("/")) {
    return { token: "" };
  }

  return {
    token: trimmed,
  };
}
