import pino from 'pino';

const isDevelopment = process.env.NODE_ENV === 'development';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: isDevelopment
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname',
          singleLine: false,
        },
      }
    : undefined,
  formatters: {
    level: (label) => {
      return { level: label.toUpperCase() };
    },
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});

// Helper functions
export const loggers = {
  agent: logger.child({ module: 'agent' }),
  api: logger.child({ module: 'api' }),
  worker: logger.child({ module: 'worker' }),
  service: logger.child({ module: 'service' }),
  database: logger.child({ module: 'database' }),
  cache: logger.child({ module: 'cache' }),
};
