// ----------------------------------------------------
// API BASE (Backend is HTTP on port 4000)
// ----------------------------------------------------
const API_BASE = `http://${window.location.hostname}:4000`;

// ----------------------------------------------------
// Helper: fetch with JWT (safe)
// ----------------------------------------------------
async function apiFetch(path, options = {}) {
  const token = localStorage.getItem('token');

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      ...(options.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  return res.json();
}

// ----------------------------------------------------
// AUTH
// ----------------------------------------------------
export async function login(username, password) {
  return apiFetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
}

// ----------------------------------------------------
// REGISTRATION
// ----------------------------------------------------
export async function registerUser(data) {
  return apiFetch('/api/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

// ----------------------------------------------------
// ADMIN APIs
// ----------------------------------------------------
export async function getPendingUsers() {
  return apiFetch('/api/admin/pending-users');
}

export async function approveUser(userId) {
  return apiFetch(`/api/admin/approve/${userId}`, {
    method: 'POST',
  });
}

export async function rejectUser(userId) {
  return apiFetch(`/api/admin/reject/${userId}`, {
    method: 'POST',
  });
}

// ----------------------------------------------------
// TEACHER APIs
// ----------------------------------------------------
export async function listStudents() {
  return apiFetch('/api/teacher/students');
}

// ----------------------------------------------------
// RECORDINGS
// ----------------------------------------------------
export async function uploadRecording(formData) {
  const token = localStorage.getItem('token');

  const res = await fetch(`${API_BASE}/api/recordings/upload`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  return res.json();
}

export async function listRecordings() {
  return apiFetch('/api/recordings');
}

// ----------------------------------------------------
// LESSONS (kept for future phases)
// ----------------------------------------------------
export async function listLessons() {
  return apiFetch('/api/lessons');
}

export async function uploadLesson(formData) {
  const token = localStorage.getItem('token');

  const res = await fetch(`${API_BASE}/api/lessons/upload`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  return res.json();
}

// ----------------------------------------------------
// WEBSOCKET PRESENCE (FORCED ws:// – CRITICAL FIX)
// ----------------------------------------------------
export function connectPresence(onUpdate) {
  // IMPORTANT:
  // Frontend is HTTPS but backend WS is HTTP
  // Force ws:// to avoid browser crash
  const ws = new WebSocket(`ws://${window.location.hostname}:4000`);

  ws.onopen = () => {
    ws.send(
      JSON.stringify({
        type: 'auth',
        token: localStorage.getItem('token'),
      })
    );
  };

  ws.onmessage = (e) => {
    try {
      const data = JSON.parse(e.data);
      onUpdate(data);
    } catch (err) {
      console.warn('WS parse error', err);
    }
  };

  ws.onerror = (e) => {
    console.warn('WebSocket error (dev-safe)', e);
  };

  ws.onclose = () => {
    console.log('WebSocket closed');
  };

  return ws;
}
