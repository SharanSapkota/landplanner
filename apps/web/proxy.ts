import { NextRequest, NextResponse } from 'next/server';

const PROTECTED_ROUTES = ['/dashboard', '/library', '/knowledge', '/admin'];
const AUTH_ROUTES = ['/login'];

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = request.cookies.has('session');

  if (PROTECTED_ROUTES.some((route) => pathname.startsWith(route)) && !hasSession) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (AUTH_ROUTES.some((route) => pathname.startsWith(route)) && hasSession) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/library/:path*', '/knowledge/:path*', '/admin/:path*', '/login'],
};
