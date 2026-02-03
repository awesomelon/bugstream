import { useEffect, useState } from 'react';
import RecordButton from './components/RecordButton';
import StatusIndicator from './components/StatusIndicator';
import SettingsPanel from './components/SettingsPanel';

interface RecordingState {
  isRecording: boolean;
  startTime: number | null;
  bufferDuration: number;
  eventCount: number;
  consoleCount: number;
  networkCount: number;
}

export default function App() {
  const [state, setState] = useState<RecordingState>({
    isRecording: true,
    startTime: null,
    bufferDuration: 0,
    eventCount: 0,
    consoleCount: 0,
    networkCount: 0,
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    const fetchState = async () => {
      try {
        const response = await chrome.runtime.sendMessage({ type: 'GET_STATE' });
        if (response && !response.error) {
          setState(response);
        }
      } catch (error) {
        console.error('Failed to get state:', error);
      }
    };

    fetchState();
    const interval = setInterval(fetchState, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleToggleRecording = async () => {
    try {
      const message = state.isRecording
        ? { type: 'STOP_RECORDING' }
        : { type: 'START_RECORDING' };
      await chrome.runtime.sendMessage(message);
      setState((prev) => ({ ...prev, isRecording: !prev.isRecording }));
    } catch (error) {
      console.error('Failed to toggle recording:', error);
    }
  };

  const handleGenerateReport = async () => {
    setIsGenerating(true);
    try {
      await chrome.runtime.sendMessage({ type: 'GENERATE_REPORT' });
    } catch (error) {
      console.error('Failed to generate report:', error);
    }
    setIsGenerating(false);
  };

  return (
    <div className="popup-container">
      <header className="popup-header">
        <div className="logo">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
            <circle cx="12" cy="12" r="4" fill="currentColor" />
          </svg>
          <span className="logo-text">BugStream</span>
        </div>
        <button
          className="icon-button"
          onClick={() => setShowSettings(!showSettings)}
          title="Settings"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </button>
      </header>

      {showSettings ? (
        <SettingsPanel onClose={() => setShowSettings(false)} />
      ) : (
        <>
          <StatusIndicator
            isRecording={state.isRecording}
            bufferDuration={state.bufferDuration}
            eventCount={state.eventCount}
            consoleCount={state.consoleCount}
            networkCount={state.networkCount}
          />

          <div className="actions">
            <RecordButton
              isRecording={state.isRecording}
              onClick={handleToggleRecording}
            />

            <button
              className="primary-button"
              onClick={handleGenerateReport}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>
                  <span className="spinner" />
                  Generating...
                </>
              ) : (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  Save Report
                </>
              )}
            </button>
          </div>
        </>
      )}

      <footer className="popup-footer">
        <span>Last 60 seconds recorded</span>
      </footer>
    </div>
  );
}
