// This script is injected into the page context to intercept network requests
// It runs in the MAIN world, not the isolated content script world

export {};

const MAX_REQUEST_BODY_SIZE = 50000;
const MAX_RESPONSE_BODY_SIZE = 100000;

interface NetworkEntry {
  timestamp: number;
  id: string;
  method: string;
  url: string;
  requestHeaders?: Record<string, string>;
  requestBody?: string;
  status?: number;
  statusText?: string;
  responseHeaders?: Record<string, string>;
  responseBody?: string;
  duration?: number;
  error?: string;
}

interface ExtendedWindow extends Window {
  __bugstreamNetworkIntercepting?: boolean;
}

(function (win: ExtendedWindow) {
  if (win.__bugstreamNetworkIntercepting) return;
  win.__bugstreamNetworkIntercepting = true;

  let requestId = 0;

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

  function sendEntry(entry: NetworkEntry): void {
    win.postMessage({ type: '__BUGSTREAM_NETWORK_ENTRY__', entry }, '*');
  }

  // Intercept XMLHttpRequest
  const originalXhrOpen = XMLHttpRequest.prototype.open;
  const originalXhrSend = XMLHttpRequest.prototype.send;
  const originalXhrSetRequestHeader = XMLHttpRequest.prototype.setRequestHeader;

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

    return originalXhrOpen.call(this, method, url, async, user, password);
  };

  XMLHttpRequest.prototype.setRequestHeader = function (name: string, value: string) {
    const entry = (this as XMLHttpRequest & { __bugstream_entry?: NetworkEntry }).__bugstream_entry;
    if (entry && entry.requestHeaders) {
      entry.requestHeaders[name] = value;
    }
    return originalXhrSetRequestHeader.call(this, name, value);
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

        sendEntry(entry);
      });

      this.addEventListener('error', () => {
        entry.error = 'Network error';
        entry.duration = Date.now() - startTime;
        sendEntry(entry);
      });

      this.addEventListener('timeout', () => {
        entry.error = 'Request timeout';
        entry.duration = Date.now() - startTime;
        sendEntry(entry);
      });
    }

    return originalXhrSend.call(this, body);
  };

  // Intercept fetch
  const originalFetch = win.fetch;

  win.fetch = async function (
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
      const response = await originalFetch.call(win, input, init);

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

      sendEntry(entry);
      return response;
    } catch (error) {
      entry.error = error instanceof Error ? error.message : 'Fetch error';
      entry.duration = Date.now() - startTime;
      sendEntry(entry);
      throw error;
    }
  };
})(window as ExtendedWindow);
