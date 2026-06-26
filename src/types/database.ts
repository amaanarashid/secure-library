/**
 * Database type definitions for Supabase's generated types pattern.
 * In production, run: npx supabase gen types typescript --project-id <id>
 * to auto-generate this file from your live schema.
 *
 * This manual version mirrors the exact schema we will create in Supabase.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string
          email: string
          role: 'admin' | 'librarian' | 'student'
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name: string
          email: string
          role?: 'admin' | 'librarian' | 'student'
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          full_name?: string
          role?: 'admin' | 'librarian' | 'student'
          is_active?: boolean
          updated_at?: string
        }
      }
      books: {
        Row: {
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
        Insert: {
          title: string
          author: string
          isbn?: string | null
          category: string
          description?: string | null
          quantity: number
          available_quantity?: number
        }
        Update: {
          title?: string
          author?: string
          isbn?: string | null
          category?: string
          description?: string | null
          quantity?: number
          available_quantity?: number
          updated_at?: string
        }
      }
      borrow_records: {
        Row: {
          id: string
          book_id: string
          user_id: string
          borrow_date: string
          due_date: string
          return_date: string | null
          status: 'active' | 'returned' | 'overdue'
          created_at: string
        }
        Insert: {
          book_id: string
          user_id: string
          borrow_date?: string
          due_date: string
          return_date?: string | null
          status?: 'active' | 'returned' | 'overdue'
        }
        Update: {
          return_date?: string | null
          status?: 'active' | 'returned' | 'overdue'
        }
      }
      audit_logs: {
        Row: {
          id: string
          user_id: string | null
          action: string
          description: string
          ip_address: string | null
          metadata: Json | null
          created_at: string
        }
        Insert: {
          user_id?: string | null
          action: string
          description: string
          ip_address?: string | null
          metadata?: Json | null
        }
        Update: never // Audit logs are immutable
      }
    }
    Views: {
      books_with_status: {
        Row: {
          id: string
          title: string
          author: string
          isbn: string | null
          category: string
          description: string | null
          quantity: number
          available_quantity: number
          status: 'available' | 'unavailable'
          created_at: string
          updated_at: string
        }
      }
      active_borrows_view: {
        Row: {
          id: string
          book_id: string
          book_title: string
          book_author: string
          user_id: string
          user_name: string
          user_email: string
          borrow_date: string
          due_date: string
          days_remaining: number
          is_overdue: boolean
          status: string
        }
      }
    }
    Functions: {
      get_dashboard_stats: {
        Args: Record<string, never>
        Returns: {
          total_books: number
          total_users: number
          active_borrows: number
          overdue_books: number
          books_added_this_month: number
          new_users_this_month: number
          available_books: number
          total_borrow_records: number
        }[]
      }
      borrow_book: {
        Args: { p_book_id: string }
        Returns: { success: boolean; message: string; record_id: string | null }[]
      }
      return_book: {
        Args: { p_record_id: string }
        Returns: { success: boolean; message: string }[]
      }
      search_books: {
        Args: {
          p_search?: string
          p_category?: string
          p_available_only?: boolean
          p_limit?: number
          p_offset?: number
        }
        Returns: {
          id: string
          title: string
          author: string
          isbn: string | null
          category: string
          description: string | null
          quantity: number
          available_quantity: number
          status: string
          total_count: number
        }[]
      }
      add_book_secure: {
        Args: {
          p_title: string
          p_author: string
          p_isbn: string | null
          p_category: string
          p_description: string | null
          p_quantity: number
        }
        Returns: { success: boolean; message: string; book_id: string | null }[]
      }
      update_book_secure: {
        Args: {
          p_book_id: string
          p_title: string
          p_author: string
          p_isbn: string | null
          p_category: string
          p_description: string | null
          p_quantity: number
        }
        Returns: { success: boolean; message: string }[]
      }
      delete_book_secure: {
        Args: { p_book_id: string }
        Returns: { success: boolean; message: string }[]
      }
      get_user_permissions: {
        Args: Record<string, never>
        Returns: {
          user_id: string
          role: string
          can_manage_books: boolean
          can_manage_users: boolean
          can_view_audit_logs: boolean
          can_borrow_books: boolean
          can_view_all_borrows: boolean
        }[]
      }
      update_profile_secure: {
        Args: { p_full_name: string }
        Returns: { success: boolean; message: string }[]
      }
      change_user_role: {
        Args: { p_user_id: string; p_new_role: string }
        Returns: { success: boolean; message: string }[]
      }
      disable_user: {
        Args: { p_user_id: string }
        Returns: { success: boolean; message: string }[]
      }
      enable_user: {
        Args: { p_user_id: string }
        Returns: { success: boolean; message: string }[]
      }
      search_users: {
        Args: {
          p_search?: string
          p_role?: string
          p_is_active?: boolean | null
          p_limit?: number
          p_offset?: number
        }
        Returns: {
          id: string
          full_name: string
          email: string
          role: string
          is_active: boolean
          created_at: string
          total_count: number
        }[]
      }
      get_recent_activity: {
        Args: { p_limit?: number }
        Returns: {
          id: string
          action: string
          description: string
          user_name: string | null
          created_at: string
        }[]
      }
      get_overdue_books: {
        Args: Record<string, never>
        Returns: {
          id: string
          book_id: string
          book_title: string
          user_id: string
          user_name: string
          user_email: string
          borrow_date: string
          due_date: string
          days_overdue: number
        }[]
      }
      create_audit_log: {
        Args: {
          p_action: string
          p_description: string
          p_metadata?: Json | null
        }
        Returns: { success: boolean }[]
      }
    }
    Enums: {
      user_role: 'admin' | 'librarian' | 'student'
      borrow_status: 'active' | 'returned' | 'overdue'
    }
  }
}
