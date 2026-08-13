import { appRouter } from "../server/routers.ts";

const context = {
  user: null,
  req: { headers: { "x-forwarded-proto": "https" }, protocol: "https" },
  res: { clearCookie() {} },
};

const result = await appRouter.createCaller(context).auth.logout();
console.log(JSON.stringify({ ok: true, result, expectedSource: "trpc mutation auth.logout" }));
