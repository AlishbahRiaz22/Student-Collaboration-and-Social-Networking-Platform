
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const auth = require('./middleware/auth');

const app = express();

// ── Middleware ──────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ── Routes ──────────────────────────────────────────────

app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));

// app.use('/api/posts', require('./routes/posts'));
// routes (put this BEFORE 404)

app.get("/test", auth, (req, res) => {
  res.json({ message: "API working" });
});

// ── 404 handler — unhandled routes return JSON ──────────
app.use((req, res) => {
	res.status(404).json({ error: 'Not found' });
});

// ── Global error handler ────────────────────────────────
app.use((err, req, res, next) => {
	console.error(err.stack);
	res.status(500).json({ error: 'Something went wrong' });
});

// ── Connect DB then start server ────────────────────────

if (!process.env.MONGO_URI) {
	console.error('MongoDB connection failed: MONGO_URI not set');
	process.exit(1);
} else {
	mongoose
		.connect(process.env.MONGO_URI)
		.then(() => {
			console.log('MongoDB connected');
			app.listen(process.env.PORT || 5000, () => {
				console.log(`Server running on port ${process.env.PORT || 5000}`);
			});
		})
		.catch((err) => console.error('MongoDB connection failed:', err));
}
