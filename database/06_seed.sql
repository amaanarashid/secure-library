-- ============================================================
-- SecureLib — Seed Data
-- File: 06_seed.sql
-- Run LAST, after all schema, RLS, functions, views, triggers.
--
-- PURPOSE: Demo data for presentation and testing.
-- NOTE:    User accounts must be created through Supabase Auth
--          (Dashboard → Authentication → Users → Invite user).
--          After creating users in Auth, run the UPDATE statements
--          at the bottom to assign admin/librarian roles.
-- ============================================================

-- ── Sample Books ─────────────────────────────────────────────
insert into public.books (title, author, isbn, category, description, quantity, available_quantity) values
  ('Clean Code',                        'Robert C. Martin',        '9780132350884', 'Computer Science', 'A handbook of agile software craftsmanship covering coding standards and best practices.',          5, 5),
  ('The Pragmatic Programmer',           'David Thomas, Andrew Hunt','9780135957059', 'Computer Science', 'From journeyman to master — timeless advice for software developers.',                           4, 4),
  ('Design Patterns',                    'Gang of Four',            '9780201633610', 'Computer Science', 'Elements of reusable object-oriented software. The classic patterns reference.',                 3, 3),
  ('Introduction to Algorithms',         'Cormen et al.',           '9780262033848', 'Computer Science', 'Comprehensive textbook on algorithms used in universities worldwide.',                           6, 6),
  ('The Art of War',                     'Sun Tzu',                 '9780140439199', 'History',          'Ancient Chinese military treatise on strategy, tactics, and espionage.',                        10, 10),
  ('Sapiens: A Brief History of Humankind','Yuval Noah Harari',     '9780062316097', 'History',          'A survey of the history of humankind from the Stone Age to the modern era.',                   4, 4),
  ('1984',                               'George Orwell',           '9780451524935', 'Fiction',          'Dystopian social science fiction about surveillance, totalitarianism, and doublethink.',         8, 8),
  ('Brave New World',                    'Aldous Huxley',           '9780060850524', 'Fiction',          'A dystopian novel set in a futuristic World State of genetically modified citizens.',            5, 5),
  ('The Great Gatsby',                   'F. Scott Fitzgerald',     '9780743273565', 'Fiction',          'A portrait of the Jazz Age and the hollowness of the upper class in 1920s America.',             6, 6),
  ('Thinking, Fast and Slow',            'Daniel Kahneman',         '9780374533557', 'Psychology',       'Explores the two systems that drive the way we think: fast and intuitive vs. slow and logical.', 3, 3),
  ('Atomic Habits',                      'James Clear',             '9780735211292', 'Psychology',       'How tiny changes in behavior can lead to remarkable results over time.',                          7, 7),
  ('The Lean Startup',                   'Eric Ries',               '9780307887894', 'Business',         'How entrepreneurs use continuous innovation to create radically successful businesses.',           4, 4),
  ('Zero to One',                        'Peter Thiel',             '9780804139021', 'Business',         'Notes on startups and how to build the future by creating something truly new.',                  3, 3),
  ('A Brief History of Time',            'Stephen Hawking',         '9780553380163', 'Science',          'From the Big Bang to black holes — an accessible introduction to cosmology.',                    5, 5),
  ('The Selfish Gene',                   'Richard Dawkins',         '9780198788607', 'Science',          'Introduces the gene-centred view of evolution and popularises the concept of the meme.',         4, 4),
  ('Cybersecurity Essentials',           'Charles J. Brooks et al.','9781119362395', 'Computer Science', 'Foundational cybersecurity concepts for students and professionals.',                            6, 6),
  ('The Web Application Hacker''s Handbook','Dafydd Stuttard',      '9781118026472', 'Computer Science', 'Finding and exploiting security flaws in web applications.',                                    3, 3),
  ('Database System Concepts',           'Silberschatz et al.',     '9780078022159', 'Computer Science', 'Classic textbook covering database design, SQL, and system implementation.',                     5, 5),
  ('Network Security Essentials',        'William Stallings',       '9780134527338', 'Computer Science', 'Applications and standards covering all major network security tools.',                          4, 4),
  ('Operating System Concepts',          'Silberschatz et al.',     '9781119800330', 'Computer Science', 'The definitive textbook on OS principles used by universities worldwide.',                       7, 7)
on conflict (isbn) do nothing;

-- ============================================================
-- ROLE ASSIGNMENT
-- ============================================================
--
-- STEP 1: Create users in Supabase Auth
--   Dashboard → Authentication → Users → Add user (or Invite)
--   Create at minimum:
--     admin@securelib.com      (password: Admin@123456)
--     librarian@securelib.com  (password: Lib@123456)
--     student@securelib.com    (password: Student@123456)
--
-- STEP 2: After creation, run this block to assign roles.
--   Replace the emails if you used different ones.
--
-- update public.profiles
-- set role = 'admin'
-- where email = 'admin@securelib.com';
--
-- update public.profiles
-- set role = 'librarian'
-- where email = 'librarian@securelib.com';
--
-- (student@securelib.com keeps the default 'student' role)
--
-- ============================================================
