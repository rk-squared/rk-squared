import { format, TransformableInfo } from 'logform';
import * as winston from 'winston';

/**
 * Allows logging of bare Error objects.  Calling JSON.stringify on an Error
 * results in an empty object.  Calling printf results in just the message, so
 * it loses the exception name and the stack trace. This method converts the
 * error object to preserve all of its info.
 */
const error = format((info: TransformableInfo) => {
  if (info.message && info.name && info.stack) {
    return {
      ...info,
      message: `${info.name}: ${info.message}\n${info.stack}`,
      rawMessage: info.message,
      name: info.name,
      stack: info.stack,
    };
  }
  return info;
});

const logFormat = winston.format.combine(
  error(),
  winston.format.timestamp(),

  winston.format.colorize(),
  winston.format.printf(info => `${info.timestamp} ${info.level}: ${info.message}`),
  // Or use winston.format.json() for pure JSON.
);

const logger = winston.createLogger({
  level: 'debug',
  format: logFormat,
  transports: [new winston.transports.Console()],
});

export { logger };
