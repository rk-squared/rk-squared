import * as winston from 'winston';

import { simpleFilter } from './typeUtils';

function makeLogFormat({ colorize, timestamp }: { colorize: boolean; timestamp: boolean }) {
  return winston.format.combine(
    ...simpleFilter([
      timestamp ? winston.format.timestamp() : null,
      colorize ? winston.format.colorize() : null,
      winston.format.printf(
        info => `${timestamp ? info.timestamp + ' ' : ''}${info.level}: ${info.message}`,
      ),
      // Or use winston.format.json() for pure JSON.
    ]),
  );
}

const defaultTransport = new winston.transports.Console({
  format: makeLogFormat({ colorize: true, timestamp: true }),
});

const logger = winston.createLogger({
  level: 'debug',
  transports: [defaultTransport],
});

export function logToFile(filename: string) {
  logger.add(
    new winston.transports.File({
      filename,
      format: makeLogFormat({ colorize: false, timestamp: true }),
    }),
  );
}

/**
 * Configure the logger for command-line scripts.  In particular, remove
 * timestamps, to cut down on clutter and to make the output easier to diff.
 */
export function logForCli() {
  logger.configure({
    level: 'debug',
    transports:[new winston.transports.Console({ format: makeLogFormat({ colorize: true, timestamp: false }) })]
  });
}

/**
 * Log an Error object, including details.  Calling JSON.stringify on an Error
 * results in an empty object.  Calling printf results in just the message, so
 * it loses the exception name and the stack trace.
 */
export function logException(e: any, level: string = 'error') {
  if (e.message && e.name && e.stack) {
    logger.log(level, `${e.name}: ${e.message}\n${e.stack}`, {
      ...e,
      rawMessage: e.message,
      name: e.name,
      stack: e.stack,
    });
  } else if (e.syscall && e.code) {
    // Errors from sockets ("Error communicating with") lack details.  Try this
    // alternate code for handling them.
    logger.log(level, `${e.syscall} ${e.code}` + (e.stack ? `\n${e.stack}` : ''), {
      ...e,
      rawMessage: `${e.syscall} ${e.code}`,
      stack: e.stack,
    });
  }
}

export { logger };
