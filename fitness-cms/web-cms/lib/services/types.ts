export interface ServiceResult<T> {
  data: T;
  error?: never;
}

export interface ServiceError {
  data?: never;
  error: {
    code: string;
    message: string;
    status: number;
  };
}

export type ServiceResponse<T> = ServiceResult<T> | ServiceError;

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  hasMore: boolean;
  cursor?: string;
}

export interface PaginationOptions {
  limit?: number;
  cursor?: string;
}
