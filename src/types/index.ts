// ============================================================
// Core Domain Types
// ============================================================

export type UserRole = 'admin' | 'librarian' | 'student'

export type BookStatus = 'available' | 'borrowed' | 'unavailable'

export type BorrowStatus = 'active' | 'returned' | 'overdue'

export type AuditAction =
  | 'USER_LOGIN'
  | 'USER_LOGOUT'
  | 'USER_LOGIN_FAILED'
  | 'USER_REGISTERED'
  | 'USER_CREATED'
  | 'USER_UPDATED'
  | 'USER_DISABLED'
  | 'USER_ENABLED'
  | 'USER_ROLE_CHANGED'
  | 'PASSWORD_CHANGED'
  | 'PASSWORD_RESET_REQUESTED'
  | 'PROFILE_UPDATED'
  | 'BOOK_ADDED'
  | 'BOOK_UPDATED'
  | 'BOOK_DELETED'
  | 'BOOK_BORROWED'
  | 'BOOK_RETURNED'
  | 'BOOK_OVERDUE'

// ============================================================
// Database Row Types (mirror DB schema 1:1)
// ============================================================

export interface Profile {
  id: string
  full_name: string
  email: string
  role: UserRole
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Book {
  id: string
  title: string
  author: string
  isbn: string | null
  category: string
  description: string | null
  quantity: number
  available_quantity: number
  created_at: string
  updated_at: string
}

export interface BorrowRecord {
  id: string
  book_id: string
  user_id: string
  borrow_date: string
  due_date: string
  return_date: string | null
  status: BorrowStatus
  created_at: string
  // Joined fields
  book?: Pick<Book, 'id' | 'title' | 'author' | 'isbn'>
  user?: Pick<Profile, 'id' | 'full_name' | 'email'>
}

export interface AuditLog {
  id: string
  user_id: string | null
  action: AuditAction
  description: string
  ip_address: string | null
  metadata: Record<string, unknown> | null
  created_at: string
  // Joined
  user?: Pick<Profile, 'id' | 'full_name' | 'email'>
}

// ============================================================
// RPC Response Types
// ============================================================

export interface RPCResponse<T = null> {
  success: boolean
  data?: T
  error?: string
  code?: string
}

export interface DashboardStats {
  total_books: number
  total_users: number
  active_borrows: number
  overdue_books: number
  books_added_this_month: number
  new_users_this_month: number
  available_books: number
  total_borrow_records: number
}

export interface RecentActivity {
  id: string
  action: AuditAction
  description: string
  user_name: string | null
  created_at: string
}

export interface UserPermissions {
  user_id: string
  role: UserRole
  can_manage_books: boolean
  can_manage_users: boolean
  can_view_audit_logs: boolean
  can_borrow_books: boolean
  can_view_all_borrows: boolean
}

// ============================================================
// Form Input Types
// ============================================================

export interface LoginInput {
  email: string
  password: string
  remember_me: boolean
}

export interface RegisterInput {
  full_name: string
  email: string
  password: string
  confirm_password: string
}

export interface BookInput {
  title: string
  author: string
  isbn: string
  category: string
  description: string
  quantity: number
}

export interface ProfileUpdateInput {
  full_name: string
}

export interface ChangePasswordInput {
  current_password: string
  new_password: string
  confirm_password: string
}

export interface CreateUserInput {
  full_name: string
  email: string
  password: string
  role: UserRole
}

// ============================================================
// Filter / Search Types
// ============================================================

export interface BookFilters {
  search?: string
  category?: string
  status?: 'available' | 'unavailable' | 'all'
  page?: number
  limit?: number
}

export interface BorrowFilters {
  status?: BorrowStatus | 'all'
  user_id?: string
  page?: number
  limit?: number
}

export interface AuditFilters {
  action?: AuditAction | 'all'
  user_id?: string
  date_from?: string
  date_to?: string
  page?: number
  limit?: number
}

export interface UserFilters {
  search?: string
  role?: UserRole | 'all'
  is_active?: boolean | 'all'
  page?: number
  limit?: number
}

// ============================================================
// Pagination
// ============================================================

export interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  limit: number
  total_pages: number
}
