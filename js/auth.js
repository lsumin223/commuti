// ============================================================
// Authentication
// ============================================================

const Auth = (() => {
  let _currentUser = null;
  let _currentProfile = null;

  // Get current session user
  async function init() {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      _currentUser = session.user;
      _currentProfile = await fetchProfile(session.user.id);
    }
    // Listen for auth state changes
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        _currentUser = session.user;
        _currentProfile = await fetchProfile(session.user.id);
        window.dispatchEvent(new CustomEvent('auth:signin', { detail: { user: _currentUser, profile: _currentProfile } }));
      } else if (event === 'SIGNED_OUT') {
        _currentUser = null;
        _currentProfile = null;
        window.dispatchEvent(new CustomEvent('auth:signout'));
      }
    });
    return { user: _currentUser, profile: _currentProfile };
  }

  async function fetchProfile(userId) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (error) { console.error('fetchProfile error:', error); return null; }
    return data;
  }

  // Register with invite code
  async function signUp({ email, password, handle, name, inviteCode }) {
    // Validate invite code first
    if (!inviteCode) throw new Error('초대코드가 필요합니다.');

    const { data: code, error: codeErr } = await supabase
      .from('invite_codes')
      .select('id, used_count, max_uses, expires_at')
      .eq('code', inviteCode.trim().toUpperCase())
      .single();

    if (codeErr || !code) throw new Error('유효하지 않은 초대코드입니다.');
    if (code.used_count >= code.max_uses) throw new Error('이미 사용된 초대코드입니다.');
    if (code.expires_at && new Date(code.expires_at) < new Date()) throw new Error('만료된 초대코드입니다.');

    // Check handle availability
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('handle', handle.toLowerCase())
      .maybeSingle();
    if (existing) throw new Error('이미 사용 중인 핸들입니다.');

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          handle: handle.toLowerCase(),
          name,
          invite_code: inviteCode.trim().toUpperCase(),
        },
      },
    });
    if (error) throw error;
    return data;
  }

  async function signIn({ email, password }) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }

  async function updatePassword(newPassword) {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
  }

  function getUser() { return _currentUser; }
  function getProfile() { return _currentProfile; }
  function isAdmin() { return _currentProfile?.role === 'admin'; }
  function isLoggedIn() { return !!_currentUser; }

  function setProfile(p) { _currentProfile = p; }

  return { init, signUp, signIn, signOut, updatePassword, getUser, getProfile, isAdmin, isLoggedIn, setProfile, fetchProfile };
})();
