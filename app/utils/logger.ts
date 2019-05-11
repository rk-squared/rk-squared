import { format, TransformableInfo } from 'logform';
import * as winston from 'winston';

import { simpleFilter } from './typeUtils';

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
  } else if (info.syscall && info.code) {
    // Errors from sockets ("Error communicating with") lack details.  Try this
    // alternate code for handling them.
    return {
      ...info,
      message: `${info.syscall} ${info.code}` + (info.stack ? `\n${info.stack}` : ''),
      rawMessage: `${info.syscall} ${info.code}`,
      stack: info.stack,
    };
  }
  return info;
});

function makeLogFormat(colorize: boolean) {
  return winston.format.combine(
    ...simpleFilter([
      error(),
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

export { logger };
