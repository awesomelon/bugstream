import type { NetworkEntry } from '../types';
import { MAX_REQUEST_BODY_SIZE, MAX_RESPONSE_BODY_SIZE } from '../constants';

let isIntercepting = false;
let requestId = 0;

// Store original references for restoration
let originalFetch: typeof window.fetch | null = null;
let originalXhrOpen: typeof XMLHttpRequest.prototype.open | null = null;
let originalXhrSend: typeof XMLHttpRequest.prototype.send | null = null;
let originalXhrSetRequestHeader: typeof XMLHttpRequest.prototype.setRequestHeader | null = null;

function generateId(): string {
  return `req_${++requestId}_${Date.now()}`;
}

function truncateBody(body: string | undefined, maxSize: number): string | undefined {
  if (!body) return undefined;
  if (body.length <= maxSize) return body;
  return body.slice(0, maxSize) + `... [truncated, ${body.length - maxSize} bytes omitted]`;
}

function parseHeaders(headers: Headers): Record<string, string> {
  const result: Record<string, string> = {};
  headers.forEach((value, key) => {
    result[key] = value;
  });
  return result;
}

export function startNetworkRecording(callback: (entry: NetworkEntry) => void): void {
  if (isIntercepting) return;
  isIntercepting = true;
  requestId = 0;

  // Save originals
  originalFetch = window.fetch;
  originalXhrOpen = XMLHttpRequest.prototype.open;
  originalXhrSend = XMLHttpRequest.prototype.send;
  originalXhrSetRequestHeader = XMLHttpRequest.prototype.setRequestHeader;

  // Intercept XMLHttpRequest
  XMLHttpRequest.prototype.open = function (
    method: string,
    url: string | URL,
    async: boolean = true,
    user?: string | null,
    password?: string | null
  ) {
    const entry: NetworkEntry = {
      timestamp: Date.now(),
      id: generateId(),
      method: method.toUpperCase(),
      url: typeof url === 'string' ? url : url.toString(),
      requestHeaders: {},
    };

    (this as XMLHttpRequest & { __bugstream_entry: NetworkEntry }).__bugstream_entry = entry;

    return originalXhrOpen!.call(this, method, url, async, user, password);
  };

  XMLHttpRequest.prototype.setRequestHeader = function (name: string, value: string) {
    const entry = (this as XMLHttpRequest & { __bugstream_entry?: NetworkEntry }).__bugstream_entry;
    if (entry && entry.requestHeaders) {
      entry.requestHeaders[name] = value;
    }
    return originalXhrSetRequestHeader!.call(this, name, value);
  };

  XMLHttpRequest.prototype.send = function (body?: Document | XMLHttpRequestBodyInit | null) {
    const entry = (this as XMLHttpRequest & { __bugstream_entry?: NetworkEntry }).__bugstream_entry;

    if (entry) {
      if (body && typeof body === 'string') {
        entry.requestBody = truncateBody(body, MAX_REQUEST_BODY_SIZE);
      }

      const startTime = Date.now();

      this.addEventListener('load', () => {
        entry.status = this.status;
        entry.statusText = this.statusText;
        entry.duration = Date.now() - startTime;

        const responseHeaders = this.getAllResponseHeaders();
        if (responseHeaders) {
          entry.responseHeaders = {};
          responseHeaders.split('\r\n').forEach((line) => {
            const [key, ...values] = line.split(': ');
            if (key) {
              entry.responseHeaders![key] = values.join(': ');
            }
          });
        }

        try {
          entry.responseBody = truncateBody(this.responseText, MAX_RESPONSE_BODY_SIZE);
        } catch {
          // Response may not be text
        }

        callback(entry);
      });

      this.addEventListener('error', () => {
        entry.error = 'Network error';
        entry.duration = Date.now() - startTime;
        callback(entry);
      });

      this.addEventListener('timeout', () => {
        entry.error = 'Request timeout';
        entry.duration = Date.now() - startTime;
        callback(entry);
      });
    }

    return originalXhrSend!.call(this, body);
  };

  // Intercept fetch
  const savedFetch = originalFetch;
  window.fetch = async function (
    input: RequestInfo | URL,
    init?: RequestInit
  ): Promise<Response> {
    const entry: NetworkEntry = {
      timestamp: Date.now(),
      id: generateId(),
      method: init?.method?.toUpperCase() || 'GET',
      url: typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url,
      requestHeaders: {},
    };

    if (init?.headers) {
      if (init.headers instanceof Headers) {
        entry.requestHeaders = parseHeaders(init.headers);
      } else if (Array.isArray(init.headers)) {
        for (const [key, value] of init.headers) {
          entry.requestHeaders![key] = value;
        }
      } else {
        entry.requestHeaders = { ...init.headers };
      }
    }

    if (init?.body && typeof init.body === 'string') {
      entry.requestBody = truncateBody(init.body, MAX_REQUEST_BODY_SIZE);
    }

    const startTime = Date.now();

    try {
      const response = await savedFetch!.call(window, input, init);

      entry.status = response.status;
      entry.statusText = response.statusText;
      entry.duration = Date.now() - startTime;
      entry.responseHeaders = parseHeaders(response.headers);

      const clonedResponse = response.clone();
      try {
        const text = await clonedResponse.text();
        entry.responseBody = truncateBody(text, MAX_RESPONSE_BODY_SIZE);
      } catch {
        // Response may not be text
      }

      callback(entry);
      return response;
    } catch (error) {
      entry.error = error instanceof Error ? error.message : 'Fetch error';
      entry.duration = Date.now() - startTime;
      callback(entry);
      throw error;
    }
  };
}

export function stopNetworkRecording(): void {
  if (!isIntercepting) return;

  // Restore originals
  if (originalFetch) {
    window.fetch = originalFetch;
    originalFetch = null;
  }
  if (originalXhrOpen) {
    XMLHttpRequest.prototype.open = originalXhrOpen;
    originalXhrOpen = null;
  }
  if (originalXhrSend) {
    XMLHttpRequest.prototype.send = originalXhrSend;
    originalXhrSend = null;
  }
  if (originalXhrSetRequestHeader) {
    XMLHttpRequest.prototype.setRequestHeader = originalXhrSetRequestHeader;
    originalXhrSetRequestHeader = null;
  }

  isIntercepting = false;
}
