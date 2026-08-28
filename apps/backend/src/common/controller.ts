import { Controller as TsoaController, Response } from "tsoa";

import {
  formatError,
  formatSuccess,
  HttpStatus,
  type ApiResponse,
  type ErrorResponse,
} from "@/api";

@Response<ApiResponse<never>>(
  `${HttpStatus.INTERNAL_SERVER_ERROR}`,
  "internal server error",
)
@Response<ApiResponse<never>>(`${HttpStatus.BAD_REQUEST}`, "validation error")
export class Controller extends TsoaController {
  sendError(options: ErrorResponse["error"]): ApiResponse<never> {
    const json = formatError(options);

    this.setStatus(options.httpStatus ?? 500);
    return json;
  }

  sendSuccess<T>(data: T, httpStatus?: HttpStatus): ApiResponse<T> {
    const json = formatSuccess(data);

    this.setStatus(httpStatus ?? 200);
    return json;
  }

  sendNotFound(message: string, details?: unknown) {
    return this.sendError({
      httpStatus: HttpStatus.NOT_FOUND,
      message,
      details,
    });
  }
}
