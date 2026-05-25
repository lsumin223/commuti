'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import Editor from '@/components/Editor';
import SharePopover from '@/components/SharePopover';

interface Series { id: string; name: string; }
interface Log {
  id: string;
  title: string;
  kind: string;
  content: string | null;
  images: string | null;
  visibility: string;
  updatedAt: string;
  series: Series | null;
  characterId: string;
}

const KIND_META = {
  TEXT:  { label: '글로그',   color: '#7A9E8A' },
  IMAGE: { label: '그림로그', color: '#C4607A' },
  COMIC: { label: '만화로그', color: '#8B6FC4' },
};

const VIS_LABEL: Record<string, string> = {
  private: '🔒 비공개',
  link:    '🔗 링크 공개',
  secret:  '🔑 비밀번호',
};

interface Props { cid: string; charid: string; logid: string; }

// ── Image/Comic Viewer ────────────────────────────────────────────────────────
function ImageGrid({ images, onUpdate, comic }: {
  images: string[];
  onUpdate: (images: string[]) => void;
  comic?: boolean;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    const uploaded: string[] = [];
    for (const file of Array.from(files)) {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      if (res.ok) {
        const { url } = await res.json();
        uploaded.push(url);
      }
    }
    onUpdate([...images, ...uploaded]);
    setUploading(false);
  };

  const removeImage = (idx: number) => {
    onUpdate(images.filter((_, i) => i !== idx));
  };

  const moveImage = (idx: number, dir: 'up' | 'down') => {
    const next = dir === 'up' ? idx - 1 : idx + 1;
    if (next < 0 || next >= images.length) return;
    const arr = [...images];
    [arr[idx], arr[next]] = [arr[next], arr[idx]];
    onUpdate(arr);
  };

  return (
    <div>
      {/* Grid */}
      <div className={`grid gap-3 ${comic ? 'grid-cols-1 max-w-lg mx-auto' : 'grid-cols-2 sm:grid-cols-3'}`}>
        {images.map((url, idx) => (
          <div key={idx} className="relative group rounded-xl overflow-hidden bg-bg2 border border-bd">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={url}
              alt={`이미지 ${idx + 1}`}
              className="w-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
              style={{ aspectRatio: comic ? 'auto' : '1' }}
              onClick={() => setLightbox(idx)}
            />
            {/* Controls overlay */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              {comic && (
                <>
                  <button
                    type="button"
                    onClick={() => moveImage(idx, 'up')}
                    disabled={idx === 0}
                    className="w-7 h-7 rounded-full bg-white/80 text-text0 flex items-center justify-center disabled:opacity-30 hover:bg-white transition-colors"
                  >↑</button>
                  <button
                    type="button"
                    onClick={() => moveImage(idx, 'down')}
                    disabled={idx === images.length - 1}
                    className="w-7 h-7 rounded-full bg-white/80 text-text0 flex items-center justify-center disabled:opacity-30 hover:bg-white transition-colors"
                  >↓</button>
                </>
              )}
              <button
                type="button"
                onClick={() => removeImage(idx)}
                className="w-7 h-7 rounded-full bg-rose/80 text-white flex items-center justify-center hover:bg-rose transition-colors"
              >×</button>
            </div>
            {comic && (
              <div className="absolute top-1.5 left-1.5 bg-black/50 text-white text-[10px] px-1.5 py-0.5 rounded">
                {idx + 1}
              </div>
            )}
          </div>
        ))}

        {/* Upload button */}
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className={`rounded-xl border-2 border-dashed border-bd hover:border-rose/50 flex flex-col items-center justify-center gap-2 text-text2 hover:text-rose transition-colors ${
            comic ? 'py-8' : 'aspect-square'
          }`}
        >
          {uploading ? (
            <span className="text-xs">업로드 중…</span>
          ) : (
            <>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21 15 16 10 5 21"/>
              </svg>
              <span className="text-xs">{comic ? '페이지 추가' : '이미지 추가'}</span>
            </>
          )}
        </button>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple={!comic || images.length === 0}
        className="hidden"
        onChange={e => handleUpload(e.target.files)}
      />

      {/* Lightbox */}
      {lightbox !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={() => setLightbox(null)}
        >
          <button
            type="button"
            className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors"
            onClick={(e) => { e.stopPropagation(); setLightbox(i => i !== null && i > 0 ? i - 1 : i); }}
          >‹</button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={images[lightbox]}
            alt=""
            className="max-h-screen max-w-screen-lg object-contain"
            onClick={e => e.stopPropagation()}
          />
          <button
            type="button"
            className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors"
            onClick={(e) => { e.stopPropagation(); setLightbox(i => i !== null && i < images.length - 1 ? i + 1 : i); }}
          >›</button>
          <button
            type="button"
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors"
            onClick={() => setLightbox(null)}
          >×</button>
          <div className="absolute bottom-4 text-white/60 text-sm">
            {lightbox + 1} / {images.length}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function LogViewerPage({ cid, charid, logid }: Props) {
  const router = useRouter();
  const [log, setLog] = useState<Log | null>(null);
  const [loading, setLoading] = useState(true);
  const [editTitle, setEditTitle] = useState(false);
  const [titleValue, setTitleValue] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch(`/api/logs/${logid}`)
      .then(r => r.ok ? r.json() : null)
      .then((data: Log | null) => {
        setLog(data);
        if (data) {
          setTitleValue(data.title);
          setImages(data.images ? JSON.parse(data.images) : []);
        }
        setLoading(false);
      });
  }, [logid]);

  useEffect(() => {
    if (!menuOpen) return;
    const h = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [menuOpen]);

  useEffect(() => {
    if (editTitle) titleRef.current?.focus();
  }, [editTitle]);

  const saveTitle = async () => {
    if (!log || !titleValue.trim()) return;
    setEditTitle(false);
    if (titleValue.trim() === log.title) return;
    await fetch(`/api/logs/${logid}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: titleValue.trim() }),
    });
    setLog(l => l ? { ...l, title: titleValue.trim() } : l);
  };

  const saveContent = useCallback(async (content: string) => {
    await fetch(`/api/logs/${logid}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    });
  }, [logid]);

  const saveImages = useCallback(async (imgs: string[]) => {
    setImages(imgs);
    await fetch(`/api/logs/${logid}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ images: JSON.stringify(imgs) }),
    });
  }, [logid]);

  const handleDelete = async () => {
    if (!confirm('이 로그를 삭제하시겠습니까?')) return;
    await fetch(`/api/logs/${logid}`, { method: 'DELETE' });
    router.push(`/${cid}/${charid}/logs`);
    // refresh sidebar
    window.dispatchEvent(new Event('sidebar-refresh'));
  };

  if (loading) return <div className="p-6 text-text2 text-sm">불러오는 중…</div>;
  if (!log)    return <div className="p-6 text-text2 text-sm">로그를 찾을 수 없습니다.</div>;

  const meta = KIND_META[log.kind as keyof typeof KIND_META] ?? KIND_META.TEXT;

  return (
    <div>
      {/* Header */}
      <div
        className="flex items-center gap-3 px-6 py-4 border-b border-bd"
        style={{ borderLeft: `3px solid ${meta.color}` }}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span
              className="text-[11px] px-1.5 py-0.5 rounded-full font-medium"
              style={{ background: `${meta.color}20`, color: meta.color }}
            >
              {meta.label}
            </span>
            {log.series && (
              <span className="text-[11px] text-text2 px-1.5 py-0.5 bg-bg2 rounded">
                📚 {log.series.name}
              </span>
            )}
            <span className="text-[11px] text-text2">{VIS_LABEL[log.visibility]}</span>
          </div>

          {/* Editable title */}
          {editTitle ? (
            <input
              ref={titleRef}
              value={titleValue}
              onChange={e => setTitleValue(e.target.value)}
              onBlur={saveTitle}
              onKeyDown={e => { if (e.key === 'Enter') saveTitle(); if (e.key === 'Escape') { setTitleValue(log.title); setEditTitle(false); } }}
              className="text-lg font-bold text-text0 bg-transparent border-b border-rose outline-none w-full"
            />
          ) : (
            <h1
              className="text-lg font-bold text-text0 cursor-text hover:text-rose/80 transition-colors truncate"
              onClick={() => setEditTitle(true)}
              title="클릭하여 제목 편집"
            >
              {log.title}
            </h1>
          )}

          <p className="text-xs text-text2 mt-0.5">
            수정: {format(new Date(log.updatedAt), 'yyyy.MM.dd HH:mm', { locale: ko })}
          </p>
        </div>

        <SharePopover targetType="log" logId={logid} />

        {/* ··· menu */}
        <div className="relative flex-shrink-0" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen(o => !o)}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-bg2 text-text2 hover:text-text0 transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <circle cx="3" cy="8" r="1.5"/><circle cx="8" cy="8" r="1.5"/><circle cx="13" cy="8" r="1.5"/>
            </svg>
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-full mt-1 z-20 bg-bg border border-bd rounded-lg shadow-lg py-1 min-w-[130px]">
              <button
                type="button"
                onClick={() => { setMenuOpen(false); setEditTitle(true); setTitleValue(log.title); }}
                className="w-full text-left px-3 py-1.5 text-sm text-text1 hover:bg-bg1 transition-colors"
              >
                제목 변경
              </button>
              <div className="my-1 border-t border-bd" />
              <button
                type="button"
                onClick={() => { setMenuOpen(false); handleDelete(); }}
                className="w-full text-left px-3 py-1.5 text-sm text-rose hover:bg-rose/5 transition-colors"
              >
                삭제
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Content by kind */}
      {log.kind === 'TEXT' && (
        <div className="border border-bd rounded-xl m-6 overflow-hidden">
          <Editor
            content={log.content ?? undefined}
            onSave={saveContent}
            placeholder="로그 내용을 작성하세요…"
          />
        </div>
      )}

      {log.kind === 'IMAGE' && (
        <div className="p-6">
          <ImageGrid images={images} onUpdate={saveImages} />
        </div>
      )}

      {log.kind === 'COMIC' && (
        <div className="p-6">
          <p className="text-xs text-text2 mb-4">페이지 순서대로 이미지를 업로드하세요. ↑↓ 버튼으로 순서를 변경할 수 있습니다.</p>
          <ImageGrid images={images} onUpdate={saveImages} comic />
        </div>
      )}
    </div>
  );
}
