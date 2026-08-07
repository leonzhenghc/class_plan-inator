const mongoose = require('mongoose');

// This is a "profile" doc, not an auth record — Supabase owns login/password.
// _id here is the Supabase user's UUID (a string), not a normal Mongo ObjectId.
const userSchema = new mongoose.Schema(
  {
    _id: { type: String }, // Supabase auth user id
    fullName: { type: String, required: true },
    displayName: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },

    focusScore: { type: Number, default: 0 },
    currentStreak: { type: Number, default: 0 },

    pomodoroSettings: {
      focusLength: { type: Number, default: 25 },
      breakLength: { type: Number, default: 5 },
    },

    notifications: {
      canvasSyncAlerts: { type: Boolean, default: true },
      dueDateReminders: { type: Boolean, default: true },
      deepWorkMode: { type: Boolean, default: false },
    },

    connectedAccounts: [
      {
        provider: { type: String, enum: ['canvas', 'google_calendar', 'notion'] },
        connected: { type: Boolean, default: false },
        lastSyncedAt: { type: Date },
      },
    ],
  },
  { timestamps: true, _id: false }
);

module.exports = mongoose.model('User', userSchema);
