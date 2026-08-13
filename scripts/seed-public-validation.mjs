import { seedPublicValidationCases } from "../server/public-validation-seed.ts";

try {
  const result = await seedPublicValidationCases();
  console.log(JSON.stringify({ ok: true, ...result }));
  process.exit(0);
} catch (error) {
  console.error(JSON.stringify({ ok: false, error: error instanceof Error ? error.message : "PUBLIC_VALIDATION_SEED_FAILED" }));
  process.exit(1);
}
