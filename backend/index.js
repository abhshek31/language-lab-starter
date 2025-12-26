const express = require('express');
const cors = require('cors');
const http = require('http');
const WebSocket = require('ws');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('./db');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const JWT_SECRET = 'language-lab-secret';

// ----------------------------------
app.use(cors());
app.use(express.json());

// ----------------------------------
// Uploads
const UPLOAD_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR);
app.use('/uploads', express.static(UPLOAD_DIR));

// ----------------------------------
// AUTH MIDDLEWARE
function auth(req, res, next) {
  const h = req.headers.authorization;
  if (!h) return res.sendStatus(401);

  try {
    const token = h.split(' ')[1];
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.sendStatus(401);
  }
}

function adminOnly(req, res, next) {
  if (req.user.role !== 'admin') return res.sendStatus(403);
  next();
}

// ----------------------------------
// LOGIN (approved users only)
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;

  const [rows] = await pool.query(
    'SELECT * FROM users WHERE username = ?',
    [username]
  );

  if (!rows.length) return res.status(401).json({ error: 'Invalid credentials' });

  const user = rows[0];
  if (user.status !== 'approved')
    return res.status(403).json({ error: 'Account not approved' });

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

  const token = jwt.sign(
    { id: user.id, role: user.role },
    JWT_SECRET,
    { expiresIn: '8h' }
  );

  res.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      role: user.role,
      full_name: user.full_name,
      class_name: user.class_name,
      profile_pic: user.profile_pic,
    },
  });
});

// ----------------------------------
// REGISTER
app.post('/api/register', async (req, res) => {
  const { username, password, role, full_name, class_name } = req.body;
  const hash = await bcrypt.hash(password, 10);

  try {
    const [r] = await pool.query(
      `INSERT INTO users
       (username, password_hash, role, full_name, class_name, status)
       VALUES (?, ?, ?, ?, ?, 'pending')`,
      [username, hash, role, full_name, class_name]
    );

    await pool.query(
      'INSERT INTO user_status (user_id, is_online) VALUES (?, FALSE)',
      [r.insertId]
    );

    res.json({ message: 'Registration submitted for approval' });
  } catch {
    res.status(400).json({ error: 'Username already exists' });
  }
});

// ----------------------------------
// ADMIN
app.get('/api/admin/pending-users', auth, adminOnly, async (req, res) => {
  const [rows] = await pool.query(
    `SELECT id, full_name, role, class_name FROM users WHERE status='pending'`
  );
  res.json(rows);
});

app.post('/api/admin/approve/:id', auth, adminOnly, async (req, res) => {
  await pool.query(
    `UPDATE users SET status='approved', approved_at=NOW() WHERE id=?`,
    [req.params.id]
  );
  res.json({ message: 'Approved' });
});

app.post('/api/admin/reject/:id', auth, adminOnly, async (req, res) => {
  await pool.query(
    `UPDATE users SET status='rejected' WHERE id=?`,
    [req.params.id]
  );
  res.json({ message: 'Rejected' });
});

// ----------------------------------
// TEACHER – STUDENT LIST
app.get('/api/teacher/students', auth, async (req, res) => {
  if (req.user.role !== 'teacher') return res.sendStatus(403);

  const [rows] = await pool.query(`
    SELECT u.id, u.full_name, u.class_name, u.profile_pic, s.is_online
    FROM users u
    JOIN user_status s ON u.id = s.user_id
    WHERE u.role='student' AND u.status='approved'
  `);

  res.json(rows);
});

// ----------------------------------
// RECORDINGS
const upload = multer({ dest: UPLOAD_DIR });

app.post('/api/recordings/upload', auth, upload.single('file'), (req, res) => {
  res.json({ message: 'Uploaded' });
});

app.get('/api/recordings', auth, (req, res) => {
  const files = fs.readdirSync(UPLOAD_DIR).map((n) => ({
    name: n,
    url: `/uploads/${n}`,
  }));
  res.json(files);
});

// ----------------------------------
// WEBSOCKET PRESENCE
const clients = new Map();

wss.on('connection', (ws) => {
  ws.on('message', async (msg) => {
    const data = JSON.parse(msg.toString());
    if (data.type === 'auth') {
      const user = jwt.verify(data.token, JWT_SECRET);
      ws.userId = user.id;
      ws.role = user.role;
      clients.set(user.id, ws);

      await pool.query(
        'UPDATE user_status SET is_online=TRUE WHERE user_id=?',
        [user.id]
      );

      broadcast(user.id, true);
    }
  });

  ws.on('close', async () => {
    if (ws.userId) {
      clients.delete(ws.userId);
      await pool.query(
        'UPDATE user_status SET is_online=FALSE,last_seen=NOW() WHERE user_id=?',
        [ws.userId]
      );
      broadcast(ws.userId, false);
    }
  });
});

function broadcast(userId, online) {
  const msg = JSON.stringify({ type: 'presence', userId, online });
  for (const ws of clients.values()) {
    if (ws.role === 'teacher') ws.send(msg);
  }
}

// ----------------------------------
server.listen(4000, () => {
  console.log('Backend running on port 4000');
});
