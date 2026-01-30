interface RecordButtonProps {
  isRecording: boolean;
  onClick: () => void;
}

export default function RecordButton({ isRecording, onClick }: RecordButtonProps) {
  return (
    <button
      className={`record-button ${isRecording ? 'recording' : ''}`}
      onClick={onClick}
      title={isRecording ? 'Stop Recording' : 'Start Recording'}
    >
      <span className="record-icon" />
      {isRecording ? 'Recording' : 'Start Recording'}
    </button>
  );
}
