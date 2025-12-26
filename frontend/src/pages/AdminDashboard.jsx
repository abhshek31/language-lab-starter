import { useEffect, useState } from 'react';
import { api } from '../api';

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);

  async function load() {
    const data = await api('/api/admin/pending-users');
    setUsers(data);
  }

  async function approve(id) {
    await api(`/api/admin/approve/${id}`, { method: 'POST' });
    load();
  }

  async function reject(id) {
    await api(`/api/admin/reject/${id}`, { method: 'POST' });
    load();
  }

  useEffect(() => { load(); }, []);

  return (
    <div>
      <h2>Admin Approval Panel</h2>

      <table border="1" cellPadding="6">
        <thead>
          <tr>
            <th>Name</th><th>Role</th><th>Class</th><th>Action</th>
          </tr>
        </thead>
        <tbody>
          {users.map(u => (
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
