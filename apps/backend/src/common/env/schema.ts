import z from "zod";
import { LogLevel } from "@/common/logger";

export const envSchema = z.object({
  PORT: z.coerce.number().default(3000),
  LOG_LEVEL: z.enum(LogLevel).default(LogLevel.HTTP),
  DB_URL: z.url(),
});

export type Env = z.infer<typeof envSchema>;
