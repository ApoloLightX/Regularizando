import { describe, expect, it } from "vitest";

import {
  invitationSchema,
  licensingProcessSchema,
  signUpSchema,
  slugifyOrganizationName,
} from "./validation";

describe("validation boundaries", () => {
  it("normalizes organization names into safe slug fragments", () => {
    expect(slugifyOrganizationName("  Ápolo & Meio Ambiente Ltda. ")).toBe(
      "apolo-meio-ambiente-ltda",
    );
  });

  it("normalizes signup email and rejects short passwords", () => {
    const valid = signUpSchema.parse({
      fullName: "Gabriel Apolo",
      email: "APOLO@EXAMPLE.COM",
      password: "uma-senha-segura",
    });

    expect(valid.email).toBe("apolo@example.com");
    expect(
      signUpSchema.safeParse({
        fullName: "Gabriel Apolo",
        email: "apolo@example.com",
        password: "curta",
      }).success,
    ).toBe(false);
  });

  it("does not permit invitations with the owner role", () => {
    expect(
      invitationSchema.safeParse({
        organizationId: "f6a8b2f1-3dbb-4d82-8176-6c4aa6db7c14",
        email: "owner@example.com",
        role: "owner",
      }).success,
    ).toBe(false);
  });

  it("normalizes and validates the process state code", () => {
    const parsed = licensingProcessSchema.parse({
      organizationId: "f6a8b2f1-3dbb-4d82-8176-6c4aa6db7c14",
      projectId: "08342984-4d19-4ed4-b342-a266481333b9",
      name: "Licença Prévia",
      state: "sp",
    });

    expect(parsed.state).toBe("SP");
  });
});
