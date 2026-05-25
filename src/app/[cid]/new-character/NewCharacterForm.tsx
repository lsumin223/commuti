'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import PageHeader from '@/components/PageHeader';
import EmojiPicker from '@/components/EmojiPicker';
import { useSidebarStore } from '@/store/sidebar';

const PRESET_COLORS = [
  '#C4607A','#8B6FC4','#4A90D9','#7A9E8A','#D4874A','#6B6058',
];

export default function NewCharacterForm({ cid }: { cid: string }) {
  const router = useRouter();
  const refresh = useSidebarStore(s => s.refresh);
  const [catName, setCatName] = useState('');
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('');
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/sidebar').then(r => r.json()).then((cats: { id: string; name: string }[]) => {
      const c = cats.find(c => c.id === cid);
      if (c) setCatName(c.name);
    });
  }, [cid]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    const res = await fetch(`/api/categories/${cid}/characters`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim(), emoji, themeColor: color }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error); setLoading(false); return; }
    await refresh();
    router.push(`/${cid}/${data.id}/profile`);
  }

  return (
    <>
      <PageHeader breadcrumb={[
        { label: '대시보드', href: '/' },
        { label: catName || '…', href: `/${cid}` },
        { label: '캐릭터 추가' },
      ]} />
      <div className="p-6 max-w-md">
        <h2 className="text-lg font-bold text-text0 mb-6">새 캐릭터</h2>
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Emoji + Name */}
          <div className="flex items-start gap-4">
            <div>
              <div className="text-xs font-medium text-text1 mb-1.5">이모지</div>
              <EmojiPicker value={emoji} onChange={setEmoji} />
            </div>
            <div className="flex-1 pt-0.5">
              <label className="text-xs font-medium text-text1 block mb-1.5">캐릭터 이름 *</label>
              <input value={name} onChange={e => setName(e.target.value)}
                placeholder="예: 세리아, 카이엔"
                className="w-full px-3 py-2.5 rounded-btn border border-bd text-sm focus:outline-none focus:border-rose transition-colors"
                required />
            </div>
          </div>

          {/* Theme Color */}
          <div>
            <label className="text-xs font-medium text-text1 block mb-2">테마 컬러</label>
            <div className="flex gap-2.5">
              {PRESET_COLORS.map(c => (
                <button key={c} type="button" onClick={() => setColor(c)}
                  className="w-8 h-8 rounded-full transition-all"
                  style={{
                    background: c,
                    outline: color === c ? `3px solid ${c}` : 'none',
                    outlineOffset: '2px',
                  }} />
              ))}
            </div>
          </div>

          {/* Preview card */}
          <div className="flex items-center gap-3 p-4 rounded-card border border-bd overflow-hidden relative"
            style={{ background: color + '11' }}>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
              style={{ background: color + '33' }}>
              {emoji || '✦'}
            </div>
            <div>
              <div className="font-semibold text-sm text-text0">{name || '캐릭터 이름'}</div>
              <div className="text-xs text-text2 mt-0.5">프로필 · 세계관 · 비밀정보 · 단서 · 타임라인</div>
            </div>
          </div>

          {error && <p className="text-sm text-rose">{error}</p>}

          <div className="flex gap-3">
            <button type="button" onClick={() => router.back()}
              className="px-4 py-2 rounded-btn border border-bd text-sm text-text1 hover:bg-bg2 transition-colors">
              취소
            </button>
            <button type="submit" disabled={loading || !name.trim()}
              className="px-5 py-2 rounded-btn text-sm font-semibold text-white disabled:opacity-60"
              style={{ background: color }}>
              {loading ? '생성 중…' : '캐릭터 만들기'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
