import React, { useEffect, useState } from 'react';
import Recorder from './Recorder';

export default function StudentPanel({ token, ws, uploadRecording }) {
  const [broadcastUrl, setBroadcastUrl] = useState(null);

  useEffect(() => {
    if (!ws) return;
    ws.onmessage = (m) => {
      try {
        const msg = JSON.parse(m.data);
        if (msg.type === 'broadcast' && msg.url) {
          console.log('broadcast', msg.url);
          setBroadcastUrl(msg.url);
          // small autoplay attempt
          const audio = new Audio(msg.url);
          audio.play().catch(()=>{ console.log('autoplay blocked'); });
        }
      } catch (e) {}
    };
  }, [ws]);

  async function handleUploadBlob(blob) {
    const fd = new FormData();
    const filename = `recording-${Date.now()}.webm`;
    fd.append('file', blob, filename);
    const res = await uploadRecording(fd, token);
    alert('Recording uploaded');
  }

  return (
    <div className="panel">
      <h3>Student Console</h3>

      <section className="box">
        <h4>Current Broadcast</h4>
        {broadcastUrl ? <audio controls src={broadcastUrl}></audio> : <div className="muted">No live broadcast</div>}
      </section>

      <section className="box">
        <h4>Record & Upload</h4>
        <Recorder onUpload={handleUploadBlob} />
      </section>
    </div>
  );
}
