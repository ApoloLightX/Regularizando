import { z } from "zod";

export const EXTRACTOR_VERSION = "spreadsheet-v1";

export type SpreadsheetFileKind = "xlsx" | "csv";
export type CandidateKind = "coordinate" | "monitoring" | "document_pending";
export type ReviewStatus = "proposta" | "confirmada" | "editada" | "rejeitada";
export type SheetClassification =
  | "coordenadas"
  | "monitoramento"
  | "checklist_documental"
  | "tabular_generico";

const A1_ADDRESS_PATTERN = /^[A-Z]+[1-9]\d*$/;

export const sourceCellSchema = z.object({
  sourceFileId: z.string().min(1),
  sourceSha256: z.string().regex(/^[a-f0-9]{64}$/),
  sheetIndex: z.number().int().nonnegative(),
  sheetName: z.string(),
  row: z.number().int().positive(),
  column: z.number().int().positive(),
  address: z.string().regex(A1_ADDRESS_PATTERN),
  headerOriginal: z.string().nullable(),
  rawValue: z.unknown(),
  safeText: z.string(),
  formulaText: z.string().nullable(),
});

export type SourceCell = z.infer<typeof sourceCellSchema>;

export interface TabularSheet {
  index: number;
  name: string;
  rows: SourceCell[][];
}

const candidateKindSchema = z.enum([
  "coordinate",
  "monitoring",
  "document_pending",
]);
const reviewStatusSchema = z.enum([
  "proposta",
  "confirmada",
  "editada",
  "rejeitada",
]);

export const candidateSchema = z
  .object({
    kind: candidateKindSchema,
    reviewStatus: reviewStatusSchema,
    confidence: z.number().min(0).max(1),
    evidence: z.array(sourceCellSchema),
    alerts: z.array(z.string()),
  })
  .passthrough();

export type Candidate = z.infer<typeof candidateSchema>;

export const proposedCandidateSchema = candidateSchema.extend({
  reviewStatus: z.literal("proposta"),
});

export type ProposedCandidate = z.infer<typeof proposedCandidateSchema>;

export const ambiguitySchema = z.object({
  id: z.string().min(1),
  state: z.enum(["pending", "attempt_persisted", "resolved", "unresolved"]),
  evidence: z.array(sourceCellSchema).min(1),
});

export type Ambiguity = z.infer<typeof ambiguitySchema>;

export const persistedAmbiguityAttemptSchema = z.object({
  id: z.string().min(1),
  number: z.literal(1),
  persistedAt: z.string().datetime(),
});

export type PersistedAmbiguityAttempt = z.infer<
  typeof persistedAmbiguityAttemptSchema
>;

export interface SheetExtraction {
  sheet: TabularSheet;
  classifications: Array<{ kind: SheetClassification; confidence: number }>;
  candidates: ProposedCandidate[];
  signals: string[];
  ambiguities: Ambiguity[];
  alerts: string[];
}

export interface AmbiguityResolver {
  resolve(input: AmbiguityRequest): Promise<AmbiguityResolution | null>;
}

export interface AmbiguityRequest {
  ambiguityId: string;
  /** Persisted by the orchestrator before the only permitted resolver call. */
  persistedAttempt: PersistedAmbiguityAttempt;
  headers: string[];
  sampleRows: string[][];
  deterministicScores: Record<SheetClassification, number>;
  signals: string[];
}

export const ambiguityRequestSchema = z.object({
  ambiguityId: z.string().min(1),
  persistedAttempt: persistedAmbiguityAttemptSchema,
  headers: z.array(z.string()),
  sampleRows: z.array(z.array(z.string())),
  deterministicScores: z.object({
    coordenadas: z.number(),
    monitoramento: z.number(),
    checklist_documental: z.number(),
    tabular_generico: z.number(),
  }),
  signals: z.array(z.string()),
});

export interface AmbiguityResolution {
  classifications: Array<{ kind: SheetClassification; confidence: number }>;
  rationale: string;
}
