import { NOT_ADMIN_ERR_MSG, UNAUTHED_ERR_MSG } from '@shared/const';
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./context";
import { recordProcedureMutation } from "../governance-sync";
import { consumeRateLimitBucket, getOrganizationForUser } from "../db";

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
});

export const router = t.router;
const governanceMutationTrail = t.middleware(async opts => {
  const result = await opts.next();
  if (opts.type === "mutation" && !opts.path.startsWith("system.")) {
    try {
      await recordProcedureMutation({ path: opts.path, actorUserId: opts.ctx.user?.id ?? null });
    } catch (error) {
      console.warn("[governance-sync] local mutation record deferred", error instanceof Error ? error.message : error);
    }
  }
  return result;
});

export const publicProcedure = t.procedure.use(governanceMutationTrail);

const requireUser = t.middleware(async opts => {
  const { ctx, next } = opts;

  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

const authenticatedUserRateLimit = t.middleware(async opts => {
  const user = opts.ctx.user;
  if (!user) throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  // Os testes de procedimento usam repositórios simulados; a política distribuída é coberta separadamente.
  if (process.env.NODE_ENV === "test" || process.env.VITEST) return opts.next();
  const path = opts.path.toLowerCase();
  const strict = path.includes("evidences.upload") || path.includes("datagovernance") || path.includes("export") || path.includes("analysis") || path.includes("ai");
  const limit = strict ? 20 : 180;
  try {
    const bucket = await consumeRateLimitBucket({ bucketKey: `trpc:user:${user.id}:${strict ? "sensitive" : "general"}`, scope: strict ? "user_sensitive" : "user_general", windowMs: 60_000 });
    if (bucket.requestCount > limit) {
      const retryAfter = Math.max(1, Math.ceil((bucket.expiresAt.getTime() - Date.now()) / 1000));
      opts.ctx.res.setHeader("Retry-After", String(retryAfter));
      throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Limite de requisições atingido; tente novamente em instantes." });
    }
    const organization = await getOrganizationForUser(user.id);
    if (organization) {
      const organizationLimit = strict ? 80 : 600;
      const organizationBucket = await consumeRateLimitBucket({ bucketKey: `trpc:org:${organization.organization.id}:${strict ? "sensitive" : "general"}`, scope: strict ? "org_sensitive" : "org_general", windowMs: 60_000 });
      if (organizationBucket.requestCount > organizationLimit) {
        const retryAfter = Math.max(1, Math.ceil((organizationBucket.expiresAt.getTime() - Date.now()) / 1000));
        opts.ctx.res.setHeader("Retry-After", String(retryAfter));
        throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Limite organizacional de requisições atingido; tente novamente em instantes." });
      }
    }
  } catch (error) {
    if (error instanceof TRPCError) throw error;
    if (strict) throw new TRPCError({ code: "SERVICE_UNAVAILABLE", message: "Controle temporariamente indisponível para esta operação sensível." });
    console.warn("[rate-limit] user bucket unavailable", error);
  }
  return opts.next();
});

export const protectedProcedure = t.procedure.use(requireUser).use(authenticatedUserRateLimit).use(governanceMutationTrail);

export const adminProcedure = t.procedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;

    if (!ctx.user || ctx.user.role !== 'admin') {
      throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }

    return next({
      ctx: {
        ...ctx,
        user: ctx.user,
      },
    });
  }),
).use(governanceMutationTrail);
