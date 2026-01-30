export const BUGSTREAM_VERSION = '1.0.0';

export const DEFAULT_BUFFER_DURATION = 60000; // 60 seconds in ms

export const STORAGE_KEYS = {
  BUFFER_DURATION: 'bufferDuration',
  RECORDING_STATE: 'recordingState',
} as const;

export const MAX_CONSOLE_ENTRIES = 1000;
export const MAX_NETWORK_ENTRIES = 500;
export const MAX_REQUEST_BODY_SIZE = 50 * 1024; // 50KB
export const MAX_RESPONSE_BODY_SIZE = 100 * 1024; // 100KB
