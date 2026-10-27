// Crea (o reactiva) una cuenta de administrador. Es la forma de crear la
// primera cuenta; las demás se crean desde el panel /admin.
//
//   npm run create-admin -- --email ana@aped.cl --name "Ana Pérez"
//
// La contraseña se genera al azar y se muestra una sola vez. Para elegirla,
// define ADMIN_PASSWORD (mínimo 10 caracteres). Si la cuenta ya existe, se le
// asigna la contraseña nueva. MONGODB_URI se lee del entorno o de .env.local.
import fs from 'node:fs';
import crypto from 'node:crypto';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

function arg(name) {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : undefined;
}

function envFromFile(key) {
  if (!fs.existsSync('.env.local')) return undefined;
  const line = fs
    .readFileSync('.env.local', 'utf8')
    .split(/\r?\n/)
    .find((l) => l.startsWith(`${key}=`));
  return line?.slice(key.length + 1).trim().replace(/^["']|["']$/g, '');
}

const email = arg('email')?.trim().toLowerCase();
const name = arg('name')?.trim();
const uri = process.env.MONGODB_URI || envFromFile('MONGODB_URI');

if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !name) {
  console.error('Uso: npm run create-admin -- --email ana@aped.cl --name "Ana Pérez"');
  process.exit(1);
}
if (!uri) {
  console.error('Falta MONGODB_URI (en el entorno o en .env.local).');
  process.exit(1);
}

const chosen = process.env.ADMIN_PASSWORD;
if (chosen && chosen.length < 10) {
  console.error('ADMIN_PASSWORD debe tener al menos 10 caracteres.');
  process.exit(1);
}
const password = chosen || crypto.randomBytes(12).toString('base64url');

await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
const users = mongoose.connection.collection('users');
const now = new Date();
const result = await users.updateOne(
  { email },
  {
    $set: { name, role: 'admin', active: true, password: await bcrypt.hash(password, 12), updatedAt: now },
    $unset: { therapistId: '' },
    $setOnInsert: { email, createdAt: now },
  },
  { upsert: true }
);
await mongoose.disconnect();

console.log(result.upsertedCount ? `Administrador creado: ${email}` : `Administrador actualizado: ${email}`);
if (!chosen) {
  console.log(`Contraseña: ${password}`);
  console.log('Guárdala en un lugar seguro: no se volverá a mostrar.');
}
