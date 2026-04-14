import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

const SESSION_COOKIE_NAME = 'elonew.session';

const hasSessionCookie = (request: NextRequest) => {
	return request.cookies.has(SESSION_COOKIE_NAME);
};

export const proxy = (request: NextRequest) => {
	const { pathname } = request.nextUrl;
	const hasSession = hasSessionCookie(request);

	if (pathname.startsWith('/client') && !hasSession) {
		return NextResponse.redirect(new URL('/login', request.url));
	}

	if ((pathname === '/login' || pathname === '/register') && hasSession) {
		return NextResponse.redirect(new URL('/client', request.url));
	}

	return NextResponse.next();
};

export const config = {
	matcher: ['/client/:path*', '/login', '/register'],
};
