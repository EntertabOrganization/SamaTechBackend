import { Request } from "express";

export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const getPagination = (req: Request): PaginationParams => {
  const page = Math.max(parseInt(String(req.query.page ?? "1"), 10) || 1, 1);
  const limit = Math.max(
    parseInt(String(req.query.limit ?? "20"), 10) || 20,
    1
  );
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

export const buildPaginatedResult = <T>(
  data: T[],
  total: number,
  page: number,
  limit: number
): PaginatedResult<T> => ({
  data,
  meta: {
    total,
    page,
    limit,
    totalPages: Math.max(Math.ceil(total / limit), 1),
  },
});
