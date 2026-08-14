import { inflateRawSync } from "node:zlib";

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

function inspectOfficeZip(bytes: Buffer) {
  const centralHeader = Buffer.from([0x50, 0x4b, 0x01, 0x02]);
  const localHeader = Buffer.from([0x50, 0x4b, 0x03, 0x04]);
  const names: string[] = [];
  let cursor = 0;
  let entries = 0;
  let uncompressedTotal = 0;
  let index = bytes.indexOf(centralHeader, cursor);

  while (index >= 0) {
    if (index + 46 > bytes.length) throw new Error("A estrutura ZIP do documento está truncada.");
    const flags = bytes.readUInt16LE(index + 8);
    const method = bytes.readUInt16LE(index + 10);
    const compressedSize = bytes.readUInt32LE(index + 20);
    const uncompressedSize = bytes.readUInt32LE(index + 24);
    const fileNameLength = bytes.readUInt16LE(index + 28);
    const extraLength = bytes.readUInt16LE(index + 30);
    const commentLength = bytes.readUInt16LE(index + 32);
    const localOffset = bytes.readUInt32LE(index + 42);
    const end = index + 46 + fileNameLength + extraLength + commentLength;
    if (end > bytes.length) throw new Error("A estrutura ZIP do documento está truncada.");
    if (flags & 0x0001) throw new Error("Documentos Office criptografados não são permitidos.");
    if (![0, 8].includes(method)) throw new Error("O método de compactação do documento Office não é permitido.");
    if (compressedSize === 0 && uncompressedSize > 0) throw new Error("O documento Office contém entrada ZIP incompatível.");
    if (compressedSize > 0 && uncompressedSize / compressedSize > 100) throw new Error("O documento Office excede o limite de compressão estrutural permitido.");
    uncompressedTotal += uncompressedSize;
    if (uncompressedTotal > 64 * 1024 * 1024) throw new Error("O documento Office excede o limite estrutural descompactado permitido.");
    const name = bytes.subarray(index + 46, index + 46 + fileNameLength).toString("utf8");
    if (!name || name.includes("\0") || name.startsWith("/") || /^[a-zA-Z]:/.test(name) || name.split("/").includes("..") || name.includes("\\")) throw new Error("A estrutura compactada do documento contém caminho incompatível.");
    if (name.toLowerCase().endsWith("vbaproject.bin")) throw new Error("Documentos Office com macro não são permitidos.");
    names.push(name);
    if (name.toLowerCase().endsWith(".rels")) {
      if (localOffset + 30 > bytes.length || !bytes.subarray(localOffset, localOffset + 4).equals(localHeader)) throw new Error("A estrutura ZIP do documento está truncada.");
      const localNameLength = bytes.readUInt16LE(localOffset + 26);
      const localExtraLength = bytes.readUInt16LE(localOffset + 28);
      const dataStart = localOffset + 30 + localNameLength + localExtraLength;
      const dataEnd = dataStart + compressedSize;
      if (dataEnd > bytes.length) throw new Error("A estrutura ZIP do documento está truncada.");
      const raw = bytes.subarray(dataStart, dataEnd);
      const relationXml = method === 8 ? inflateRawSync(raw).toString("utf8") : raw.toString("utf8");
      if (/targetmode\s*=\s*["']external["']/i.test(relationXml)) throw new Error("Documentos Office com relações externas não são permitidos.");
    }
    entries += 1;
    if (entries > 3_000) throw new Error("O documento Office excede o limite de entradas estruturais permitido.");
    cursor = end;
    index = bytes.indexOf(centralHeader, cursor);
  }

  if (entries === 0 || !names.includes("[Content_Types].xml") || !(names.some((name) => name.startsWith("word/")) || names.some((name) => name.startsWith("xl/")))) throw new Error("O container Office não possui a estrutura esperada para DOCX ou XLSX.");
}

export function validateEvidenceUpload(input: { mimeType: string; sizeBytes: number; fileName?: string; bytes?: Buffer }) {
  const allowed = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "text/csv", "image/jpeg", "image/png"] as const;
  if (!allowed.includes(input.mimeType as (typeof allowed)[number])) {
    throw new Error("Formato não permitido. Envie PDF, DOCX, XLSX, CSV, JPG ou PNG.");
  }
  if (input.sizeBytes <= 0 || input.sizeBytes > maximumEvidenceBytes) {
    throw new Error("O arquivo deve ter até 8 MB.");
  }
  if (input.fileName && !/\.(pdf|docx|xlsx|csv|jpg|jpeg|png)$/i.test(input.fileName)) throw new Error("A extensão do arquivo não corresponde à allowlist permitida.");
  if (input.bytes) {
    if (input.bytes.byteLength !== input.sizeBytes) throw new Error("O tamanho do arquivo não confere com o upload.");
    const signature = input.bytes.subarray(0, 4).toString("binary");
    const expectsPdf = input.mimeType === "application/pdf";
    const expectsOffice = input.mimeType.includes("openxmlformats");
    const expectsJpeg = input.mimeType === "image/jpeg";
    const expectsPng = input.mimeType === "image/png";
    if ((expectsPdf && signature !== "%PDF") || (expectsOffice && signature !== "PK\x03\x04") || (expectsJpeg && !input.bytes.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))) || (expectsPng && !input.bytes.subarray(0, 4).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47])))) throw new Error("A assinatura do arquivo não corresponde ao formato declarado.");
    if (input.mimeType === "text/csv" && input.bytes.subarray(0, Math.min(input.bytes.length, 512)).includes(0)) throw new Error("CSV com bytes nulos não é permitido.");
    if (expectsOffice) {
      inspectOfficeZip(input.bytes);
    }
  }
}
