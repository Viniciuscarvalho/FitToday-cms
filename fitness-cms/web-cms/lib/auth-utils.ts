import { UserRole, TrainerStatus } from '@/types';

// Cookie names for role-based authentication
export const AUTH_COOKIES = {
  TOKEN: 'auth-token',
  ROLE: 'user-role',
  STATUS: 'trainer-status',
} as const;

// Route definitions by role
export const ADMIN_ROUTES = ['/admin'];
export const TRAINER_ROUTES = [
  '/',
  '/programs',
  '/students',
  '/exercises',
  '/messages',
  '/analytics',
  '/finances',
  '/settings',
];
export const AUTH_ROUTES = ['/login', '/register'];
export const PENDING_ROUTE = '/pending-approval';

/**
 * Check if a route requires admin role
 */
export function isAdminRoute(pathname: string): boolean {
  return ADMIN_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
}

/**
 * Check if a route requires active trainer status
 */
export function isTrainerRoute(pathname: string): boolean {
  return TRAINER_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
}

/**
 * Check if a route is an auth route (login/register)
 */
export function isAuthRoute(pathname: string): boolean {
  return AUTH_ROUTES.includes(pathname);
}

/**
 * Check if user can access the route based on role and status
 */
export function canAccessRoute(
  pathname: string,
  role: UserRole | null,
  status: TrainerStatus | null
): { allowed: boolean; redirect?: string } {
  // Not authenticated
  if (!role) {
    if (isAdminRoute(pathname) || isTrainerRoute(pathname)) {
      return { allowed: false, redirect: '/login' };
    }
    return { allowed: true };
  }

  // Authenticated but trying to access auth routes
  if (isAuthRoute(pathname)) {
    if (role === 'admin') {
      return { allowed: false, redirect: '/admin' };
    }
    return { allowed: false, redirect: '/' };
  }

  // Admin can access everything
  if (role === 'admin') {
    return { allowed: true };
  }

  // Trainer trying to access admin routes
  if (role === 'trainer' && isAdminRoute(pathname)) {
    return { allowed: false, redirect: '/' };
  }

  // Trainer with non-active status trying to access trainer routes
  if (role === 'trainer' && status !== 'active' && isTrainerRoute(pathname)) {
    return { allowed: false, redirect: PENDING_ROUTE };
  }

  // Trainer with non-active status can access pending-approval page
  if (role === 'trainer' && status !== 'active' && pathname === PENDING_ROUTE) {
    return { allowed: true };
  }

  // Active trainer trying to access pending page
  if (role === 'trainer' && status === 'active' && pathname === PENDING_ROUTE) {
    return { allowed: false, redirect: '/' };
  }

  return { allowed: true };
}

/**
 * Set role and status cookies for middleware
 */
export function setRoleCookies(role: UserRole | null, status: TrainerStatus | null) {
  const maxAge = 60 * 60 * 24 * 7; // 7 days

  if (role) {
    document.cookie = `${AUTH_COOKIES.ROLE}=${role}; path=/; max-age=${maxAge}; SameSite=Lax`;
  } else {
    document.cookie = `${AUTH_COOKIES.ROLE}=; path=/; max-age=0`;
  }

  if (status) {
    document.cookie = `${AUTH_COOKIES.STATUS}=${status}; path=/; max-age=${maxAge}; SameSite=Lax`;
  } else {
    document.cookie = `${AUTH_COOKIES.STATUS}=; path=/; max-age=0`;
  }
}

/**
 * Clear all auth cookies
 */
export function clearAuthCookies() {
  document.cookie = `${AUTH_COOKIES.TOKEN}=; path=/; max-age=0`;
  document.cookie = `${AUTH_COOKIES.ROLE}=; path=/; max-age=0`;
  document.cookie = `${AUTH_COOKIES.STATUS}=; path=/; max-age=0`;
}
