/**
 * Shared utility functions.
 * Pure functions only — no side effects, no imports from service layer.
 */

import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, formatDistanceToNow, isAfter, parseISO } from 'date-fns'
import type { UserRole, BorrowStatus, AuditAction } from '@/types'

// ── Tailwind class merging ────────────────────────────────────
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ── Date formatting ───────────────────────────────────────────
export function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  try {
    return format(parseISO(dateStr), 'dd MMM yyyy')
  } catch {
    return '—'
  }
}

export function formatDateTime(dateStr: string | null): string {
  if (!dateStr) return '—'
  try {
    return format(parseISO(dateStr), 'dd MMM yyyy, HH:mm')
  } catch {
    return '—'
  }
}

export function formatRelativeTime(dateStr: string): string {
  try {
    return formatDistanceToNow(parseISO(dateStr), { addSuffix: true })
  } catch {
    return '—'
  }
}

export function isOverdue(dueDateStr: string): boolean {
  try {
    return isAfter(new Date(), parseISO(dueDateStr))
  } catch {
    return false
  }
}

// ── Role helpers ──────────────────────────────────────────────
export function getRoleBadgeVariant(role: UserRole): 'primary' | 'warning' | 'slate' {
  switch (role) {
    case 'admin':     return 'primary'
    case 'librarian': return 'warning'
    case 'student':   return 'slate'
  }
}

export function canManageBooks(role: UserRole): boolean {
  return role === 'admin' || role === 'librarian'
}

export function canManageUsers(role: UserRole): boolean {
  return role === 'admin'
}

export function canViewAuditLogs(role: UserRole): boolean {
  return role === 'admin'
}

// ── Borrow status helpers ─────────────────────────────────────
export function getBorrowStatusVariant(
  status: BorrowStatus
): 'success' | 'danger' | 'warning' {
  switch (status) {
    case 'returned': return 'success'
    case 'overdue':  return 'danger'
    case 'active':   return 'warning'
  }
}

// ── Audit action labels ───────────────────────────────────────
export const AUDIT_ACTION_LABELS: Record<AuditAction, string> = {
  USER_LOGIN:               'User Login',
  USER_LOGOUT:              'User Logout',
  USER_LOGIN_FAILED:        'Failed Login Attempt',
  USER_REGISTERED:          'User Registered',
  USER_CREATED:             'User Created',
  USER_UPDATED:             'User Updated',
  USER_DISABLED:            'User Disabled',
  USER_ENABLED:             'User Enabled',
  USER_ROLE_CHANGED:        'Role Changed',
  PASSWORD_CHANGED:         'Password Changed',
  PASSWORD_RESET_REQUESTED: 'Password Reset Requested',
  PROFILE_UPDATED:          'Profile Updated',
  BOOK_ADDED:               'Book Added',
  BOOK_UPDATED:             'Book Updated',
  BOOK_DELETED:             'Book Deleted',
  BOOK_BORROWED:            'Book Borrowed',
  BOOK_RETURNED:            'Book Returned',
  BOOK_OVERDUE:             'Book Overdue',
}

// ── Security-sensitive audit actions ─────────────────────────
export const SECURITY_AUDIT_ACTIONS: AuditAction[] = [
  'USER_LOGIN_FAILED',
  'USER_DISABLED',
  'USER_ROLE_CHANGED',
  'PASSWORD_CHANGED',
  'PASSWORD_RESET_REQUESTED',
]

// ── String helpers ───────────────────────────────────────────
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str
  return str.slice(0, maxLength - 1) + '…'
}

export function initials(fullName: string): string {
  return fullName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

// ── Error extraction ──────────────────────────────────────────
/**
 * Extract a safe, user-friendly message from any error.
 * NEVER expose raw PostgreSQL errors or stack traces to the UI.
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    // Map known Supabase/Postgres error codes to friendly messages
    const msg = error.message.toLowerCase()
    if (msg.includes('jwt expired'))        return 'Your session has expired. Please sign in again.'
    if (msg.includes('invalid login'))      return 'Invalid email or password.'
    if (msg.includes('email not confirmed')) return 'Please verify your email address before signing in.'
    if (msg.includes('user already registered')) return 'An account with this email already exists.'
    if (msg.includes('network'))            return 'Network error. Please check your connection.'
    if (msg.includes('permission denied'))  return 'You do not have permission to perform this action.'
    // For unrecognized errors, return a generic message (never the raw DB error)
    return 'An unexpected error occurred. Please try again.'
  }
  return 'An unexpected error occurred. Please try again.'
}

// ── Pagination ────────────────────────────────────────────────
export function getPaginationRange(
  page: number,
  limit: number
): { from: number; to: number } {
  const from = (page - 1) * limit
  const to = from + limit - 1
  return { from, to }
}
