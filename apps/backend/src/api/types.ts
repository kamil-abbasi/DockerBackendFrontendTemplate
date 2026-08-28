export enum HttpStatus {
  NOT_FOUND = 404,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  CONFLICT = 409,
  INTERNAL_SERVER_ERROR = 500,
  OK = 200,
  CREATED = 201,
}

export type SuccessResponse<T> = {
  success: true;
  data: T;
};

export type ErrorResponse = {
  success: false;
  error: {
    message: string;
    httpStatus: HttpStatus;
    apiCode?: string;
    details?: unknown;
  };
};

type BaseResponse = {
  timestamp: string;
};

export type ApiResponse<S> = BaseResponse &
  (SuccessResponse<S> | ErrorResponse);
