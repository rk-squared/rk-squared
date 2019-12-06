import * as winston from 'winston';

import { simpleFilter } from './typeUtils';

function makeLogFormat(colorize: boolean) {
  return winston.format.combine(
    ...simpleFilter([
      winston.format.timestamp(),

      colorize ? winston.format.colorize() : null,
      winston.format.printf(info => `${info.timestamp} ${info.level}: ${info.message}`),
      // Or use winston.format.json() for pure JSON.
    ]),
  );
}

const logger = winston.createLogger({
  level: 'debug',
  transports: [new winston.transports.Console({ format: makeLogFormat(true) })],
});

export function logToFile(filename: string) {
  logger.add(
    new winston.transports.File({
      filename,
      format: makeLogFormat(false),
    }),
  );
}

/**
 * Log an Error object, including details.  Calling JSON.stringify on an Error
 * results in an empty object.  Calling printf results in just the message, so
 * it loses the exception name and the stack trace.
 */
export function logException(e: any) {
  if (e.message && e.name && e.stack) {
    logger.error(`${e.name}: ${e.message}\n${e.stack}`, {
      ...e,
      rawMessage: e.message,
      name: e.name,
      stack: e.stack,
    });
  } else if (e.syscall && e.code) {
    // Errors from sockets ("Error communicating with") lack details.  Try this
    // alternate code for handling them.
    logger.error(`${e.syscall} ${e.code}` + (e.stack ? `\n${e.stack}` : ''), {
      ...e,
      rawMessage: `${e.syscall} ${e.code}`,
      stack: e.stack,
    });
  }
}

export { logger };
