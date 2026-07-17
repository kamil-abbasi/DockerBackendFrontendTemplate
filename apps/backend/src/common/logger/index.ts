import winston from "winston";

export interface ILogger {
	error(message: string): ILogger;
	warn(message: string): ILogger;
	info(message: string): ILogger;
	http(message: string): ILogger;
	verbose(message: string): ILogger;
	debug(message: string): ILogger;
	silly(message: string): ILogger;
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

	error(message: string): ILogger {
		this.loggerInstance.error(message);
		return this.loggerInstance;
	}

	warn(message: string): ILogger {
		this.loggerInstance.warn(message);
		return this.loggerInstance;
	}

	info(message: string): ILogger {
		this.loggerInstance.info(message);
		return this.loggerInstance;
	}

	http(message: string): ILogger {
		this.loggerInstance.http(message);
		return this.loggerInstance;
	}

	verbose(message: string): ILogger {
		this.loggerInstance.verbose(message);
		return this.loggerInstance;
	}

	debug(message: string): ILogger {
		this.loggerInstance.debug(message);
		return this.loggerInstance;
	}

	silly(message: string): ILogger {
		this.loggerInstance.silly(message);
		return this.loggerInstance;
	}
}
