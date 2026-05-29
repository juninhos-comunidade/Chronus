export interface ListResponse<T> {
  data: T[]
  pagination: {
    currentPage: number
    perPage: number
    totalItems: number
    totalPages: number
  }
}

export const DEFAULT_PAGE_SIZE = 20
export const MAX_PAGE_SIZE = 100

export type PaginationParams = {
  page?: number
  pageSize?: number
}

export const normalizePagination = (params: PaginationParams) => {
  const page = Math.max(1, params.page ?? 1)
  const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, params.pageSize ?? DEFAULT_PAGE_SIZE))
  const offset = (page - 1) * pageSize

  return { page, pageSize, offset }
}

export const buildListResponse = <T>(
  data: T[],
  totalItems: number,
  page: number,
  pageSize: number
): ListResponse<T> => ({
  data,
  pagination: {
    currentPage: page,
    perPage: pageSize,
    totalItems,
    totalPages: Math.ceil(totalItems / pageSize),
  },
})