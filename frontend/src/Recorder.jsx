import { useRef, useState } from 'react';

export default function Recorder({ onUpload }) {
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const [recording, setRecording] = useState(false);
  const [error, setError] = useState('');

  async function start() {
    setError('');

    // 🔒 Browser security check
    if (
      !navigator.mediaDevices ||
      typeof navigator.mediaDevices.getUserMedia !== 'function'
    ) {
      setError(
        'Microphone access is blocked.\n' +
        'Use https:// or http://localhost.'
      );
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      const chunks = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunks.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });

        // upload recording
        if (onUpload) onUpload(blob);

        // stop microphone tracks
        stream.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      };

      mediaRecorder.start();
      setRecording(true);
    } catch (err) {
      console.error('Microphone error:', err);
      setError('Microphone permission denied or not available.');
    }
  }

  function stop() {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
    }
    setRecording(false);
  }

  return (
    <div style={styles.container}>
      <h4>Voice Recorder</h4>

      {error && <div style={styles.error}>{error}</div>}

      {!recording ? (
        <button onClick={start} style={styles.button}>
          🎙 Start Recording
        </button>
      ) : (
        <button onClick={stop} style={styles.stopButton}>
          ⏹ Stop Recording
        </button>
      )}

      <p style={styles.note}>
        Tip: Allow microphone permission when prompted.
      </p>
    </div>
  );
}

const styles = {
  container: {
    marginTop: 20,
    padding: 16,
    border: '1px solid #ddd',
    borderRadius: 8,
    maxWidth: 320,
  },
  button: {
    padding: '8px 14px',
    fontSize: 14,
    backgroundColor: '#0b5cff',
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
  },
  stopButton: {
    padding: '8px 14px',
    fontSize: 14,
    backgroundColor: '#d93025',
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
  },
  error: {
    color: '#d93025',
    marginBottom: 8,
    whiteSpace: 'pre-line',
  },
  note: {
    fontSize: 12,
    color: '#555',
    marginTop: 10,
  },
};
