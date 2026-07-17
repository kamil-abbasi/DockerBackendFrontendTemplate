import type { Request, Response, NextFunction } from "express";

import type { ILogger } from "@/common/logger";

export function logger(loggerInstance: ILogger) {
  return (req: Request, res: Response, next: NextFunction) => {
    loggerInstance.http(`${req.method} ${req.path}`);
    next();
  };
}
