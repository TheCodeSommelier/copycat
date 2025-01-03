import winston from "winston";
import path from "path";
import LoggerPort from "../../core/ports/loggerPort.js";

class Logger extends LoggerPort {
  constructor() {
    super();
    const logFormat = winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.printf(({ level, message, timestamp, ...meta }) => {
        return `${timestamp} ${level}: ${message} ${
          Object.keys(meta).length ?
          JSON.stringify(meta, null, 2) : ''
        }`;
      })
    );

    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || "info",
      format: logFormat,
      defaultMeta: { service: "tradingService" },
      transports: [
        // Error logs
        new winston.transports.File({
          filename: path.join("logs", "error.log"),
          level: "error",
          maxsize: 5242880, // 5MB
          maxFiles: 5,
        }),
        // All logs
        new winston.transports.File({
          filename: path.join("logs", "combined.log"),
          maxsize: 5242880,
          maxFiles: 5,
        }),
      ],
    });

    this.logger.add(
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.simple()
        ),
      })
    );
  }

  info(message, meta = {}) {
    this.logger.info(message, { timestamp: new Date(), ...meta });
  }

  error(message, error = null, meta = {}) {
    const errorInfo = error ? {
      name: error.name,
      message: error.message,
      stack: error.stack
    } : null;

    this.logger.error(message, {
      timestamp: new Date(),
      error: errorInfo,
      ...meta,
    });
  }

  warn(message, meta = {}) {
    this.logger.warn(message, { timestamp: new Date(), ...meta });
  }

  debug(message, meta = {}) {
    this.logger.debug(message, { timestamp: new Date(), ...meta });
  }
}

export default new Logger();
