'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Log { id: string; title: string; kind: string; }
interface Document { id: string; kind: string; }
interface Character { id: string; name: string; emoji: string | null; themeColor: string; documents: Document[]; logs: Log[]; }
interface Category { id: string; name: string; color: string; characters: Character[]; }

const DOC_LABEL: Record<string, { label: string; icon: string }> = {
  PROFILE:  { label: '프로필',   icon: '👤' },
  WORLD:    { label: '세계관',   icon: '🌍' },
  SECRET:   { label: '비밀정보', icon: '🔒' },
  CLUE:     { label: '단서',     icon: '🧩' },
  TIMELINE: { label: '타임라인', icon: '📅' },
};

const DOC_PATH: Record<string, string> = {
  PROFILE: 'profile', WORLD: 'world', SECRET: 'secret', CLUE: 'clue', TIMELINE: 'timeline',
};

const KIND_COLOR: Record<string, string> = {
  TEXT: '#7A9E8A', IMAGE: '#C4607A', COMIC: '#8B6FC4',
};
const KIND_LABEL: Record<string, string> = {
  TEXT: '글로그', IMAGE: '그림로그', COMIC: '만화로그',
};

export default function TestPageClient() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [seeding, setSeeding] = useState(false);
  const [seedMsg, setSeedMsg] = useState('');
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    const res = await fetch('/api/test-seed');
    setCategories(res.ok ? await res.json() : []);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const handleSeed = async () => {
    setSeeding(true);
    setSeedMsg('');
    const res = await fetch('/api/test-seed', { method: 'POST' });
    const data = await res.json();
    setSeedMsg(data.existing ? '이미 테스트 데이터가 있습니다.' : '✓ 테스트 데이터가 생성되었습니다!');
    await loadData();
    setSeeding(false);
  };

  const totalChars = categories.reduce((s, c) => s + c.characters.length, 0);
  const totalLogs  = categories.reduce((s, c) => s + c.characters.reduce((s2, ch) => s2 + ch.logs.length, 0), 0);

  return (
    <div className="p-6 max-w-4xl">
      {/* Title */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-text0 flex items-center gap-2">
            <span className="text-2xl">🧪</span> 기능 테스트 페이지
          </h1>
          <p className="text-sm text-text2 mt-1">모든 기능을 빠르게 확인할 수 있습니다.</p>
        </div>
        <button
          type="button"
          onClick={handleSeed}
          disabled={seeding}
          className="flex items-center gap-2 px-4 py-2 bg-rose text-white text-sm font-medium rounded-lg hover:bg-rose/80 disabled:opacity-50 transition-colors"
        >
          {seeding ? (
            <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : '✨'}
          테스트 데이터 생성
        </button>
      </div>

      {seedMsg && (
        <div className={`mb-4 px-4 py-3 rounded-xl text-sm border ${
          seedMsg.startsWith('✓') ? 'bg-sage/10 border-sage/30 text-sage' : 'bg-bg2 border-bd text-text2'
        }`}>
          {seedMsg}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: '카테고리', value: categories.length, icon: '📁' },
          { label: '캐릭터',   value: totalChars,         icon: '👥' },
          { label: '로그',     value: totalLogs,          icon: '📓' },
        ].map(s => (
          <div key={s.label} className="p-4 bg-bg1 border border-bd rounded-xl text-center">
            <div className="text-2xl mb-1">{s.icon}</div>
            <div className="text-2xl font-bold text-text0">{s.value}</div>
            <div className="text-xs text-text2">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Quick nav */}
      <section className="mb-6">
        <h2 className="text-xs font-semibold text-text2 uppercase tracking-wide mb-3">전역 페이지</h2>
        <div className="flex flex-wrap gap-2">
          {[
            { href: '/',         icon: '🏠', label: '대시보드' },
            { href: '/search',   icon: '🔍', label: '검색' },
            { href: '/settings', icon: '⚙️',  label: '설정' },
          ].map(item => (
            <Link key={item.href} href={item.href}
              className="flex items-center gap-2 px-4 py-2 bg-bg border border-bd rounded-lg text-sm text-text1 hover:border-rose/50 hover:bg-bg1 transition-all">
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Per-character feature links */}
      {loading && <p className="text-text2 text-sm">데이터 불러오는 중…</p>}

      {!loading && categories.length === 0 && (
        <div className="text-center py-12 border-2 border-dashed border-bd rounded-2xl text-text2">
          <p className="text-3xl mb-2">🌱</p>
          <p className="text-sm mb-3">데이터가 없습니다.</p>
          <button type="button" onClick={handleSeed} disabled={seeding}
            className="px-4 py-2 bg-rose text-white text-sm rounded-lg hover:bg-rose/80 transition-colors">
            테스트 데이터 생성하기
          </button>
        </div>
      )}

      {categories.map(cat => (
        <section key={cat.id} className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-3 h-3 rounded-full" style={{ background: cat.color }} />
            <Link href={`/${cat.id}`}
              className="text-sm font-semibold text-text0 hover:text-rose transition-colors">
              {cat.name}
            </Link>
          </div>

          <div className="space-y-4">
            {cat.characters.map(char => (
              <div key={char.id} className="border border-bd rounded-2xl overflow-hidden">
                {/* Character header */}
                <div className="flex items-center gap-3 px-4 py-3 border-b border-bd"
                  style={{ background: `${char.themeColor}08` }}>
                  <span className="text-2xl">{char.emoji || '✦'}</span>
                  <div className="flex-1">
                    <Link href={`/${cat.id}/${char.id}/profile`}
                      className="font-semibold text-text0 hover:text-rose transition-colors">
                      {char.name}
                    </Link>
                    <p className="text-xs text-text2">
                      문서 {char.documents.length}개 · 로그 {char.logs.length}개
                    </p>
                  </div>
                </div>

                <div className="p-4 grid gap-4 sm:grid-cols-2">
                  {/* Documents */}
                  <div>
                    <p className="text-xs font-semibold text-text2 mb-2">문서</p>
                    <div className="flex flex-wrap gap-1.5">
                      {char.documents.map(doc => {
                        const m = DOC_LABEL[doc.kind];
                        const path = DOC_PATH[doc.kind];
                        if (!m || !path) return null;
                        return (
                          <Link key={doc.id}
                            href={`/${cat.id}/${char.id}/${path}`}
                            className="flex items-center gap-1 px-2.5 py-1 bg-bg1 border border-bd rounded-lg text-xs text-text1 hover:border-rose/50 hover:text-rose transition-all">
                            <span>{m.icon}</span>
                            <span>{m.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  </div>

                  {/* Logs */}
                  <div>
                    <p className="text-xs font-semibold text-text2 mb-2">
                      로그{' '}
                      <Link href={`/${cat.id}/${char.id}/logs`}
                        className="ml-1 text-rose hover:underline">목록 →</Link>
                    </p>
                    {char.logs.length === 0 ? (
                      <Link href={`/${cat.id}/${char.id}/logs/new`}
                        className="text-xs text-text2 hover:text-rose transition-colors">
                        + 로그 작성
                      </Link>
                    ) : (
                      <div className="space-y-1">
                        {char.logs.map(log => (
                          <Link key={log.id}
                            href={`/${cat.id}/${char.id}/logs/${log.id}`}
                            className="flex items-center gap-2 px-2.5 py-1 bg-bg1 border border-bd rounded-lg text-xs text-text1 hover:border-rose/50 hover:text-rose transition-all">
                            <span className="w-2 h-2 rounded-full flex-shrink-0"
                              style={{ background: KIND_COLOR[log.kind] || '#A89E94' }} />
                            <span className="truncate">{log.title}</span>
                            <span className="text-text2 flex-shrink-0">{KIND_LABEL[log.kind]}</span>
                          </Link>
                        ))}
                        <Link href={`/${cat.id}/${char.id}/logs/new`}
                          className="block text-xs text-text2 hover:text-rose transition-colors px-1 py-0.5">
                          + 새 로그
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}

      {/* Feature checklist */}
      <section className="mt-8 p-4 bg-bg1 border border-bd rounded-2xl">
        <h2 className="text-xs font-semibold text-text2 uppercase tracking-wide mb-3">기능 체크리스트</h2>
        <div className="grid sm:grid-cols-2 gap-1.5 text-sm text-text1">
          {[
            '캐릭터 두상 이미지 업로드 (캐릭터 헤더 클릭)',
            '프로필 앵커 에디터 (점프바, 섹션 드래그)',
            '텍스트 에디터 (폰트/색상/표/이미지/집중모드)',
            '글로그 작성 및 자동저장',
            '그림로그 이미지 업로드 + 라이트박스',
            '만화로그 페이지 순서 변경',
            '로그 시리즈 생성 및 연결',
            '공유 링크 생성 (비밀번호/만료 설정)',
            '공유 페이지 비밀번호 게이트',
            '검색 (캐릭터·로그·섹션 전문 검색)',
            '설정 (닉네임 변경, 비밀번호 변경)',
            '모바일 사이드바 토글 (창 좁히기)',
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-2 text-xs">
              <span className="text-text2 flex-shrink-0 mt-0.5">□</span>
              <span>{item}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
