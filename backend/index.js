// backend/index.js
const express = require('express');
const http = require('http');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const WebSocket = require('ws');
const cors = require('cors');

require('dotenv').config();

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(express.json());
app.use(cors());

// storage for uploads
const UPLOAD_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR);

// multer config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const t = Date.now();
    cb(null, `${t}-${file.originalname.replace(/\s+/g,'_')}`);
  }
});
const upload = multer({ storage });

// demo users (hardcoded for starter)
const USERS = [
  { id: 'teacher1', username: 'teacher', password: 'teacherpass', role: 'teacher' },
  { id: 'student1', username: 'student', password: 'studentpass', role: 'student' }
];

const JWT_SECRET = process.env.JWT_SECRET || 'replace-me-very-secret';

// simple auth
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const user = USERS.find(u => u.username === username && u.password === password);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '8h' });
  res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
});

// middleware to protect endpoints
function authMiddleware(req, res, next) {
  const h = req.headers.authorization;
  if (!h) return res.status(401).json({ error: 'Missing auth' });
  const parts = h.split(' ');
  if (parts.length !== 2) return res.status(401).json({ error: 'Invalid auth' });
  const token = parts[1];
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// list uploaded lesson media (teacher)
app.get('/api/lessons', authMiddleware, (req, res) => {
  // list all audio files in uploads (very simple)
  const files = fs.readdirSync(UPLOAD_DIR).map(f => ({
    name: f,
    url: `/uploads/${f}`,
    createdAt: fs.statSync(path.join(UPLOAD_DIR,f)).ctime
  }));
  res.json(files);
});

// upload lesson (teacher)
app.post('/api/lessons/upload', authMiddleware, upload.single('file'), (req, res) => {
  if (req.user.role !== 'teacher') return res.status(403).json({ error: 'Only teacher allowed' });
  const file = req.file;
  res.json({ success: true, file: { name: file.filename, url: `/uploads/${file.filename}` } });
});

// student uploads recording
app.post('/api/recordings/upload', authMiddleware, upload.single('file'), (req, res) => {
  if (req.user.role !== 'student') return res.status(403).json({ error: 'Only students upload recordings' });
  const file = req.file;
  // For a real app you'd persist metadata in DB. Here we keep simple.
  res.json({ success: true, file: { name: file.filename, url: `/uploads/${file.filename}` } });
});

// list all recordings (teacher)
app.get('/api/recordings', authMiddleware, (req, res) => {
  if (req.user.role !== 'teacher') return res.status(403).json({ error: 'Only teacher allowed' });
  // naive: list all files but mark those that look like student recordings (filename contains original name)
  const files = fs.readdirSync(UPLOAD_DIR).map(f => ({
    name: f,
    url: `/uploads/${f}`,
    createdAt: fs.statSync(path.join(UPLOAD_DIR,f)).ctime
  }));
  res.json(files);
});

// static serving of uploads
app.use('/uploads', express.static(UPLOAD_DIR));

// ----------------- WebSocket for real-time events -----------------
const clients = new Set();
wss.on('connection', (ws, req) => {
  ws.isAlive = true;
  clients.add(ws);

  ws.on('pong', () => { ws.isAlive = true; });

  ws.on('message', message => {
    try {
      const msg = JSON.parse(message);
      // client can send identity after connecting
      if (msg.type === 'hello') {
        ws.identity = msg.identity || 'guest';
        ws.role = msg.role || 'guest';
      }
      // teacher -> server: broadcast a lesson to everyone
      if (msg.type === 'broadcast' && msg.url) {
        // forward to all connected clients (including students)
        const payload = JSON.stringify({ type: 'broadcast', url: msg.url, from: ws.identity || 'teacher' });
        clients.forEach(c => {
          if (c.readyState === WebSocket.OPEN) c.send(payload);
        });
      }
    } catch (e) {
      console.error('ws parse error', e);
    }
  });

  ws.on('close', () => clients.delete(ws));
});

// ping/pong to keep connection alive
setInterval(() => {
  clients.forEach((c) => {
    if (!c.isAlive) {
      c.terminate();
      clients.delete(c);
    } else {
      c.isAlive = false;
      c.ping();
    }
  });
}, 30000);

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`Backend listening on ${PORT}`));
