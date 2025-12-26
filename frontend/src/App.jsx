import { useState, useEffect } from 'react';
import Recorder from './Recorder.jsx';
import {
  login,
  registerUser,
  getPendingUsers,
  approveUser,
  rejectUser,
  listRecordings,
  uploadRecording,
} from './api';

// ------------------------
// Main App
// ------------------------
export default function App() {
  const [user, setUser] = useState(null);
  const [error, setError] = useState('');
  const [view, setView] = useState('login'); // login | register
  const [recordings, setRecordings] = useState([]);
  const [pendingUsers, setPendingUsers] = useState([]);

  // ------------------------
  // LOGIN
  // ------------------------
  async function handleLogin(e) {
    e.preventDefault();
    setError('');

    const f = new FormData(e.target);
    const res = await login(f.get('username'), f.get('password'));

    if (!res.token) {
      setError(res.error || 'Login failed');
      return;
    }

    localStorage.setItem('token', res.token);
    setUser(res.user);
  }

  // ------------------------
  // REGISTER
  // ------------------------
  async function handleRegister(e) {
    e.preventDefault();
    setError('');

    const f = new FormData(e.target);

    const res = await registerUser({
      username: f.get('username'),
      password: f.get('password'),
      role: f.get('role'),
      full_name: f.get('full_name'),
      class_name: f.get('class_name'),
    });

    if (res.error) {
      setError(res.error);
      return;
    }

    alert('Registration submitted. Waiting for admin approval.');
    setView('login');
  }

  // ------------------------
  // ADMIN
  // ------------------------
  async function loadPendingUsers() {
    const data = await getPendingUsers();
    setPendingUsers(data);
  }

  async function approve(id) {
    await approveUser(id);
    loadPendingUsers();
  }

  async function reject(id) {
    await rejectUser(id);
    loadPendingUsers();
  }

  // ------------------------
  // TEACHER
  // ------------------------
  async function loadTeacherRecordings() {
    const data = await listRecordings();
    setRecordings(data);
  }

  // ------------------------
  // STUDENT
  // ------------------------
  async function uploadStudentRecording(blob) {
    const fd = new FormData();
    fd.append('file', blob, `recording-${Date.now()}.webm`);
    await uploadRecording(fd);
    alert('Recording uploaded');
  }

  // ========================
  // LOGIN VIEW
  // ========================
  if (!user && view === 'login') {
    return (
      <div style={styles.center}>
        <form onSubmit={handleLogin} style={styles.card}>
          <h2>Digital Language Lab</h2>

          <input name="username" placeholder="Username" required />
          <input name="password" type="password" placeholder="Password" required />

          <button>Login</button>

          {error && <p style={styles.error}>{error}</p>}

          <p style={styles.link} onClick={() => setView('register')}>
            New user? Register
          </p>
        </form>
      </div>
    );
  }

  // ========================
  // REGISTER VIEW
  // ========================
  if (!user && view === 'register') {
    return (
      <div style={styles.center}>
        <form onSubmit={handleRegister} style={styles.card}>
          <h2>User Registration</h2>

          <input name="full_name" placeholder="Full Name" required />
          <input name="username" placeholder="Username" required />
          <input name="password" type="password" placeholder="Password" required />

          <select name="role">
            <option value="student">Student</option>
            <option value="teacher">Teacher</option>
          </select>

          <input name="class_name" placeholder="Class / Batch" />

          <button>Register</button>

          {error && <p style={styles.error}>{error}</p>}

          <p style={styles.link} onClick={() => setView('login')}>
            ← Back to Login
          </p>
        </form>
      </div>
    );
  }

  // ========================
  // ADMIN DASHBOARD
  // ========================
  if (user.role === 'admin') {
    return (
      <div style={styles.page}>
        <h2>Admin Dashboard</h2>
        <button onClick={loadPendingUsers}>Load Pending Users</button>

        <table border="1" cellPadding="6" style={{ marginTop: 10 }}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Role</th>
              <th>Class</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {pendingUsers.map((u) => (
              <tr key={u.id}>
                <td>{u.full_name}</td>
                <td>{u.role}</td>
                <td>{u.class_name}</td>
                <td>
                  <button onClick={() => approve(u.id)}>Approve</button>
                  <button onClick={() => reject(u.id)}>Reject</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  // ========================
  // TEACHER DASHBOARD
  // ========================
  if (user.role === 'teacher') {
    return (
      <div style={styles.page}>
        <h2>Teacher Dashboard</h2>
        <button onClick={loadTeacherRecordings}>Load Student Recordings</button>

        <ul style={styles.list}>
          {recordings.map((r) => (
            <li key={r.name}>
              {r.name}
              <br />
              <audio controls src={`http://${window.location.hostname}:4000${r.url}`} />
            </li>
          ))}
        </ul>

        <p style={{ marginTop: 20 }}>
          🔜 Student online/offline monitor coming in PHASE 3
        </p>
      </div>
    );
  }

  // ========================
  // STUDENT DASHBOARD
  // ========================
  return (
    <div style={styles.page}>
      <h2>Student Dashboard</h2>
      <Recorder onUpload={uploadStudentRecording} />
    </div>
  );
}

// ------------------------
// Styles
// ------------------------
const styles = {
  center: {
    height: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    width: 320,
    padding: 20,
    border: '1px solid #ddd',
    borderRadius: 8,
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  page: {
    padding: 20,
  },
  error: {
    color: 'red',
    fontSize: 13,
  },
  link: {
    fontSize: 13,
    color: '#0066cc',
    cursor: 'pointer',
  },
  list: {
    listStyle: 'none',
    paddingLeft: 0,
  },
};
