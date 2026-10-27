import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SignJWT } from 'jose';
import { createSessionToken, verifySessionToken, safeRedirect } from './session';

const SECRET = 'x'.repeat(40);
const user = { id: '64b000000000000000000001', name: 'Ana', email: 'ana@aped.cl', role: 'admin' };

beforeEach(() => vi.stubEnv('AUTH_SECRET', SECRET));
afterEach(() => vi.unstubAllEnvs());

describe('token de sesión', () => {
  it('se crea y se verifica', async () => {
    const session = await verifySessionToken(await createSessionToken(user));
    expect(session).toEqual({ ...user, therapistId: null });
  });

  it('rechaza un token alterado, firmado con otro secreto o expirado', async () => {
    const token = await createSessionToken(user);
    expect(await verifySessionToken(`${token.slice(0, -2)}xx`)).toBeNull();

    const other = await new SignJWT({ role: 'admin' })
      .setProtectedHeader({ alg: 'HS256' })
      .setSubject(user.id)
      .setExpirationTime('1h')
      .sign(new TextEncoder().encode('y'.repeat(40)));
    expect(await verifySessionToken(other)).toBeNull();

    const expired = await new SignJWT({ role: 'admin' })
      .setProtectedHeader({ alg: 'HS256' })
      .setSubject(user.id)
      .setExpirationTime(Math.floor(Date.now() / 1000) - 60)
      .sign(new TextEncoder().encode(SECRET));
    expect(await verifySessionToken(expired)).toBeNull();
  });

  it('rechaza roles que no tienen panel', async () => {
    expect(await verifySessionToken(await createSessionToken({ ...user, role: 'staff' }))).toBeNull();
  });

  it('exige un AUTH_SECRET de al menos 32 caracteres', async () => {
    vi.stubEnv('AUTH_SECRET', 'corto');
    await expect(createSessionToken(user)).rejects.toThrow('AUTH_SECRET');
  });
});

describe('safeRedirect', () => {
  it.each([
    ['/admin', 'admin', '/admin'],
    ['/admin/citas?x=1', 'admin', '/admin/citas?x=1'],
    ['/terapeuta', 'admin', '/admin'],
    ['https://malicioso.com', 'admin', '/admin'],
    ['//malicioso.com', 'therapist', '/terapeuta'],
    ['/administrador-falso', 'admin', '/admin'],
    [undefined, 'therapist', '/terapeuta'],
  ])('%s con rol %s → %s', (next, role, expected) => {
    expect(safeRedirect(next, role)).toBe(expected);
  });
});
