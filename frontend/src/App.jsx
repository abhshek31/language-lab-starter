import React, { useEffect, useState } from 'react';

const API_BASE = `http://${window.location.hostname}:4000`;

export default function App() {
  const [user, setUser] = useState(null);
  const [error, setError] = useState('');
  const [ws, setWs] = useState(null);

  // connect websocket once
  useEffect(() => {
    const socket = new WebSocket(`ws://${window.location.hostname}:4000`);

    socket.onopen = () => console.log('WS connected');
    socket.onerror = (e) => console.error('WS error', e);

    setWs(socket);
    return () => socket.close();
  }, []);

  async function handleLogin(e) {
    e.preventDefault();
    const form = new FormData(e.target);

    const res = await fetch(`${API_BASE}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: form.get('username'),
        password: form.get('password'),
      }),
    });

    const data = await res.json();
    if (!data.token) {
      setError('Login failed');
    } else {
      setUser(data.user);
    }
  }

  if (!user) {
    return (
      <div style={styles.center}>
        <form onSubmit={handleLogin} style={styles.card}>
          <h2>Language Lab</h2>
          <input name="username" placeholder="username" />
          <input name="password" type="password" placeholder="password" />
          <button type="submit">Login</button>
          {error && <p style={{ color: 'red' }}>{error}</p>}
          <p style={{ fontSize: 12 }}>
            teacher / teacherpass<br />
            student / studentpass
          </p>
        </form>
      </div>
    );
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>Welcome {user.username}</h2>
      <p>Role: {user.role}</p>

      {user.role === 'teacher' ? (
        <button
          onClick={() =>
            ws?.send(
              JSON.stringify({
                type: 'broadcast',
                url: `${API_BASE}/uploads/sample.mp3`,
              })
            )
          }
        >
          Broadcast Sample Audio
        </button>
      ) : (
        <p>Waiting for teacher broadcast…</p>
      )}
    </div>
  );
}

const styles = {
  center: {
    height: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    width: 300,
    padding: 20,
    border: '1px solid #ddd',
    borderRadius: 8,
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
};

