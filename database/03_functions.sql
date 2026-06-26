-- ============================================================
-- SecureLib — PostgreSQL RPC Functions
-- File: 03_functions.sql
-- Run after 02_rls.sql
--
-- All functions use SECURITY DEFINER to run as the function owner
-- (bypassing RLS where needed) but validate the caller's role first.
-- set search_path = public prevents schema injection.
-- ============================================================

-- ── Internal audit helper ─────────────────────────────────────
create or replace function public._log_audit(
  p_action      text,
  p_description text,
  p_metadata    jsonb default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.audit_logs (user_id, action, description, metadata)
  values (auth.uid(), p_action, p_description, p_metadata);
end;
$$;

-- ============================================================
-- FUNCTION: create_audit_log (public-facing alias)
-- ============================================================
create or replace function public.create_audit_log(
  p_action      text,
  p_description text,
  p_metadata    jsonb default null
)
returns table(success boolean)
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public._log_audit(p_action, p_description, p_metadata);
  return query select true;
exception when others then
  return query select false;
end;
$$;

-- ============================================================
-- TRIGGER: Auto-create profile on auth.users insert
-- ============================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email,
    'student'
  );

  insert into public.audit_logs (user_id, action, description)
  values (new.id, 'USER_REGISTERED', 'New user account created: ' || new.email);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- FUNCTION: get_dashboard_stats
-- ============================================================
create or replace function public.get_dashboard_stats()
returns table(
  total_books             bigint,
  total_users             bigint,
  active_borrows          bigint,
  overdue_books           bigint,
  books_added_this_month  bigint,
  new_users_this_month    bigint,
  available_books         bigint,
  total_borrow_records    bigint
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text := get_current_user_role();
begin
  if v_role is null then
    raise exception 'Unauthorized';
  end if;

  -- Update overdue records before counting
  update public.borrow_records
  set status = 'overdue'
  where status = 'active' and due_date < current_date;

  return query
  select
    (select count(*) from public.books)::bigint,
    (select count(*) from public.profiles where is_active)::bigint,
    (select count(*) from public.borrow_records where status = 'active')::bigint,
    (select count(*) from public.borrow_records where status = 'overdue')::bigint,
    (select count(*) from public.books where created_at >= date_trunc('month', now()))::bigint,
    (select count(*) from public.profiles where created_at >= date_trunc('month', now()))::bigint,
    (select coalesce(sum(available_quantity), 0) from public.books)::bigint,
    (select count(*) from public.borrow_records)::bigint;
end;
$$;

-- ============================================================
-- FUNCTION: search_books
-- ============================================================
create or replace function public.search_books(
  p_search         text    default null,
  p_category       text    default null,
  p_available_only boolean default null,
  p_limit          integer default 10,
  p_offset         integer default 0
)
returns table(
  id                 uuid,
  title              text,
  author             text,
  isbn               text,
  category           text,
  description        text,
  quantity           integer,
  available_quantity integer,
  status             text,
  total_count        bigint
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if get_current_user_role() is null then
    raise exception 'Unauthorized';
  end if;

  return query
  select
    b.id, b.title, b.author, b.isbn, b.category, b.description,
    b.quantity, b.available_quantity,
    case when b.available_quantity > 0 then 'available' else 'unavailable' end,
    count(*) over()
  from public.books b
  where
    (p_search is null or (
      to_tsvector('english', b.title || ' ' || b.author || coalesce(' ' || b.isbn, ''))
      @@ plainto_tsquery('english', p_search)
    ))
    and (p_category is null or b.category = p_category)
    and (p_available_only is null or (p_available_only = true and b.available_quantity > 0))
  order by b.created_at desc
  limit p_limit offset p_offset;
end;
$$;

-- ============================================================
-- FUNCTION: borrow_book
-- Atomic: validates stock, creates record, decrements quantity, logs audit
-- ============================================================
create or replace function public.borrow_book(p_book_id uuid)
returns table(success boolean, message text, record_id uuid)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id      uuid := auth.uid();
  v_role         text := get_current_user_role();
  v_book         record;
  v_active_count integer;
  v_record_id    uuid;
begin
  -- Auth check
  if v_role is null then
    return query select false, 'Unauthorized', null::uuid; return;
  end if;

  -- Get book with lock to prevent race conditions
  select * into v_book from public.books where id = p_book_id for update;

  if not found then
    return query select false, 'Book not found', null::uuid; return;
  end if;

  if v_book.available_quantity <= 0 then
    return query select false, 'Book is not available', null::uuid; return;
  end if;

  -- Check active borrow limit
  select count(*) into v_active_count
  from public.borrow_records
  where user_id = v_user_id and status in ('active', 'overdue');

  if v_active_count >= 3 then
    return query select false, 'Maximum active borrows (3) reached', null::uuid; return;
  end if;

  -- Check not already borrowing this book
  if exists (
    select 1 from public.borrow_records
    where book_id = p_book_id and user_id = v_user_id and status in ('active', 'overdue')
  ) then
    return query select false, 'You already have this book borrowed', null::uuid; return;
  end if;

  -- Create borrow record
  insert into public.borrow_records (book_id, user_id, borrow_date, due_date, status)
  values (p_book_id, v_user_id, current_date, current_date + interval '14 days', 'active')
  returning id into v_record_id;

  -- Decrement available stock
  update public.books
  set available_quantity = available_quantity - 1, updated_at = now()
  where id = p_book_id;

  -- Audit log
  perform public._log_audit(
    'BOOK_BORROWED',
    format('Borrowed "%s" (due %s)', v_book.title, current_date + interval '14 days'),
    jsonb_build_object('book_id', p_book_id, 'record_id', v_record_id)
  );

  return query select true, 'Book borrowed successfully', v_record_id;
end;
$$;

-- ============================================================
-- FUNCTION: return_book
-- ============================================================
create or replace function public.return_book(p_record_id uuid)
returns table(success boolean, message text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_role    text := get_current_user_role();
  v_record  record;
begin
  if v_role is null then
    return query select false, 'Unauthorized'; return;
  end if;

  select br.*, b.title as book_title
  into v_record
  from public.borrow_records br
  join public.books b on b.id = br.book_id
  where br.id = p_record_id
  for update;

  if not found then
    return query select false, 'Borrow record not found'; return;
  end if;

  -- Students can only return their own books
  if v_role = 'student' and v_record.user_id != v_user_id then
    return query select false, 'Unauthorized'; return;
  end if;

  if v_record.status = 'returned' then
    return query select false, 'Book already returned'; return;
  end if;

  -- Mark as returned
  update public.borrow_records
  set status = 'returned', return_date = current_date
  where id = p_record_id;

  -- Increment stock
  update public.books
  set available_quantity = available_quantity + 1, updated_at = now()
  where id = v_record.book_id;

  perform public._log_audit(
    'BOOK_RETURNED',
    format('Returned "%s"', v_record.book_title),
    jsonb_build_object('book_id', v_record.book_id, 'record_id', p_record_id)
  );

  return query select true, 'Book returned successfully';
end;
$$;

-- ============================================================
-- FUNCTION: add_book_secure
-- ============================================================
create or replace function public.add_book_secure(
  p_title       text,
  p_author      text,
  p_isbn        text,
  p_category    text,
  p_description text,
  p_quantity    integer
)
returns table(success boolean, message text, book_id uuid)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role    text := get_current_user_role();
  v_book_id uuid;
begin
  if v_role not in ('admin', 'librarian') then
    return query select false, 'Insufficient permissions', null::uuid; return;
  end if;

  if p_quantity < 1 then
    return query select false, 'Quantity must be at least 1', null::uuid; return;
  end if;

  insert into public.books (title, author, isbn, category, description, quantity, available_quantity)
  values (trim(p_title), trim(p_author), nullif(trim(p_isbn), ''), p_category, nullif(trim(p_description), ''), p_quantity, p_quantity)
  returning id into v_book_id;

  perform public._log_audit(
    'BOOK_ADDED',
    format('Added book: "%s" by %s (qty: %s)', p_title, p_author, p_quantity),
    jsonb_build_object('book_id', v_book_id)
  );

  return query select true, 'Book added successfully', v_book_id;
end;
$$;

-- ============================================================
-- FUNCTION: update_book_secure
-- ============================================================
create or replace function public.update_book_secure(
  p_book_id     uuid,
  p_title       text,
  p_author      text,
  p_isbn        text,
  p_category    text,
  p_description text,
  p_quantity    integer
)
returns table(success boolean, message text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role   text := get_current_user_role();
  v_book   record;
  v_delta  integer;
begin
  if v_role not in ('admin', 'librarian') then
    return query select false, 'Insufficient permissions'; return;
  end if;

  select * into v_book from public.books where id = p_book_id for update;
  if not found then
    return query select false, 'Book not found'; return;
  end if;

  -- Adjust available quantity proportionally to quantity change
  v_delta := p_quantity - v_book.quantity;

  update public.books
  set
    title              = trim(p_title),
    author             = trim(p_author),
    isbn               = nullif(trim(p_isbn), ''),
    category           = p_category,
    description        = nullif(trim(p_description), ''),
    quantity           = p_quantity,
    available_quantity = greatest(0, v_book.available_quantity + v_delta),
    updated_at         = now()
  where id = p_book_id;

  perform public._log_audit(
    'BOOK_UPDATED',
    format('Updated book: "%s"', p_title),
    jsonb_build_object('book_id', p_book_id)
  );

  return query select true, 'Book updated successfully';
end;
$$;

-- ============================================================
-- FUNCTION: delete_book_secure
-- ============================================================
create or replace function public.delete_book_secure(p_book_id uuid)
returns table(success boolean, message text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text := get_current_user_role();
  v_book record;
begin
  if v_role != 'admin' then
    return query select false, 'Only admins can delete books'; return;
  end if;

  select * into v_book from public.books where id = p_book_id;
  if not found then
    return query select false, 'Book not found'; return;
  end if;

  if exists (select 1 from public.borrow_records where book_id = p_book_id and status in ('active', 'overdue')) then
    return query select false, 'Cannot delete a book with active borrows'; return;
  end if;

  perform public._log_audit(
    'BOOK_DELETED',
    format('Deleted book: "%s" by %s', v_book.title, v_book.author),
    jsonb_build_object('book_id', p_book_id, 'title', v_book.title)
  );

  delete from public.books where id = p_book_id;

  return query select true, 'Book deleted successfully';
end;
$$;

-- ============================================================
-- FUNCTION: get_user_permissions
-- ============================================================
create or replace function public.get_user_permissions()
returns table(
  user_id             uuid,
  role                text,
  can_manage_books    boolean,
  can_manage_users    boolean,
  can_view_audit_logs boolean,
  can_borrow_books    boolean,
  can_view_all_borrows boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text := get_current_user_role();
begin
  return query
  select
    auth.uid(),
    v_role,
    v_role in ('admin', 'librarian'),
    v_role = 'admin',
    v_role = 'admin',
    v_role is not null,
    v_role in ('admin', 'librarian');
end;
$$;

-- ============================================================
-- FUNCTION: update_profile_secure
-- ============================================================
create or replace function public.update_profile_secure(p_full_name text)
returns table(success boolean, message text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    return query select false, 'Unauthorized'; return;
  end if;

  if length(trim(p_full_name)) < 2 then
    return query select false, 'Name must be at least 2 characters'; return;
  end if;

  update public.profiles
  set full_name = trim(p_full_name), updated_at = now()
  where id = v_uid;

  perform public._log_audit('PROFILE_UPDATED', 'Profile name updated');

  return query select true, 'Profile updated';
end;
$$;

-- ============================================================
-- FUNCTION: change_user_role
-- ============================================================
create or replace function public.change_user_role(p_user_id uuid, p_new_role text)
returns table(success boolean, message text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role     text := get_current_user_role();
  v_old_role text;
begin
  if v_role != 'admin' then
    return query select false, 'Only admins can change roles'; return;
  end if;

  if p_user_id = auth.uid() then
    return query select false, 'Cannot change your own role'; return;
  end if;

  if p_new_role not in ('admin', 'librarian', 'student') then
    return query select false, 'Invalid role'; return;
  end if;

  select role::text into v_old_role from public.profiles where id = p_user_id;

  update public.profiles set role = p_new_role::user_role, updated_at = now()
  where id = p_user_id;

  perform public._log_audit(
    'USER_ROLE_CHANGED',
    format('Changed user role from %s to %s', v_old_role, p_new_role),
    jsonb_build_object('target_user_id', p_user_id, 'old_role', v_old_role, 'new_role', p_new_role)
  );

  return query select true, 'Role updated';
end;
$$;

-- ============================================================
-- FUNCTION: disable_user / enable_user
-- ============================================================
create or replace function public.disable_user(p_user_id uuid)
returns table(success boolean, message text)
language plpgsql
security definer
set search_path = public
as $$
begin
  if get_current_user_role() != 'admin' then
    return query select false, 'Only admins can disable users'; return;
  end if;

  if p_user_id = auth.uid() then
    return query select false, 'Cannot disable your own account'; return;
  end if;

  update public.profiles set is_active = false, updated_at = now() where id = p_user_id;
  perform public._log_audit('USER_DISABLED', 'User account disabled',
    jsonb_build_object('target_user_id', p_user_id));
  return query select true, 'User disabled';
end;
$$;

create or replace function public.enable_user(p_user_id uuid)
returns table(success boolean, message text)
language plpgsql
security definer
set search_path = public
as $$
begin
  if get_current_user_role() != 'admin' then
    return query select false, 'Only admins can enable users'; return;
  end if;

  update public.profiles set is_active = true, updated_at = now() where id = p_user_id;
  perform public._log_audit('USER_ENABLED', 'User account enabled',
    jsonb_build_object('target_user_id', p_user_id));
  return query select true, 'User enabled';
end;
$$;

-- ============================================================
-- FUNCTION: search_users
-- ============================================================
create or replace function public.search_users(
  p_search    text    default null,
  p_role      text    default null,
  p_is_active boolean default null,
  p_limit     integer default 10,
  p_offset    integer default 0
)
returns table(
  id          uuid,
  full_name   text,
  email       text,
  role        text,
  is_active   boolean,
  created_at  timestamptz,
  total_count bigint
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if get_current_user_role() != 'admin' then
    raise exception 'Unauthorized';
  end if;

  return query
  select
    p.id, p.full_name, p.email, p.role::text, p.is_active, p.created_at,
    count(*) over()
  from public.profiles p
  where
    (p_search is null or (
      lower(p.full_name) like '%' || lower(p_search) || '%'
      or lower(p.email) like '%' || lower(p_search) || '%'
    ))
    and (p_role is null or p.role::text = p_role)
    and (p_is_active is null or p.is_active = p_is_active)
  order by p.created_at desc
  limit p_limit offset p_offset;
end;
$$;

-- ============================================================
-- FUNCTION: get_recent_activity
-- ============================================================
create or replace function public.get_recent_activity(p_limit integer default 10)
returns table(
  id          uuid,
  action      text,
  description text,
  user_name   text,
  created_at  timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if get_current_user_role() is null then
    raise exception 'Unauthorized';
  end if;

  return query
  select
    al.id, al.action, al.description,
    p.full_name,
    al.created_at
  from public.audit_logs al
  left join public.profiles p on p.id = al.user_id
  order by al.created_at desc
  limit p_limit;
end;
$$;

-- ============================================================
-- FUNCTION: get_overdue_books
-- ============================================================
create or replace function public.get_overdue_books()
returns table(
  id          uuid,
  book_id     uuid,
  book_title  text,
  user_id     uuid,
  user_name   text,
  user_email  text,
  borrow_date date,
  due_date    date,
  days_overdue integer
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if get_current_user_role() not in ('admin', 'librarian') then
    raise exception 'Unauthorized';
  end if;

  -- Mark overdue first
  update public.borrow_records
  set status = 'overdue'
  where status = 'active' and due_date < current_date;

  return query
  select
    br.id, br.book_id, b.title,
    br.user_id, p.full_name, p.email,
    br.borrow_date, br.due_date,
    (current_date - br.due_date)::integer
  from public.borrow_records br
  join public.books    b on b.id = br.book_id
  join public.profiles p on p.id = br.user_id
  where br.status = 'overdue'
  order by br.due_date asc;
end;
$$;
