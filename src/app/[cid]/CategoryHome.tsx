'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import PageHeader from '@/components/PageHeader';
import { useSidebarStore } from '@/store/sidebar';

interface Character {
  id: string; name: string; emoji: string | null; themeColor: string;
}
interface Category {
  id: string; name: string; color: string; characters: Character[];
}

const PRESET_COLORS = ['#C4607A','#8B6FC4','#4A90D9','#7A9E8A','#D4874A','#6B6058'];

export default function CategoryHome({ cid }: { cid: string }) {
  const router = useRouter();
  const refresh = useSidebarStore(s => s.refresh);
  const [cat, setCat] = useState<Category | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/sidebar').then(r => r.json()).then((cats: Category[]) => {
      const found = cats.find(c => c.id === cid);
      if (found) { setCat(found); setEditName(found.name); setEditColor(found.color); }
      else router.replace('/');
    });
  }, [cid, router]);

  async function handleSave() {
    if (!editName.trim()) return;
    setSaving(true);
    const res = await fetch(`/api/categories/${cid}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editName.trim(), color: editColor }),
    });
    if (res.ok) {
      const updated = await res.json();
      setCat(c => c ? { ...c, name: updated.name, color: updated.color } : c);
      await refresh();
      setEditing(false);
    }
    setSaving(false);
  }

  async function handleDelete() {
    if (!confirm(`'${cat?.name}' 카테고리를 삭제할까요? 모든 캐릭터와 문서가 삭제됩니다.`)) return;
    await fetch(`/api/categories/${cid}`, { method: 'DELETE' });
    await refresh();
    router.replace('/');
  }

  if (!cat) return <div className="p-6 text-text2 text-sm">불러오는 중…</div>;

  return (
    <>
      <PageHeader
        breadcrumb={[{ label: '대시보드', href: '/' }, { label: cat.name }]}
        actions={
          <div className="flex items-center gap-2">
            <button onClick={() => router.push(`/${cid}/new-character`)}
              className="px-3 py-1.5 rounded-btn text-sm font-semibold text-white"
              style={{ background: cat.color }}>
              + 캐릭터 추가
            </button>
            <div className="relative">
              <button onClick={() => setShowMenu(o => !o)}
                className="w-8 h-8 rounded-btn flex items-center justify-center text-text2 hover:bg-bg2">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                  <circle cx="5" cy="12" r="1.2"/><circle cx="12" cy="12" r="1.2"/><circle cx="19" cy="12" r="1.2"/>
                </svg>
              </button>
              {showMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                  <div className="absolute right-0 top-full mt-1 w-32 bg-white border border-bd rounded-card shadow-lg z-50 py-1">
                    <button onClick={() => { setShowMenu(false); setEditing(true); }}
                      className="w-full px-3 py-2 text-sm text-left text-text1 hover:bg-bg1">편집</button>
                    <button onClick={() => { setShowMenu(false); handleDelete(); }}
                      className="w-full px-3 py-2 text-sm text-left text-rose hover:bg-rose-xl">삭제</button>
                  </div>
                </>
              )}
            </div>
          </div>
        }
      />

      {/* Inline edit panel */}
      {editing && (
        <div className="px-6 py-4 border-b border-bd bg-bg1 flex items-center gap-4 flex-wrap">
          <input value={editName} onChange={e => setEditName(e.target.value)}
            className="px-3 py-1.5 rounded-btn border border-bd text-sm focus:outline-none focus:border-rose" />
          <div className="flex gap-2">
            {PRESET_COLORS.map(c => (
              <button key={c} type="button" onClick={() => setEditColor(c)}
                className="w-6 h-6 rounded-full"
                style={{ background: c, outline: editColor === c ? `2px solid ${c}` : 'none', outlineOffset: '2px' }} />
            ))}
          </div>
          <button onClick={handleSave} disabled={saving}
            className="px-3 py-1.5 rounded-btn text-sm font-semibold text-white disabled:opacity-60"
            style={{ background: editColor }}>
            {saving ? '저장 중…' : '저장'}
          </button>
          <button onClick={() => setEditing(false)}
            className="px-3 py-1.5 rounded-btn text-sm text-text1 border border-bd hover:bg-bg2">
            취소
          </button>
        </div>
      )}

      <div className="p-6">
        {cat.characters.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="text-3xl mb-3">✦</div>
            <p className="text-text1 font-medium mb-1">아직 캐릭터가 없습니다</p>
            <p className="text-text2 text-sm mb-5">첫 번째 캐릭터를 만들어 보세요.</p>
            <Link href={`/${cid}/new-character`}
              className="px-4 py-2 rounded-btn text-sm font-semibold text-white"
              style={{ background: cat.color }}>
              + 캐릭터 추가
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {cat.characters.map(char => (
              <Link key={char.id} href={`/${cid}/${char.id}`}
                className="flex flex-col items-center gap-2 p-5 rounded-card border border-bd bg-bg hover:border-bd2 hover:shadow-sm transition-all group">
                <div className="w-14 h-14 rounded-xl flex items-center justify-center text-3xl"
                  style={{ background: char.themeColor + '22' }}>
                  {char.emoji || '✦'}
                </div>
                <span className="text-sm font-medium text-text0 group-hover:text-rose transition-colors text-center">
                  {char.name}
                </span>
              </Link>
            ))}
            <Link href={`/${cid}/new-character`}
              className="flex flex-col items-center justify-center gap-2 p-5 rounded-card border border-dashed border-bd hover:border-rose hover:bg-rose-xl transition-all text-text2 hover:text-rose">
              <span className="text-3xl leading-none">+</span>
              <span className="text-xs">캐릭터 추가</span>
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
