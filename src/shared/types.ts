import type { eventWithTime } from 'rrweb';

export interface ConsoleEntry {
  timestamp: number;
  level: 'log' | 'info' | 'warn' | 'error' | 'debug';
  args: unknown[];
  stack?: string;
}

export interface NetworkEntry {
  timestamp: number;
  id: string;
  method: string;
  url: string;
  status?: number;
  statusText?: string;
  requestHeaders?: Record<string, string>;
  responseHeaders?: Record<string, string>;
  requestBody?: string;
  responseBody?: string;
  duration?: number;
  error?: string;
}

export interface BugStreamReport {
  version: string;
  metadata: ReportMetadata;
  events: eventWithTime[];
  console: ConsoleEntry[];
  network: NetworkEntry[];
}

export interface ReportMetadata {
  url: string;
  title: string;
  timestamp: number;
  userAgent: string;
  screenWidth: number;
  screenHeight: number;
  duration: number;
}

export interface RecordingState {
  isRecording: boolean;
  startTime: number | null;
  bufferDuration: number;
}

export type MessageType =
  | 'START_RECORDING'
  | 'STOP_RECORDING'
  | 'GET_STATE'
  | 'GENERATE_REPORT'
  | 'RECORDING_STATE_CHANGED';

export interface Message<T = unknown> {
  type: MessageType;
  payload?: T;
}
