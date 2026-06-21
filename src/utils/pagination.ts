export interface PaginationResult<T> {
  data: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export function parsePagination(
  rawPage: unknown,
  rawLimit: unknown,
  maxLimit = 100,
): PaginationParams {
  const page = Math.max(1, Number(rawPage) || 1);
  const limit = Math.min(maxLimit, Math.max(1, Number(rawLimit) || 20));
  return { page, limit };
}

export function buildPaginationResult<T>(
  data: T[],
  total: number,
  params: PaginationParams,
): PaginationResult<T> {
  return {
    data,
    page: params.page,
    limit: params.limit,
    total,
    totalPages: Math.ceil(total / params.limit),
  };
}
