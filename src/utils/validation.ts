/**
 * Zod validation schemas (compatible with Zod v4)
 *
 * All schemas are defined here and reused across forms and service calls.
 * Client-side validation is the first layer of defense (UX).
 * The database provides the authoritative second layer via constraints and functions.
 */

import { z } from 'zod'
import { PASSWORD_RULES, BOOK_CATEGORIES } from '@/constants'

// ── Password schema (shared, used in multiple schemas) ────────
const passwordSchema = z
  .string()
  .min(PASSWORD_RULES.minLength, `Password must be at least ${PASSWORD_RULES.minLength} characters`)
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character')

// ── Auth schemas ──────────────────────────────────────────────
export const loginSchema = z.object({
  email:       z.string().email('Please enter a valid email address'),
  password:    z.string().min(1, 'Password is required'),
  remember_me: z.boolean().default(false),
})

export const registerSchema = z.object({
  full_name:        z.string()
    .min(2, 'Full name must be at least 2 characters')
    .max(100, 'Full name is too long')
    .regex(/^[a-zA-Z\s'-]+$/, 'Full name contains invalid characters'),
  email:            z.string().email('Please enter a valid email address'),
  password:         passwordSchema,
  confirm_password: z.string(),
}).refine(
  data => data.password === data.confirm_password,
  { message: 'Passwords do not match', path: ['confirm_password'] }
)

export const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
})

export const resetPasswordSchema = z.object({
  password:         passwordSchema,
  confirm_password: z.string(),
}).refine(
  data => data.password === data.confirm_password,
  { message: 'Passwords do not match', path: ['confirm_password'] }
)

// ── Book schemas ──────────────────────────────────────────────
export const bookSchema = z.object({
  title:       z.string().min(1, 'Title is required').max(255, 'Title is too long'),
  author:      z.string().min(1, 'Author is required').max(255, 'Author is too long'),
  isbn:        z.string()
    .regex(/^(?:97[89]\d{10}|\d{9}[\dX])$/, 'Invalid ISBN format')
    .optional()
    .or(z.literal('')),
  category:    z.enum(BOOK_CATEGORIES, 'Please select a category'),
  description: z.string().max(2000, 'Description is too long').optional().or(z.literal('')),
  quantity:    z.number('Quantity must be a number')
    .int('Quantity must be a whole number')
    .min(1, 'Quantity must be at least 1')
    .max(9999, 'Quantity is too large'),
})

// ── Profile schemas ───────────────────────────────────────────
export const updateProfileSchema = z.object({
  full_name: z.string()
    .min(2, 'Full name must be at least 2 characters')
    .max(100, 'Full name is too long')
    .regex(/^[a-zA-Z\s'-]+$/, 'Full name contains invalid characters'),
})

export const changePasswordSchema = z.object({
  current_password: z.string().min(1, 'Current password is required'),
  new_password:     passwordSchema,
  confirm_password: z.string(),
}).refine(
  data => data.new_password === data.confirm_password,
  { message: 'Passwords do not match', path: ['confirm_password'] }
).refine(
  data => data.current_password !== data.new_password,
  { message: 'New password must be different from current password', path: ['new_password'] }
)

// ── User management schemas ───────────────────────────────────
export const createUserSchema = z.object({
  full_name: z.string().min(2, 'Full name must be at least 2 characters').max(100),
  email:     z.string().email('Please enter a valid email address'),
  password:  passwordSchema,
  role:      z.enum(['admin', 'librarian', 'student'] as const, 'Please select a valid role'),
})

export const changeRoleSchema = z.object({
  role: z.enum(['admin', 'librarian', 'student'] as const),
})

// ── Search / Filter schemas ────────────────────────────────────
export const bookFilterSchema = z.object({
  search:   z.string().max(200).optional(),
  category: z.string().optional(),
  status:   z.enum(['available', 'unavailable', 'all'] as const).optional(),
})

// Types inferred from schemas
export type LoginFormData        = z.infer<typeof loginSchema>
export type RegisterFormData     = z.infer<typeof registerSchema>
export type ForgotPasswordData   = z.infer<typeof forgotPasswordSchema>
export type ResetPasswordData    = z.infer<typeof resetPasswordSchema>
export type BookFormData         = z.infer<typeof bookSchema>
export type UpdateProfileData    = z.infer<typeof updateProfileSchema>
export type ChangePasswordData   = z.infer<typeof changePasswordSchema>
export type CreateUserFormData   = z.infer<typeof createUserSchema>
