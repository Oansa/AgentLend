import pino from 'pino';
import { config } from '../config.js';

let loggerInstance: pino.Logger | null = null;

function getLogger(): pino.Logger {
  if (!loggerInstance) {
    // Use defaults if config not loaded yet
    const logLevel = config.LOG_LEVEL || 'info';
    const logPretty = config.LOG_PRETTY !== false;

    // Don't use pino-pretty in test environment (it can fail)
    const isTest = process.env.NODE_ENV === 'test' || process.env.VITEST === 'true';

    loggerInstance = pino({
      level: logLevel,
      transport: !isTest && logPretty ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname',
        },
      } : undefined,
    });
  }
  return loggerInstance;
}

export { getLogger as logger };