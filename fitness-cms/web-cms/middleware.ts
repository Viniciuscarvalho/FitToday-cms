import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { UserRole, TrainerStatus } from '@/types';

// Cookie names
const AUTH_TOKEN = 'auth-token';
const USER_ROLE = 'user-role';
const TRAINER_STATUS = 'trainer-status';

// Route definitions
const ADMIN_ROUTES = ['/admin'];
const TRAINER_ROUTES = [
  '/cms',
  '/cms/programs',
  '/cms/students',
  '/cms/messages',
  '/cms/analytics',
  '/cms/finances',
  '/cms/settings',
];
const AUTH_ROUTES = ['/login', '/register'];
const PENDING_ROUTE = '/pending-approval';

function isAdminRoute(pathname: string): boolean {
  return ADMIN_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
}

function isTrainerRoute(pathname: string): boolean {
  return TRAINER_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
}

function isAuthRoute(pathname: string): boolean {
  return AUTH_ROUTES.includes(pathname);
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Get cookies
  const authToken = request.cookies.get(AUTH_TOKEN)?.value;
  const userRole = request.cookies.get(USER_ROLE)?.value as UserRole | undefined;
  const trainerStatus = request.cookies.get(TRAINER_STATUS)?.value as TrainerStatus | undefined;

  // Not authenticated
  if (!authToken) {
    // Trying to access protected routes without auth
    if (isAdminRoute(pathname) || isTrainerRoute(pathname)) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
    // Allow access to auth routes and pending-approval
    return NextResponse.next();
  }

  // Authenticated - check role-based access

  // Redirect away from auth routes if authenticated
  if (isAuthRoute(pathname)) {
    if (userRole === 'admin') {
      return NextResponse.redirect(new URL('/admin', request.url));
    }
    return NextResponse.redirect(new URL('/cms', request.url));
  }

  // Admin can access everything
  if (userRole === 'admin') {
    return NextResponse.next();
  }

  // Trainer trying to access admin routes
  if (userRole === 'trainer' && isAdminRoute(pathname)) {
    return NextResponse.redirect(new URL('/cms', request.url));
  }

  // Trainer with non-active status trying to access trainer routes
  if (userRole === 'trainer' && trainerStatus !== 'active' && isTrainerRoute(pathname)) {
    return NextResponse.redirect(new URL(PENDING_ROUTE, request.url));
  }

  // Active trainer trying to access pending page - redirect to dashboard
  if (userRole === 'trainer' && trainerStatus === 'active' && pathname === PENDING_ROUTE) {
    return NextResponse.redirect(new URL('/cms', request.url));
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
