interface StatusIndicatorProps {
  isRecording: boolean;
  bufferDuration: number;
  eventCount: number;
  consoleCount: number;
  networkCount: number;
}

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export default function StatusIndicator({
  isRecording,
  bufferDuration,
  eventCount,
  consoleCount,
  networkCount,
}: StatusIndicatorProps) {
  return (
    <div className="status-container">
      <div className={`status-badge ${isRecording ? 'active' : 'inactive'}`}>
        <span className="status-dot" />
        <span className="status-text">{isRecording ? 'Recording' : 'Paused'}</span>
        <span className="status-timer">{formatDuration(bufferDuration)}</span>
      </div>

      <div className="stats-grid">
        <div className="stat-item">
          <span className="stat-value">{eventCount}</span>
          <span className="stat-label">DOM Events</span>
        </div>
        <div className="stat-item">
          <span className="stat-value">{consoleCount}</span>
          <span className="stat-label">Console</span>
        </div>
        <div className="stat-item">
          <span className="stat-value">{networkCount}</span>
          <span className="stat-label">Network</span>
        </div>
      </div>
    </div>
  );
}
