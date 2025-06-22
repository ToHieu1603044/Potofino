
export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginationResult {
  skip: number;
  take: number;
  page: number;
  limit: number;
}

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
};

export function paginate(params: PaginationParams = {}): PaginationResult {
  const page = params.page && params.page > 0 ? params.page : PAGINATION.DEFAULT_PAGE;
  const limit = params.limit && params.limit > 0 ? params.limit : PAGINATION.DEFAULT_LIMIT;
  const skip = (page - 1) * limit;
  return { skip, take: limit, page, limit };
}
