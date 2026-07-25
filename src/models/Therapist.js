import mongoose from 'mongoose';

const TherapistSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    phone: { type: String, required: true },
    specialties: {
      type: [String],
      required: true,
      enum: [
        'terapia-ocupacional',
        'fonoaudiologia',
        'terapia-conductual',
        'psicologia',
      ],
    },
    schedule: {
      monday: { available: { type: Boolean, default: false }, slots: [String] },
      tuesday: { available: { type: Boolean, default: false }, slots: [String] },
      wednesday: { available: { type: Boolean, default: false }, slots: [String] },
      thursday: { available: { type: Boolean, default: false }, slots: [String] },
      friday: { available: { type: Boolean, default: false }, slots: [String] },
      saturday: { available: { type: Boolean, default: false }, slots: [String] },
    },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

TherapistSchema.index({ specialties: 1, active: 1 });

export default mongoose.models.Therapist ||
  mongoose.model('Therapist', TherapistSchema);
