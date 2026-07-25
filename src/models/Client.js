import mongoose from 'mongoose';

const ClientSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    phone: { type: String, required: true },
    dateOfBirth: { type: Date, required: true },
    guardianName: { type: String, trim: true },
    guardianPhone: { type: String },
    disabilityType: { type: String, trim: true },
    medicalNotes: { type: String, maxlength: 2000 },
    emergencyContact: {
      name: { type: String },
      phone: { type: String },
      relationship: { type: String },
    },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

ClientSchema.index({ email: 1 });
ClientSchema.index({ lastName: 1, firstName: 1 });

export default mongoose.models.Client ||
  mongoose.model('Client', ClientSchema);
