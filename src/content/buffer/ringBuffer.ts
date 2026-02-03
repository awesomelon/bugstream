interface TimestampedItem {
  timestamp: number;
}

export class RingBuffer<T extends TimestampedItem> {
  private items: T[] = [];
  private maxDuration: number;

  constructor(maxDurationMs: number) {
    this.maxDuration = maxDurationMs;
  }

  push(item: T): void {
    this.items.push(item);
    this.evictOld();
  }

  pushMany(items: T[]): void {
    this.items.push(...items);
    this.evictOld();
  }

  private evictOld(): void {
    if (this.items.length === 0) return;

    const now = Date.now();
    const cutoff = now - this.maxDuration;

    const firstValidIndex = this.items.findIndex(
      (item) => item.timestamp >= cutoff
    );

    if (firstValidIndex > 0) {
      this.items = this.items.slice(firstValidIndex);
    } else if (firstValidIndex === -1) {
      this.items = [];
    }
  }

  getAll(): T[] {
    this.evictOld();
    return [...this.items];
  }

  getRange(startTime: number, endTime: number): T[] {
    return this.items.filter(
      (item) => item.timestamp >= startTime && item.timestamp <= endTime
    );
  }

  get length(): number {
    return this.items.length;
  }

  getDuration(): number {
    this.evictOld();
    if (this.items.length === 0) return 0;
    return Date.now() - this.items[0].timestamp;
  }
}
