import { formatError, HttpStatus } from "@/api";
import type { Request, Response } from "express";

export function notFound(_: Request, res: Response) {
  return res.status(HttpStatus.NOT_FOUND).json(
    formatError({
      message: "this endpoint does not exist",
      httpStatus: HttpStatus.NOT_FOUND,
    }),
  );
}
