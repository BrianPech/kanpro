export const MAX_AVATAR_BYTES = 1 * 1024 * 1024; // 1 MB post-compression limit
export const MAX_DOCUMENT_BYTES = 2 * 1024 * 1024; // 2 MB post-compression limit

export interface OptimizeImageOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
}

/**
 * Compresses and resizes raster images (JPG, PNG, WEBP) to WebP on the client
 * before uploading to Supabase Storage. Leaves PDFs and non-browser environments untouched.
 */
export async function optimizeImageForStorage(
  file: File,
  options: OptimizeImageOptions = {}
): Promise<{ file: File; previewUrl: string }> {
  const maxWidth = options.maxWidth ?? 1600;
  const maxHeight = options.maxHeight ?? 1600;
  const quality = options.quality ?? 0.82;

  const safeCreatePreview = (blobOrFile: Blob): string => {
    if (typeof URL !== "undefined" && typeof URL.createObjectURL === "function") {
      return URL.createObjectURL(blobOrFile);
    }
    return "";
  };

  if (
    !file.type.startsWith("image/") ||
    file.type === "image/svg+xml" ||
    typeof window === "undefined" ||
    typeof document === "undefined" ||
    typeof Image === "undefined"
  ) {
    return { file, previewUrl: safeCreatePreview(file) };
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        let { width, height } = img;
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.max(1, Math.round(width * ratio));
          height = Math.max(1, Math.round(height * ratio));
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve({ file, previewUrl: safeCreatePreview(file) });
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const outputType = "image/webp";

        canvas.toBlob(
          (blob) => {
            if (!blob || (blob.size >= file.size && file.type === "image/webp")) {
              resolve({ file, previewUrl: safeCreatePreview(file) });
              return;
            }
            const baseName =
              file.name
                .replace(/\.[^/.]+$/, "")
                .replace(/[^a-zA-Z0-9_-]/g, "_") || "image";
            const optimizedFile = new File([blob], `${baseName}.webp`, {
              type: outputType,
            });
            resolve({
              file: optimizedFile,
              previewUrl: safeCreatePreview(blob),
            });
          },
          outputType,
          quality
        );
      };
      img.onerror = () => resolve({ file, previewUrl: safeCreatePreview(file) });
    };
    reader.onerror = () => resolve({ file, previewUrl: safeCreatePreview(file) });
  });
}
