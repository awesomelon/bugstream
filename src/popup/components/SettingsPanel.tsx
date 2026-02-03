interface SettingsPanelProps {
  onClose: () => void;
}

export default function SettingsPanel({ onClose }: SettingsPanelProps) {
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
          <label>Buffer Duration</label>
          <span className="setting-value">60 seconds (fixed)</span>
        </div>

        <p className="setting-description">
          BugStream captures the last 60 seconds of activity when saving a report.
        </p>
      </div>
    </div>
  );
}
