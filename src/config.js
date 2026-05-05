// server/server.js  —  Entry point backend
// Hapus semua mongoose require & connection dari file ini

const express = require('express');
const cors    = require('cors');
require('dotenv').config();           // ← wajib ada di paling atas

const app  = express();
const PORT = process.env.PORT || 5000;

// ---------- Middleware ----------
app.use(cors());                      // izinkan frontend call API
app.use(express.json());              // parse JSON body

// ---------- Routes ----------
const authRoutes  = require('./routes/auth');
const itemRoutes  = require('./routes/items');

app.use('/api/auth',  authRoutes);    // POST /api/auth/register | /login | GET /profile
app.use('/api/items', itemRoutes);    // CRUD /api/items

// ---------- Health-check ----------
app.get('/', (req, res) => {
  res.json({ message: 'Backend Supabase is running ✅' });
});

// ---------- Start ----------
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
