const mongoose = require('mongoose');

const pomodoroSessionSchema = new mongoose.Schema(
  {
    user: { type: String, required: true }, // Supabase user id
    activeTaskLabel: { type: String }, // e.g. "Calculus III: Chapter 4 Exercises"
    type: { type: String, enum: ['focus', 'short_break', 'long_break'], default: 'focus' },
    durationMinutes: { type: Number, required: true },
    completedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model('PomodoroSession', pomodoroSessionSchema);
