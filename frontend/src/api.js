const API_BASE = process.env.API_BASE || (window.location.origin.includes('localhost') ? 'http://localhost:4000' : window.location.origin);

export async function login(username, password) {
  const res = await fetch(`${API_BASE}/api/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  return res.json();
}

export async function listLessons(token) {
  const res = await fetch(`${API_BASE}/api/lessons`, { headers: { Authorization: `Bearer ${token}` }});
  return res.json();
}

export async function uploadLesson(formData, token) {
  const res = await fetch(`${API_BASE}/api/lessons/upload`, {
    method: 'POST', body: formData, headers: { Authorization: `Bearer ${token}` }
  });
  return res.json();
}

export async function uploadRecording(formData, token) {
  const res = await fetch(`${API_BASE}/api/recordings/upload`, {
    method: 'POST', body: formData, headers: { Authorization: `Bearer ${token}` }
  });
  return res.json();
}

export async function listRecordings(token) {
  const res = await fetch(`${API_BASE}/api/recordings`, { headers: { Authorization: `Bearer ${token}` }});
  return res.json();
}
