import type { KeyboardEntry } from '../../shared/types';

let isIntercepting = false;
let onEntry: ((entry: KeyboardEntry) => void) | null = null;

function handleMessage(event: MessageEvent): void {
  if (event.source !== window) return;
  if (event.data?.type !== '__BUGSTREAM_KEYBOARD_ENTRY__') return;

  const entry = event.data.entry as KeyboardEntry;
  if (entry && onEntry) {
    onEntry(entry);
  }
}

export function startKeyboardInterception(callback: (entry: KeyboardEntry) => void): void {
  if (isIntercepting) return;

  onEntry = callback;
  isIntercepting = true;

  // Listen for messages from the injected script
  window.addEventListener('message', handleMessage);

  // Inject script into the page context using a file URL
  const script = document.createElement('script');
  script.src = chrome.runtime.getURL('injected/keyboardInjected.js');
  script.onload = () => script.remove();
  script.onerror = () => {
    console.error('[BugStream] Failed to load keyboard interceptor script');
    script.remove();
  };
  (document.head || document.documentElement).appendChild(script);
}

export function stopKeyboardInterception(): void {
  if (!isIntercepting) return;

  window.removeEventListener('message', handleMessage);

  isIntercepting = false;
  onEntry = null;
}

export function isKeyboardIntercepting(): boolean {
  return isIntercepting;
}
