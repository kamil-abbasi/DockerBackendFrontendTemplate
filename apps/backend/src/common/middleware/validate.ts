import type { NextFunction, Request, Response } from "express";
import z, { type ZodError, type ZodType } from "zod";

import { HttpStatus } from "@/api";
import { HttpError } from "@/common/error";

/** Request parts this middleware knows how to validate. */
const SOURCES = ["body", "query", "params"] as const;

type Source = (typeof SOURCES)[number];

export type ValidationSchemas = Partial<Record<Source, ZodType>>;

/**
 * Route-level validation, installed on a controller method with tsoa's
 * `@Middlewares()` so it runs before the generated handler.
 *
 * Each validated part is replaced with the parsed output, so defaults,
 * coercions and `trim()` are what the controller — and tsoa's own validation
 * pass — actually see.
 */
export function validate(schemas: ValidationSchemas) {
  return (req: Request, _res: Response, next: NextFunction) => {
    for (const source of SOURCES) {
      const schema = schemas[source];

      if (!schema) {
        continue;
      }

      const result = schema.safeParse(req[source]);

      if (!result.success) {
        return next(toHttpError(source, result.error));
      }

      // express 5 exposes `req.query` through a getter, so a plain
      // assignment throws; defineProperty works for all three parts.
      Object.defineProperty(req, source, {
        value: result.data,
        writable: true,
        configurable: true,
        enumerable: true,
      });
    }

    return next();
  };
}

/**
 * Shapes a zod failure like the rest of the app's errors: the error middleware
 * turns `HttpError` into the standard envelope, and `details` mirrors the
 * treeified output already used for env parsing.
 */
function toHttpError(source: Source, error: ZodError): HttpError {
  return new HttpError(
    HttpStatus.BAD_REQUEST,
    `invalid request ${source}`,
    z.treeifyError(error),
  );
}
