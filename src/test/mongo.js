// MongoDB temporal en memoria para los tests que usan la base de datos.
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { connectDB } from '@/config/db';

let server;

export async function startMongo() {
  server = await MongoMemoryServer.create();
  process.env.MONGODB_URI = server.getUri('aped-test');
  await connectDB();
}

export async function stopMongo() {
  await mongoose.disconnect();
  global.mongoose = { conn: null, promise: null };
  await server?.stop();
}

export async function clearMongo() {
  const { collections } = mongoose.connection;
  await Promise.all(Object.values(collections).map((c) => c.deleteMany({})));
}

const weekdays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

/** Horario semanal: los días indicados con esas horas, el resto sin atención. */
export function weeklySchedule(days, slots) {
  return Object.fromEntries(weekdays.map((d) => [d, { available: days.includes(d), slots: days.includes(d) ? slots : [] }]));
}
