import type { NextFunction, Request, Response } from "express";
import { ValidateError } from "@tsoa/runtime";

import { formatError, HttpStatus, type ApiResponse } from "@/api";
import { HttpError } from "@/common/error";
import type { ILogger } from "../logger";

/**
 * Maps a thrown error onto the response envelope. Auth failures reach here
 * through the tsoa-generated routes, which call `next(err)`.
 */
export function error(logger: ILogger) {
  return (err: Error, _req: Request, res: Response, _next: NextFunction) => {
    let body: ApiResponse<never>;

    if (err instanceof ValidateError) {
      body = formatError({
        httpStatus: HttpStatus.BAD_REQUEST,
        message: err.message || "validation failed",
        details: err.fields,
      });
    } else if (err instanceof HttpError) {
      body = formatError({
        httpStatus: err.status,
        message: err.message,
        details: err.details,
      });
    } else {
      logger.error(`response error ${err.message}`, err);

      body = formatError({
        httpStatus: HttpStatus.INTERNAL_SERVER_ERROR,
        message: "internal server error",
      });
    }

    return res.status(body.success ? 200 : body.error.httpStatus).json(body);
  };
}
