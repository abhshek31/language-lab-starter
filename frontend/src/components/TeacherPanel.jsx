import React, { useEffect, useState, useRef } from 'react';

export default function TeacherPanel({ token, ws, listLessons, uploadLesson, listRecordings }) {
  const [lessons, setLessons] = useState([]);
  const [recordings, setRecordings] = useState([]);
  const fileRef = useRef();

  useEffect(() => { refresh(); refreshRecordings(); }, []);

  async function refresh() {
    const items = await listLessons(token);
    setLessons(items);
  }

  async function refreshRecordings() {
    const items = await listRecordings(token);
    setRecordings(items);
  }

  async function handleUpload(e) {
    e.preventDefault();
    const file = fileRef.current.files[0];
    if (!file) return alert('select file');
    const fd = new FormData();
    fd.append('file', file);
    const res = await uploadLesson(fd, token);
    alert('Uploaded');
    refresh();
  }

  function broadcast(url) {
    if (!ws || ws.readyState !== 1) return alert('WS not connected');
    ws.send(JSON.stringify({ type: 'broadcast', url }));
    alert('Broadcast triggered');
  }

  return (
    <div className="panel">
      <h3>Teacher Console</h3>

      <section className="box">
        <h4>Upload Lesson Audio</h4>
        <form onSubmit={handleUpload}>
          <input type="file" accept="audio/*" ref={fileRef} />
          <button type="submit">Upload</button>
        </form>
        <small>Upload an MP3/WAV for broadcasting.</small>
      </section>

      <section className="box">
        <h4>Lessons</h4>
        <ul className="list">
          {lessons.map(l => (
            <li key={l.name}>
              <span>{l.name}</span>
              <audio controls src={window.location.origin + l.url}></audio>
              <button onClick={() => broadcast(window.location.origin + l.url)}>Broadcast</button>
            </li>
          ))}
        </ul>
      </section>

      <section className="box">
        <h4>Student Recordings</h4>
        <button onClick={refreshRecordings}>Refresh</button>
        <ul className="list">
          {recordings.map(r => (
            <li key={r.name}>
              <span>{r.name}</span>
              <audio controls src={window.location.origin + r.url}></audio>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
