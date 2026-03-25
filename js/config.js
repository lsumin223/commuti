// ============================================================
// Supabase Configuration
// Replace SUPABASE_URL and SUPABASE_ANON_KEY with your project values.
// Find them in: Supabase Dashboard > Project Settings > API
// ============================================================

const SUPABASE_URL = 'https://YOUR_PROJECT_ID.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY_HERE';

// Supabase client (imported via CDN in HTML)
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  realtime: {
    params: { eventsPerSecond: 10 },
  },
});

// Storage bucket names
const BUCKETS = {
  AVATARS: 'avatars',
  HEADERS: 'headers',
  HALFTONES: 'halftones',
  POST_MEDIA: 'post-media',
  GACHA_ITEMS: 'gacha-items',
};

// App settings
const APP = {
  NAME: 'COMMUTI',
  MAX_POST_LENGTH: 2000,
  MAX_BIO_LENGTH: 500,
  POSTS_PER_PAGE: 20,
  MESSAGES_PER_PAGE: 30,
};
