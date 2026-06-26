# SecureLib — Secure Library Management System

A production-quality library management system built with security as the highest priority. Developed as a Computer Systems Security university assignment demonstrating enterprise-grade security patterns.

---

## Table of Contents

1. [Overview](#overview)
2. [Technology Stack](#technology-stack)
3. [Project Structure](#project-structure)
4. [Security Architecture](#security-architecture)
5. [Authentication Flow](#authentication-flow)
6. [Authorization Flow](#authorization-flow)
7. [Database Schema](#database-schema)
8. [RLS Policies](#rls-policies)
9. [RPC Functions](#rpc-functions)
10. [Triggers & Views](#triggers--views)
11. [Setup Guide](#setup-guide)
12. [Environment Variables](#environment-variables)
13. [Running the Application](#running-the-application)
14. [User Roles](#user-roles)
15. [Security Features Summary](#security-features-summary)

---

## Overview

SecureLib is a full-stack library management system where **security is enforced at every layer**:

- **Frontend**: Input validation, protected routes, session management
- **Service Layer**: Typed RPC calls, no raw SQL from client
- **Database**: Row Level Security, SECURITY DEFINER functions, triggers, audit logs

The application intentionally avoids placing business logic in React. All sensitive operations — permission checks, stock management, audit logging — live inside PostgreSQL functions exposed via Supabase RPC.

---

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite + TypeScript |
| Styling | Tailwind CSS |
| Forms | React Hook Form + Zod |
| Data Fetching | TanStack Query v5 |
| Routing | React Router v6 |
| Backend | Supabase (Auth + Database) |
| Database | PostgreSQL |
| Notifications | react-hot-toast |
| Icons | lucide-react |

---

## Project Structure

```
secure-library/
├── database/
│   ├── 01_schema.sql       # Tables, enums, constraints, indexes
│   ├── 02_rls.sql          # Row Level Security policies
│   ├── 03_functions.sql    # All RPC functions (SECURITY DEFINER)
│   ├── 04_views.sql        # Read-only projections
│   ├── 05_triggers.sql     # Automated audit & integrity triggers
│   └── 06_seed.sql         # Demo data + role assignment guide
│
└── src/
    ├── lib/
    │   └── supabase.ts         # Typed Supabase client
    │
    ├── types/
    │   ├── index.ts            # Domain types (Profile, Book, etc.)
    │   └── database.ts         # Full Database<> interface for type safety
    │
    ├── constants/
    │   └── index.ts            # App-wide constants, routes, query keys
    │
    ├── utils/
    │   ├── index.ts            # Helpers: formatDate, cn(), error masking
    │   └── validation.ts       # Zod schemas for all forms
    │
    ├── contexts/
    │   └── AuthContext.tsx     # Session state, inactivity timeout
    │
    ├── services/               # All Supabase calls — one file per domain
    │   ├── auth/authService.ts
    │   ├── books/bookService.ts
    │   ├── borrowing/borrowService.ts
    │   ├── users/userService.ts
    │   ├── dashboard/dashboardService.ts
    │   ├── audit/auditService.ts
    │   └── profile/profileService.ts
    │
    ├── hooks/                  # TanStack Query hooks wrapping services
    │   ├── useBooks.ts
    │   ├── useBorrowing.ts
    │   ├── useDashboard.ts
    │   ├── useUsers.ts
    │   └── useAudit.ts
    │
    ├── components/
    │   ├── guards/             # AuthGuard, GuestGuard, RoleGuard
    │   ├── layouts/            # AppLayout (sidebar), AuthLayout (card)
    │   └── ui/                 # Reusable: Button, Input, Modal, Table…
    │
    ├── pages/                  # One folder per module
    │   ├── auth/               # Login, Register, ForgotPassword, Reset
    │   ├── dashboard/          # Stats + recent activity
    │   ├── books/              # Book list, search, add/edit/delete
    │   ├── borrowing/          # My borrows / all borrows (staff)
    │   ├── users/              # Admin: manage users, roles
    │   ├── audit/              # Admin: audit log search + CSV export
    │   ├── security/           # Admin: security dashboard
    │   └── profile/            # Update profile, change password
    │
    ├── features/
    │   └── books/BookFormModal.tsx
    │
    └── App.tsx                 # Routes + providers
```

---

## Security Architecture

```
Browser
  │
  ▼
React UI  ─── Zod validation (client-side)
  │           Protected routes (AuthGuard / RoleGuard)
  │           Session timeout (inactivity timer)
  │
  ▼
Service Layer  ─── Typed TypeScript calls
  │               No raw SQL ever sent from client
  │               Errors sanitised before display
  │
  ▼
Supabase Client  ─── JWT token attached automatically
  │                  HTTPS only
  │
  ▼
PostgREST / RPC
  │
  ▼
PostgreSQL Functions  ─── SECURITY DEFINER
  │                        set search_path = public (prevents injection)
  │                        Validate caller role FIRST
  │                        Business logic
  │                        Transactions where needed
  │                        Audit log written atomically
  │
  ▼
Row Level Security  ─── Final enforcement layer
  │                      Even if RPC is bypassed, RLS blocks access
  │
  ▼
Tables  ─── Constraints, FK, CHECK, NOT NULL
```

**Key principle:** RLS is the authoritative security boundary. RPC functions add business-logic validation on top. The frontend adds UX-level protection only.

---

## Authentication Flow

```
Register
  → Zod validates: email format, password strength (8+, upper, lower, digit, special)
  → supabase.auth.signUp() called
  → Supabase sends verification email
  → handle_new_user() trigger fires → creates profile row (role: 'student')
  → Audit log: USER_REGISTERED

Email Verification
  → User clicks link → Supabase confirms email
  → User can now log in

Login
  → supabase.auth.signInWithPassword()
  → JWT stored in localStorage (key: 'securelib-auth-token')
  → AuthContext fetches profile (role, name)
  → Inactivity timer starts (configurable, default 30 min)
  → Audit log: USER_LOGIN

Session Timeout
  → mousemove / keydown / click events reset timer
  → On timeout: supabase.auth.signOut() called automatically
  → User redirected to /login

Forgot Password
  → Always shows success message (prevents email enumeration)
  → supabase.auth.resetPasswordForEmail() sends link if email exists

Password Reset
  → Token validated by Supabase
  → supabase.auth.updateUser() with new password
  → Audit log: PASSWORD_CHANGED
```

---

## Authorization Flow

```
Route Access
  AuthGuard  → checks session exists → else redirect /login
  GuestGuard → blocks logged-in users from /login, /register
  RoleGuard  → checks role from AuthContext → shows Forbidden if insufficient

UI Visibility
  AppLayout navigation: filters menu items by role
  Action buttons (Add Book, Delete, etc.): conditionally rendered by role

API Calls
  Every RPC function calls get_current_user_role() as its FIRST action
  If role is NULL or insufficient → returns error or raises exception
  Role comes from profiles table (database), never from JWT claims

Database Layer (final authority)
  RLS policies check role for every SELECT / INSERT / UPDATE / DELETE
  Even a crafted request bypassing the frontend is blocked here
```

---

## Database Schema

### profiles
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | FK → auth.users(id) |
| full_name | text | NOT NULL, min 2 chars |
| email | text | UNIQUE, NOT NULL |
| role | user_role | enum: admin/librarian/student |
| is_active | boolean | Default true; soft-delete pattern |
| created_at | timestamptz | Auto |
| updated_at | timestamptz | Auto (trigger) |

### books
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| title | text | NOT NULL |
| author | text | NOT NULL |
| isbn | text | UNIQUE (nullable) |
| category | text | NOT NULL |
| description | text | Nullable |
| quantity | integer | CHECK ≥ 0 |
| available_quantity | integer | CHECK ≥ 0, ≤ quantity |
| created_at / updated_at | timestamptz | Auto |

### borrow_records
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| book_id | uuid | FK → books |
| user_id | uuid | FK → profiles |
| borrow_date | date | NOT NULL |
| due_date | date | NOT NULL |
| return_date | date | Nullable |
| status | borrow_status | enum: active/returned/overdue |
| created_at | timestamptz | Auto |

### audit_logs
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| user_id | uuid | FK → profiles (nullable for system events) |
| action | text | NOT NULL |
| description | text | NOT NULL |
| metadata | jsonb | Structured extra data |
| ip_address | text | Reserved (future) |
| created_at | timestamptz | Auto |

---

## RLS Policies

| Table | Operation | Who |
|-------|-----------|-----|
| profiles | SELECT | Own row OR admin |
| profiles | INSERT | Blocked (trigger only) |
| profiles | UPDATE | Own row OR admin (via RPC) |
| profiles | DELETE | Never |
| books | SELECT | Any active user |
| books | INSERT | admin, librarian |
| books | UPDATE | admin, librarian |
| books | DELETE | admin only |
| borrow_records | SELECT | Own rows OR admin/librarian |
| borrow_records | INSERT | Any active user (RPC validates) |
| borrow_records | UPDATE | Own rows OR admin/librarian |
| borrow_records | DELETE | Never |
| audit_logs | SELECT | Admin OR own rows |
| audit_logs | INSERT | Allowed (RPC controls logic) |
| audit_logs | UPDATE | Never |
| audit_logs | DELETE | Never |

---

## RPC Functions

| Function | Permission | Description |
|----------|-----------|-------------|
| `get_dashboard_stats()` | Any authenticated | 8 stats including overdue count |
| `search_books(...)` | Any authenticated | Full-text search + filters + pagination |
| `borrow_book(book_id)` | Any authenticated | Atomic: validates stock, 3-borrow limit, race-safe |
| `return_book(record_id)` | Student (own) / Staff | Atomic: marks returned, increments stock |
| `add_book_secure(...)` | admin, librarian | Validates + inserts + logs |
| `update_book_secure(...)` | admin, librarian | Adjusts available_qty proportionally |
| `delete_book_secure(...)` | admin only | Blocks if active borrows exist |
| `get_user_permissions()` | Any authenticated | Returns permission flags for current user |
| `update_profile_secure(name)` | Any authenticated | Validates + updates + logs |
| `change_user_role(uid, role)` | admin only | Cannot change own role |
| `disable_user(uid)` | admin only | Cannot disable self |
| `enable_user(uid)` | admin only | Re-activates account |
| `search_users(...)` | admin only | Search by name/email/role |
| `get_recent_activity(n)` | Any authenticated | Last N audit entries with user names |
| `get_overdue_books()` | admin, librarian | Auto-marks overdue before returning |
| `create_audit_log(...)` | Any authenticated | Public alias for manual log entries |

All functions use `SECURITY DEFINER` and `set search_path = public`.

---

## Triggers & Views

### Triggers

| Trigger | Table | When | Purpose |
|---------|-------|------|---------|
| `on_auth_user_created` | auth.users | AFTER INSERT | Creates profile, logs USER_REGISTERED |
| `books_set_updated_at` | books | BEFORE UPDATE | Stamps updated_at |
| `profiles_set_updated_at` | profiles | BEFORE UPDATE | Stamps updated_at |
| `books_after_insert` | books | AFTER INSERT | Fallback audit log |
| `books_after_delete` | books | AFTER DELETE | Fallback audit log |
| `borrow_after_insert` | borrow_records | AFTER INSERT | Fallback audit log |
| `borrow_overdue_check` | borrow_records | BEFORE UPDATE | Auto-sets overdue status |
| `profile_role_change` | profiles | AFTER UPDATE | Logs role changes |
| `profile_active_change` | profiles | AFTER UPDATE | Logs enable/disable |

### Views

| View | Description |
|------|-------------|
| `books_with_status` | Books + computed availability string |
| `active_borrows_view` | Active/overdue borrows joined with book + user details |
| `audit_logs_view` | Audit logs joined with user names |
| `user_summary_view` | Per-user borrow statistics |

---

## Setup Guide

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) → New Project
2. Note your **Project URL** and **anon public key** (Settings → API)

### 2. Run Database SQL

In Supabase Dashboard → SQL Editor, run files **in order**:

```
01_schema.sql   ← Tables, enums, indexes
02_rls.sql      ← RLS policies + helper functions
03_functions.sql← All RPC functions + user trigger
04_views.sql    ← Convenience views
05_triggers.sql ← Audit + integrity triggers
06_seed.sql     ← Sample books (read the role assignment notes inside)
```

### 3. Create Demo Users

In Supabase Dashboard → Authentication → Users → Add user:

| Email | Password | Role |
|-------|----------|------|
| admin@securelib.com | Admin@123456 | admin |
| librarian@securelib.com | Lib@123456 | librarian |
| student@securelib.com | Student@123456 | student |

Then in SQL Editor, assign roles:

```sql
update public.profiles set role = 'admin'     where email = 'admin@securelib.com';
update public.profiles set role = 'librarian' where email = 'librarian@securelib.com';
```

### 4. Configure Environment

```bash
cp .env.example .env
```

Edit `.env`:

```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 5. Install & Run

```bash
npm install
npm run dev
```

App runs at **http://localhost:5173**

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Public anon key (safe to expose — RLS enforces access) |

Never put service role keys in the frontend.

---

## Running the Application

```bash
npm run dev      # Development server
npm run build    # Production build
npm run preview  # Preview production build
```

---

## User Roles

### Admin
- Full access to everything
- Manage users (assign roles, disable/enable)
- View all audit logs
- Delete books (if no active borrows)
- Access Security Dashboard

### Librarian
- Manage books (add, edit)
- Process borrows and returns
- View all borrow records including overdue
- Cannot manage users or view audit logs

### Student
- Browse and search books
- Borrow up to 3 books at a time (14-day loan)
- Return own books
- View own borrow history
- Update own profile
- Cannot add/edit/delete books

---

## Security Features Summary

| Feature | Implementation |
|---------|----------------|
| Authentication | Supabase Auth (email + password) |
| Email Verification | Required before login |
| Password Strength | Zod: 8+ chars, upper, lower, digit, special |
| Session Management | JWT, auto-refresh, stored with custom key |
| Session Timeout | Inactivity timer, configurable |
| Remember Me | Persistent session option |
| Forgot Password | Always returns success (no email enumeration) |
| RBAC | 3 roles enforced at DB level, not just UI |
| Protected Routes | AuthGuard + RoleGuard components |
| Row Level Security | Enabled on ALL tables, never disabled |
| Business Logic in DB | All via SECURITY DEFINER RPC functions |
| SQL Injection Prevention | Parameterised queries via Supabase SDK |
| XSS Prevention | React escapes all rendered values by default |
| Error Sanitisation | `getErrorMessage()` never exposes SQL/stack |
| Audit Logging | Immutable (INSERT only, no UPDATE/DELETE) |
| Race Condition Protection | `FOR UPDATE` lock in borrow_book() |
| Borrow Limits | Enforced in DB (max 3 active), not just UI |
| Soft Deletes | is_active flag; no hard user deletes |
| Active Borrow Guard | delete_book_secure() blocks if borrows active |
| Schema Injection | `set search_path = public` on all functions |
| No Secrets in Frontend | Only anon key; service key never exposed |
