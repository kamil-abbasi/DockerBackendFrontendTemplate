import { TokenService } from "./auth/tokens";
import { Database, Logger, setupEnv } from "./common";

export const env = setupEnv();
export const logger = new Logger({ level: env.LOG_LEVEL });
export const db = new Database(env.DB_URL);

/* services */
export const tokensService = new TokenService();
