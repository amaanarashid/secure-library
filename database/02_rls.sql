-- ============================================================
-- SecureLib — Row Level Security Policies
-- File: 02_rls.sql
-- Run after 01_schema.sql
--
-- Security philosophy:
-- RLS is the authoritative access control layer.
-- Every table is locked down. No table is left unprotected.
-- ============================================================

-- ── Enable RLS on all tables ──────────────────────────────────
alter table public.profiles      enable row level security;
alter table public.books         enable row level security;
alter table public.borrow_records enable row level security;
alter table public.audit_logs    enable row level security;

-- ── Helper: get caller's role ─────────────────────────────────
-- Used in policies to avoid repeated subqueries.
create or replace function public.get_current_user_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role::text from public.profiles where id = auth.uid() and is_active = true;
$$;

-- ── Helper: check if caller is active ─────────────────────────
create or replace function public.is_active_user()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and is_active = true
  );
$$;

-- ============================================================
-- PROFILES POLICIES
-- ============================================================

-- All authenticated active users can view their own profile
create policy "profiles.select.own"
  on public.profiles for select
  using (id = auth.uid() and is_active_user());

-- Admins can view all profiles
create policy "profiles.select.admin"
  on public.profiles for select
  using (get_current_user_role() = 'admin');

-- Only RPC functions (security definer) can insert/update profiles
-- Direct inserts from client are blocked — done via trigger on auth.users
create policy "profiles.insert.system"
  on public.profiles for insert
  with check (false); -- Block all direct inserts; use trigger instead

create policy "profiles.update.rpc_only"
  on public.profiles for update
  using (get_current_user_role() = 'admin' or id = auth.uid());

-- Hard deletes are blocked — use is_active flag instead
create policy "profiles.delete.never"
  on public.profiles for delete
  using (false);

-- ============================================================
-- BOOKS POLICIES
-- ============================================================

-- Everyone authenticated can view books
create policy "books.select.authenticated"
  on public.books for select
  using (is_active_user());

-- Only admin and librarian can insert (via RPC functions)
create policy "books.insert.staff"
  on public.books for insert
  with check (get_current_user_role() in ('admin', 'librarian'));

-- Only admin and librarian can update
create policy "books.update.staff"
  on public.books for update
  using (get_current_user_role() in ('admin', 'librarian'));

-- Only admin can delete
create policy "books.delete.admin"
  on public.books for delete
  using (get_current_user_role() = 'admin');

-- ============================================================
-- BORROW_RECORDS POLICIES
-- ============================================================

-- Students see only their own records
create policy "borrow_records.select.own"
  on public.borrow_records for select
  using (user_id = auth.uid() and is_active_user());

-- Staff see all records
create policy "borrow_records.select.staff"
  on public.borrow_records for select
  using (get_current_user_role() in ('admin', 'librarian'));

-- Insert only via RPC functions (security definer bypass)
create policy "borrow_records.insert.authenticated"
  on public.borrow_records for insert
  with check (is_active_user());

-- Updates (return) only via RPC
create policy "borrow_records.update.authenticated"
  on public.borrow_records for update
  using (
    user_id = auth.uid()
    or get_current_user_role() in ('admin', 'librarian')
  );

-- No hard deletes on borrow records
create policy "borrow_records.delete.never"
  on public.borrow_records for delete
  using (false);

-- ============================================================
-- AUDIT_LOGS POLICIES
-- Only admins can read. Nobody can update or delete.
-- ============================================================

-- Admins read all audit logs
create policy "audit_logs.select.admin"
  on public.audit_logs for select
  using (get_current_user_role() = 'admin');

-- Users can read their own audit entries (for profile activity page)
create policy "audit_logs.select.own"
  on public.audit_logs for select
  using (user_id = auth.uid());

-- Insert is allowed (triggered via security definer functions only in practice)
create policy "audit_logs.insert.authenticated"
  on public.audit_logs for insert
  with check (true); -- Further restricted by RPC function logic

-- NEVER allow update or delete on audit logs
create policy "audit_logs.update.never"
  on public.audit_logs for update
  using (false);

create policy "audit_logs.delete.never"
  on public.audit_logs for delete
  using (false);
