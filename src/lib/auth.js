// Autenticación del lado del servidor: login, sesión actual y permisos.
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import { connectDB } from '@/config/db';
import User from '@/models/User';
import { errorResponse } from '@/lib/responses';
import { SESSION_COOKIE, ROLE_HOME, verifySessionToken } from '@/lib/session';

const MAX_ATTEMPTS = 5;
const LOCK_MINUTES = 15;

// Hash de relleno: si el email no existe igual se compara una contraseña,
// para no revelar por el tiempo de respuesta qué emails están registrados.
const DUMMY_HASH = bcrypt.hashSync('contraseña-de-relleno', 12);

// Intentos fallidos por email, en memoria del servidor.
const failedAttempts = new Map();

function isLocked(email) {
  const entry = failedAttempts.get(email);
  if (!entry) return false;
  if (Date.now() - entry.first > LOCK_MINUTES * 60 * 1000) {
    failedAttempts.delete(email);
    return false;
  }
  return entry.count >= MAX_ATTEMPTS;
}

function registerFailure(email) {
  const entry = failedAttempts.get(email);
  if (!entry || Date.now() - entry.first > LOCK_MINUTES * 60 * 1000) {
    failedAttempts.set(email, { count: 1, first: Date.now() });
  } else {
    entry.count += 1;
  }
}

export function resetLoginAttempts() {
  failedAttempts.clear();
}

/**
 * Verifica email y contraseña. Devuelve { ok: true, user } o
 * { ok: false, reason: 'invalid' | 'locked' }.
 */
export async function authenticate(email, password) {
  const normalized = typeof email === 'string' ? email.trim().toLowerCase() : '';
  if (!normalized || typeof password !== 'string' || !password) return { ok: false, reason: 'invalid' };
  if (isLocked(normalized)) return { ok: false, reason: 'locked' };

  await connectDB();
  const user = await User.findOne({ email: normalized }).select('+password');
  const canLogIn = user && user.active && ROLE_HOME[user.role];
  const passwordOk = await bcrypt.compare(password, canLogIn ? user.password : DUMMY_HASH);

  if (!canLogIn || !passwordOk) {
    registerFailure(normalized);
    return { ok: false, reason: 'invalid' };
  }

  failedAttempts.delete(normalized);
  return {
    ok: true,
    user: {
      id: String(user._id),
      name: user.name,
      email: user.email,
      role: user.role,
      therapistId: user.therapistId ? String(user.therapistId) : null,
    },
  };
}

// El token dura 8 horas: se confirma contra la base que la cuenta siga activa
// y con el mismo rol, para que desactivar una cuenta tenga efecto inmediato.
async function activeSession(token) {
  const session = await verifySessionToken(token);
  if (!session) return null;
  await connectDB();
  const user = await User.findById(session.id).select('active role therapistId').lean();
  if (!user?.active || user.role !== session.role) return null;
  return { ...session, therapistId: user.therapistId ? String(user.therapistId) : null };
}

/** Sesión actual en componentes de servidor (o null). */
export async function getSession() {
  const store = await cookies();
  return activeSession(store.get(SESSION_COOKIE)?.value);
}

/**
 * Para route handlers: devuelve { session } si el usuario tiene uno de los
 * roles, o { response } con 401/403 para devolver directamente.
 */
export async function requireRole(request, roles) {
  const session = await activeSession(request.cookies?.get(SESSION_COOKIE)?.value ?? readCookie(request));
  if (!session) return { response: errorResponse('Debes iniciar sesión', 401) };
  if (!roles.includes(session.role)) return { response: errorResponse('No tienes permiso para esta acción', 403) };
  return { session };
}

// Request estándar (sin request.cookies de Next): lee la cookie del header.
function readCookie(request) {
  const header = request.headers.get('cookie') || '';
  const match = header.split(/;\s*/).find((c) => c.startsWith(`${SESSION_COOKIE}=`));
  return match ? decodeURIComponent(match.slice(SESSION_COOKIE.length + 1)) : null;
}
