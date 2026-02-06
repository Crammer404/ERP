/**
 * Custom console utility that can be easily toggled
 * Works with any bundler (Webpack, Turbopack, etc.)
 */

const isDevelopment = process.env.NODE_ENV === 'development';

// You can also use an environment variable for more control
const ENABLE_CONSOLE = process.env.NEXT_PUBLIC_ENABLE_CONSOLE !== 'false';

export const customConsole = {
  log: (...args: any[]) => {
    if (isDevelopment && ENABLE_CONSOLE) {
      console.log(...args);
    }
  },
  
  warn: (...args: any[]) => {
    if (isDevelopment && ENABLE_CONSOLE) {
      console.warn(...args);
    }
  },
  
  error: (...args: any[]) => {
    if (isDevelopment && ENABLE_CONSOLE) {
      console.error(...args);
    }
  },
  
  info: (...args: any[]) => {
    if (isDevelopment && ENABLE_CONSOLE) {
      console.info(...args);
    }
  },
  
  debug: (...args: any[]) => {
    if (isDevelopment && ENABLE_CONSOLE) {
      console.debug(...args);
    }
  },
  
  // Always show critical errors
  critical: (...args: any[]) => {
    console.error('[CRITICAL]', ...args);
  }
};

// Export individual methods for convenience
export const { log, warn, error, info, debug, critical } = customConsole;
