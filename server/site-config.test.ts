import { describe, expect, it } from "vitest";

describe("public site configuration", () => {
  it("uses an HTTPS canonical origin and a public site name", () => {
    const canonicalOrigin = process.env.CANONICAL_ORIGIN;
    const siteName = process.env.SITE_NAME;

    expect(canonicalOrigin).toBeTruthy();
    expect(siteName).toBe("Regularizando");

    const url = new URL(canonicalOrigin!);
    expect(url.protocol).toBe("https:");
    expect(url.hostname).toContain("manus.space");

    expect(url.pathname).toBe("/");
  });
});
