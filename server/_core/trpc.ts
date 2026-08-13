import { NOT_ADMIN_ERR_MSG, UNAUTHED_ERR_MSG } from '@shared/const';
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./context";
import { recordProcedureMutation } from "../governance-sync";

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

export const protectedProcedure = t.procedure.use(requireUser).use(governanceMutationTrail);

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
