'use client';

import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function LoginPage() {
  const router = useRouter();
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(''); setLoading(true);
    const fd = new FormData(e.currentTarget);
    const res = await signIn('credentials', {
      email: fd.get('email'), password: fd.get('password'), redirect: false,
    });
    setLoading(false);
    if (res?.error) setError('이메일 또는 비밀번호가 올바르지 않습니다.');
    else router.replace('/');
  }

  async function handleRegister(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(''); setLoading(true);
    const fd = new FormData(e.currentTarget);
    const pw = fd.get('password') as string;
    const pw2 = fd.get('password2') as string;
    if (pw !== pw2) { setError('비밀번호가 일치하지 않습니다.'); setLoading(false); return; }
    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: fd.get('email'), password: pw, nickname: fd.get('nickname') }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error); setLoading(false); return; }
    // Auto sign in
    await signIn('credentials', { email: fd.get('email'), password: pw, redirect: false });
    setLoading(false);
    router.replace('/');
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white text-xl font-bold mx-auto mb-3"
            style={{ background: 'linear-gradient(135deg, #C4607A, #8B6FC4)' }}>✦</div>
          <h1 className="font-bold text-xl text-text0">창작 스튜디오</h1>
          <p className="text-sm text-text2 mt-1">동인 창작 캐릭터 관리</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-card border border-bd p-6 shadow-sm">
          {/* Tabs */}
          <div className="flex gap-1 p-1 bg-bg1 rounded-btn mb-5">
            {(['login', 'register'] as const).map(t => (
              <button key={t} onClick={() => { setTab(t); setError(''); }}
                className={`flex-1 py-1.5 rounded-[8px] text-sm font-medium transition-all ${
                  tab === t ? 'bg-white shadow-sm text-text0' : 'text-text2 hover:text-text1'
                }`}>
                {t === 'login' ? '로그인' : '회원가입'}
              </button>
            ))}
          </div>

          {error && (
            <div className="text-sm text-rose bg-rose-xl border border-rose-l rounded-btn px-3 py-2 mb-4">
              {error}
            </div>
          )}

          {tab === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-3">
              <div>
                <label className="text-xs font-medium text-text1 mb-1 block">이메일</label>
                <input name="email" type="email" required placeholder="example@email.com"
                  className="w-full px-3 py-2 rounded-btn border border-bd text-sm focus:outline-none focus:border-rose transition-colors" />
              </div>
              <div>
                <label className="text-xs font-medium text-text1 mb-1 block">비밀번호</label>
                <input name="password" type="password" required placeholder="••••••••"
                  className="w-full px-3 py-2 rounded-btn border border-bd text-sm focus:outline-none focus:border-rose transition-colors" />
              </div>
              <button type="submit" disabled={loading}
                className="w-full py-2.5 rounded-btn text-sm font-semibold text-white mt-2 disabled:opacity-60 transition-opacity"
                style={{ background: '#C4607A' }}>
                {loading ? '로그인 중…' : '로그인'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-3">
              <div>
                <label className="text-xs font-medium text-text1 mb-1 block">닉네임</label>
                <input name="nickname" type="text" required placeholder="활동명"
                  className="w-full px-3 py-2 rounded-btn border border-bd text-sm focus:outline-none focus:border-rose transition-colors" />
              </div>
              <div>
                <label className="text-xs font-medium text-text1 mb-1 block">이메일</label>
                <input name="email" type="email" required placeholder="example@email.com"
                  className="w-full px-3 py-2 rounded-btn border border-bd text-sm focus:outline-none focus:border-rose transition-colors" />
              </div>
              <div>
                <label className="text-xs font-medium text-text1 mb-1 block">비밀번호</label>
                <input name="password" type="password" required placeholder="8자 이상" minLength={8}
                  className="w-full px-3 py-2 rounded-btn border border-bd text-sm focus:outline-none focus:border-rose transition-colors" />
              </div>
              <div>
                <label className="text-xs font-medium text-text1 mb-1 block">비밀번호 확인</label>
                <input name="password2" type="password" required placeholder="재입력"
                  className="w-full px-3 py-2 rounded-btn border border-bd text-sm focus:outline-none focus:border-rose transition-colors" />
              </div>
              <button type="submit" disabled={loading}
                className="w-full py-2.5 rounded-btn text-sm font-semibold text-white mt-2 disabled:opacity-60"
                style={{ background: '#C4607A' }}>
                {loading ? '가입 중…' : '가입하기'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
