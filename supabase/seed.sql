-- ============================================================
-- COMMUTI - Seed Data
-- Run AFTER schema.sql and AFTER creating your first admin user
-- ============================================================

-- Default dice bot commands
insert into public.bot_configs (name, command, type, config, is_active) values
  ('기본 주사위 (d10)', '1d10', 'dice', '{"sides": 10, "count": 1}', true),
  ('기본 주사위 (d20)', '1d20', 'dice', '{"sides": 20, "count": 1}', true),
  ('스탯 주사위', '4d6drop1', 'dice', '{"sides": 6, "count": 4, "drop_lowest": 1}', true),
  ('기본 전투', '전투', 'combat', '{"turn_order": "initiative", "crit_range": 20}', true)
on conflict do nothing;

-- Note: Replace <ADMIN_USER_ID> with the actual UUID of your admin user
-- to set them as admin after registration:
--
-- update public.profiles set role = 'admin' where id = '<ADMIN_USER_ID>';
--
-- Or use email:
-- update public.profiles
--   set role = 'admin'
-- where id = (select id from auth.users where email = 'your@email.com');

-- Generate initial invite code (run after setting admin):
-- insert into public.invite_codes (code, created_by, max_uses)
--   values ('WELCOME2024', '<ADMIN_USER_ID>', 10);
