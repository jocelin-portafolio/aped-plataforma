import mongoose from 'mongoose';

const WorkshopSessionSchema = new mongoose.Schema(
  {
    workshopId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workshop',
      required: true,
    },
    date: { type: Date, required: true },
    enrolledClients: [
      {
        clientId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Client',
          required: true,
        },
        enrolledAt: { type: Date, default: Date.now },
        status: {
          type: String,
          enum: ['enrolled', 'attended', 'cancelled', 'waitlisted'],
          default: 'enrolled',
        },
      },
    ],
    status: {
      type: String,
      enum: ['open', 'full', 'in-progress', 'completed', 'cancelled'],
      default: 'open',
    },
    notes: { type: String, maxlength: 1000 },
  },
  { timestamps: true }
);

WorkshopSessionSchema.index({ workshopId: 1, date: 1 });

WorkshopSessionSchema.virtual('enrolledCount').get(function () {
  return this.enrolledClients.filter((c) => c.status === 'enrolled').length;
});

WorkshopSessionSchema.methods.hasCapacity = function () {
  return this.enrolledClients.filter((c) => c.status === 'enrolled').length <
    this._capacity;
};

WorkshopSessionSchema.methods.addClient = async function (clientId) {
  const alreadyEnrolled = this.enrolledClients.some(
    (c) => c.clientId.toString() === clientId.toString() && c.status !== 'cancelled'
  );
  if (alreadyEnrolled) {
    throw new Error('Client already enrolled in this session');
  }

  const enrolledCount = this.enrolledClients.filter(
    (c) => c.status === 'enrolled'
  ).length;

  if (enrolledCount >= this._capacity) {
    this.enrolledClients.push({ clientId, status: 'waitlisted' });
    await this.save();
    return { status: 'waitlisted' };
  }

  this.enrolledClients.push({ clientId, status: 'enrolled' });
  await this.save();
  return { status: 'enrolled' };
};

WorkshopSessionSchema.pre('save', async function (next) {
  if (this.isNew || this.isModified('workshopId')) {
    const Workshop = mongoose.model('Workshop');
    const workshop = await Workshop.findById(this.workshopId);
    if (workshop) this._capacity = workshop.maxCapacity;
  }
  next();
});

export default mongoose.models.WorkshopSession ||
  mongoose.model('WorkshopSession', WorkshopSessionSchema);
