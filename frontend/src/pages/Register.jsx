import { useState } from 'react';
import { api } from '../api';

export default function Register({ goLogin }) {
  const [msg, setMsg] = useState('');

  async function submit(e) {
    e.preventDefault();
    const f = new FormData(e.target);

    const res = await api('/api/register', {
      method: 'POST',
      body: JSON.stringify({
        username: f.get('username'),
        password: f.get('password'),
        role: f.get('role'),
        full_name: f.get('full_name'),
        class_name: f.get('class_name'),
      }),
    });

    setMsg(res.message || res.error);
  }

  return (
    <form onSubmit={submit} style={box}>
      <h3>User Registration</h3>

      <input name="full_name" placeholder="Full Name" required />
      <input name="username" placeholder="Username" required />
      <input name="password" type="password" placeholder="Password" required />

      <select name="role">
        <option value="student">Student</option>
        <option value="teacher">Teacher</option>
      </select>

      <input name="class_name" placeholder="Class / Batch" />

      <button>Register</button>

      {msg && <p>{msg}</p>}
      <p onClick={goLogin} style={{ cursor: 'pointer' }}>← Back to Login</p>
    </form>
  );
}

const box = { padding: 20, maxWidth: 300 };
