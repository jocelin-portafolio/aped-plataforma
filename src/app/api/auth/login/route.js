import { authenticate } from '@/lib/auth';
import { createSessionToken, sessionCookieOptions, safeRedirect, SESSION_COOKIE } from '@/lib/session';
import { errorResponse } from '@/lib/responses';

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return errorResponse('JSON inválido');
  }

  try {
    const result = await authenticate(body?.email, body?.password);
    if (!result.ok) {
      return result.reason === 'locked'
        ? errorResponse('Demasiados intentos fallidos. Espera 15 minutos e intenta de nuevo.', 429)
        : errorResponse('Email o contraseña incorrectos', 401);
    }

    const { user } = result;
    const response = Response.json({
      success: true,
      data: { name: user.name, role: user.role, redirect: safeRedirect(body?.next, user.role) },
    });
    const token = await createSessionToken(user);
    const opts = sessionCookieOptions();
    response.headers.append(
      'Set-Cookie',
      [
        `${SESSION_COOKIE}=${token}`,
        `Path=${opts.path}`,
        `Max-Age=${opts.maxAge}`,
        'HttpOnly',
        'SameSite=Lax',
        opts.secure && 'Secure',
      ]
        .filter(Boolean)
        .join('; ')
    );
    return response;
  } catch (err) {
    console.error('[api/auth/login]', err);
    return errorResponse('No pudimos iniciar sesión en este momento', 503);
  }
}
