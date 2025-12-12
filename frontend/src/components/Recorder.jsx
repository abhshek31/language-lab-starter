import React, { useRef, useState } from 'react';

export default function Recorder({ onUpload }) {
  const mediaRef = useRef(null);
  const [recording, setRecording] = useState(false);
  const [chunks, setChunks] = useState([]);

  async function start() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      mediaRef.current = mr;
      mr.ondataavailable = e => setChunks(prev => [...prev, e.data]);
      mr.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        onUpload(blob);
        setChunks([]);
      };
      mr.start();
      setRecording(true);
    } catch (e) {
      alert('Microphone permission required');
    }
  }

  function stop() {
    mediaRef.current?.stop();
    setRecording(false);
  }

  return (
    <div>
      {recording ? <button onClick={stop}>Stop</button> : <button onClick={start}>Record</button>}
      <div style={{marginTop:8}}>Recorded files will upload automatically after stop.</div>
    </div>
  );
}
