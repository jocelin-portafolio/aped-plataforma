import mongoose from 'mongoose';

let cached = global.mongoose;
if (!cached) cached = global.mongoose = { conn: null, promise: null };

export async function connectDB() {
  if (cached.conn) return cached.conn;
  // Se lee al conectar (no al importar) para que las rutas que no usan la
  // base de datos funcionen aunque falte la variable.
  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI) {
    throw new Error('Define MONGODB_URI in .env.local');
  }
  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
      serverSelectionTimeoutMS: 8000,
    });
    // Si la conexión falla, el próximo intento vuelve a conectar.
    cached.promise.catch(() => {
      cached.promise = null;
    });
  }
  cached.conn = await cached.promise;
  return cached.conn;
}
