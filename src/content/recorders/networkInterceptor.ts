import type { NetworkEntry } from '../../shared/types';

let isIntercepting = false;
let onEntry: ((entry: NetworkEntry) => void) | null = null;

function handleMessage(event: MessageEvent): void {
  if (event.source !== window) return;
  if (event.data?.type !== '__BUGSTREAM_NETWORK_ENTRY__') return;

  const entry = event.data.entry as NetworkEntry;
  if (entry && onEntry) {
    onEntry(entry);
  }
}

export function startNetworkInterception(
  callback: (entry: NetworkEntry) => void
): void {
  if (isIntercepting) return;

  onEntry = callback;
  isIntercepting = true;

  // Listen for messages from the injected script
  window.addEventListener('message', handleMessage);

  // Inject script into the page context using a file URL
  // This works better with CSP than inline scripts
  const script = document.createElement('script');
  script.src = chrome.runtime.getURL('injected/networkInjected.js');
  script.onload = () => script.remove();
  script.onerror = () => {
    console.error('[BugStream] Failed to load network interceptor script');
    script.remove();
  };
  (document.head || document.documentElement).appendChild(script);
}

export function stopNetworkInterception(): void {
  if (!isIntercepting) return;

  window.removeEventListener('message', handleMessage);

  // Note: We can't easily restore the original fetch/XHR in the page context
  // The injected script has a guard to prevent re-injection

  isIntercepting = false;
  onEntry = null;
}
