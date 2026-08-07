require('dotenv').config();
const express = require('express');
const cors = require('cors');

const userRoutes = require('./src/routes/userRoutes');
const classRoutes = require('./src/routes/classRoutes');
const assignmentRoutes = require('./src/routes/assignmentRoutes');
const pomodoroRoutes = require('./src/routes/pomodoroRoutes');

const app = express();

// --- Middleware ---
app.use(cors({ origin: process.env.CLIENT_URL || '*' }));
app.use(express.json());

// --- Routes ---
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/users', userRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/pomodoro', pomodoroRoutes);

// --- 404 handler ---
app.use((req, res) => res.status(404).json({ message: 'Route not found' }));

// --- Error handler ---
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong on the server' });
});

// --- Start ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
