export const MAX_UPLOAD_MB = 15;
export const MAX_UPLOAD_BYTES = MAX_UPLOAD_MB * 1024 * 1024;

export const ALLOWED_MIME = [
  "image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml",
  "application/pdf",
  "video/mp4", "video/webm",
  "text/plain", "text/csv", "text/markdown",
  "application/zip",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];

export function validateUpload(file: File): string | null {
  if (file.size > MAX_UPLOAD_BYTES) return `File is too large. Max ${MAX_UPLOAD_MB} MB.`;
  if (file.type && !ALLOWED_MIME.includes(file.type)) return `File type "${file.type}" is not allowed.`;
  return null;
}

export const UPLOAD_ACCEPT =
  "image/*,application/pdf,video/mp4,video/webm,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.md,.csv,.zip";
