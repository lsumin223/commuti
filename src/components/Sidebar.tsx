'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useSidebarStore } from '@/store/sidebar';
import { cn } from '@/lib/utils';

// ── Icons ──────────────────────────────────────────────────
const ChevronRight = ({ className }: { className?: string }) => (
  <svg className={className} width="12" height="12" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);
const Plus = ({ size = 13 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);
const SearchIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);
const SettingsIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
  </svg>
);
const DashboardIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
    <rect x="3" y="3" width="7" height="7" rx="1.5" />
    <rect x="14" y="3" width="7" height="7" rx="1.5" />
    <rect x="3" y="14" width="7" height="7" rx="1.5" />
    <rect x="14" y="14" width="7" height="7" rx="1.5" />
  </svg>
);
const LogIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
    <polyline points="14 2 14 8 20 8" />
  </svg>
);

// ── Doc nav items ──────────────────────────────────────────
const DOC_ITEMS = [
  { key: 'profile',  label: '프로필' },
  { key: 'world',    label: '세계관' },
  { key: 'secret',   label: '비밀정보' },
  { key: 'clue',     label: '단서' },
  { key: 'timeline', label: '타임라인' },
];

const LOG_KIND_DOT: Record<string, string> = {
  TEXT:  '#7A9E8A',
  IMAGE: '#C4607A',
  COMIC: '#8B6FC4',
};

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { categories, loading, fetch, refresh,
          collapsedCategories, collapsedCharacters, collapsedLogs,
          toggleCategory, toggleCharacter, toggleLogs } = useSidebarStore();

  useEffect(() => { fetch(); }, [fetch]);

  useEffect(() => {
    const handler = () => refresh();
    window.addEventListener('sidebar-refresh', handler);
    return () => window.removeEventListener('sidebar-refresh', handler);
  }, [refresh]);

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  return (
    <aside className="flex flex-col w-[214px] min-w-[214px] h-screen overflow-hidden border-r border-bd bg-bg1">
      {/* Top: logo */}
      <div className="flex items-center gap-2 px-4 py-4 border-b border-bd">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold"
          style={{ background: 'linear-gradient(135deg, #C4607A, #8B6FC4)' }}>✦</div>
        <span className="font-bold text-sm text-text0">창작 스튜디오</span>
      </div>

      {/* Scrollable nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5">

        {/* Dashboard */}
        <Link href="/" className={cn('nav-item', pathname === '/' && 'active')}>
          <DashboardIcon />
          <span>대시보드</span>
        </Link>

        <div className="my-2 border-t border-bd" />

        {/* Categories */}
        {loading ? (
          <div className="px-3 py-4 text-xs text-text2">불러오는 중…</div>
        ) : (
          <>
            {categories.map(cat => {
              const catOpen = !collapsedCategories.has(cat.id);
              return (
                <div key={cat.id}>
                  {/* Category row */}
                  <div
                    className="nav-item group"
                    onClick={() => toggleCategory(cat.id)}
                  >
                    <ChevronRight className={cn(
                      'flex-shrink-0 transition-transform duration-150 text-text2',
                      catOpen && 'rotate-90',
                    )} />
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ background: cat.color }} />
                    <Link
                      href={`/${cat.id}`}
                      className="flex-1 truncate"
                      onClick={e => e.stopPropagation()}
                    >
                      {cat.name}
                    </Link>
                  </div>

                  {/* Characters */}
                  {catOpen && (
                    <div className="ml-3 border-l border-bd2 pl-2 space-y-0.5">
                      {cat.characters.map(char => {
                        const charOpen = !collapsedCharacters.has(char.id);
                        const baseHref = `/${cat.id}/${char.id}`;
                        return (
                          <div key={char.id}>
                            {/* Character row */}
                            <div
                              className="nav-item group"
                              onClick={() => toggleCharacter(char.id)}
                            >
                              <ChevronRight className={cn(
                                'flex-shrink-0 transition-transform duration-150 text-text2',
                                charOpen && 'rotate-90',
                              )} />
                              <span className="text-base leading-none">{char.emoji || '✦'}</span>
                              <Link
                                href={baseHref}
                                className="flex-1 truncate"
                                onClick={e => e.stopPropagation()}
                              >
                                {char.name}
                              </Link>
                            </div>

                            {/* Doc + Log items */}
                            {charOpen && (
                              <div className="ml-3 border-l border-bd2 pl-2 space-y-0.5">
                                {DOC_ITEMS.map(doc => {
                                  const href = `${baseHref}/${doc.key}`;
                                  return (
                                    <Link key={doc.key} href={href}
                                      className={cn('nav-item text-xs', isActive(href) && 'active')}>
                                      <span className="w-1 h-1 rounded-full bg-text2 flex-shrink-0" />
                                      {doc.label}
                                    </Link>
                                  );
                                })}

                                {/* Logs folder */}
                                <div>
                                  <div
                                    className="nav-item text-xs"
                                    onClick={() => toggleLogs(char.id)}
                                  >
                                    <ChevronRight className={cn(
                                      'flex-shrink-0 transition-transform duration-150 text-text2',
                                      !collapsedLogs.has(char.id) && 'rotate-90',
                                    )} />
                                    <LogIcon />
                                    <Link
                                      href={`${baseHref}/logs`}
                                      className="flex-1"
                                      onClick={e => e.stopPropagation()}
                                    >
                                      로그
                                    </Link>
                                  </div>

                                  {!collapsedLogs.has(char.id) && char.logs.length > 0 && (
                                    <div className="ml-3 border-l border-bd2 pl-2 space-y-0.5">
                                      {char.logs.map(log => {
                                        const logHref = `${baseHref}/logs/${log.id}`;
                                        return (
                                          <Link key={log.id} href={logHref}
                                            className={cn('nav-item text-xs', isActive(logHref) && 'active')}>
                                            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                                              style={{ background: LOG_KIND_DOT[log.kind] || '#A89E94' }} />
                                            <span className="truncate">{log.title}</span>
                                          </Link>
                                        );
                                      })}
                                      <Link href={`${baseHref}/logs/new`}
                                        className="nav-item text-xs text-text2 hover:text-rose">
                                        <Plus size={11} />
                                        새 로그
                                      </Link>
                                    </div>
                                  )}
                                </div>

                                {/* Add log shortcut */}
                                {!collapsedLogs.has(char.id) && char.logs.length === 0 && (
                                  <Link href={`${baseHref}/logs/new`}
                                    className="nav-item text-xs text-text2 hover:text-rose ml-3">
                                    <Plus size={11} />
                                    새 로그
                                  </Link>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}

                      {/* Add character */}
                      <button
                        onClick={() => router.push(`/${cat.id}/new-character`)}
                        className="nav-item text-xs text-text2 hover:text-rose w-full"
                      >
                        <Plus size={11} />
                        캐릭터 추가
                      </button>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Add category */}
            <button
              onClick={() => router.push('/categories/new')}
              className="nav-item text-xs text-text2 hover:text-rose w-full mt-1"
            >
              <Plus size={11} />
              카테고리 추가
            </button>
          </>
        )}
      </nav>

      {/* Bottom: Search + Settings */}
      <div className="px-2 py-2 border-t border-bd space-y-0.5">
        <Link href="/search" className={cn('nav-item', isActive('/search') && 'active')}>
          <SearchIcon />
          <span>검색</span>
        </Link>
        <Link href="/settings" className={cn('nav-item', isActive('/settings') && 'active')}>
          <SettingsIcon />
          <span>설정</span>
        </Link>
      </div>
    </aside>
  );
}
