'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

interface Category { id: string; name: string; color: string; }
interface CharResult {
  id: string; name: string; emoji: string | null; themeColor: string;
  category: Category;
}
interface LogResult {
  id: string; title: string; kind: string; updatedAt: string;
  character: { id: string; categoryId: string; category: { id: string } };
}
interface SectionResult {
  id: string; title: string; content: string | null;
  document: { id: string; kind: string; character: { id: string; name: string; category: { id: string } } };
}
interface SearchResult {
  characters: CharResult[];
  logs: LogResult[];
  sections: SectionResult[];
}

const KIND_LABEL: Record<string, string> = {
  TEXT: '글로그', IMAGE: '그림로그', COMIC: '만화로그',
};
const DOC_LABEL: Record<string, string> = {
  PROFILE: '프로필', WORLD: '세계관', SECRET: '비밀정보', CLUE: '단서', TIMELINE: '타임라인',
};

function highlight(text: string, q: string): React.ReactNode {
  if (!q) return text;
  const idx = text.toLowerCase().indexOf(q.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-rose/20 text-rose rounded px-0.5">{text.slice(idx, idx + q.length)}</mark>
      {text.slice(idx + q.length)}
    </>
  );
}

export default function SearchPageClient() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const search = useCallback(async (q: string) => {
    if (!q.trim()) { setResults(null); setLoading(false); return; }
    setLoading(true);
    const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
    setResults(res.ok ? await res.json() : null);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => search(query), 300);
    return () => { if (debounce.current) clearTimeout(debounce.current); };
  }, [query, search]);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const total = results
    ? results.characters.length + results.logs.length + results.sections.length
    : 0;

  return (
    <div>
      {/* Header + search input */}
      <div className="px-6 py-5 border-b border-bd">
        <h1 className="text-sm font-semibold text-text0 mb-3">검색</h1>
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-text2" width="15" height="15"
            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="캐릭터, 로그, 섹션 내용 검색…"
            className="w-full pl-9 pr-4 py-2.5 border border-bd rounded-xl text-sm text-text0 bg-bg placeholder:text-text2 focus:outline-none focus:border-rose"
          />
          {query && (
            <button type="button"
              onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text2 hover:text-text1 transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="p-6 space-y-6">
        {loading && <p className="text-text2 text-sm">검색 중…</p>}

        {!loading && query && results && total === 0 && (
          <p className="text-text2 text-sm">"{query}"에 대한 결과가 없습니다.</p>
        )}

        {!loading && results && total > 0 && (
          <p className="text-xs text-text2">{total}개 결과</p>
        )}

        {/* Characters */}
        {results && results.characters.length > 0 && (
          <section>
            <h2 className="text-xs font-semibold text-text2 uppercase tracking-wide mb-2">캐릭터</h2>
            <div className="space-y-2">
              {results.characters.map(char => (
                <Link key={char.id}
                  href={`/${char.category.id}/${char.id}/profile`}
                  className="flex items-center gap-3 p-3 border border-bd rounded-xl hover:border-rose/40 hover:bg-bg1 transition-all">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center text-lg flex-shrink-0"
                    style={{ background: `${char.themeColor}15` }}>
                    {char.emoji || '✦'}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text0">
                      {highlight(char.name, query)}
                    </p>
                    <p className="text-xs text-text2 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full" style={{ background: char.category.color }} />
                      {char.category.name}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Logs */}
        {results && results.logs.length > 0 && (
          <section>
            <h2 className="text-xs font-semibold text-text2 uppercase tracking-wide mb-2">로그</h2>
            <div className="space-y-2">
              {results.logs.map(log => (
                <Link key={log.id}
                  href={`/${log.character.category.id}/${log.character.id}/logs/${log.id}`}
                  className="flex items-center gap-3 p-3 border border-bd rounded-xl hover:border-rose/40 hover:bg-bg1 transition-all">
                  <div className="text-lg">📓</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text0 truncate">
                      {highlight(log.title, query)}
                    </p>
                    <p className="text-xs text-text2">
                      {KIND_LABEL[log.kind] ?? log.kind} · {format(new Date(log.updatedAt), 'yyyy.MM.dd', { locale: ko })}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Sections */}
        {results && results.sections.length > 0 && (
          <section>
            <h2 className="text-xs font-semibold text-text2 uppercase tracking-wide mb-2">섹션</h2>
            <div className="space-y-2">
              {results.sections.map(sec => (
                <Link key={sec.id}
                  href={`/${sec.document.character.category.id}/${sec.document.character.id}/${sec.document.kind.toLowerCase()}`}
                  className="p-3 border border-bd rounded-xl hover:border-rose/40 hover:bg-bg1 transition-all block">
                  <p className="text-sm font-medium text-text0">
                    {highlight(sec.title, query)}
                  </p>
                  <p className="text-xs text-text2 mt-0.5">
                    {sec.document.character.name} · {DOC_LABEL[sec.document.kind] ?? sec.document.kind}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
