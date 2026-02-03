import type { ConsoleEntry } from '../../shared/types';

let isIntercepting = false;
let onEntry: ((entry: ConsoleEntry) => void) | null = null;

function handleMessage(event: MessageEvent): void {
  if (event.source !== window) return;
  if (event.data?.type !== '__BUGSTREAM_CONSOLE_ENTRY__') return;

  const entry = event.data.entry as ConsoleEntry;
  if (entry && onEntry) {
    onEntry(entry);
  }
}

export function startConsoleInterception(callback: (entry: ConsoleEntry) => void): void {
  if (isIntercepting) return;

  onEntry = callback;
  isIntercepting = true;

  // Listen for messages from the injected script
  window.addEventListener('message', handleMessage);

  // Inject script into the page context using a file URL
  // This works better with CSP than inline scripts
  const script = document.createElement('script');
  script.src = chrome.runtime.getURL('injected/consoleInjected.js');
  script.onload = () => script.remove();
  script.onerror = () => {
    console.error('[BugStream] Failed to load console interceptor script');
    script.remove();
  };
  (document.head || document.documentElement).appendChild(script);
}

export function stopConsoleInterception(): void {
  if (!isIntercepting) return;

  window.removeEventListener('message', handleMessage);

  // Note: We can't easily restore the original console in the page context
  // The injected script has a guard to prevent re-injection

  isIntercepting = false;
  onEntry = null;
}

export function isConsoleIntercepting(): boolean {
  return isIntercepting;
}
