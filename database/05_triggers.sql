-- ============================================================
-- SecureLib — Database Triggers
-- File: 05_triggers.sql
-- Run after 04_views.sql
--
-- Triggers automate audit logging and data integrity enforcement
-- at the database level — independent of the application layer.
-- ============================================================

-- ── updated_at auto-stamp ─────────────────────────────────────
-- Generic trigger function: sets updated_at = now() on every UPDATE.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists books_set_updated_at    on public.books;
drop trigger if exists profiles_set_updated_at on public.profiles;

create trigger books_set_updated_at
  before update on public.books
  for each row execute function public.set_updated_at();

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ── books: audit on insert ────────────────────────────────────
-- Fires when a book row is inserted directly (belt-and-suspenders
-- alongside add_book_secure() which also logs).
-- Only logs if the audit hasn't already been written by the RPC.
create or replace function public.trg_books_after_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- RPC functions log immediately before insert; skip duplicate
  -- by checking if an audit row for this book_id was created
  -- in the last 2 seconds.
  if not exists (
    select 1 from public.audit_logs
    where action = 'BOOK_ADDED'
      and metadata->>'book_id' = new.id::text
      and created_at > now() - interval '2 seconds'
  ) then
    insert into public.audit_logs (user_id, action, description, metadata)
    values (
      auth.uid(),
      'BOOK_ADDED',
      format('Book added via direct insert: "%s"', new.title),
      jsonb_build_object('book_id', new.id, 'source', 'trigger')
    );
  end if;
  return new;
end;
$$;

drop trigger if exists books_after_insert on public.books;
create trigger books_after_insert
  after insert on public.books
  for each row execute function public.trg_books_after_insert();

-- ── books: audit on delete ────────────────────────────────────
create or replace function public.trg_books_after_delete()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.audit_logs
    where action = 'BOOK_DELETED'
      and metadata->>'book_id' = old.id::text
      and created_at > now() - interval '2 seconds'
  ) then
    insert into public.audit_logs (user_id, action, description, metadata)
    values (
      auth.uid(),
      'BOOK_DELETED',
      format('Book deleted: "%s" by %s', old.title, old.author),
      jsonb_build_object('book_id', old.id, 'title', old.title, 'source', 'trigger')
    );
  end if;
  return old;
end;
$$;

drop trigger if exists books_after_delete on public.books;
create trigger books_after_delete
  after delete on public.books
  for each row execute function public.trg_books_after_delete();

-- ── borrow_records: audit on insert ──────────────────────────
create or replace function public.trg_borrow_after_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.audit_logs
    where action = 'BOOK_BORROWED'
      and metadata->>'record_id' = new.id::text
      and created_at > now() - interval '2 seconds'
  ) then
    insert into public.audit_logs (user_id, action, description, metadata)
    values (
      auth.uid(),
      'BOOK_BORROWED',
      format('Borrow record created (due %s)', new.due_date),
      jsonb_build_object('record_id', new.id, 'book_id', new.book_id, 'source', 'trigger')
    );
  end if;
  return new;
end;
$$;

drop trigger if exists borrow_after_insert on public.borrow_records;
create trigger borrow_after_insert
  after insert on public.borrow_records
  for each row execute function public.trg_borrow_after_insert();

-- ── borrow_records: overdue auto-flag ────────────────────────
-- When a row's due_date passes, a status-check update triggers
-- this to keep overdue status accurate without a cron job.
create or replace function public.trg_borrow_overdue_check()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'active' and new.due_date < current_date then
    new.status := 'overdue';
  end if;
  return new;
end;
$$;

drop trigger if exists borrow_overdue_check on public.borrow_records;
create trigger borrow_overdue_check
  before update on public.borrow_records
  for each row execute function public.trg_borrow_overdue_check();

-- ── profiles: role change audit ───────────────────────────────
create or replace function public.trg_profile_role_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.role is distinct from new.role then
    if not exists (
      select 1 from public.audit_logs
      where action = 'USER_ROLE_CHANGED'
        and metadata->>'target_user_id' = new.id::text
        and created_at > now() - interval '2 seconds'
    ) then
      insert into public.audit_logs (user_id, action, description, metadata)
      values (
        auth.uid(),
        'USER_ROLE_CHANGED',
        format('Role changed from %s to %s for %s', old.role, new.role, new.email),
        jsonb_build_object(
          'target_user_id', new.id,
          'old_role', old.role,
          'new_role', new.role,
          'source', 'trigger'
        )
      );
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists profile_role_change on public.profiles;
create trigger profile_role_change
  after update on public.profiles
  for each row execute function public.trg_profile_role_change();

-- ── profiles: deactivation audit ─────────────────────────────
create or replace function public.trg_profile_active_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.is_active is distinct from new.is_active then
    if not exists (
      select 1 from public.audit_logs
      where action in ('USER_DISABLED', 'USER_ENABLED')
        and metadata->>'target_user_id' = new.id::text
        and created_at > now() - interval '2 seconds'
    ) then
      insert into public.audit_logs (user_id, action, description, metadata)
      values (
        auth.uid(),
        case when new.is_active then 'USER_ENABLED' else 'USER_DISABLED' end,
        format('User account %s: %s', case when new.is_active then 'enabled' else 'disabled' end, new.email),
        jsonb_build_object('target_user_id', new.id, 'source', 'trigger')
      );
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists profile_active_change on public.profiles;
create trigger profile_active_change
  after update on public.profiles
  for each row execute function public.trg_profile_active_change();
