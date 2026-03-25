-- ============================================================
-- COMMUTI - Character SNS with RPG Elements
-- Supabase Schema
-- ============================================================

-- Enable required extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ============================================================
-- TABLES
-- ============================================================

-- Profiles (1:1 with auth.users, account = character)
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  handle text unique not null check (handle ~ '^[a-zA-Z0-9_]{2,30}$'),
  name text not null check (char_length(name) between 1 and 50),
  bio text check (char_length(bio) <= 500),
  avatar_url text,
  header_url text,
  halftone_url text,  -- half-body character illustration
  role text not null default 'user' check (role in ('user', 'admin')),
  is_private boolean not null default false,
  -- Character info
  char_age text,
  char_height text,
  char_job text,
  char_world text,
  char_keywords text[] default '{}',
  char_personality text,
  char_extras jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Character notices (char = in-character notice, owner = OOC/player notice)
create table if not exists public.character_notices (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null check (type in ('char', 'owner')),
  items jsonb not null default '[]',
  is_hidden boolean not null default false,
  updated_at timestamptz not null default now()
);
-- Each user has exactly one of each type
create unique index if not exists character_notices_user_type_idx on public.character_notices(user_id, type);

-- Character RPG stats
create table if not exists public.character_stats (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  str smallint not null default 10 check (str between 1 and 999),
  dex smallint not null default 10 check (dex between 1 and 999),
  int smallint not null default 10 check (int between 1 and 999),
  luk smallint not null default 10 check (luk between 1 and 999),
  hp int not null default 100 check (hp >= 0),
  max_hp int not null default 100 check (max_hp >= 1),
  mp int not null default 50 check (mp >= 0),
  max_mp int not null default 50 check (max_mp >= 0),
  level int not null default 1 check (level >= 1),
  exp int not null default 0 check (exp >= 0),
  updated_at timestamptz not null default now()
);

-- Posts
create table if not exists public.posts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  reply_to uuid references public.posts(id) on delete set null,
  content text check (char_length(content) <= 2000),
  is_pinned boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- At least content or media must exist (enforced in app logic)
  constraint posts_nonempty check (content is not null or true)  -- media checked separately
);

-- Post media attachments
create table if not exists public.post_media (
  id uuid primary key default uuid_generate_v4(),
  post_id uuid not null references public.posts(id) on delete cascade,
  type text not null check (type in ('image', 'video', 'link')),
  url text not null,
  thumb_url text,
  duration int check (duration > 0),   -- video seconds
  link_title text,
  link_desc text,
  sort_order smallint not null default 0
);

-- Likes
create table if not exists public.likes (
  user_id uuid references public.profiles(id) on delete cascade,
  post_id uuid references public.posts(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, post_id)
);

-- Reposts
create table if not exists public.reposts (
  user_id uuid references public.profiles(id) on delete cascade,
  post_id uuid references public.posts(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, post_id)
);

-- Follows (pending = follow request for private accounts)
create table if not exists public.follows (
  follower_id uuid references public.profiles(id) on delete cascade,
  following_id uuid references public.profiles(id) on delete cascade,
  status text not null default 'accepted' check (status in ('pending', 'accepted')),
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  constraint follows_no_self check (follower_id <> following_id)
);

-- Notifications
create table if not exists public.notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete cascade,
  type text not null check (type in ('like', 'repost', 'reply', 'follow', 'follow_request', 'follow_accept', 'mention')),
  post_id uuid references public.posts(id) on delete cascade,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

-- DM / Group channels
create table if not exists public.channels (
  id uuid primary key default uuid_generate_v4(),
  type text not null check (type in ('dm', 'group')),
  name text check (char_length(name) <= 100),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

-- Channel members
create table if not exists public.channel_members (
  channel_id uuid references public.channels(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  last_read_at timestamptz not null default now(),
  joined_at timestamptz not null default now(),
  primary key (channel_id, user_id)
);

-- Messages
create table if not exists public.messages (
  id uuid primary key default uuid_generate_v4(),
  channel_id uuid not null references public.channels(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  content text not null check (char_length(content) between 1 and 2000),
  created_at timestamptz not null default now()
);

-- Invite codes
create table if not exists public.invite_codes (
  id uuid primary key default uuid_generate_v4(),
  code text unique not null,
  created_by uuid references public.profiles(id) on delete set null,
  max_uses int not null default 1 check (max_uses >= 1),
  used_count int not null default 0 check (used_count >= 0),
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  constraint invite_not_over_used check (used_count <= max_uses)
);

-- Bot / command configurations
create table if not exists public.bot_configs (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  command text not null,  -- trigger string: "1d10", "전투", etc.
  type text not null check (type in ('dice', 'gacha', 'combat')),
  config jsonb not null default '{}',
  is_active boolean not null default true,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Gacha item pool items
create table if not exists public.gacha_items (
  id uuid primary key default uuid_generate_v4(),
  pool_id uuid not null references public.bot_configs(id) on delete cascade,
  name text not null,
  rarity text not null check (rarity in ('common', 'uncommon', 'rare', 'epic', 'legendary')),
  weight int not null default 100 check (weight >= 1),
  image_url text,
  description text,
  created_at timestamptz not null default now()
);

-- ============================================================
-- INDEXES
-- ============================================================

create index if not exists posts_user_id_idx on public.posts(user_id);
create index if not exists posts_reply_to_idx on public.posts(reply_to);
create index if not exists posts_created_at_idx on public.posts(created_at desc);
create index if not exists likes_post_id_idx on public.likes(post_id);
create index if not exists reposts_post_id_idx on public.reposts(post_id);
create index if not exists follows_following_id_idx on public.follows(following_id);
create index if not exists notifications_user_id_idx on public.notifications(user_id, created_at desc);
create index if not exists messages_channel_id_idx on public.messages(channel_id, created_at);

-- ============================================================
-- FUNCTIONS
-- ============================================================

-- Auto-update updated_at timestamp
create or replace function public.update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Create default profile records after signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
declare
  _handle text;
  _name text;
  _invite_code text;
begin
  _handle := new.raw_user_meta_data->>'handle';
  _name := new.raw_user_meta_data->>'name';
  _invite_code := new.raw_user_meta_data->>'invite_code';

  -- Validate and consume invite code
  if _invite_code is not null and _invite_code <> '' then
    update public.invite_codes
    set used_count = used_count + 1
    where code = _invite_code
      and used_count < max_uses
      and (expires_at is null or expires_at > now());
    if not found then
      raise exception 'Invalid or expired invite code';
    end if;
  end if;

  -- Create profile
  insert into public.profiles (id, handle, name)
  values (new.id, coalesce(_handle, 'user_' || substr(new.id::text, 1, 8)), coalesce(_name, 'New User'));

  -- Create default stats
  insert into public.character_stats (user_id) values (new.id);

  -- Create default notices
  insert into public.character_notices (user_id, type) values (new.id, 'char');
  insert into public.character_notices (user_id, type) values (new.id, 'owner');

  return new;
end;
$$;

-- Trigger: create profile on new user
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Triggers: auto update_updated_at
create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.update_updated_at();
create trigger posts_updated_at before update on public.posts
  for each row execute function public.update_updated_at();
create trigger character_stats_updated_at before update on public.character_stats
  for each row execute function public.update_updated_at();
create trigger character_notices_updated_at before update on public.character_notices
  for each row execute function public.update_updated_at();
create trigger bot_configs_updated_at before update on public.bot_configs
  for each row execute function public.update_updated_at();

-- Function: get post counts efficiently
create or replace function public.get_post_counts(post_ids uuid[])
returns table (post_id uuid, like_count bigint, reply_count bigint, repost_count bigint)
language sql stable as $$
  select
    p.id,
    count(distinct l.user_id) as like_count,
    count(distinct r2.id) as reply_count,
    count(distinct rp.user_id) as repost_count
  from unnest(post_ids) as p(id)
  left join public.likes l on l.post_id = p.id
  left join public.posts r2 on r2.reply_to = p.id
  left join public.reposts rp on rp.post_id = p.id
  group by p.id;
$$;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.profiles enable row level security;
alter table public.character_notices enable row level security;
alter table public.character_stats enable row level security;
alter table public.posts enable row level security;
alter table public.post_media enable row level security;
alter table public.likes enable row level security;
alter table public.reposts enable row level security;
alter table public.follows enable row level security;
alter table public.notifications enable row level security;
alter table public.channels enable row level security;
alter table public.channel_members enable row level security;
alter table public.messages enable row level security;
alter table public.invite_codes enable row level security;
alter table public.bot_configs enable row level security;
alter table public.gacha_items enable row level security;

-- Helper: check if requester follows the target (accepted)
create or replace function public.is_following(follower uuid, following uuid)
returns boolean language sql stable security definer as $$
  select exists (
    select 1 from public.follows
    where follower_id = follower and following_id = following and status = 'accepted'
  );
$$;

-- Helper: check if profile is accessible to requester
create or replace function public.can_view_profile(profile_id uuid)
returns boolean language sql stable security definer as $$
  select (
    -- own profile
    auth.uid() = profile_id
    -- public profile
    or not (select is_private from public.profiles where id = profile_id)
    -- private profile but following
    or public.is_following(auth.uid(), profile_id)
    -- admin can see all
    or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );
$$;

-- PROFILES
create policy "Profiles viewable by authenticated users" on public.profiles
  for select to authenticated using (true);
create policy "Users can insert own profile" on public.profiles
  for insert to authenticated with check (id = auth.uid());
create policy "Users can update own profile" on public.profiles
  for update to authenticated using (id = auth.uid());
create policy "Admins can update any profile" on public.profiles
  for update to authenticated using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- CHARACTER NOTICES
create policy "Notices viewable if profile viewable" on public.character_notices
  for select to authenticated using (public.can_view_profile(user_id) or not is_hidden);
create policy "Users manage own notices" on public.character_notices
  for all to authenticated using (user_id = auth.uid());

-- CHARACTER STATS
create policy "Stats viewable by authenticated" on public.character_stats
  for select to authenticated using (true);
create policy "Users manage own stats" on public.character_stats
  for all to authenticated using (user_id = auth.uid());
create policy "Admins manage any stats" on public.character_stats
  for all to authenticated using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- POSTS
create policy "Posts viewable if accessible" on public.posts
  for select to authenticated using (public.can_view_profile(user_id));
create policy "Users create own posts" on public.posts
  for insert to authenticated with check (user_id = auth.uid());
create policy "Users update own posts" on public.posts
  for update to authenticated using (user_id = auth.uid());
create policy "Users delete own posts" on public.posts
  for delete to authenticated using (user_id = auth.uid());
create policy "Admins delete any post" on public.posts
  for delete to authenticated using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- POST MEDIA
create policy "Media viewable with post" on public.post_media
  for select to authenticated using (
    exists (select 1 from public.posts p where p.id = post_id and public.can_view_profile(p.user_id))
  );
create policy "Users manage own post media" on public.post_media
  for all to authenticated using (
    exists (select 1 from public.posts p where p.id = post_id and p.user_id = auth.uid())
  );

-- LIKES
create policy "Likes viewable by authenticated" on public.likes
  for select to authenticated using (true);
create policy "Users manage own likes" on public.likes
  for all to authenticated using (user_id = auth.uid());

-- REPOSTS
create policy "Reposts viewable by authenticated" on public.reposts
  for select to authenticated using (true);
create policy "Users manage own reposts" on public.reposts
  for all to authenticated using (user_id = auth.uid());

-- FOLLOWS
create policy "Follows viewable by authenticated" on public.follows
  for select to authenticated using (follower_id = auth.uid() or following_id = auth.uid());
create policy "Users manage own follows" on public.follows
  for all to authenticated using (follower_id = auth.uid());

-- NOTIFICATIONS
create policy "Users view own notifications" on public.notifications
  for select to authenticated using (user_id = auth.uid());
create policy "System insert notifications" on public.notifications
  for insert to authenticated with check (true);
create policy "Users update own notifications" on public.notifications
  for update to authenticated using (user_id = auth.uid());

-- CHANNELS
create policy "Members view their channels" on public.channels
  for select to authenticated using (
    exists (select 1 from public.channel_members where channel_id = id and user_id = auth.uid())
  );
create policy "Authenticated can create channels" on public.channels
  for insert to authenticated with check (created_by = auth.uid());

-- CHANNEL MEMBERS
create policy "Members view channel members" on public.channel_members
  for select to authenticated using (
    exists (select 1 from public.channel_members cm where cm.channel_id = channel_id and cm.user_id = auth.uid())
  );
create policy "Users manage own membership" on public.channel_members
  for all to authenticated using (user_id = auth.uid());

-- MESSAGES
create policy "Members view channel messages" on public.messages
  for select to authenticated using (
    exists (select 1 from public.channel_members where channel_id = messages.channel_id and user_id = auth.uid())
  );
create policy "Members send messages" on public.messages
  for insert to authenticated with check (
    user_id = auth.uid() and
    exists (select 1 from public.channel_members where channel_id = messages.channel_id and user_id = auth.uid())
  );

-- INVITE CODES
create policy "Admins manage invite codes" on public.invite_codes
  for all to authenticated using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );
create policy "Anyone can validate invite codes" on public.invite_codes
  for select to anon, authenticated using (true);

-- BOT CONFIGS
create policy "All authenticated can view active bots" on public.bot_configs
  for select to authenticated using (is_active = true or
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );
create policy "Admins manage bot configs" on public.bot_configs
  for all to authenticated using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- GACHA ITEMS
create policy "All authenticated can view gacha items" on public.gacha_items
  for select to authenticated using (true);
create policy "Admins manage gacha items" on public.gacha_items
  for all to authenticated using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- ============================================================
-- STORAGE BUCKETS
-- ============================================================
-- Run these in Supabase Dashboard > Storage after creating the project:
--
-- insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true);
-- insert into storage.buckets (id, name, public) values ('headers', 'headers', true);
-- insert into storage.buckets (id, name, public) values ('halftones', 'halftones', true);
-- insert into storage.buckets (id, name, public) values ('post-media', 'post-media', true);
-- insert into storage.buckets (id, name, public) values ('gacha-items', 'gacha-items', true);
--
-- Storage RLS policies (also set in Dashboard):
-- create policy "Public read" on storage.objects for select using (bucket_id in ('avatars','headers','halftones','post-media','gacha-items'));
-- create policy "Auth upload own" on storage.objects for insert to authenticated with check (auth.uid()::text = (storage.foldername(name))[1]);
-- create policy "Auth update own" on storage.objects for update to authenticated using (auth.uid()::text = (storage.foldername(name))[1]);
-- create policy "Auth delete own" on storage.objects for delete to authenticated using (auth.uid()::text = (storage.foldername(name))[1]);
