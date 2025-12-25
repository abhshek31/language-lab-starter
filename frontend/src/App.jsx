import React, { useEffect, useState } from 'react';
import Recorder from './Recorder';

const API_BASE = `http://${window.location.hostname}:4000`;

export default function App() {
  const [user, setUser] = useState(null);
  const [recordings, setRecordings] = useState([]);
  const [ws, setWs] = useState(null);

  useEffect(() => {
    const socket = new WebSocket(`ws://${window.location.hostname}:4000`);
    socket.onopen = () => console.log('WS connected');
    setWs(socket);
    return () => socket.close();
  }, []);

  async function login(e) {
    e.preventDefault();
    const form = new FormData(e.target);

    const res = await fetch(`${API_BASE}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: form.get('username'),
        password: form.get('password')
      })
    });

    const data = await res.json();
    if (data.user) setUser(data.user);
  }

  async function uploadRecording(blob) {
    const fd = new FormData();
    fd.append('file', blob, `rec-${Date.now()}.webm`);

    await fetch(`${API_BASE}/api/recordings/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer dummy` },
      body: fd
    });

    alert('Recording uploaded');
  }

  async function loadRecordings() {
    const res = await fetch(`${API_BASE}/api/recordings`, {
      headers: { Authorization: `Bearer dummy` }
    });
    setRecordings(await res.json());
  }

  if (!user) {
    return (
      <form onSubmit={login} style={{ padding: 30 }}>
        <h2>Login</h2>
        <input name="username" placeholder="username" /><br />
        <input name="password" placeholder="password" type="password" /><br />
        <button>Login</button>
      </form>
    );
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>Welcome {user.username}</h2>
      <p>Role: {user.role}</p>

      {user.role === 'student' && (
        <>
          <h3>Record your voice</h3>
          <Recorder onUpload={uploadRecording} />
        </>
      )}

      {user.role === 'teacher' && (
        <>
          <h3>Student Recordings</h3>
          <button onClick={loadRecordings}>Load</button>
          <ul>
            {recordings.map(r => (
              <li key={r.name}>
                {r.name}
                <audio controls src={`${API_BASE}${r.url}`} />
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
