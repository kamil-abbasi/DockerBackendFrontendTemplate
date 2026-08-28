import { HttpStatus } from "@/api";

/**
 * Error that carries the status code the client should see.
 *
 * The property is named `status` on purpose: that is the field the
 * tsoa-generated routes read (and default to 401) when an authentication
 * function rejects, so throwing this from anywhere lands in the error
 * middleware with the right code already attached.
 */
export class HttpError extends Error {
  constructor(
    public readonly status: HttpStatus,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "HttpError";
  }
}
