import { useRef, useState } from 'react';

export default function Recorder({ onUpload }) {
  const mediaRef = useRef(null);
  const [recording, setRecording] = useState(false);
  const [chunks, setChunks] = useState([]);

  async function start() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);

    mediaRef.current = recorder;
    recorder.ondataavailable = e => setChunks(c => [...c, e.data]);
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'audio/webm' });
      onUpload(blob);
      setChunks([]);
    };

    recorder.start();
    setRecording(true);
  }

  function stop() {
    mediaRef.current?.stop();
    setRecording(false);
  }

  return (
    <div>
      {recording ? (
        <button onClick={stop}>Stop Recording</button>
      ) : (
        <button onClick={start}>Start Recording</button>
      )}
    </div>
  );
}
