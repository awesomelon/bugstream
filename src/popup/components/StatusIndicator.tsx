interface StatusIndicatorProps {
  isRecording: boolean;
  eventCount: number;
  consoleCount: number;
  networkCount: number;
}

export default function StatusIndicator({
  isRecording,
  eventCount,
  consoleCount,
  networkCount,
}: StatusIndicatorProps) {
  return (
    <div className="status-container">
      <div className={`status-badge ${isRecording ? 'active' : 'inactive'}`}>
        <span className="status-dot" />
        <span className="status-text">{isRecording ? 'Recording' : 'Paused'}</span>
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
