import type { ConsoleEntry } from '../../shared/types';

type ConsoleMethod = 'log' | 'info' | 'warn' | 'error' | 'debug';

const originalConsole: Record<ConsoleMethod, (...args: unknown[]) => void> = {
  log: console.log.bind(console),
  info: console.info.bind(console),
  warn: console.warn.bind(console),
  error: console.error.bind(console),
  debug: console.debug.bind(console),
};

let isIntercepting = false;
let onEntry: ((entry: ConsoleEntry) => void) | null = null;

function serializeArg(arg: unknown): unknown {
  if (arg === null) return null;
  if (arg === undefined) return undefined;
  if (typeof arg === 'string' || typeof arg === 'number' || typeof arg === 'boolean') {
    return arg;
  }
  if (arg instanceof Error) {
    return {
      __type: 'Error',
      name: arg.name,
      message: arg.message,
      stack: arg.stack,
    };
  }
  try {
    return JSON.parse(JSON.stringify(arg));
  } catch {
    return String(arg);
  }
}

function createInterceptor(method: ConsoleMethod): (...args: unknown[]) => void {
  return (...args: unknown[]) => {
    originalConsole[method](...args);

    if (onEntry) {
      const entry: ConsoleEntry = {
        timestamp: Date.now(),
        level: method,
        args: args.map(serializeArg),
      };

      if (method === 'error') {
        const stack = new Error().stack;
        if (stack) {
          entry.stack = stack.split('\n').slice(2).join('\n');
        }
      }

      onEntry(entry);
    }
  };
}

export function startConsoleInterception(
  callback: (entry: ConsoleEntry) => void
): void {
  if (isIntercepting) return;

  onEntry = callback;
  isIntercepting = true;

  const methods: ConsoleMethod[] = ['log', 'info', 'warn', 'error', 'debug'];
  for (const method of methods) {
    console[method] = createInterceptor(method);
  }
}

export function stopConsoleInterception(): void {
  if (!isIntercepting) return;

  const methods: ConsoleMethod[] = ['log', 'info', 'warn', 'error', 'debug'];
  for (const method of methods) {
    console[method] = originalConsole[method];
  }

  isIntercepting = false;
  onEntry = null;
}

export function isConsoleIntercepting(): boolean {
  return isIntercepting;
}
