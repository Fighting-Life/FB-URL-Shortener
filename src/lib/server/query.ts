import type { RequestEvent } from '@sveltejs/kit';
import {
  eq,
  and,
  or,
  gte,
  lte,
  inArray,
  asc,
  desc,
  ilike,
  isNull,
  type SQL,
  type Column
} from 'drizzle-orm';
import { ServerBase } from './server.js';
import { formatToPostgresTimestampV2 } from '$lib/utils/time.js';

const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 10;
const DEFAULT_PAGE = 1;

/**
 * Chainable WHERE/ORDER/pagination builder for Drizzle queries inside a
 * SvelteKit request. One instance per request — call `.clone()` if you need
 * to branch into two different filtered queries (e.g. paginated list + a
 * separate "total without filters" count) from the same base conditions.
 */
export class QueryHelper extends ServerBase {
  private whereConditions: SQL[] = [];
  private defaultTable?: any;

  constructor(event: RequestEvent, table?: any) {
    super(event);
    this.defaultTable = table;
  }

  private resolveColumn(field: Column | string, table?: any): Column | null {
    if (typeof field === 'string') {
      const targetTable = table || this.defaultTable;
      if (targetTable && targetTable[field]) {
        return targetTable[field] as Column;
      }
      console.warn(`[QueryHelper] Field '${field}' tidak ditemukan pada tabel.`);
      return null;
    }
    return field as Column;
  }

  /**
   * ILIKE search across multiple columns, combined with OR.
   * Pass `allowedFields` from `SearchFieldConfig[]` — fields not in the
   * config are silently ignored, which is what keeps this safe to expose
   * directly to `sort_by`/filter query params from the client.
   */
  addSearch(search: string | null | undefined, fields: SearchFieldConfig[], table?: any): this {
    if (!search || search.trim() === '') return this;

    const searchConditions: SQL[] = [];
    const cleanSearch = search.trim();

    for (const config of fields) {
      if (config.searchable === false) continue;

      const col = this.resolveColumn(config.field, table);
      if (!col) continue;

      switch (config.type) {
        case 'string':
          searchConditions.push(ilike(col, `%${cleanSearch}%`));
          break;

        case 'number': {
          const searchAsNumber = Number(cleanSearch);
          if (!Number.isNaN(searchAsNumber)) {
            searchConditions.push(eq(col, searchAsNumber));
          }
          break;
        }

        case 'date': {
          const searchAsDate = new Date(cleanSearch);
          if (!Number.isNaN(searchAsDate.getTime())) {
            const startOfDay = new Date(searchAsDate);
            startOfDay.setHours(0, 0, 0, 0);

            const endOfDay = new Date(searchAsDate);
            endOfDay.setHours(23, 59, 59, 999);

            const range = and(gte(col, startOfDay), lte(col, endOfDay));
            if (range) searchConditions.push(range);
          }
          break;
        }

        case 'boolean': {
          const searchLower = cleanSearch.toLowerCase();
          if (['true', '1', 'yes'].includes(searchLower)) {
            searchConditions.push(eq(col, true));
          } else if (['false', '0', 'no'].includes(searchLower)) {
            searchConditions.push(eq(col, false));
          }
          break;
        }
      }
    }

    if (searchConditions.length > 0) {
      const combined = or(...searchConditions);
      if (combined) this.whereConditions.push(combined);
    }

    return this;
  }

  addFilter(
    field: Column | string,
    value: unknown,
    operator: 'equals' | 'in' | 'contains' = 'equals',
    table?: any
  ): this {
    if (value === undefined || value === null || value === '') return this;

    const col = this.resolveColumn(field, table);
    if (!col) return this;

    switch (operator) {
      case 'equals':
        this.whereConditions.push(eq(col, value));
        break;
      case 'in': {
        const arrayValue = Array.isArray(value) ? value : [value];
        if (arrayValue.length > 0) {
          this.whereConditions.push(inArray(col, arrayValue));
        }
        break;
      }
      case 'contains':
        this.whereConditions.push(ilike(col, `%${value}%`));
        break;
    }

    return this;
  }

  /**
   * Apply every entry of `params.extra` as an equals/in filter in one call,
   * restricted to `allowedFields` so a client can't probe arbitrary columns
   * through the `filter[...]` query params. Pass the same keys you used to
   * build `allowedFields` as the object keys in `extra`.
   */
  addExtraFilters(extra: Record<string, unknown> | undefined, allowedFields: string[], table?: any): this {
    if (!extra) return this;

    for (const key of allowedFields) {
      const value = extra[key];
      if (value === undefined || value === null || value === '') continue;
      this.addFilter(key, value, Array.isArray(value) ? 'in' : 'equals', table);
    }

    return this;
  }

  addDateRange(field: Column | string, from?: string | Date, to?: string | Date, table?: any): this {
    if (!from && !to) return this;

    const col = this.resolveColumn(field, table);
    if (!col) return this;

    if (from) this.whereConditions.push(gte(col, new Date(from)));
    if (to) this.whereConditions.push(lte(col, new Date(to)));

    return this;
  }

  addNumberRange(field: Column | string, min?: number, max?: number, table?: any): this {
    if (min === undefined && max === undefined) return this;

    const col = this.resolveColumn(field, table);
    if (!col) return this;

    if (min !== undefined) this.whereConditions.push(gte(col, min));
    if (max !== undefined) this.whereConditions.push(lte(col, max));

    return this;
  }

  addCondition(condition: SQL | undefined | null): this {
    if (condition) this.whereConditions.push(condition);
    return this;
  }

  excludeDeleted(field: Column | string = 'deletedAt', table?: any): this {
    const col = this.resolveColumn(field, table);
    if (col) this.whereConditions.push(isNull(col));
    return this;
  }

  build(): SQL | undefined {
    if (this.whereConditions.length === 0) return undefined;
    if (this.whereConditions.length === 1) return this.whereConditions[0];
    return and(...this.whereConditions);
  }

  /**
   * Resolves ORDER BY from a (usually user-supplied) field name.
   * - `allowedFields`, when passed, whitelists which columns can be sorted
   *   on — anything else silently falls back to `fallbackField`.
   * - Falls back to `fallbackField` (or `undefined`) if `field` doesn't
   *   resolve to a real column at all.
   */
  buildOrderBy(
    field: Column | string,
    orderBy: SortOrder = 'desc',
    table?: any,
    options?: { allowedFields?: string[]; fallbackField?: Column | string }
  ) {
    const isFieldAllowed =
      typeof field !== 'string' || !options?.allowedFields || options.allowedFields.includes(field);

    const col = isFieldAllowed
      ? this.resolveColumn(field, table)
      : options?.fallbackField
        ? this.resolveColumn(options.fallbackField, table)
        : null;

    const resolved = col ?? (options?.fallbackField ? this.resolveColumn(options.fallbackField, table) : null);
    if (!resolved) return undefined;

    return orderBy === 'asc' ? asc(resolved) : desc(resolved);
  }

  buildPagination(page: number = DEFAULT_PAGE, limit: number = DEFAULT_LIMIT): { limit: number; offset: number } {
    const safePage = Math.max(1, Math.floor(page) || DEFAULT_PAGE);
    const safeLimit = Math.min(Math.max(1, Math.floor(limit) || DEFAULT_LIMIT), MAX_LIMIT);
    const offset = (safePage - 1) * safeLimit;
    return { limit: safeLimit, offset };
  }

  buildPaginatedResult<T>(data: T[], totalCount: number, page: number, limit: number): PaginatedResult<T> {
    const totalPages = Math.max(1, Math.ceil(totalCount / limit));

    return {
      data,
      pagination: {
        current_page: page,
        total_pages: totalPages,
        total_items: totalCount,
        has_next: page < totalPages,
        has_prev: page > 1,
        limit
      }
    };
  }

  /**
   * Parses a request URL's search params into the shared `QueryParams`
   * shape. `page`/`limit` are clamped here too so a handler that reads
   * `params.page` directly (before calling `buildPagination`) still gets a
   * sane value.
   */
  parseQueryParams(url: URL): QueryParams {
    const params = url.searchParams;
    const defaultDateRange = this.getDefaultDateRange();

    const rawPage = Number.parseInt(params.get('page') ?? '', 10);
    const rawLimit = Number.parseInt(params.get('limit') ?? '', 10);

    const extra: Record<string, unknown> = {};
    for (const [key, value] of params.entries()) {
      const match = /^filter\[(.+)\]$/.exec(key);
      if (!match) continue;
      const field = match[1];
      extra[field] = value.includes(',') ? value.split(',') : value;
    }

    return {
      page: Math.max(1, Number.isNaN(rawPage) ? DEFAULT_PAGE : rawPage),
      limit: Math.min(Math.max(1, Number.isNaN(rawLimit) ? DEFAULT_LIMIT : rawLimit), MAX_LIMIT),
      search: params.get('search') || undefined,
      sort_by: params.get('sort_by') || 'createdAt',
      order_by: (params.get('order_by') as SortOrder) === 'asc' ? 'asc' : 'desc',
      date_from: params.get('date_from') || defaultDateRange.start,
      date_to: params.get('date_to') || defaultDateRange.end,
      include_deleted: params.get('include_deleted') === 'true',
      extra
    };
  }

  getDefaultDateRange() {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 30);

    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    return {
      start: start.toISOString(),
      end: end.toISOString()
    };
  }

  getPreviousPeriod(dateFrom: string, dateTo: string): { start: string; end: string } {
    const start = new Date(dateFrom);
    const end = new Date(dateTo);

    const timeDiff = end.getTime() - start.getTime();

    const previousDateStart = new Date(start.getTime() - timeDiff - 1);
    const previousDateEnd = new Date(start.getTime() - 1);

    return {
      start: formatToPostgresTimestampV2(previousDateStart),
      end: formatToPostgresTimestampV2(previousDateEnd)
    };
  }

  /** @deprecated Kept only so existing callers using the old typo'd name don't break — use `getPreviousPeriod`. */
  getPrevoiusPeriod(dateFrom: string, dateTo: string): { start: string; end: string } {
    return this.getPreviousPeriod(dateFrom, dateTo);
  }

  clone(): QueryHelper {
    const clone = new QueryHelper(this.event, this.defaultTable);
    clone.whereConditions = [...this.whereConditions];
    return clone;
  }
}
