interface SettingsPanelProps {
  bufferDuration: number;
  onBufferDurationChange: (duration: number) => void;
  onClose: () => void;
}

export default function SettingsPanel({
  bufferDuration,
  onBufferDurationChange,
  onClose,
}: SettingsPanelProps) {
  return (
    <div className="settings-panel">
      <div className="settings-header">
        <h3>Settings</h3>
        <button className="icon-button" onClick={onClose}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <div className="settings-content">
        <div className="setting-item">
          <label htmlFor="buffer-duration">Buffer Duration</label>
          <select
            id="buffer-duration"
            value={bufferDuration}
            onChange={(e) => onBufferDurationChange(Number(e.target.value))}
          >
            <option value={30}>30 seconds</option>
            <option value={60}>60 seconds</option>
            <option value={120}>2 minutes</option>
            <option value={300}>5 minutes</option>
          </select>
        </div>

        <p className="setting-description">
          How far back to capture when saving a report.
        </p>
      </div>
    </div>
  );
}
