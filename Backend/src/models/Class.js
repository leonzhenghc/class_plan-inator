const mongoose = require('mongoose');

const classSchema = new mongoose.Schema(
  {
    user: { type: String, required: true }, // Supabase user id
    name: { type: String, required: true }, // e.g. "Quantum Physics"
    code: { type: String }, // e.g. "HIS 101"
    instructor: { type: String },
    category: {
      type: String,
      enum: ['STEM', 'HUMANITIES', 'ARTS', 'SOCIAL SCIENCE', 'OTHER'],
      default: 'OTHER',
    },
    semester: { type: String, default: 'Fall Semester 2023' },
    totalAssignments: { type: Number, default: 0 },
    completedAssignments: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Virtual for progress percentage (used for the progress bar on the frontend)
classSchema.virtual('progress').get(function () {
  if (!this.totalAssignments) return 0;
  return Math.round((this.completedAssignments / this.totalAssignments) * 100);
});
classSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Class', classSchema);
