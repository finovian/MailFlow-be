import type { PaginatedData, PaginationQuery } from "../types/api.types.js";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;
const MIN_PAGE = 1;

export function parsePaginationQuery(query: {
  page?: string | number;
  limit?: string | number;
}): PaginationQuery {
  const page = Math.max(MIN_PAGE, Number(query.page) || MIN_PAGE);
  const limit = Math.min(MAX_LIMIT, Math.max(1, Number(query.limit) || DEFAULT_LIMIT));
  return { page, limit };
}

export function buildPaginationArgs(page?: number, limit?: number): { skip: number; take: number } {
  const p = Math.max(1, page || 1);
  const l = Math.max(1, limit || 20);
  return {
    skip: (p - 1) * l,
    take: l,
  };
}

export function buildPaginatedResponse<T>(
  items: T[],
  total: number,
  page: number,
  limit: number,
): PaginatedData<T> {
  return {
    items,
    total,
    page,
    limit,
    hasMore: page * limit < total,
  };
}
