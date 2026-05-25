'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

interface Series { id: string; name: string; }
interface Log {
  id: string;
  title: string;
  kind: string;
  visibility: string;
  images: string | null;
  updatedAt: string;
  series: Series | null;
}

const KIND_META = {
  TEXT:  { label: '글로그',   color: '#7A9E8A', dot: '#7A9E8A' },
  IMAGE: { label: '그림로그', color: '#C4607A', dot: '#C4607A' },
  COMIC: { label: '만화로그', color: '#8B6FC4', dot: '#8B6FC4' },
};

const VISIBILITY_LABEL: Record<string, string> = {
  private: '비공개',
  link:    '링크 공개',
  secret:  '비밀번호',
};

interface Props { cid: string; charid: string; }

export default function LogListPage({ cid, charid }: Props) {
  const router = useRouter();
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [kindFilter, setKindFilter] = useState<string>('ALL');

  const loadLogs = useCallback(async () => {
    setLoading(true);
    const qs = kindFilter !== 'ALL' ? `?kind=${kindFilter}` : '';
    const res = await fetch(`/api/characters/${charid}/logs${qs}`);
    setLogs(res.ok ? await res.json() : []);
    setLoading(false);
  }, [charid, kindFilter]);

  useEffect(() => { loadLogs(); }, [loadLogs]);

  const firstImage = (log: Log): string | null => {
    if (!log.images) return null;
    try { const arr = JSON.parse(log.images); return arr[0] ?? null; }
    catch { return null; }
  };

  const TABS = [
    { key: 'ALL',   label: '전체' },
    { key: 'TEXT',  label: '글로그' },
    { key: 'IMAGE', label: '그림로그' },
    { key: 'COMIC', label: '만화로그' },
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-bd"
        style={{ borderLeft: '3px solid #6B6058' }}>
        <div className="flex items-center gap-2.5">
          <span className="text-lg">📓</span>
          <span className="font-semibold text-text0">로그</span>
        </div>
        <Link
          href={`/${cid}/${charid}/logs/new`}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-rose text-white text-sm rounded-lg hover:bg-rose/80 transition-colors"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          새 로그
        </Link>
      </div>

      {/* Kind tabs */}
      <div className="flex items-center gap-1 px-6 py-2.5 border-b border-bd bg-bg1">
        {TABS.map(t => (
          <button
            key={t.key}
            type="button"
            onClick={() => setKindFilter(t.key)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              kindFilter === t.key
                ? 'bg-text0 text-bg'
                : 'text-text2 hover:text-text1 hover:bg-bg2'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="p-6">
        {loading && <p className="text-text2 text-sm">불러오는 중…</p>}
        {!loading && logs.length === 0 && (
          <div className="text-center py-16 text-text2 text-sm">
            <p className="mb-3">아직 로그가 없습니다.</p>
            <Link
              href={`/${cid}/${charid}/logs/new`}
              className="px-4 py-2 bg-rose text-white rounded-lg text-sm hover:bg-rose/80 transition-colors"
            >
              + 첫 로그 작성
            </Link>
          </div>
        )}

        <div className="grid gap-3">
          {logs.map(log => {
            const meta = KIND_META[log.kind as keyof typeof KIND_META] ?? KIND_META.TEXT;
            const thumb = (log.kind === 'IMAGE' || log.kind === 'COMIC') ? firstImage(log) : null;
            return (
              <Link
                key={log.id}
                href={`/${cid}/${charid}/logs/${log.id}`}
                className="group flex gap-4 p-4 bg-bg border border-bd rounded-xl hover:border-rose/40 hover:shadow-sm transition-all"
                style={{ borderLeft: `3px solid ${meta.dot}` }}
              >
                {/* Thumbnail for image/comic logs */}
                {thumb && (
                  <div className="w-14 h-14 flex-shrink-0 rounded-lg overflow-hidden bg-bg2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={thumb} alt="" className="w-full h-full object-cover" />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-text0 truncate group-hover:text-rose transition-colors">
                      {log.title}
                    </h3>
                    <span
                      className="flex-shrink-0 text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                      style={{ background: `${meta.dot}20`, color: meta.dot }}
                    >
                      {meta.label}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mt-1.5 text-xs text-text2">
                    {log.series && (
                      <span className="px-1.5 py-0.5 bg-bg2 rounded text-text2">
                        📚 {log.series.name}
                      </span>
                    )}
                    <span>{VISIBILITY_LABEL[log.visibility] ?? log.visibility}</span>
                    <span>·</span>
                    <span>{format(new Date(log.updatedAt), 'yyyy.MM.dd', { locale: ko })}</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
