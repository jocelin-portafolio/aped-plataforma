import mongoose from 'mongoose';

const AppointmentSchema = new mongoose.Schema(
  {
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      required: true,
    },
    therapistId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Therapist',
      required: true,
    },
    specialty: {
      type: String,
      required: true,
      enum: [
        'terapia-ocupacional',
        'fonoaudiologia',
        'terapia-conductual',
        'psicologia',
      ],
    },
    date: { type: Date, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    status: {
      type: String,
      enum: ['scheduled', 'confirmed', 'completed', 'cancelled', 'no-show'],
      default: 'scheduled',
    },
    notes: { type: String, maxlength: 1000 },
    clinicalNotes: { type: String, maxlength: 3000 },
    sessionNumber: { type: Number, min: 1 },
  },
  { timestamps: true }
);

AppointmentSchema.index({ therapistId: 1, date: 1, startTime: 1 });
AppointmentSchema.index({ clientId: 1, date: 1 });
AppointmentSchema.index({ status: 1, date: 1 });

AppointmentSchema.statics.isSlotAvailable = async function (
  therapistId,
  date,
  startTime,
  excludeId = null
) {
  const query = {
    therapistId,
    date,
    startTime,
    status: { $nin: ['cancelled'] },
  };
  if (excludeId) query._id = { $ne: excludeId };
  const conflict = await this.findOne(query);
  return !conflict;
};

export default mongoose.models.Appointment ||
  mongoose.model('Appointment', AppointmentSchema);
