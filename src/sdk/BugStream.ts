import type { eventWithTime } from 'rrweb';
import type {
  BugStreamOptions,
  BugStreamState,
  BugStreamReport,
  ReportMetadata,
  ConsoleEntry,
  NetworkEntry,
  KeyboardEntry,
} from './types';
import { DEFAULT_BUFFER_DURATION, BUGSTREAM_VERSION } from './constants';
import { RingBuffer } from './buffer/ringBuffer';
import { startRrwebRecording, stopRrwebRecording, isRecording, takeFullSnapshot } from './recorders/rrwebRecorder';
import { startConsoleRecording, stopConsoleRecording } from './recorders/consoleRecorder';
import { startNetworkRecording, stopNetworkRecording } from './recorders/networkRecorder';
import { startKeyboardRecording, stopKeyboardRecording } from './recorders/keyboardRecorder';
import { sanitizeNetworkEntry, sanitizeConsoleEntry } from './sanitizer/dataSanitizer';
import { generateHtmlReport } from './generator/generateReport';

export class BugStream {
  private rrwebBuffer: RingBuffer<eventWithTime & { timestamp: number }>;
  private consoleBuffer: RingBuffer<ConsoleEntry>;
  private networkBuffer: RingBuffer<NetworkEntry>;
  private keyboardBuffer: RingBuffer<KeyboardEntry>;
  private options: BugStreamOptions;
  private recordingStartTime: number | null = null;
  private visibilityHandler: (() => void) | null = null;

  constructor(options?: BugStreamOptions) {
    this.options = options || {};
    const duration = this.options.bufferDuration || DEFAULT_BUFFER_DURATION;

    this.rrwebBuffer = new RingBuffer(duration);
    this.consoleBuffer = new RingBuffer(duration);
    this.networkBuffer = new RingBuffer(duration);
    this.keyboardBuffer = new RingBuffer(duration);
  }

  start(): void {
    if (isRecording()) return;

    this.recordingStartTime = Date.now();

    startRrwebRecording({
      onEvent: (event) => {
        this.rrwebBuffer.push(event);
      },
      blockSelector: this.options.blockSelector,
      maskInputSelector: this.options.maskInputSelector,
    });

    startConsoleRecording((entry) => {
      this.consoleBuffer.push(sanitizeConsoleEntry(entry));
    });

    startNetworkRecording((entry) => {
      this.networkBuffer.push(sanitizeNetworkEntry(entry));
    });

    startKeyboardRecording((entry) => {
      this.keyboardBuffer.push(entry);
    });

    // Handle tab visibility changes for recording stability
    this.visibilityHandler = () => {
      if (document.visibilityState === 'visible' && isRecording()) {
        takeFullSnapshot();
      }
    };
    document.addEventListener('visibilitychange', this.visibilityHandler);
  }

  stop(): void {
    stopRrwebRecording();
    stopConsoleRecording();
    stopNetworkRecording();
    stopKeyboardRecording();

    if (this.visibilityHandler) {
      document.removeEventListener('visibilitychange', this.visibilityHandler);
      this.visibilityHandler = null;
    }
  }

  getState(): BugStreamState {
    return {
      isRecording: isRecording(),
      startTime: this.recordingStartTime,
      bufferDuration: this.rrwebBuffer.getDuration(),
      eventCount: this.rrwebBuffer.length,
      consoleCount: this.consoleBuffer.length,
      networkCount: this.networkBuffer.length,
      keyboardCount: this.keyboardBuffer.length,
    };
  }

  async generateReport(): Promise<string> {
    const events = this.rrwebBuffer.getAll();
    const consoleLogs = this.consoleBuffer.getAll();
    const networkLogs = this.networkBuffer.getAll();
    const keyboardLogs = this.keyboardBuffer.getAll();

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

    const report: BugStreamReport = {
      version: BUGSTREAM_VERSION,
      metadata,
      events,
      console: consoleLogs,
      network: networkLogs,
      keyboard: keyboardLogs,
    };

    const htmlContent = await generateHtmlReport(report);
    return this.downloadHtml(htmlContent);
  }

  destroy(): void {
    this.stop();
    this.rrwebBuffer.clear();
    this.consoleBuffer.clear();
    this.networkBuffer.clear();
    this.keyboardBuffer.clear();
    this.recordingStartTime = null;
  }

  private downloadHtml(htmlContent: string): string {
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
}
