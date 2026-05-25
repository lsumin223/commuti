'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import PageHeader from '@/components/PageHeader';

interface Character {
  id: string; name: string; emoji: string | null; themeColor: string;
}
interface Category {
  id: string; name: string; color: string; characters: Character[];
}

export default function CategoryHome({ cid }: { cid: string }) {
  const router = useRouter();
  const [cat, setCat] = useState<Category | null>(null);

  useEffect(() => {
    fetch('/api/sidebar').then(r => r.json()).then((cats: Category[]) => {
      const found = cats.find(c => c.id === cid);
      if (found) setCat(found); else router.replace('/');
    });
  }, [cid, router]);

  if (!cat) return <div className="p-6 text-text2 text-sm">불러오는 중…</div>;

  return (
    <>
      <PageHeader
        breadcrumb={[{ label: '대시보드', href: '/' }, { label: cat.name }]}
        actions={
          <button onClick={() => router.push(`/${cid}/new-character`)}
            className="px-3 py-1.5 rounded-btn text-sm font-semibold text-white"
            style={{ background: cat.color }}>
            + 캐릭터 추가
          </button>
        }
      />
      <div className="p-6">
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
      </div>
    </>
  );
}
