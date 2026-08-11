import { QueryClient, QueryClientProvider, dehydrate } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { renderToString } from "react-dom/server";
import superjson from "superjson";
import { Router } from "wouter";
import { getSiteMeta, isPrivatePath, type SiteMeta } from "@shared/siteMeta";
import App from "./App";
import { trpc } from "./lib/trpc";

export type SsrRenderResult = { html: string; dehydratedState: unknown; meta: SiteMeta };

export async function render(url: string): Promise<SsrRenderResult> {
  const path = url.split("?")[0] || "/";
  const meta = getSiteMeta(url);
  if (isPrivatePath(path)) return { html: "", dehydratedState: {}, meta };

  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } } });
  const trpcClient = trpc.createClient({ links: [httpBatchLink({ url: "/api/trpc", transformer: superjson })] });
  const html = renderToString(
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <Router ssrPath={path} ssrSearch={url.includes("?") ? url.slice(url.indexOf("?") + 1) : ""}>
          <App />
        </Router>
      </QueryClientProvider>
    </trpc.Provider>,
  );
  return { html, dehydratedState: dehydrate(queryClient), meta };
}
