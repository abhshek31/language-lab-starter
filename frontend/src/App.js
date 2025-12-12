import React, { useEffect, useState, useRef } from 'react';
import { login, listLessons, uploadLesson, uploadRecording, listRecordings } from './api';
import TeacherPanel from './components/TeacherPanel';
import StudentPanel from './components/StudentPanel';
import './styles.css';

function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [ws, setWs] = useState(null);

  useEffect(() => {
    // connect websocket to backend (used for broadcast events)
    const url = (window.location.origin.includes('localhost') ? 'ws://localhost:4000' : (window.location.origin.replace(/^http/, 'ws')));
    const socket = new WebSocket(url);
    socket.onopen = () => {
      console.log('ws open');
      socket.send(JSON.stringify({ type: 'hello', identity: user ? user.username : 'guest', role: user ? user.role : 'guest' }));
    };
    socket.onmessage = (m) => {
      console.log('ws msg', m.data);
    };
    setWs(socket);
    return () => socket.close();
  }, [user]);

  async function doLogin(e) {
    e.preventDefault();
    const form = new FormData(e.target);
    const username = form.get('username');
    const password = form.get('password');
    const j = await login(username, password);
    if (j.token) {
      setToken(j.token);
      setUser(j.user);
      alert(`Logged in as ${j.user.role}`);
    } else {
      alert('Login failed');
    }
  }

  if (!user) {
    return (
      <div className="centered">
        <div className="card">
          <h2>Language Lab — Demo</h2>
          <p>Use <b>teacher/teacherpass</b> or <b>student/studentpass</b></p>
          <form onSubmit={doLogin}>
            <input name="username" placeholder="username" defaultValue="student" />
            <input name="password" placeholder="password" type="password" defaultValue="studentpass" />
            <button type="submit">Login</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <img className="logo" alt="logo" src={`data:image/svg+xml;utf8,${encodeURIComponent(logoSVG)}`} />
          <span>Language Lab</span>
        </div>
        <div>Signed in as <b>{user.username}</b> ({user.role})</div>
      </header>

      <main className="main">
        {user.role === 'teacher' ? (
          <TeacherPanel token={token} ws={ws} listLessons={listLessons} uploadLesson={uploadLesson} listRecordings={listRecordings} />
        ) : (
          <StudentPanel token={token} ws={ws} uploadRecording={uploadRecording} />
        )}
      </main>
    </div>
  );
}

// simple inline SVG logo (small)
const logoSVG = `
<svg xmlns='http://www.w3.org/2000/svg' width='36' height='36' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='1.2'>
  <rect x='1' y='1' width='22' height='22' rx='4' fill='%23f3f4f6'/>
  <path d='M7 8h10M7 12h10M7 16h6' stroke='%23033' stroke-linecap='round'/>
</svg>
`;

export default App;
