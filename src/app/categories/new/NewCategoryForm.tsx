'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import PageHeader from '@/components/PageHeader';
import { useSidebarStore } from '@/store/sidebar';

const PRESET_COLORS = [
  '#C4607A', // 로즈
  '#8B6FC4', // 퍼플
  '#4A90D9', // 블루
  '#7A9E8A', // 세이지
  '#D4874A', // 오렌지
  '#6B6058', // 브라운
];

export default function NewCategoryForm() {
  const router = useRouter();
  const refresh = useSidebarStore(s => s.refresh);
  const [name, setName] = useState('');
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    const res = await fetch('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim(), color }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error); setLoading(false); return; }
    await refresh();
    router.push(`/${data.id}`);
  }

  return (
    <>
      <PageHeader breadcrumb={[{ label: '대시보드', href: '/' }, { label: '카테고리 추가' }]} />
      <div className="p-6 max-w-md">
        <h2 className="text-lg font-bold text-text0 mb-6">새 카테고리</h2>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="text-sm font-medium text-text1 block mb-1.5">카테고리 이름</label>
            <input value={name} onChange={e => setName(e.target.value)}
              placeholder="예: 판타지 세계관, 현대물, 오리지널"
              className="w-full px-3 py-2.5 rounded-btn border border-bd text-sm focus:outline-none focus:border-rose transition-colors"
              required />
          </div>
          <div>
            <label className="text-sm font-medium text-text1 block mb-2">색상</label>
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

          {/* Preview */}
          <div className="flex items-center gap-2 p-3 bg-bg1 rounded-card border border-bd">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
            <span className="text-sm text-text0 font-medium">{name || '카테고리 이름'}</span>
          </div>

          {error && <p className="text-sm text-rose">{error}</p>}

          <div className="flex gap-3">
            <button type="button" onClick={() => router.back()}
              className="px-4 py-2 rounded-btn border border-bd text-sm text-text1 hover:bg-bg2 transition-colors">
              취소
            </button>
            <button type="submit" disabled={loading || !name.trim()}
              className="px-5 py-2 rounded-btn text-sm font-semibold text-white disabled:opacity-60 transition-opacity"
              style={{ background: color }}>
              {loading ? '생성 중…' : '만들기'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
