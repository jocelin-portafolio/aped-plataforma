import mongoose from 'mongoose';

const WorkshopSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: { type: String, required: true, maxlength: 1500 },
    category: {
      type: String,
      required: true,
      enum: [
        'habilidades-sociales',
        'arteterapia',
        'cocina',
        'motricidad',
      ],
    },
    maxCapacity: { type: Number, required: true, min: 1 },
    instructor: { type: String, required: true, trim: true },
    schedule: {
      dayOfWeek: { type: String, default: 'saturday' },
      startTime: { type: String, required: true },
      endTime: { type: String, required: true },
    },
    price: { type: Number, default: 0, min: 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

WorkshopSchema.index({ slug: 1 });
WorkshopSchema.index({ category: 1, active: 1 });

export default mongoose.models.Workshop ||
  mongoose.model('Workshop', WorkshopSchema);
