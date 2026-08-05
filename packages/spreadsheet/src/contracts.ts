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

export const sourceCellSchema = z.object({
  sheetIndex: z.number().int().nonnegative(),
  sheetName: z.string(),
  row: z.number().int().positive(),
  column: z.number().int().positive(),
  address: z.string().min(1),
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

export interface Candidate {
  kind: CandidateKind;
  reviewStatus: ReviewStatus;
  confidence: number;
  evidence: SourceCell[];
  alerts: string[];
}

export interface SheetExtraction {
  sheet: TabularSheet;
  classifications: Array<{ kind: SheetClassification; confidence: number }>;
  candidates: Candidate[];
  signals: string[];
  ambiguities: string[];
  alerts: string[];
}

export interface AmbiguityResolver {
  resolve(input: AmbiguityRequest): Promise<AmbiguityResolution | null>;
}

export interface AmbiguityRequest {
  headers: string[];
  sampleRows: string[][];
  deterministicScores: Record<SheetClassification, number>;
  signals: string[];
}

export interface AmbiguityResolution {
  classifications: Array<{ kind: SheetClassification; confidence: number }>;
  rationale: string;
}
