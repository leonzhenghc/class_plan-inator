const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema(
  {
    user: { type: String, required: true }, // Supabase user id
    class: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
    title: { type: String, required: true }, // e.g. "Modern History Essay"
    dueDate: { type: Date, required: true },
    status: {
      type: String,
      enum: ['TO DO', 'IN PROGRESS', 'DUE TODAY', 'COMPLETE'],
      default: 'TO DO',
    },
    source: { type: String, enum: ['manual', 'canvas'], default: 'manual' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Assignment', assignmentSchema);
