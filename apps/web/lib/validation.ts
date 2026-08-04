import { z } from "zod";

export const emailSchema = z
  .email("Informe um e-mail válido.")
  .transform((email) => email.trim().toLowerCase());

export const passwordSchema = z
  .string()
  .min(10, "A senha precisa ter pelo menos 10 caracteres.")
  .max(72, "A senha pode ter no máximo 72 caracteres.");

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Informe sua senha."),
});

export const signUpSchema = z.object({
  fullName: z.string().trim().min(3).max(160),
  email: emailSchema,
  password: passwordSchema,
});

export const organizationSchema = z.object({
  name: z.string().trim().min(2).max(160),
});

export const projectSchema = z.object({
  organizationId: z.uuid(),
  name: z.string().trim().min(3).max(200),
  description: z.string().trim().max(2000).optional(),
});

export const licensingProcessSchema = z.object({
  organizationId: z.uuid(),
  projectId: z.uuid(),
  name: z.string().trim().min(3).max(200),
  agency: z.string().trim().max(160).optional(),
  municipality: z.string().trim().max(160).optional(),
  state: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{2}$/, "Use a sigla da UF com duas letras."),
  activity: z.string().trim().max(200).optional(),
});

export const invitationSchema = z.object({
  organizationId: z.uuid(),
  email: emailSchema,
  role: z.enum(["admin", "analyst", "reviewer", "viewer"]),
});

export function slugifyOrganizationName(name: string) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 64);
}
