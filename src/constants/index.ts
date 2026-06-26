/**
 * Application-wide constants
 * All magic numbers and strings live here — never inline them.
 */

export const APP_NAME = import.meta.env.VITE_APP_NAME ?? 'SecureLib'

// ── Session ──────────────────────────────────────────────────
export const SESSION_TIMEOUT_MS =
  (Number(import.meta.env.VITE_SESSION_TIMEOUT_MINUTES) || 30) * 60 * 1000

// ── Pagination ───────────────────────────────────────────────
export const DEFAULT_PAGE_SIZE = 10
export const PAGE_SIZE_OPTIONS = [10, 25, 50]

// ── Borrow Rules ─────────────────────────────────────────────
/** Default loan period in days */
export const BORROW_DURATION_DAYS = 14
/** Max active borrows per user */
export const MAX_ACTIVE_BORROWS = 3

// ── Book Categories ──────────────────────────────────────────
export const BOOK_CATEGORIES = [
  'Fiction',
  'Non-Fiction',
  'Science',
  'Technology',
  'History',
  'Biography',
  'Mathematics',
  'Philosophy',
  'Art',
  'Law',
  'Medicine',
  'Business',
  'Education',
  'Reference',
  'Other',
] as const

export type BookCategory = (typeof BOOK_CATEGORIES)[number]

// ── User Roles ───────────────────────────────────────────────
export const USER_ROLES = ['admin', 'librarian', 'student'] as const

export const ROLE_LABELS: Record<string, string> = {
  admin: 'Admin',
  librarian: 'Librarian',
  student: 'Student',
}

export const ROLE_DESCRIPTIONS: Record<string, string> = {
  admin: 'Full system access — manage users, books, and view all logs',
  librarian: 'Manage book inventory and borrow records',
  student: 'Browse and borrow books',
}

// ── Password Rules ───────────────────────────────────────────
export const PASSWORD_RULES = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecial: true,
}

// ── Routes ───────────────────────────────────────────────────
export const ROUTES = {
  // Auth
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  VERIFY_EMAIL: '/verify-email',
  // App
  DASHBOARD: '/dashboard',
  BOOKS: '/books',
  BOOK_DETAIL: '/books/:id',
  BORROWING: '/borrowing',
  PROFILE: '/profile',
  // Admin / Librarian
  USERS: '/users',
  AUDIT_LOGS: '/audit-logs',
  SECURITY: '/security',
} as const

// ── Query Keys ───────────────────────────────────────────────
export const QUERY_KEYS = {
  DASHBOARD_STATS: ['dashboard', 'stats'],
  RECENT_ACTIVITY: ['dashboard', 'activity'],
  BOOKS: ['books'],
  BOOK: (id: string) => ['books', id],
  BORROW_RECORDS: ['borrows'],
  OVERDUE_BOOKS: ['borrows', 'overdue'],
  MY_BORROWS: ['borrows', 'mine'],
  USERS: ['users'],
  USER: (id: string) => ['users', id],
  AUDIT_LOGS: ['audit-logs'],
  USER_PERMISSIONS: ['permissions'],
} as const

// ── Toast Durations (ms) ─────────────────────────────────────
export const TOAST = {
  SUCCESS: 3000,
  ERROR: 5000,
  WARNING: 4000,
} as const
