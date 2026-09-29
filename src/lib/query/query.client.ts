import { QueryClient } from '@tanstack/svelte-query';
import { browser } from '$app/environment';

/**
 * Create one `QueryClient` per request on the server (so data never leaks
 * between users) and reuse a single instance in the browser. Call this
 * from `+layout.ts`'s `load`, not at module scope — module scope would be
 * shared across every SSR request on the server.
 */
export function createAppQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Queries are created disabled during SSR by default in this setup
        // (no dehydrate/hydrate wired up) — they run once the page hydrates.
        enabled: browser,
        staleTime: 30 * 1000,
        gcTime: 5 * 60 * 1000,
        retry: 1,
        refetchOnWindowFocus: false
      }
    }
  });
}
