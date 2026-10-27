import mongoose from 'mongoose';

// Estado de una conversación de WhatsApp: historial reciente, reserva en
// curso y mensajes ya procesados (Meta puede reenviar el mismo mensaje).
const ChatSessionSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true },
    history: [
      {
        _id: false,
        role: { type: String, enum: ['user', 'assistant'] },
        content: String,
      },
    ],
    booking: { type: mongoose.Schema.Types.Mixed, default: null },
    processedIds: [String],
  },
  { timestamps: true }
);

// Las conversaciones inactivas por 24 horas se borran solas.
ChatSessionSchema.index({ updatedAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 });

export default mongoose.models.ChatSession ||
  mongoose.model('ChatSession', ChatSessionSchema);
