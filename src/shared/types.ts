import type { eventWithTime } from 'rrweb';

export interface ConsoleEntry {
  timestamp: number;
  level: 'log' | 'info' | 'warn' | 'error' | 'debug';
  args: unknown[];
  stack?: string;
}

export interface KeyboardEntry {
  timestamp: number;
  type: 'keydown' | 'keyup';
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
  keyboard: KeyboardEntry[];
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
