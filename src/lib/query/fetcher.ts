/**
 * Turns `QueryParams` into a query string matching what
 * `QueryHelper.parseQueryParams` expects on the server (including the
 * `filter[key]=value` convention for `extra`).
 */
export function buildQueryString(params: QueryParams): string {
  const sp = new URLSearchParams();

  if (params.search) sp.set('search', params.search);
  if (params.date_from) sp.set('date_from', params.date_from);
  if (params.date_to) sp.set('date_to', params.date_to);
  if (params.sort_by) sp.set('sort_by', params.sort_by);
  if (params.order_by) sp.set('order_by', params.order_by);
  if (params.page) sp.set('page', String(params.page));
  if (params.limit) sp.set('limit', String(params.limit));
  if (params.include_deleted) sp.set('include_deleted', 'true');

  if (params.extra) {
    for (const [key, value] of Object.entries(params.extra)) {
      if (value === undefined || value === null || value === '') continue;
      sp.set(`filter[${key}]`, Array.isArray(value) ? value.join(',') : String(value));
    }
  }

  return sp.toString();
}

/**
 * `fetchFn` should be `event.fetch` when called from a SvelteKit `load`
 * function (so cookies/credentials and relative URLs resolve correctly
 * during SSR), or the global `fetch` in the browser — TanStack Query hooks
 * in this project always call it from the browser, so `fetch` is the
 * default.
 */
export async function fetchPaginated<T>(
  endpoint: string,
  params: QueryParams,
  fetchFn: typeof fetch = fetch,
  signal?: AbortSignal
): Promise<PaginatedResult<T>> {
  const qs = buildQueryString(params);
  const res = await fetchFn(`${endpoint}${qs ? `?${qs}` : ''}`, { signal });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Request failed (${res.status}): ${body || res.statusText}`);
  }

  return res.json() as Promise<PaginatedResult<T>>;
}
