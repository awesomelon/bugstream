import { record, type eventWithTime, type recordOptions } from 'rrweb';

type StopFn = () => void;

let stopRecording: StopFn | null = null;
let events: eventWithTime[] = [];

export interface RrwebRecorderOptions {
  onEvent?: (event: eventWithTime) => void;
  blockSelector?: string;
  maskInputSelector?: string;
}

export function startRrwebRecording(options: RrwebRecorderOptions = {}): void {
  if (stopRecording) {
    return;
  }

  events = [];

  const recordConfig: recordOptions<eventWithTime> = {
    emit: (event) => {
      events.push(event);
      options.onEvent?.(event);
    },
    // Block heavy/problematic elements
    blockSelector: options.blockSelector || 'iframe, canvas, video, [data-rrweb-block]',
    blockClass: 'rrweb-block',
    // Mask sensitive inputs
    maskInputOptions: {
      password: true,
    },
    maskInputFn: (text: string, element: HTMLElement | null) => {
      if (element instanceof HTMLInputElement && element.type === 'password') {
        return '*'.repeat(text.length);
      }
      return text;
    },
    // Aggressive sampling to reduce data
    sampling: {
      mousemove: false,
      mouseInteraction: true,
      scroll: 300,
      media: 500,
      input: 'last',
    },
    // Disable expensive features
    recordCanvas: false,
    collectFonts: false,
    inlineStylesheet: true,
    // Limit snapshot complexity
    slimDOMOptions: {
      script: true,
      comment: true,
      headFavicon: true,
      headWhitespace: true,
      headMetaSocial: true,
      headMetaRobots: true,
      headMetaHttpEquiv: true,
      headMetaVerification: true,
      headMetaAuthorship: true,
    },
  };

  try {
    stopRecording = record(recordConfig) ?? null;
  } catch (e) {
    console.error('[BugStream] Failed to start recording:', e);
  }
}

export function stopRrwebRecording(): eventWithTime[] {
  if (stopRecording) {
    stopRecording();
    stopRecording = null;
  }
  const capturedEvents = [...events];
  events = [];
  return capturedEvents;
}

export function getEvents(): eventWithTime[] {
  return [...events];
}

export function isRecording(): boolean {
  return stopRecording !== null;
}

export function clearEvents(): void {
  events = [];
}
