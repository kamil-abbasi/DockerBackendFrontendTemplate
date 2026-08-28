import type { Request } from "express";

import { HttpStatus } from "@/api";
import { HttpError } from "@/common/error";
import { container } from "@/ioc";
import type { TokenSubject } from "./tokens";

/** Security scheme names, as declared in `spec.securityDefinitions`. */
export const SecurityScheme = {
  JWT: "jwt",
} as const;

/**
 * Called by the tsoa-generated routes for every endpoint that has a security
 * scheme. Whatever this resolves with becomes `request.user`; whatever it
 * throws goes to the express error middleware.
 *
 * This is a plain module, so dependencies come from the container directly —
 * no decorator metadata, no service locator.
 */
export async function expressAuthentication(
  request: Request,
  securityName: string,
  _scopes?: string[],
): Promise<TokenSubject> {
  if (securityName !== SecurityScheme.JWT) {
    throw new HttpError(
      HttpStatus.INTERNAL_SERVER_ERROR,
      `unknown security scheme "${securityName}"`,
    );
  }

  const header = request.header("authorization");

  if (!header) {
    throw new HttpError(
      HttpStatus.UNAUTHORIZED,
      "missing authorization header",
    );
  }

  const [tokenType, token] = header.split(" ");

  if (tokenType !== "Bearer") {
    throw new HttpError(HttpStatus.UNAUTHORIZED, "unsupported token type");
  }

  if (!token) {
    throw new HttpError(HttpStatus.UNAUTHORIZED, "missing token");
  }

  return container.tokens.verify(token);
}
