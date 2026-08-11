export const permittedEvidenceTypes = ["application/pdf", "image/jpeg", "image/png", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"] as const;
export const maximumEvidenceBytes = 8 * 1024 * 1024;

export function makeOrganizationSlug(name: string) {
  const normalized = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 72);
  return normalized || "organizacao";
}

export function safeEvidenceName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "-").replace(/-+/g, "-").slice(0, 160) || "evidencia";
}

export function validateEvidenceUpload(input: { mimeType: string; sizeBytes: number }) {
  if (!permittedEvidenceTypes.includes(input.mimeType as (typeof permittedEvidenceTypes)[number])) {
    throw new Error("Formato não permitido. Envie PDF, JPG, PNG ou DOCX.");
  }
  if (input.sizeBytes <= 0 || input.sizeBytes > maximumEvidenceBytes) {
    throw new Error("O arquivo deve ter até 8 MB.");
  }
}
