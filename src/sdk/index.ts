import { BugStream } from './BugStream';

// Register as global
(window as any).BugStream = BugStream;

export default BugStream;
export type { BugStreamOptions, BugStreamState, BugStreamReport, ReportMetadata } from './types';
export type { ConsoleEntry, NetworkEntry, KeyboardEntry } from './types';
