'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import PageHeader from '@/components/PageHeader';
import EmojiPicker from '@/components/EmojiPicker';
import { useSidebarStore } from '@/store/sidebar';

const PRESET_COLORS = ['#C4607A','#8B6FC4','#4A90D9','#7A9E8A','#D4874A','#6B6058'];

interface Character {
  id: string; name: string; emoji: string | null;
  themeColor: string; category: { id: string; name: string };
}

export default function EditCharacterForm({ cid, charid }: { cid: string; charid: string }) {
  const router = useRouter();
  const refresh = useSidebarStore(s => s.refresh);
  const [char, setChar] = useState<Character | null>(null);
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('');
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/characters/${charid}`).then(r => r.json()).then((data: Character) => {
      setChar(data);
      setName(data.name);
      setEmoji(data.emoji || '');
      setColor(data.themeColor);
    });
  }, [charid]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    const res = await fetch(`/api/characters/${charid}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim(), emoji: emoji || null, themeColor: color }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error); setLoading(false); return; }
    await refresh();
    router.push(`/${cid}/${charid}/profile`);
  }

  if (!char) return <div className="p-6 text-text2 text-sm">불러오는 중…</div>;

  return (
    <>
      <PageHeader breadcrumb={[
        { label: '대시보드', href: '/' },
        { label: char.category.name, href: `/${cid}` },
        { label: char.name, href: `/${cid}/${charid}/profile` },
        { label: '편집' },
      ]} />
      <div className="p-6 max-w-md">
        <h2 className="text-lg font-bold text-text0 mb-6">캐릭터 편집</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex items-start gap-4">
            <div>
              <div className="text-xs font-medium text-text1 mb-1.5">이모지</div>
              <EmojiPicker value={emoji} onChange={setEmoji} />
            </div>
            <div className="flex-1 pt-0.5">
              <label className="text-xs font-medium text-text1 block mb-1.5">캐릭터 이름 *</label>
              <input value={name} onChange={e => setName(e.target.value)}
                className="w-full px-3 py-2.5 rounded-btn border border-bd text-sm focus:outline-none focus:border-rose transition-colors"
                required />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-text1 block mb-2">테마 컬러</label>
            <div className="flex gap-2.5">
              {PRESET_COLORS.map(c => (
                <button key={c} type="button" onClick={() => setColor(c)}
                  className="w-8 h-8 rounded-full"
                  style={{ background: c, outline: color === c ? `3px solid ${c}` : 'none', outlineOffset: '2px' }} />
              ))}
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
              {loading ? '저장 중…' : '저장'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
