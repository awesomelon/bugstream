import type { KeyboardEntry } from '../types';

type KeyboardEventType = 'keydown' | 'keyup';

let isIntercepting = false;
let keydownHandler: ((event: KeyboardEvent) => void) | null = null;
let keyupHandler: ((event: KeyboardEvent) => void) | null = null;

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

function createHandler(
  eventType: KeyboardEventType,
  callback: (entry: KeyboardEntry) => void
): (event: KeyboardEvent) => void {
  return (event: KeyboardEvent) => {
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

    callback(entry);
  };
}

export function startKeyboardRecording(callback: (entry: KeyboardEntry) => void): void {
  if (isIntercepting) return;
  isIntercepting = true;

  keydownHandler = createHandler('keydown', callback);
  keyupHandler = createHandler('keyup', callback);

  document.addEventListener('keydown', keydownHandler, true);
  document.addEventListener('keyup', keyupHandler, true);
}

export function stopKeyboardRecording(): void {
  if (!isIntercepting) return;

  if (keydownHandler) {
    document.removeEventListener('keydown', keydownHandler, true);
    keydownHandler = null;
  }
  if (keyupHandler) {
    document.removeEventListener('keyup', keyupHandler, true);
    keyupHandler = null;
  }

  isIntercepting = false;
}
