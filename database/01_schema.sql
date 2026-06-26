-- ============================================================
-- SecureLib — Database Schema
-- File: 01_schema.sql
-- Run this first in your Supabase SQL Editor.
-- ============================================================

-- ── Extensions ───────────────────────────────────────────────
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ── Custom Types ─────────────────────────────────────────────
create type user_role as enum ('admin', 'librarian', 'student');
create type borrow_status as enum ('active', 'returned', 'overdue');

-- ============================================================
-- TABLE: profiles
-- Extends Supabase auth.users with application-level fields.
-- id references auth.users so deleting an auth user cascades here.
-- ============================================================
create table if not exists public.profiles (
  id          uuid        primary key references auth.users(id) on delete cascade,
  full_name   text        not null check (length(trim(full_name)) >= 2 and length(full_name) <= 100),
  email       text        not null unique,
  role        user_role   not null default 'student',
  is_active   boolean     not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table public.profiles is 'Application user profiles, extended from auth.users';
comment on column public.profiles.role is 'RBAC role — determines permissions throughout the system';
comment on column public.profiles.is_active is 'Soft-disable flag; disabled users cannot sign in';

-- ============================================================
-- TABLE: books
-- ============================================================
create table if not exists public.books (
  id                 uuid        primary key default uuid_generate_v4(),
  title              text        not null check (length(trim(title)) >= 1 and length(title) <= 255),
  author             text        not null check (length(trim(author)) >= 1 and length(author) <= 255),
  isbn               text        unique,
  category           text        not null,
  description        text        check (length(description) <= 2000),
  quantity           integer     not null check (quantity >= 0),
  available_quantity integer     not null check (available_quantity >= 0),
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  -- Ensure available never exceeds total
  constraint chk_available_lte_quantity check (available_quantity <= quantity)
);

comment on table public.books is 'Library book inventory';
comment on column public.books.available_quantity is 'Updated atomically via borrow/return RPC functions only';

-- ============================================================
-- TABLE: borrow_records
-- ============================================================
create table if not exists public.borrow_records (
  id          uuid          primary key default uuid_generate_v4(),
  book_id     uuid          not null references public.books(id) on delete restrict,
  user_id     uuid          not null references public.profiles(id) on delete restrict,
  borrow_date date          not null default current_date,
  due_date    date          not null,
  return_date date,
  status      borrow_status not null default 'active',
  created_at  timestamptz   not null default now(),
  -- Prevent duplicate active borrows of the same book by the same user
  constraint uq_active_borrow unique nulls not distinct (book_id, user_id, return_date),
  constraint chk_due_after_borrow check (due_date > borrow_date),
  constraint chk_return_after_borrow check (return_date is null or return_date >= borrow_date)
);

comment on table public.borrow_records is 'Tracks all book loans. Never hard-deleted for audit purposes.';

-- ============================================================
-- TABLE: audit_logs
-- Append-only — no UPDATE or DELETE ever happens here.
-- ============================================================
create table if not exists public.audit_logs (
  id          uuid        primary key default uuid_generate_v4(),
  user_id     uuid        references public.profiles(id) on delete set null,
  action      text        not null,
  description text        not null check (length(description) <= 1000),
  ip_address  inet,
  metadata    jsonb,
  created_at  timestamptz not null default now()
);

comment on table public.audit_logs is 'Immutable audit trail. INSERT only — no UPDATE or DELETE policies.';

-- ============================================================
-- INDEXES — performance
-- ============================================================
create index if not exists idx_books_title        on public.books using gin(to_tsvector('english', title || ' ' || author));
create index if not exists idx_books_category     on public.books(category);
create index if not exists idx_borrow_user        on public.borrow_records(user_id);
create index if not exists idx_borrow_book        on public.borrow_records(book_id);
create index if not exists idx_borrow_status      on public.borrow_records(status);
create index if not exists idx_audit_user         on public.audit_logs(user_id);
create index if not exists idx_audit_action       on public.audit_logs(action);
create index if not exists idx_audit_created      on public.audit_logs(created_at desc);
create index if not exists idx_profiles_role      on public.profiles(role);
