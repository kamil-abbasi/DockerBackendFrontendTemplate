import winston from "winston";

export interface ILogger {
  error(message: string, ...details: unknown[]): ILogger;
  warn(message: string, ...details: unknown[]): ILogger;
  info(message: string, ...details: unknown[]): ILogger;
  http(message: string, ...details: unknown[]): ILogger;
  verbose(message: string, ...details: unknown[]): ILogger;
  debug(message: string, ...details: unknown[]): ILogger;
  silly(message: string, ...details: unknown[]): ILogger;
}

export enum LogLevel {
  ERROR = "error",
  WARN = "warn",
  INFO = "info",
  HTTP = "http",
  VERBOSE = "verbose",
  DEBUG = "debug",
  SILLY = "silly",
}

export type LoggerConfig = {
  level: LogLevel;
};

export class Logger implements ILogger {
  private readonly loggerInstance;

  constructor(config: LoggerConfig) {
    const consoleFormat = winston.format.combine(
      winston.format.colorize({ all: true }),
      winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
      winston.format.printf((info) => {
        return `[${info.level}] ${info.message}`;
      }),
    );

    this.loggerInstance = winston.createLogger({
      level: config.level,
      format: winston.format.json(),
      transports: [new winston.transports.Console({ format: consoleFormat })],
    });
  }

  error(message: string, ...details: unknown[]): ILogger {
    this.loggerInstance.error(message, details);
    return this.loggerInstance;
  }

  warn(message: string, ...details: unknown[]): ILogger {
    this.loggerInstance.warn(message);
    return this.loggerInstance;
  }

  info(message: string, ...details: unknown[]): ILogger {
    this.loggerInstance.info(message);
    return this.loggerInstance;
  }

  http(message: string, ...details: unknown[]): ILogger {
    this.loggerInstance.http(message);
    return this.loggerInstance;
  }

  verbose(message: string, ...details: unknown[]): ILogger {
    this.loggerInstance.verbose(message);
    return this.loggerInstance;
  }

  debug(message: string, ...details: unknown[]): ILogger {
    this.loggerInstance.debug(message);
    return this.loggerInstance;
  }

  silly(message: string, ...details: unknown[]): ILogger {
    this.loggerInstance.silly(message);
    return this.loggerInstance;
  }
}
