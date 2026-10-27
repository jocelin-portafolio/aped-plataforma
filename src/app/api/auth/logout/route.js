import { SESSION_COOKIE, sessionCookieOptions } from '@/lib/session';

export async function POST() {
  const { path, secure } = sessionCookieOptions();
  const response = Response.json({ success: true });
  response.headers.append(
    'Set-Cookie',
    [`${SESSION_COOKIE}=`, `Path=${path}`, 'Max-Age=0', 'HttpOnly', 'SameSite=Lax', secure && 'Secure']
      .filter(Boolean)
      .join('; ')
  );
  return response;
}
