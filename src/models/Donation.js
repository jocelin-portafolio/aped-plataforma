import mongoose from 'mongoose';

const DonationSchema = new mongoose.Schema(
  {
    donorName: { type: String, required: true, trim: true },
    donorEmail: { type: String, required: true, lowercase: true },
    donorPhone: { type: String },
    amount: { type: Number, required: true, min: 1 },
    currency: { type: String, default: 'USD' },
    type: {
      type: String,
      required: true,
      enum: ['one-time', 'monthly-subscription'],
    },
    paymentMethod: {
      type: String,
      enum: ['card', 'bank-transfer', 'cash'],
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'pending',
    },
    transactionId: { type: String },
    message: { type: String, maxlength: 500 },
    anonymous: { type: Boolean, default: false },
    subscriptionId: { type: String },
    subscriptionActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

DonationSchema.index({ donorEmail: 1, createdAt: -1 });
DonationSchema.index({ paymentStatus: 1, type: 1 });

export default mongoose.models.Donation ||
  mongoose.model('Donation', DonationSchema);
