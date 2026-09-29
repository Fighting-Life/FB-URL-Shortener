import { createQuery, keepPreviousData, type CreateQueryResult } from '@tanstack/svelte-query';
import { queryKeys } from '$lib/query/keys';
import { fetchPaginated } from '$lib/query/fetcher';

/**
 * Generic paginated-list query. `getParams` must be a function (not a
 * plain object) so TanStack Query can track reactive `$state`/`$derived`
 * values inside it and refetch when they change — this is the same
 * "options as a function" pattern `createQuery` itself uses.
 *
 * @example
 * const params = () => ({ search, page, limit, sort_by: sortBy, order_by: orderBy });
 * const usersQuery = createPaginatedQuery<User>('users', '/api/users', params);
 * // in the template: $usersQuery.data?.data, $usersQuery.isPending, ...
 */
export function createPaginatedQuery<T>(
  resource: string,
  endpoint: string,
  getParams: () => QueryParams
): CreateQueryResult<PaginatedResult<T>, Error> {
  return createQuery(() => ({
    queryKey: queryKeys.list(resource, getParams() as Record<string, any>),
    queryFn: ({ signal }: { signal: AbortSignal }) => fetchPaginated<T>(endpoint, getParams(), fetch, signal),
    // Keeps the previous page's data visible (instead of flashing a loading
    // state) while the next page or a new filter is in flight.
    placeholderData: keepPreviousData
  }));
}
