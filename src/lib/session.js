// Token de sesión firmado (JWT HS256) guardado en una cookie HttpOnly.
// Solo usa `jose`, así que también funciona en el middleware de Next.
import { SignJWT, jwtVerify } from 'jose';

export const SESSION_COOKIE = 'aped_session';
export const SESSION_HOURS = 8;

export const ROLE_HOME = {
  admin: '/admin',
  therapist: '/terapeuta',
};

function secretKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('Define AUTH_SECRET (al menos 32 caracteres) en .env.local');
  }
  return new TextEncoder().encode(secret);
}

/** Crea el token para un usuario: { id, name, email, role, therapistId }. */
export async function createSessionToken(user) {
  return new SignJWT({
    name: user.name,
    email: user.email,
    role: user.role,
    therapistId: user.therapistId ? String(user.therapistId) : null,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(String(user.id))
    .setIssuedAt()
    .setExpirationTime(`${SESSION_HOURS}h`)
    .sign(secretKey());
}

/** Devuelve la sesión o null si el token falta, expiró o fue alterado. */
export async function verifySessionToken(token) {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey(), { algorithms: ['HS256'] });
    if (!ROLE_HOME[payload.role]) return null;
    return {
      id: payload.sub,
      name: payload.name,
      email: payload.email,
      role: payload.role,
      therapistId: payload.therapistId,
    };
  } catch {
    return null;
  }
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_HOURS * 60 * 60,
  };
}

/** Ruta a la que volver tras el login: solo rutas internas del panel del rol. */
export function safeRedirect(next, role) {
  const home = ROLE_HOME[role];
  if (typeof next !== 'string' || !next.startsWith('/') || next.startsWith('//')) return home;
  return next === home || next.startsWith(`${home}/`) ? next : home;
}
