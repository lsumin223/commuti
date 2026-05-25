'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import CharacterHeader from '@/components/CharacterHeader';
import CharacterNav from '@/components/CharacterNav';
import PageHeader from '@/components/PageHeader';
import { useSidebarStore } from '@/store/sidebar';

interface Character {
  id: string; name: string; emoji: string | null;
  themeColor: string; headImage: string | null;
  category: { id: string; name: string };
}

interface Props {
  cid: string;
  charid: string;
  children: React.ReactNode;
}

export default function CharacterLayoutClient({ cid, charid, children }: Props) {
  const router = useRouter();
  const refresh = useSidebarStore(s => s.refresh);
  const [character, setCharacter] = useState<Character | null>(null);
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    fetch(`/api/characters/${charid}`).then(r => r.json()).then(data => {
      if (data.error) router.replace('/');
      else setCharacter(data);
    });
  }, [charid, router]);

  const handleDelete = useCallback(async () => {
    if (!confirm(`'${character?.name}' 캐릭터를 삭제할까요? 모든 문서와 로그가 삭제됩니다.`)) return;
    await fetch(`/api/characters/${charid}`, { method: 'DELETE' });
    await refresh();
    router.replace(`/${cid}`);
  }, [character, charid, cid, refresh, router]);

  if (!character) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="w-5 h-5 border-2 border-rose border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      <PageHeader
        breadcrumb={[
          { label: '대시보드', href: '/' },
          { label: character.category.name, href: `/${cid}` },
          { label: character.name },
        ]}
        actions={
          <div className="relative">
            <button onClick={() => setShowMenu(o => !o)}
              className="w-8 h-8 rounded-btn flex items-center justify-center text-text2 hover:bg-bg2 transition-colors">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <circle cx="5" cy="12" r="1.2"/><circle cx="12" cy="12" r="1.2"/><circle cx="19" cy="12" r="1.2"/>
              </svg>
            </button>
            {showMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                <div className="absolute right-0 top-full mt-1 w-36 bg-white border border-bd rounded-card shadow-lg z-50 py-1">
                  <button onClick={() => { setShowMenu(false); router.push(`/${cid}/${charid}/edit`); }}
                    className="w-full px-3 py-2 text-sm text-left text-text1 hover:bg-bg1 transition-colors">
                    캐릭터 편집
                  </button>
                  <button onClick={() => { setShowMenu(false); handleDelete(); }}
                    className="w-full px-3 py-2 text-sm text-left text-rose hover:bg-rose-xl transition-colors">
                    삭제
                  </button>
                </div>
              </>
            )}
          </div>
        }
      />
      <CharacterHeader
        character={character}
        onUpdate={upd => setCharacter(c => c ? { ...c, ...upd } : c)}
      />
      <CharacterNav cid={cid} charid={charid} />
      <div>{children}</div>
    </>
  );
}
