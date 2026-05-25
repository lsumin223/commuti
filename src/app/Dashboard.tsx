'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import PageHeader from '@/components/PageHeader';

interface CategoryWithChars {
  id: string;
  name: string;
  color: string;
  characters: { id: string; name: string; emoji: string | null; themeColor: string }[];
}

export default function Dashboard() {
  const { data: session } = useSession();
  const [categories, setCategories] = useState<CategoryWithChars[]>([]);

  useEffect(() => {
    fetch('/api/sidebar').then(r => r.json()).then(setCategories).catch(() => {});
  }, []);

  const totalChars = categories.reduce((a, c) => a + c.characters.length, 0);

  return (
    <>
      <PageHeader breadcrumb={[{ label: '대시보드' }]} />
      <div className="p-6 max-w-4xl">
        {/* Greeting */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-text0">
            안녕하세요, {session?.user.name} 님 👋
          </h1>
          <p className="text-text2 text-sm mt-1">
            카테고리 {categories.length}개 · 캐릭터 {totalChars}명
          </p>
        </div>

        {/* Categories */}
        {categories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="text-4xl mb-4">✦</div>
            <p className="text-text1 font-medium mb-2">아직 카테고리가 없습니다</p>
            <p className="text-text2 text-sm mb-6">카테고리를 만들어 세계관과 캐릭터를 관리해 보세요.</p>
            <Link href="/categories/new"
              className="px-4 py-2 rounded-btn text-sm font-semibold text-white"
              style={{ background: '#C4607A' }}>
              + 카테고리 만들기
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {categories.map(cat => (
              <section key={cat.id}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: cat.color }} />
                  <Link href={`/${cat.id}`}
                    className="font-semibold text-text0 hover:text-rose transition-colors">
                    {cat.name}
                  </Link>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {cat.characters.map(char => (
                    <Link key={char.id} href={`/${cat.id}/${char.id}`}
                      className="flex flex-col items-center gap-2 p-4 rounded-card border border-bd bg-bg hover:border-bd2 hover:shadow-sm transition-all group">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                        style={{ background: char.themeColor + '22' }}>
                        {char.emoji || '✦'}
                      </div>
                      <span className="text-sm font-medium text-text0 group-hover:text-rose transition-colors text-center truncate w-full">
                        {char.name}
                      </span>
                    </Link>
                  ))}
                  <Link href={`/${cat.id}/new-character`}
                    className="flex flex-col items-center justify-center gap-2 p-4 rounded-card border border-dashed border-bd bg-bg hover:border-rose hover:bg-rose-xl transition-all text-text2 hover:text-rose">
                    <span className="text-2xl">+</span>
                    <span className="text-xs">캐릭터 추가</span>
                  </Link>
                </div>
              </section>
            ))}

            <Link href="/categories/new"
              className="inline-flex items-center gap-2 text-sm text-text2 hover:text-rose transition-colors mt-2">
              <span className="text-lg leading-none">+</span>
              카테고리 추가
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
