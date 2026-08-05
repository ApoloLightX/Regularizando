import { describe, expect, it } from "vitest";

import { EXTRACTOR_VERSION, sourceCellSchema } from "./contracts";

describe("spreadsheet contracts", () => {
  it("requires an address and keeps formula text separate from cached value", () => {
    const cell = sourceCellSchema.parse({
      sheetIndex: 0,
      sheetName: "Pontos",
      row: 8,
      column: 2,
      address: "B8",
      headerOriginal: "Latitude",
      rawValue: -23.55052,
      safeText: "-23.55052",
      formulaText: null,
    });

    expect(cell.address).toBe("B8");
    expect(cell.rawValue).toBe(-23.55052);
    expect(EXTRACTOR_VERSION).toMatch(/^spreadsheet-v\d+$/);
  });
});
