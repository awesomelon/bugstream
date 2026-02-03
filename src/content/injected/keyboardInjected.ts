// This script is injected into the page context to intercept keyboard events
// It runs in the MAIN world, not the isolated content script world

export {};

type KeyboardEventType = 'keydown' | 'keyup';

interface KeyboardEntry {
  timestamp: number;
  type: KeyboardEventType;
  key: string;
  code: string;
  ctrlKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
  metaKey: boolean;
  repeat: boolean;
  targetType?: string;
  masked?: boolean;
}

interface ExtendedWindow extends Window {
  __bugstreamKeyboardIntercepting?: boolean;
}

(function (win: ExtendedWindow) {
  if (win.__bugstreamKeyboardIntercepting) return;
  win.__bugstreamKeyboardIntercepting = true;

  function isPasswordField(target: EventTarget | null): boolean {
    if (!target || !(target instanceof HTMLInputElement)) return false;
    return target.type === 'password';
  }

  function getTargetType(target: EventTarget | null): string | undefined {
    if (!target) return undefined;
    if (target instanceof HTMLElement) {
      return target.tagName;
    }
    return undefined;
  }

  function sendEntry(entry: KeyboardEntry): void {
    win.postMessage({ type: '__BUGSTREAM_KEYBOARD_ENTRY__', entry }, '*');
  }

  function handleKeyboardEvent(event: KeyboardEvent, eventType: KeyboardEventType): void {
    const isPassword = isPasswordField(event.target);

    const entry: KeyboardEntry = {
      timestamp: Date.now(),
      type: eventType,
      key: isPassword ? '*' : event.key,
      code: event.code,
      ctrlKey: event.ctrlKey,
      shiftKey: event.shiftKey,
      altKey: event.altKey,
      metaKey: event.metaKey,
      repeat: event.repeat,
      targetType: getTargetType(event.target),
      masked: isPassword || undefined,
    };

    sendEntry(entry);
  }

  document.addEventListener(
    'keydown',
    (event) => handleKeyboardEvent(event, 'keydown'),
    true
  );

  document.addEventListener(
    'keyup',
    (event) => handleKeyboardEvent(event, 'keyup'),
    true
  );
})(window as ExtendedWindow);
