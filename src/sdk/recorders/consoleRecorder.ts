import type { ConsoleEntry } from '../types';

type ConsoleMethod = 'log' | 'info' | 'warn' | 'error' | 'debug';

const METHODS: ConsoleMethod[] = ['log', 'info', 'warn', 'error', 'debug'];

let isIntercepting = false;
let originalConsole: Record<ConsoleMethod, (...args: unknown[]) => void> | null = null;

function serializeArg(arg: unknown, seen = new WeakSet()): unknown {
  if (arg === null) return null;
  if (arg === undefined) return undefined;

  if (typeof arg === 'string' || typeof arg === 'number' || typeof arg === 'boolean') {
    return arg;
  }

  if (typeof arg === 'bigint') {
    return `BigInt(${arg.toString()})`;
  }

  if (typeof arg === 'symbol') {
    return arg.toString();
  }

  if (typeof arg === 'function') {
    return `[Function: ${arg.name || 'anonymous'}]`;
  }

  if (arg instanceof Error) {
    return {
      __type: 'Error',
      name: arg.name,
      message: arg.message,
      stack: arg.stack,
    };
  }

  if (arg instanceof Date) {
    return { __type: 'Date', value: arg.toISOString() };
  }

  if (arg instanceof RegExp) {
    return { __type: 'RegExp', value: arg.toString() };
  }

  // Handle DOM nodes
  if (arg instanceof Node) {
    if (arg instanceof Element) {
      return `[Element: <${arg.tagName.toLowerCase()}${arg.id ? ` id="${arg.id}"` : ''}${arg.className ? ` class="${arg.className}"` : ''}>]`;
    }
    return `[Node: ${arg.nodeName}]`;
  }

  // Check for circular reference
  if (typeof arg === 'object') {
    if (seen.has(arg as object)) {
      return '[Circular]';
    }
    seen.add(arg as object);

    if (Array.isArray(arg)) {
      return arg.map((item) => serializeArg(item, seen));
    }

    // Plain object
    const result: Record<string, unknown> = {};
    try {
      for (const key of Object.keys(arg as object)) {
        result[key] = serializeArg((arg as Record<string, unknown>)[key], seen);
      }
    } catch {
      return String(arg);
    }
    return result;
  }

  return String(arg);
}

export function startConsoleRecording(callback: (entry: ConsoleEntry) => void): void {
  if (isIntercepting) return;
  isIntercepting = true;

  // Save original console methods
  originalConsole = {
    log: console.log.bind(console),
    info: console.info.bind(console),
    warn: console.warn.bind(console),
    error: console.error.bind(console),
    debug: console.debug.bind(console),
  };

  for (const method of METHODS) {
    const original = originalConsole[method];
    console[method] = (...args: unknown[]) => {
      // Call original console method
      original(...args);

      const entry: ConsoleEntry = {
        timestamp: Date.now(),
        level: method,
        args: args.map((arg) => serializeArg(arg)),
      };

      // Add stack trace for errors
      if (method === 'error') {
        const errorArg = args.find((arg) => arg instanceof Error) as Error | undefined;
        if (errorArg?.stack) {
          entry.stack = errorArg.stack;
        } else {
          const stack = new Error().stack;
          if (stack) {
            entry.stack = stack.split('\n').slice(2).join('\n');
          }
        }
      }

      callback(entry);
    };
  }
}

export function stopConsoleRecording(): void {
  if (!isIntercepting || !originalConsole) return;

  // Restore original console methods
  for (const method of METHODS) {
    console[method] = originalConsole[method];
  }

  originalConsole = null;
  isIntercepting = false;
}
