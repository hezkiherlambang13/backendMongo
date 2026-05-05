const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
// Pastikan nama filenya pas, tadi kamu sebut auth.routes.js
const authRoutes = require('./src/routes/auth.routes'); 

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);

app.get('/', (req, res) => {
    res.send('Backend PostgreSQL Berhasil Berjalan! 🚀');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});