// Levanta un MongoDB temporal con terapeutas de ejemplo para probar la
// reserva de horas sin instalar MongoDB. Los datos se pierden al cerrarlo.
//
//   npm run demo:db
//   MONGODB_URI=mongodb://127.0.0.1:27018/aped npm run dev   (en otra terminal)
import crypto from 'node:crypto';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { MongoMemoryServer } from 'mongodb-memory-server';

const PORT = Number(process.env.DEMO_DB_PORT || 27018);

const allWeek = (slots) =>
  Object.fromEntries(
    ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'].map((day) => [
      day,
      { available: true, slots },
    ])
  );

const therapists = [
  {
    firstName: 'Carla',
    lastName: 'Soto (demo)',
    email: 'carla.demo@aped.cl',
    phone: '+56900000001',
    specialties: ['fonoaudiologia'],
    schedule: allWeek(['09:00', '09:30', '10:00', '15:00', '15:30', '16:00']),
  },
  {
    firstName: 'Pedro',
    lastName: 'Rojas (demo)',
    email: 'pedro.demo@aped.cl',
    phone: '+56900000002',
    specialties: ['psicologia'],
    schedule: allWeek(['10:00', '11:00', '12:00', '17:00']),
  },
  {
    firstName: 'María',
    lastName: 'Fuentes (demo)',
    email: 'maria.demo@aped.cl',
    phone: '+56900000003',
    specialties: ['terapia-ocupacional', 'fonoaudiologia'],
    schedule: allWeek(['09:00', '11:30', '14:00', '14:30']),
  },
];

const server = await MongoMemoryServer.create({ instance: { port: PORT } });
const uri = server.getUri('aped');
await mongoose.connect(uri);
const { insertedIds } = await mongoose.connection.collection('therapists').insertMany(
  therapists.map((t) => ({ ...t, active: true, createdAt: new Date(), updatedAt: new Date() }))
);

// Cuentas de demo para probar el login (contraseñas nuevas en cada arranque).
const accounts = [
  { name: 'Admin Demo', email: 'admin@demo.aped.cl', role: 'admin' },
  { name: 'Carla Soto (demo)', email: 'carla@demo.aped.cl', role: 'therapist', therapistId: insertedIds[0] },
].map((a) => ({ ...a, plain: crypto.randomBytes(9).toString('base64url') }));

await mongoose.connection.collection('users').insertMany(
  await Promise.all(
    accounts.map(async ({ plain, ...a }) => ({
      ...a,
      password: await bcrypt.hash(plain, 12),
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }))
  )
);
await mongoose.disconnect();

console.log(`MongoDB de demo listo en ${uri} con ${therapists.length} terapeutas de ejemplo.`);
console.log('Cuentas de demo (solo para esta base temporal):');
for (const a of accounts) console.log(`  ${a.role.padEnd(9)} ${a.email}  ${a.plain}`);
console.log('Ctrl+C para detenerlo.');

process.on('SIGINT', async () => {
  await server.stop();
  process.exit(0);
});
