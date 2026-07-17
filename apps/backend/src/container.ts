import { Logger, type ILogger } from "@/common/logger";
import type { Env } from "@/common/env";

export class Container {
  public readonly logger: ILogger;

  constructor(private readonly env: Env) {
    this.logger = new Logger({ level: this.env.LOG_LEVEL });
  }
}
