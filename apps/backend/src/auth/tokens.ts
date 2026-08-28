import jwt from "jsonwebtoken";
import type { JwtPayload } from "jsonwebtoken";
import { readFileSync } from "node:fs";

import { HttpStatus } from "@/api";
import { HttpError } from "@/common/error";
import type { Env } from "@/common";

const ALGORITHM = "RS256" as const;

export type TokenSubject = {
  id: string;
};

/**
 * Signs and verifies access tokens. Owned by the container, so the key pair is
 * read from disk once at startup instead of on every request.
 */
export class TokenService {
  private readonly privateKey: Buffer;
  private readonly publicKey: Buffer;

  constructor(env: Env) {
    this.privateKey = readFileSync(env.JWT_PRIVATE_KEY_PATH);
    this.publicKey = readFileSync(env.JWT_PUBLIC_KEY_PATH);
  }

  sign(subject: TokenSubject): string {
    return jwt.sign({}, this.privateKey, {
      algorithm: ALGORITHM,
      subject: subject.id,
    });
  }

  /** Throws `HttpError` when the token is missing, malformed or expired. */
  verify(token: string): TokenSubject {
    let payload: JwtPayload;

    try {
      // tokens are always signed with an object payload, so the result is a
      // JwtPayload even though the typings allow a bare string
      payload = jwt.verify(token, this.publicKey, {
        algorithms: [ALGORITHM],
      }) as JwtPayload;
    } catch (err) {
      throw new HttpError(
        HttpStatus.UNAUTHORIZED,
        err instanceof jwt.JsonWebTokenError ? err.message : "invalid token",
      );
    }

    if (!payload.sub) {
      throw new HttpError(
        HttpStatus.UNAUTHORIZED,
        "token does not contain user id",
      );
    }

    return { id: payload.sub };
  }
}
