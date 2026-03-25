// ============================================================
// Database API Layer
// ============================================================

const API = (() => {

  // ── PROFILES ────────────────────────────────────────────

  async function getProfile(handle) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('handle', handle)
      .single();
    if (error) throw error;
    return data;
  }

  async function getProfileById(id) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  }

  async function updateProfile(userId, updates) {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async function searchProfiles(query) {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, handle, name, avatar_url, char_job, is_private')
      .or(`handle.ilike.%${query}%,name.ilike.%${query}%`)
      .limit(20);
    if (error) throw error;
    return data;
  }

  // ── CHARACTER DATA ───────────────────────────────────────

  async function getCharacterStats(userId) {
    const { data, error } = await supabase
      .from('character_stats')
      .select('*')
      .eq('user_id', userId)
      .single();
    if (error) throw error;
    return data;
  }

  async function updateCharacterStats(userId, updates) {
    const { data, error } = await supabase
      .from('character_stats')
      .update(updates)
      .eq('user_id', userId)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async function getCharacterNotices(userId) {
    const { data, error } = await supabase
      .from('character_notices')
      .select('*')
      .eq('user_id', userId);
    if (error) throw error;
    return data;
  }

  async function upsertCharacterNotice(userId, type, items) {
    const { data, error } = await supabase
      .from('character_notices')
      .upsert({ user_id: userId, type, items }, { onConflict: 'user_id,type' })
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  // ── STORAGE ──────────────────────────────────────────────

  async function uploadFile(bucket, path, file) {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, { upsert: true });
    if (error) throw error;
    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(data.path);
    return urlData.publicUrl;
  }

  async function deleteFile(bucket, path) {
    const { error } = await supabase.storage.from(bucket).remove([path]);
    if (error) throw error;
  }

  // ── POSTS ─────────────────────────────────────────────────

  async function getFeed(userId, cursor = null) {
    // Posts from followed users + self
    let q = supabase
      .from('posts')
      .select(`
        *,
        author:profiles!posts_user_id_fkey(id, handle, name, avatar_url, is_private),
        media:post_media(*)
      `)
      .is('reply_to', null)
      .or(`user_id.eq.${userId},user_id.in.(${
        supabase.from('follows')
          .select('following_id')
          .eq('follower_id', userId)
          .eq('status', 'accepted')
      })`)
      .order('created_at', { ascending: false })
      .limit(APP.POSTS_PER_PAGE);

    // Use cursor-based pagination via RPC instead of complex subquery
    if (cursor) q = q.lt('created_at', cursor);
    const { data, error } = await q;
    if (error) throw error;
    return data;
  }

  async function getFeedSimple(userId, cursor = null) {
    // Get following list first
    const { data: followData } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', userId)
      .eq('status', 'accepted');

    const followingIds = (followData || []).map(f => f.following_id);
    followingIds.push(userId);

    let q = supabase
      .from('posts')
      .select(`
        *,
        author:profiles!posts_user_id_fkey(id, handle, name, avatar_url, halftone_url, is_private),
        media:post_media(*)
      `)
      .is('reply_to', null)
      .in('user_id', followingIds)
      .order('created_at', { ascending: false })
      .limit(APP.POSTS_PER_PAGE);

    if (cursor) q = q.lt('created_at', cursor);
    const { data, error } = await q;
    if (error) throw error;
    return data;
  }

  async function getExplorePosts(cursor = null) {
    // Public posts only
    let q = supabase
      .from('posts')
      .select(`
        *,
        author:profiles!posts_user_id_fkey(id, handle, name, avatar_url, is_private),
        media:post_media(*)
      `)
      .is('reply_to', null)
      .order('created_at', { ascending: false })
      .limit(APP.POSTS_PER_PAGE);
    if (cursor) q = q.lt('created_at', cursor);
    const { data, error } = await q;
    if (error) throw error;
    // Filter private profiles
    return (data || []).filter(p => !p.author?.is_private);
  }

  async function getProfilePosts(userId, cursor = null) {
    let q = supabase
      .from('posts')
      .select(`
        *,
        author:profiles!posts_user_id_fkey(id, handle, name, avatar_url, is_private),
        media:post_media(*)
      `)
      .eq('user_id', userId)
      .is('reply_to', null)
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(APP.POSTS_PER_PAGE);
    if (cursor) q = q.lt('created_at', cursor);
    const { data, error } = await q;
    if (error) throw error;
    return data;
  }

  async function getPost(postId) {
    const { data, error } = await supabase
      .from('posts')
      .select(`
        *,
        author:profiles!posts_user_id_fkey(id, handle, name, avatar_url, halftone_url, is_private),
        media:post_media(*),
        parent:posts!reply_to(
          *,
          author:profiles!posts_user_id_fkey(id, handle, name, avatar_url, is_private),
          media:post_media(*)
        )
      `)
      .eq('id', postId)
      .single();
    if (error) throw error;
    return data;
  }

  async function getReplies(postId) {
    const { data, error } = await supabase
      .from('posts')
      .select(`
        *,
        author:profiles!posts_user_id_fkey(id, handle, name, avatar_url, is_private),
        media:post_media(*)
      `)
      .eq('reply_to', postId)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return data;
  }

  async function createPost({ userId, content, replyTo = null, mediaFiles = [] }) {
    const { data: post, error } = await supabase
      .from('posts')
      .insert({ user_id: userId, content, reply_to: replyTo })
      .select()
      .single();
    if (error) throw error;

    // Upload and attach media
    for (let i = 0; i < mediaFiles.length; i++) {
      const mf = mediaFiles[i];
      const ext = mf.file.name.split('.').pop();
      const path = `${userId}/${post.id}/${i}.${ext}`;
      const url = await uploadFile(BUCKETS.POST_MEDIA, path, mf.file);
      await supabase.from('post_media').insert({
        post_id: post.id,
        type: mf.type || 'image',
        url,
        sort_order: i,
      });
    }

    // Create notification if it's a reply
    if (replyTo) {
      const { data: parentPost } = await supabase
        .from('posts')
        .select('user_id')
        .eq('id', replyTo)
        .single();
      if (parentPost && parentPost.user_id !== userId) {
        await createNotification({
          userId: parentPost.user_id,
          actorId: userId,
          type: 'reply',
          postId: post.id,
        });
      }
    }

    return post;
  }

  async function deletePost(postId) {
    const { error } = await supabase.from('posts').delete().eq('id', postId);
    if (error) throw error;
  }

  async function pinPost(postId, userId) {
    // Unpin all existing pins
    await supabase.from('posts').update({ is_pinned: false }).eq('user_id', userId).eq('is_pinned', true);
    // Pin this post
    const { error } = await supabase.from('posts').update({ is_pinned: true }).eq('id', postId);
    if (error) throw error;
  }

  async function getPostCounts(postIds) {
    if (!postIds.length) return {};
    const counts = {};
    await Promise.all(postIds.map(async (id) => {
      const [{ count: likes }, { count: replies }, { count: reposts }] = await Promise.all([
        supabase.from('likes').select('*', { count: 'exact', head: true }).eq('post_id', id),
        supabase.from('posts').select('*', { count: 'exact', head: true }).eq('reply_to', id),
        supabase.from('reposts').select('*', { count: 'exact', head: true }).eq('post_id', id),
      ]);
      counts[id] = { likes: likes || 0, replies: replies || 0, reposts: reposts || 0 };
    }));
    return counts;
  }

  // ── LIKES / REPOSTS ──────────────────────────────────────

  async function getLikedPosts(userId, postIds) {
    if (!postIds.length) return new Set();
    const { data } = await supabase
      .from('likes')
      .select('post_id')
      .eq('user_id', userId)
      .in('post_id', postIds);
    return new Set((data || []).map(l => l.post_id));
  }

  async function getRepostedPosts(userId, postIds) {
    if (!postIds.length) return new Set();
    const { data } = await supabase
      .from('reposts')
      .select('post_id')
      .eq('user_id', userId)
      .in('post_id', postIds);
    return new Set((data || []).map(r => r.post_id));
  }

  async function toggleLike(userId, postId) {
    const { data: existing } = await supabase
      .from('likes')
      .select('post_id')
      .eq('user_id', userId)
      .eq('post_id', postId)
      .maybeSingle();

    if (existing) {
      await supabase.from('likes').delete().eq('user_id', userId).eq('post_id', postId);
      return false;
    } else {
      await supabase.from('likes').insert({ user_id: userId, post_id: postId });
      // Notify post author
      const { data: post } = await supabase.from('posts').select('user_id').eq('id', postId).single();
      if (post && post.user_id !== userId) {
        await createNotification({ userId: post.user_id, actorId: userId, type: 'like', postId });
      }
      return true;
    }
  }

  async function toggleRepost(userId, postId) {
    const { data: existing } = await supabase
      .from('reposts')
      .select('post_id')
      .eq('user_id', userId)
      .eq('post_id', postId)
      .maybeSingle();

    if (existing) {
      await supabase.from('reposts').delete().eq('user_id', userId).eq('post_id', postId);
      return false;
    } else {
      await supabase.from('reposts').insert({ user_id: userId, post_id: postId });
      const { data: post } = await supabase.from('posts').select('user_id').eq('id', postId).single();
      if (post && post.user_id !== userId) {
        await createNotification({ userId: post.user_id, actorId: userId, type: 'repost', postId });
      }
      return true;
    }
  }

  // ── FOLLOWS ───────────────────────────────────────────────

  async function getFollowStatus(followerId, followingId) {
    const { data } = await supabase
      .from('follows')
      .select('status')
      .eq('follower_id', followerId)
      .eq('following_id', followingId)
      .maybeSingle();
    return data?.status || null;
  }

  async function getFollowerCount(userId) {
    const { count } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('following_id', userId)
      .eq('status', 'accepted');
    return count || 0;
  }

  async function getFollowingCount(userId) {
    const { count } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', userId)
      .eq('status', 'accepted');
    return count || 0;
  }

  async function toggleFollow(followerId, followingId, isPrivate) {
    const existing = await getFollowStatus(followerId, followingId);

    if (existing) {
      await supabase.from('follows').delete()
        .eq('follower_id', followerId).eq('following_id', followingId);
      return null;
    } else {
      const status = isPrivate ? 'pending' : 'accepted';
      await supabase.from('follows').insert({ follower_id: followerId, following_id: followingId, status });
      const notifType = isPrivate ? 'follow_request' : 'follow';
      await createNotification({ userId: followingId, actorId: followerId, type: notifType });
      return status;
    }
  }

  async function acceptFollowRequest(followerId, followingId) {
    await supabase.from('follows')
      .update({ status: 'accepted' })
      .eq('follower_id', followerId)
      .eq('following_id', followingId);
    await createNotification({ userId: followerId, actorId: followingId, type: 'follow_accept' });
  }

  async function rejectFollowRequest(followerId, followingId) {
    await supabase.from('follows').delete()
      .eq('follower_id', followerId)
      .eq('following_id', followingId);
  }

  async function getPendingFollowRequests(userId) {
    const { data, error } = await supabase
      .from('follows')
      .select('follower_id, created_at, follower:profiles!follows_follower_id_fkey(id, handle, name, avatar_url)')
      .eq('following_id', userId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  }

  async function getFollowers(userId) {
    const { data, error } = await supabase
      .from('follows')
      .select('follower:profiles!follows_follower_id_fkey(id, handle, name, avatar_url, char_job)')
      .eq('following_id', userId)
      .eq('status', 'accepted');
    if (error) throw error;
    return (data || []).map(f => f.follower);
  }

  async function getFollowing(userId) {
    const { data, error } = await supabase
      .from('follows')
      .select('following:profiles!follows_following_id_fkey(id, handle, name, avatar_url, char_job)')
      .eq('follower_id', userId)
      .eq('status', 'accepted');
    if (error) throw error;
    return (data || []).map(f => f.following);
  }

  // ── NOTIFICATIONS ─────────────────────────────────────────

  async function createNotification({ userId, actorId, type, postId = null }) {
    // Avoid duplicate notifications (same actor, type, post within 1 hour)
    const { data: exists } = await supabase
      .from('notifications')
      .select('id')
      .eq('user_id', userId)
      .eq('actor_id', actorId)
      .eq('type', type)
      .eq('post_id', postId || '')
      .gt('created_at', new Date(Date.now() - 3600000).toISOString())
      .maybeSingle();
    if (exists) return;

    await supabase.from('notifications').insert({ user_id: userId, actor_id: actorId, type, post_id: postId });
  }

  async function getNotifications(userId, cursor = null) {
    let q = supabase
      .from('notifications')
      .select(`
        *,
        actor:profiles!notifications_actor_id_fkey(id, handle, name, avatar_url)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(30);
    if (cursor) q = q.lt('created_at', cursor);
    const { data, error } = await q;
    if (error) throw error;
    return data;
  }

  async function getUnreadNotificationCount(userId) {
    const { count } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .is('read_at', null);
    return count || 0;
  }

  async function markNotificationsRead(userId) {
    await supabase.from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('user_id', userId)
      .is('read_at', null);
  }

  // ── DM / CHANNELS ─────────────────────────────────────────

  async function getOrCreateDM(userId1, userId2) {
    // Find existing DM channel between these two users
    const { data: existing } = await supabase.rpc('get_dm_channel', {
      user1: userId1,
      user2: userId2,
    });
    if (existing) return existing;

    // Create new DM channel
    const { data: channel, error } = await supabase
      .from('channels')
      .insert({ type: 'dm', created_by: userId1 })
      .select()
      .single();
    if (error) throw error;

    await supabase.from('channel_members').insert([
      { channel_id: channel.id, user_id: userId1 },
      { channel_id: channel.id, user_id: userId2 },
    ]);
    return channel;
  }

  async function getOrCreateDMSimple(userId1, userId2) {
    // Get all DM channels for user1
    const { data: memberships1 } = await supabase
      .from('channel_members')
      .select('channel_id')
      .eq('user_id', userId1);

    if (memberships1?.length) {
      const channelIds = memberships1.map(m => m.channel_id);
      // Check if user2 is also in any of those channels (type dm)
      const { data: shared } = await supabase
        .from('channel_members')
        .select('channel_id, channel:channels!channel_members_channel_id_fkey(id, type)')
        .eq('user_id', userId2)
        .in('channel_id', channelIds);

      const dmChannel = shared?.find(s => s.channel?.type === 'dm');
      if (dmChannel) return dmChannel.channel;
    }

    // Create new
    const { data: channel, error } = await supabase
      .from('channels')
      .insert({ type: 'dm', created_by: userId1 })
      .select()
      .single();
    if (error) throw error;

    await supabase.from('channel_members').insert([
      { channel_id: channel.id, user_id: userId1 },
      { channel_id: channel.id, user_id: userId2 },
    ]);
    return channel;
  }

  async function createGroupChannel(name, creatorId, memberIds) {
    const { data: channel, error } = await supabase
      .from('channels')
      .insert({ type: 'group', name, created_by: creatorId })
      .select()
      .single();
    if (error) throw error;

    const members = [creatorId, ...memberIds].map(uid => ({ channel_id: channel.id, user_id: uid }));
    await supabase.from('channel_members').insert(members);
    return channel;
  }

  async function getMyChannels(userId) {
    const { data, error } = await supabase
      .from('channel_members')
      .select(`
        last_read_at,
        channel:channels(
          id, type, name, created_at,
          members:channel_members(
            user:profiles!channel_members_user_id_fkey(id, handle, name, avatar_url)
          )
        )
      `)
      .eq('user_id', userId)
      .order('joined_at', { ascending: false });
    if (error) throw error;
    return (data || []).map(m => ({ ...m.channel, last_read_at: m.last_read_at }));
  }

  async function getMessages(channelId, cursor = null) {
    let q = supabase
      .from('messages')
      .select(`
        *,
        author:profiles!messages_user_id_fkey(id, handle, name, avatar_url)
      `)
      .eq('channel_id', channelId)
      .order('created_at', { ascending: false })
      .limit(APP.MESSAGES_PER_PAGE);
    if (cursor) q = q.lt('created_at', cursor);
    const { data, error } = await q;
    if (error) throw error;
    return (data || []).reverse();
  }

  async function sendMessage(channelId, userId, content) {
    const { data, error } = await supabase
      .from('messages')
      .insert({ channel_id: channelId, user_id: userId, content })
      .select(`*, author:profiles!messages_user_id_fkey(id, handle, name, avatar_url)`)
      .single();
    if (error) throw error;
    // Update last_read_at
    await supabase.from('channel_members')
      .update({ last_read_at: new Date().toISOString() })
      .eq('channel_id', channelId)
      .eq('user_id', userId);
    return data;
  }

  async function updateLastRead(channelId, userId) {
    await supabase.from('channel_members')
      .update({ last_read_at: new Date().toISOString() })
      .eq('channel_id', channelId)
      .eq('user_id', userId);
  }

  // ── ADMIN ─────────────────────────────────────────────────

  async function getAllProfiles() {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, handle, name, avatar_url, role, created_at, is_private')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  }

  async function setUserRole(userId, role) {
    const { error } = await supabase.from('profiles').update({ role }).eq('id', userId);
    if (error) throw error;
  }

  async function getInviteCodes() {
    const { data, error } = await supabase
      .from('invite_codes')
      .select(`*, creator:profiles!invite_codes_created_by_fkey(handle, name)`)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  }

  async function createInviteCode({ code, maxUses = 1, expiresAt = null }) {
    const { data, error } = await supabase
      .from('invite_codes')
      .insert({ code: code.toUpperCase(), created_by: Auth.getUser().id, max_uses: maxUses, expires_at: expiresAt })
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async function deleteInviteCode(id) {
    const { error } = await supabase.from('invite_codes').delete().eq('id', id);
    if (error) throw error;
  }

  async function getBotConfigs() {
    const { data, error } = await supabase
      .from('bot_configs')
      .select('*')
      .order('created_at', { ascending: true });
    if (error) throw error;
    return data;
  }

  async function saveBotConfig(cfg) {
    if (cfg.id) {
      const { data, error } = await supabase
        .from('bot_configs')
        .update({ name: cfg.name, command: cfg.command, type: cfg.type, config: cfg.config, is_active: cfg.is_active })
        .eq('id', cfg.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    } else {
      const { data, error } = await supabase
        .from('bot_configs')
        .insert({ name: cfg.name, command: cfg.command, type: cfg.type, config: cfg.config, is_active: cfg.is_active, created_by: Auth.getUser().id })
        .select()
        .single();
      if (error) throw error;
      return data;
    }
  }

  async function deleteBotConfig(id) {
    const { error } = await supabase.from('bot_configs').delete().eq('id', id);
    if (error) throw error;
  }

  async function getGachaItems(poolId) {
    const { data, error } = await supabase
      .from('gacha_items')
      .select('*')
      .eq('pool_id', poolId)
      .order('rarity');
    if (error) throw error;
    return data;
  }

  async function saveGachaItem(item) {
    if (item.id) {
      const { data, error } = await supabase
        .from('gacha_items')
        .update({ name: item.name, rarity: item.rarity, weight: item.weight, description: item.description, image_url: item.image_url })
        .eq('id', item.id)
        .select().single();
      if (error) throw error;
      return data;
    } else {
      const { data, error } = await supabase
        .from('gacha_items')
        .insert({ pool_id: item.pool_id, name: item.name, rarity: item.rarity, weight: item.weight, description: item.description })
        .select().single();
      if (error) throw error;
      return data;
    }
  }

  async function deleteGachaItem(id) {
    const { error } = await supabase.from('gacha_items').delete().eq('id', id);
    if (error) throw error;
  }

  return {
    getProfile, getProfileById, updateProfile, searchProfiles,
    getCharacterStats, updateCharacterStats, getCharacterNotices, upsertCharacterNotice,
    uploadFile, deleteFile,
    getFeedSimple, getExplorePosts, getProfilePosts, getPost, getReplies,
    createPost, deletePost, pinPost, getPostCounts, getLikedPosts, getRepostedPosts,
    toggleLike, toggleRepost,
    getFollowStatus, getFollowerCount, getFollowingCount, toggleFollow,
    acceptFollowRequest, rejectFollowRequest, getPendingFollowRequests,
    getFollowers, getFollowing,
    createNotification, getNotifications, getUnreadNotificationCount, markNotificationsRead,
    getOrCreateDMSimple, createGroupChannel, getMyChannels, getMessages, sendMessage, updateLastRead,
    getAllProfiles, setUserRole,
    getInviteCodes, createInviteCode, deleteInviteCode,
    getBotConfigs, saveBotConfig, deleteBotConfig,
    getGachaItems, saveGachaItem, deleteGachaItem,
  };
})();
