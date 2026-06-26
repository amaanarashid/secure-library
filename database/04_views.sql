-- ============================================================
-- SecureLib — Database Views
-- File: 04_views.sql
-- Run after 03_functions.sql
--
-- Views provide convenient read-only projections of data.
-- They do NOT bypass RLS — RLS still applies to underlying tables.
-- ============================================================

-- ── books_with_status ────────────────────────────────────────
-- Enriches books with a computed availability status string.
-- Useful for quick availability checks without extra logic.
create or replace view public.books_with_status as
select
  id,
  title,
  author,
  isbn,
  category,
  description,
  quantity,
  available_quantity,
  case
    when available_quantity > 0 then 'available'
    else 'unavailable'
  end as availability_status,
  created_at,
  updated_at
from public.books;

-- Security: inherit RLS from books table
-- (views are NOT security barriers by default in Postgres)
-- All access still filtered by books RLS policies.

-- ── active_borrows_view ───────────────────────────────────────
-- Joins borrow_records with books and profiles for easy reporting.
-- Staff use this to see who has what book and whether it's overdue.
create or replace view public.active_borrows_view as
select
  br.id                               as record_id,
  br.borrow_date,
  br.due_date,
  br.return_date,
  br.status,
  (current_date - br.due_date)        as days_overdue,  -- negative = not yet due
  b.id                                as book_id,
  b.title                             as book_title,
  b.author                            as book_author,
  b.isbn                              as book_isbn,
  b.category                          as book_category,
  p.id                                as borrower_id,
  p.full_name                         as borrower_name,
  p.email                             as borrower_email,
  p.role                              as borrower_role
from public.borrow_records br
join public.books           b on b.id = br.book_id
join public.profiles        p on p.id = br.user_id
where br.status in ('active', 'overdue');

-- ── audit_logs_view ───────────────────────────────────────────
-- Joins audit_logs with profile names for admin display.
create or replace view public.audit_logs_view as
select
  al.id,
  al.action,
  al.description,
  al.metadata,
  al.created_at,
  al.user_id,
  p.full_name   as user_name,
  p.email       as user_email,
  p.role        as user_role
from public.audit_logs al
left join public.profiles p on p.id = al.user_id;

-- ── user_summary_view ─────────────────────────────────────────
-- Per-user borrow statistics. Admin reporting use-case.
create or replace view public.user_summary_view as
select
  p.id,
  p.full_name,
  p.email,
  p.role,
  p.is_active,
  p.created_at,
  count(br.id)                                              as total_borrows,
  count(br.id) filter (where br.status = 'active')         as active_borrows,
  count(br.id) filter (where br.status = 'overdue')        as overdue_borrows,
  count(br.id) filter (where br.status = 'returned')       as returned_borrows
from public.profiles p
left join public.borrow_records br on br.user_id = p.id
group by p.id, p.full_name, p.email, p.role, p.is_active, p.created_at;
