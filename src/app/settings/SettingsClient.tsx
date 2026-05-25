'use client';

import { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';

export default function SettingsClient() {
  const { data: session } = useSession();
  const [nickname, setNickname] = useState(session?.user?.name ?? '');
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);

    if (newPw && newPw !== confirmPw) {
      setMsg({ type: 'err', text: '새 비밀번호가 일치하지 않습니다.' });
      return;
    }
    if (newPw && newPw.length < 6) {
      setMsg({ type: 'err', text: '비밀번호는 6자 이상이어야 합니다.' });
      return;
    }

    setSaving(true);
    const res = await fetch('/api/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...(nickname.trim() !== session?.user?.name && { nickname: nickname.trim() }),
        ...(newPw && { currentPassword: currentPw, newPassword: newPw }),
      }),
    });
    const data = await res.json();
    if (res.ok) {
      setMsg({ type: 'ok', text: '저장되었습니다.' });
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
    } else {
      setMsg({ type: 'err', text: data.error ?? '오류가 발생했습니다.' });
    }
    setSaving(false);
  };

  return (
    <div>
      <div className="px-6 py-5 border-b border-bd">
        <h1 className="text-sm font-semibold text-text0">설정</h1>
      </div>

      <div className="p-6 max-w-md space-y-8">
        {/* Account info */}
        <section>
          <h2 className="text-sm font-semibold text-text1 mb-4">계정 정보</h2>
          <div className="p-4 bg-bg1 rounded-xl border border-bd text-sm space-y-2">
            <div className="flex justify-between text-text1">
              <span className="text-text2">이메일</span>
              <span>{session?.user?.email}</span>
            </div>
            <div className="flex justify-between text-text1">
              <span className="text-text2">닉네임</span>
              <span>{session?.user?.name}</span>
            </div>
          </div>
        </section>

        {/* Edit form */}
        <section>
          <h2 className="text-sm font-semibold text-text1 mb-4">정보 수정</h2>
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-xs text-text2 mb-1.5">닉네임</label>
              <input
                value={nickname}
                onChange={e => setNickname(e.target.value)}
                className="w-full px-3 py-2 border border-bd rounded-lg text-sm text-text0 bg-bg focus:outline-none focus:border-rose"
              />
            </div>

            <div className="border-t border-bd pt-4">
              <p className="text-xs text-text2 mb-3">비밀번호 변경 (선택)</p>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-text2 mb-1.5">현재 비밀번호</label>
                  <input
                    type="password"
                    value={currentPw}
                    onChange={e => setCurrentPw(e.target.value)}
                    placeholder="변경 시 입력"
                    className="w-full px-3 py-2 border border-bd rounded-lg text-sm text-text0 bg-bg focus:outline-none focus:border-rose"
                  />
                </div>
                <div>
                  <label className="block text-xs text-text2 mb-1.5">새 비밀번호</label>
                  <input
                    type="password"
                    value={newPw}
                    onChange={e => setNewPw(e.target.value)}
                    placeholder="6자 이상"
                    className="w-full px-3 py-2 border border-bd rounded-lg text-sm text-text0 bg-bg focus:outline-none focus:border-rose"
                  />
                </div>
                <div>
                  <label className="block text-xs text-text2 mb-1.5">새 비밀번호 확인</label>
                  <input
                    type="password"
                    value={confirmPw}
                    onChange={e => setConfirmPw(e.target.value)}
                    className="w-full px-3 py-2 border border-bd rounded-lg text-sm text-text0 bg-bg focus:outline-none focus:border-rose"
                  />
                </div>
              </div>
            </div>

            {msg && (
              <p className={`text-xs ${msg.type === 'ok' ? 'text-sage' : 'text-rose'}`}>
                {msg.type === 'ok' ? '✓ ' : '✗ '}{msg.text}
              </p>
            )}

            <button
              type="submit"
              disabled={saving}
              className="w-full py-2 bg-rose text-white text-sm font-medium rounded-lg hover:bg-rose/80 disabled:opacity-50 transition-colors"
            >
              {saving ? '저장 중…' : '저장'}
            </button>
          </form>
        </section>

        {/* Danger zone */}
        <section>
          <h2 className="text-sm font-semibold text-text1 mb-4">계정</h2>
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="w-full py-2 border border-bd text-text1 text-sm rounded-lg hover:bg-bg1 transition-colors"
          >
            로그아웃
          </button>
        </section>
      </div>
    </div>
  );
}
