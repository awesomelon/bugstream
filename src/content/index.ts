import type { eventWithTime } from 'rrweb';
import type { ConsoleEntry, NetworkEntry, KeyboardEntry, Message, BugStreamReport, ReportMetadata } from '../shared/types';
import { DEFAULT_BUFFER_DURATION, BUGSTREAM_VERSION } from '../shared/constants';
import { RingBuffer } from './buffer/ringBuffer';
import { startRrwebRecording, stopRrwebRecording, isRecording, takeFullSnapshot } from './recorders/rrwebRecorder';
import { startConsoleInterception, stopConsoleInterception } from './recorders/consoleInterceptor';
import { startNetworkInterception, stopNetworkInterception } from './recorders/networkInterceptor';
import { startKeyboardInterception, stopKeyboardInterception } from './recorders/keyboardInterceptor';
import { sanitizeNetworkEntry, sanitizeConsoleEntry } from './sanitizer/dataSanitizer';
import { generateHtmlReport } from '../generator/generateReport';

const rrwebBuffer = new RingBuffer<eventWithTime & { timestamp: number }>(DEFAULT_BUFFER_DURATION);
const consoleBuffer = new RingBuffer<ConsoleEntry>(DEFAULT_BUFFER_DURATION);
const networkBuffer = new RingBuffer<NetworkEntry>(DEFAULT_BUFFER_DURATION);
const keyboardBuffer = new RingBuffer<KeyboardEntry>(DEFAULT_BUFFER_DURATION);

let recordingStartTime: number | null = null;

function startRecording(): void {
  if (isRecording()) return;

  recordingStartTime = Date.now();

  startRrwebRecording({
    onEvent: (event) => {
      rrwebBuffer.push(event);
    },
  });

  startConsoleInterception((entry) => {
    consoleBuffer.push(sanitizeConsoleEntry(entry));
  });

  startNetworkInterception((entry) => {
    networkBuffer.push(sanitizeNetworkEntry(entry));
  });

  startKeyboardInterception((entry) => {
    keyboardBuffer.push(entry);
  });
}

function stopRecording(): void {
  stopRrwebRecording();
  stopConsoleInterception();
  stopNetworkInterception();
  stopKeyboardInterception();
}

function generateReport(): BugStreamReport {
  const events = rrwebBuffer.getAll();
  const consoleLogs = consoleBuffer.getAll();
  const networkLogs = networkBuffer.getAll();
  const keyboardLogs = keyboardBuffer.getAll();

  const startTime = events.length > 0 ? events[0].timestamp : Date.now();
  const endTime = events.length > 0 ? events[events.length - 1].timestamp : Date.now();

  const metadata: ReportMetadata = {
    url: window.location.href,
    title: document.title,
    timestamp: Date.now(),
    userAgent: navigator.userAgent,
    screenWidth: window.innerWidth,
    screenHeight: window.innerHeight,
    duration: endTime - startTime,
  };

  return {
    version: BUGSTREAM_VERSION,
    metadata,
    events,
    console: consoleLogs,
    network: networkLogs,
    keyboard: keyboardLogs,
  };
}

function downloadHtml(htmlContent: string): string {
  const blob = new Blob([htmlContent], { type: 'text/html' });
  const url = URL.createObjectURL(blob);

  const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
  const filename = `bugstream-report-${timestamp}.html`;

  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  // Revoke after a short delay to ensure download starts
  setTimeout(() => URL.revokeObjectURL(url), 1000);

  return filename;
}

chrome.runtime.onMessage.addListener(
  (message: Message, _sender: chrome.runtime.MessageSender, sendResponse: (response: unknown) => void) => {
    (async () => {
      try {
        switch (message.type) {
          case 'START_RECORDING':
            startRecording();
            sendResponse({ success: true });
            break;

          case 'STOP_RECORDING':
            stopRecording();
            sendResponse({ success: true });
            break;

          case 'GET_STATE':
            sendResponse({
              isRecording: isRecording(),
              startTime: recordingStartTime,
              bufferDuration: rrwebBuffer.getDuration(),
              eventCount: rrwebBuffer.length,
              consoleCount: consoleBuffer.length,
              networkCount: networkBuffer.length,
              keyboardCount: keyboardBuffer.length,
            });
            break;

          case 'GENERATE_REPORT':
            const report = generateReport();
            const htmlContent = await generateHtmlReport(report);
            const filename = downloadHtml(htmlContent);
            sendResponse({ success: true, filename });
            break;

          default:
            sendResponse({ error: 'Unknown message type' });
        }
      } catch (error) {
        console.error('[BugStream] Error:', error);
        sendResponse({ error: error instanceof Error ? error.message : 'Unknown error' });
      }
    })();

    return true;
  }
);

startRecording();

// Handle tab visibility changes for recording stability
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && isRecording()) {
    // Take full snapshot when tab becomes visible again
    // This ensures rrweb re-syncs the DOM state after potential JS suspension
    takeFullSnapshot();
  }
});

console.log('[BugStream] Content script loaded and recording started');
