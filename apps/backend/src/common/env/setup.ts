import z, { ZodError } from "zod";

import { envSchema } from "./schema";

export function setupEnv() {
  try {
    const result = envSchema.parse(process.env);

    return result;
  } catch (err) {
    const message =
      "Invalid env configuration. Make sure you are supplying correct variables. To see an example config look at .env.example file.";

    const configErr = new Error(message);

    if (err instanceof ZodError) {
      configErr.cause = z.treeifyError(err);
    }

    throw configErr;
  }
}
