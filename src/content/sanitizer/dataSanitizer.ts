import type { NetworkEntry, ConsoleEntry } from '../../shared/types';

const SENSITIVE_PATTERNS = [
  /password/i,
  /passwd/i,
  /secret/i,
  /token/i,
  /api[_-]?key/i,
  /authorization/i,
  /bearer/i,
  /credential/i,
  /ssn/i,
  /credit[_-]?card/i,
];

const MASKED_VALUE = '********';

function isSensitiveKey(key: string): boolean {
  return SENSITIVE_PATTERNS.some((pattern) => pattern.test(key));
}

function sanitizeValue(value: unknown): unknown {
  if (typeof value === 'string') {
    return MASKED_VALUE;
  }
  return value;
}

function sanitizeObject(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (isSensitiveKey(key)) {
      result[key] = sanitizeValue(value);
    } else if (typeof value === 'object' && value !== null) {
      result[key] = sanitizeObject(value as Record<string, unknown>);
    } else {
      result[key] = value;
    }
  }
  return result;
}

function sanitizeHeaders(headers?: Record<string, string>): Record<string, string> | undefined {
  if (!headers) return undefined;
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(headers)) {
    if (isSensitiveKey(key)) {
      result[key] = MASKED_VALUE;
    } else {
      result[key] = value;
    }
  }
  return result;
}

function sanitizeBody(body?: string): string | undefined {
  if (!body) return undefined;

  try {
    const parsed = JSON.parse(body);
    if (typeof parsed === 'object' && parsed !== null) {
      return JSON.stringify(sanitizeObject(parsed));
    }
  } catch {
    // Not JSON, try URL-encoded
    if (body.includes('=')) {
      const params = new URLSearchParams(body);
      const sanitizedParams = new URLSearchParams();
      for (const [key, value] of params) {
        if (isSensitiveKey(key)) {
          sanitizedParams.set(key, MASKED_VALUE);
        } else {
          sanitizedParams.set(key, value);
        }
      }
      return sanitizedParams.toString();
    }
  }

  return body;
}

export function sanitizeNetworkEntry(entry: NetworkEntry): NetworkEntry {
  return {
    ...entry,
    requestHeaders: sanitizeHeaders(entry.requestHeaders),
    responseHeaders: sanitizeHeaders(entry.responseHeaders),
    requestBody: sanitizeBody(entry.requestBody),
    responseBody: sanitizeBody(entry.responseBody),
  };
}

export function sanitizeConsoleEntry(entry: ConsoleEntry): ConsoleEntry {
  return {
    ...entry,
    args: entry.args.map((arg) => {
      if (typeof arg === 'object' && arg !== null) {
        return sanitizeObject(arg as Record<string, unknown>);
      }
      return arg;
    }),
  };
}

export function sanitizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    const params = parsed.searchParams;
    const sanitizedParams = new URLSearchParams();
    for (const [key, value] of params) {
      if (isSensitiveKey(key)) {
        sanitizedParams.set(key, MASKED_VALUE);
      } else {
        sanitizedParams.set(key, value);
      }
    }
    parsed.search = sanitizedParams.toString();
    return parsed.toString();
  } catch {
    return url;
  }
}
