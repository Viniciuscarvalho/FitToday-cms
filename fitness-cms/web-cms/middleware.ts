import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes that require authentication
const protectedRoutes = [
  '/',
  '/programs',
  '/programs/new',
  '/students',
  '/exercises',
  '/messages',
  '/analytics',
  '/finances',
  '/settings',
];

// Routes that should redirect to dashboard if authenticated
const authRoutes = ['/login', '/register'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check for Firebase auth session cookie
  // Note: Firebase Auth uses localStorage/IndexedDB on client-side,
  // so we use a custom cookie set by the client after login
  const authToken = request.cookies.get('auth-token')?.value;

  // Check if trying to access protected route without auth
  const isProtectedRoute = protectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  // Check if trying to access auth route while authenticated
  const isAuthRoute = authRoutes.includes(pathname);

  if (isProtectedRoute && !authToken) {
    // Redirect to login if not authenticated
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthRoute && authToken) {
    // Redirect to dashboard if already authenticated
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*|public).*)',
  ],
};
