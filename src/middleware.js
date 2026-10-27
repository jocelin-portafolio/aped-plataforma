import { NextResponse } from 'next/server';
import { SESSION_COOKIE, ROLE_HOME, verifySessionToken } from '@/lib/session';

const PROTECTED = [
  { prefix: '/admin', role: 'admin' },
  { prefix: '/terapeuta', role: 'therapist' },
];

// Los paneles exigen sesión con el rol correspondiente. Sin sesión se va al
// login; con otro rol, al panel propio.
export async function middleware(request) {
  const { pathname, search } = request.nextUrl;
  const area = PROTECTED.find((p) => pathname === p.prefix || pathname.startsWith(`${p.prefix}/`));
  if (!area) return NextResponse.next();

  const session = await verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value);
  if (!session) {
    const url = new URL('/login', request.url);
    url.searchParams.set('next', pathname + search);
    return NextResponse.redirect(url);
  }
  if (session.role !== area.role) {
    return NextResponse.redirect(new URL(ROLE_HOME[session.role], request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/terapeuta/:path*'],
};
