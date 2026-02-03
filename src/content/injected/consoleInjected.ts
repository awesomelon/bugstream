// This script is injected into the page context to intercept console calls
// It runs in the MAIN world, not the isolated content script world

export {};

type ConsoleMethod = 'log' | 'info' | 'warn' | 'error' | 'debug';

interface ConsoleEntry {
  timestamp: number;
  level: ConsoleMethod;
  args: unknown[];
  stack?: string;
}

interface ExtendedWindow extends Window {
  __bugstreamConsoleIntercepting?: boolean;
}

(function (win: ExtendedWindow) {
  if (win.__bugstreamConsoleIntercepting) return;
  win.__bugstreamConsoleIntercepting = true;

  const originalConsole: Record<ConsoleMethod, (...args: unknown[]) => void> = {
    log: console.log.bind(console),
    info: console.info.bind(console),
    warn: console.warn.bind(console),
    error: console.error.bind(console),
    debug: console.debug.bind(console),
  };

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

  function sendEntry(entry: ConsoleEntry): void {
    win.postMessage({ type: '__BUGSTREAM_CONSOLE_ENTRY__', entry }, '*');
  }

  function createInterceptor(method: ConsoleMethod): (...args: unknown[]) => void {
    return (...args: unknown[]) => {
      // Call original console method
      originalConsole[method](...args);

      const entry: ConsoleEntry = {
        timestamp: Date.now(),
        level: method,
        args: args.map((arg) => serializeArg(arg)),
      };

      // Add stack trace for errors
      if (method === 'error') {
        // Check if any arg is an Error with a stack
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

      sendEntry(entry);
    };
  }

  // Override console methods
  const methods: ConsoleMethod[] = ['log', 'info', 'warn', 'error', 'debug'];
  for (const method of methods) {
    console[method] = createInterceptor(method);
  }
})(window as ExtendedWindow);
