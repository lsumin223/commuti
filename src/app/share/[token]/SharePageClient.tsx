'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import Editor from '@/components/Editor';

interface Section { id: string; title: string; content: string | null; order: number; }
interface Document { id: string; kind: string; content: string | null; sections: Section[]; }
interface Log { id: string; title: string; kind: string; content: string | null; images: string | null; visibility: string; updatedAt: string; }
interface Character { id: string; name: string; emoji: string | null; themeColor: string; headImage: string | null; documents: Document[]; logs: Log[]; }
interface Category { id: string; name: string; color: string; characters: Character[]; }

interface LinkData {
  token: string;
  targetType: string;
  password: string | null;
  category: Category | null;
  character: Character | null;
  document: Document | null;
  log: Log | null;
}

const KIND_META: Record<string, { label: string; color: string }> = {
  TEXT:  { label: '글로그',   color: '#7A9E8A' },
  IMAGE: { label: '그림로그', color: '#C4607A' },
  COMIC: { label: '만화로그', color: '#8B6FC4' },
};

const DOC_META: Record<string, { label: string; icon: string; color: string }> = {
  PROFILE:  { label: '프로필',   icon: '👤', color: '#C4607A' },
  WORLD:    { label: '세계관',   icon: '🌍', color: '#7A9E8A' },
  SECRET:   { label: '비밀정보', icon: '🔒', color: '#8B6FC4' },
  CLUE:     { label: '단서',     icon: '🧩', color: '#C4607A' },
  TIMELINE: { label: '타임라인', icon: '📅', color: '#4A90D9' },
};

// ── Sub-views ─────────────────────────────────────────────────────────────────
function LogView({ log }: { log: Log }) {
  const meta = KIND_META[log.kind] ?? KIND_META.TEXT;
  const images: string[] = log.images ? JSON.parse(log.images) : [];
  const [lightbox, setLightbox] = useState<number | null>(null);

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xs px-2 py-0.5 rounded-full font-medium"
          style={{ background: `${meta.color}20`, color: meta.color }}>
          {meta.label}
        </span>
        <span className="text-xs text-text2">
          {format(new Date(log.updatedAt), 'yyyy.MM.dd', { locale: ko })}
        </span>
      </div>
      <h1 className="text-2xl font-bold text-text0 mb-6">{log.title}</h1>

      {log.kind === 'TEXT' && log.content && (
        <Editor content={log.content} readOnly />
      )}

      {(log.kind === 'IMAGE' || log.kind === 'COMIC') && images.length > 0 && (
        <div className={`grid gap-3 ${log.kind === 'COMIC' ? 'grid-cols-1 max-w-lg mx-auto' : 'grid-cols-2 sm:grid-cols-3'}`}>
          {images.map((url, idx) => (
            <div key={idx} className="rounded-xl overflow-hidden bg-bg2 cursor-pointer"
              onClick={() => setLightbox(idx)}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt={`${idx + 1}`}
                className="w-full object-cover hover:opacity-90 transition-opacity"
                style={{ aspectRatio: log.kind === 'COMIC' ? 'auto' : '1' }}
              />
            </div>
          ))}
        </div>
      )}

      {lightbox !== null && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={() => setLightbox(null)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={images[lightbox]} alt=""
            className="max-h-screen max-w-screen-lg object-contain"
            onClick={e => e.stopPropagation()} />
          <button type="button" className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20"
            onClick={e => { e.stopPropagation(); setLightbox(i => i !== null && i > 0 ? i - 1 : i); }}>‹</button>
          <button type="button" className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20"
            onClick={e => { e.stopPropagation(); setLightbox(i => i !== null && i < images.length - 1 ? i + 1 : i); }}>›</button>
          <button type="button" className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/10 text-white flex items-center justify-center"
            onClick={() => setLightbox(null)}>×</button>
          <div className="absolute bottom-4 text-white/60 text-sm">{lightbox + 1} / {images.length}</div>
        </div>
      )}
    </div>
  );
}

function DocumentView({ doc }: { doc: Document }) {
  const meta = DOC_META[doc.kind] ?? { label: doc.kind, icon: '📄', color: '#6B6058' };
  const [activeSection, setActiveSection] = useState(doc.sections[0]?.id ?? null);

  if (doc.kind === 'PROFILE' && doc.sections.length > 0) {
    const current = doc.sections.find(s => s.id === activeSection) ?? doc.sections[0];
    return (
      <div>
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          {doc.sections.map(s => (
            <button key={s.id} type="button"
              onClick={() => setActiveSection(s.id)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                activeSection === s.id ? 'bg-rose text-white' : 'bg-bg2 text-text1 hover:bg-bg3'
              }`}>{s.title}</button>
          ))}
        </div>
        {current?.content && <Editor content={current.content} readOnly />}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-6" style={{ borderLeft: `3px solid ${meta.color}`, paddingLeft: '12px' }}>
        <span>{meta.icon}</span>
        <span className="font-semibold text-text0">{meta.label}</span>
      </div>
      {doc.content && <Editor content={doc.content} readOnly />}
      {!doc.content && <p className="text-text2 text-sm">내용이 없습니다.</p>}
    </div>
  );
}

function CharacterView({ character }: { character: Character }) {
  const [tab, setTab] = useState<'docs' | 'logs'>('docs');
  const [activeDoc, setActiveDoc] = useState(character.documents[0]?.id ?? null);

  const currentDoc = character.documents.find(d => d.id === activeDoc);

  return (
    <div>
      {/* Character header */}
      <div className="flex items-center gap-4 mb-6 p-4 bg-bg1 rounded-xl border border-bd">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
          style={{ background: `${character.themeColor}20` }}>
          {character.emoji || '✦'}
        </div>
        <div>
          <h1 className="text-xl font-bold text-text0">{character.name}</h1>
        </div>
      </div>

      {/* Doc/Log tabs */}
      <div className="flex gap-1 mb-4">
        <button type="button"
          onClick={() => setTab('docs')}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
            tab === 'docs' ? 'bg-text0 text-bg' : 'text-text2 hover:text-text1'
          }`}>문서</button>
        <button type="button"
          onClick={() => setTab('logs')}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
            tab === 'logs' ? 'bg-text0 text-bg' : 'text-text2 hover:text-text1'
          }`}>로그</button>
      </div>

      {tab === 'docs' && (
        <div className="flex gap-4">
          {/* Doc list */}
          <div className="w-28 flex-shrink-0 space-y-1">
            {character.documents.map(doc => {
              const m = DOC_META[doc.kind] ?? { label: doc.kind, icon: '📄', color: '#6B6058' };
              return (
                <button key={doc.id} type="button"
                  onClick={() => setActiveDoc(doc.id)}
                  className={`w-full text-left px-2 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition-colors ${
                    activeDoc === doc.id ? 'bg-bg2 text-text0 font-medium' : 'text-text2 hover:text-text1 hover:bg-bg1'
                  }`}>
                  <span>{m.icon}</span>{m.label}
                </button>
              );
            })}
          </div>
          <div className="flex-1 min-w-0">
            {currentDoc && <DocumentView doc={currentDoc} />}
          </div>
        </div>
      )}

      {tab === 'logs' && (
        <div className="space-y-3">
          {character.logs.length === 0 && <p className="text-text2 text-sm">로그가 없습니다.</p>}
          {character.logs.map(log => {
            const m = KIND_META[log.kind] ?? KIND_META.TEXT;
            return (
              <div key={log.id} className="p-3 border border-bd rounded-xl"
                style={{ borderLeft: `3px solid ${m.color}` }}>
                <div className="flex items-center justify-between">
                  <span className="font-medium text-text0 text-sm">{log.title}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full"
                    style={{ background: `${m.color}20`, color: m.color }}>{m.label}</span>
                </div>
                <p className="text-xs text-text2 mt-1">
                  {format(new Date(log.updatedAt), 'yyyy.MM.dd', { locale: ko })}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function SharePageClient({ link, needsPassword }: {
  link: LinkData;
  needsPassword: boolean;
}) {
  const [password, setPassword] = useState('');
  const [unlocked, setUnlocked] = useState(!needsPassword);
  const [pwError, setPwError] = useState(false);

  const tryUnlock = () => {
    if (password === link.password) {
      setUnlocked(true);
    } else {
      setPwError(true);
    }
  };

  // Password gate
  if (!unlocked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <div className="w-full max-w-sm p-8 bg-bg border border-bd rounded-2xl shadow-sm">
          <div className="text-center mb-6">
            <div className="text-3xl mb-2">🔑</div>
            <h1 className="font-semibold text-text0">비밀번호가 필요합니다</h1>
            <p className="text-sm text-text2 mt-1">공유 링크에 비밀번호가 설정되어 있습니다.</p>
          </div>
          <input
            type="password"
            value={password}
            onChange={e => { setPassword(e.target.value); setPwError(false); }}
            onKeyDown={e => e.key === 'Enter' && tryUnlock()}
            placeholder="비밀번호 입력"
            className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none ${
              pwError ? 'border-rose text-rose' : 'border-bd focus:border-rose'
            }`}
            autoFocus
          />
          {pwError && <p className="text-rose text-xs mt-1.5">비밀번호가 올바르지 않습니다.</p>}
          <button type="button"
            onClick={tryUnlock}
            className="w-full mt-3 py-2 bg-rose text-white text-sm font-medium rounded-lg hover:bg-rose/80 transition-colors">
            확인
          </button>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (link.targetType) {
      case 'log':
        return link.log ? <LogView log={link.log} /> : null;
      case 'document':
        return link.document ? <DocumentView doc={link.document} /> : null;
      case 'character':
      case 'log-list':
        return link.character ? <CharacterView character={link.character} /> : null;
      case 'category':
        return link.category ? (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full" style={{ background: link.category.color }} />
              <h1 className="text-xl font-bold text-text0">{link.category.name}</h1>
            </div>
            {link.category.characters.map(char => (
              <div key={char.id} className="border border-bd rounded-xl p-4">
                <CharacterView character={char} />
              </div>
            ))}
          </div>
        ) : null;
      default:
        return <p className="text-text2">알 수 없는 공유 타입입니다.</p>;
    }
  };

  return (
    <div className="min-h-screen bg-bg">
      {/* Top bar */}
      <div className="border-b border-bd bg-bg1 px-6 py-3 flex items-center gap-2">
        <div className="w-6 h-6 rounded-md flex items-center justify-center text-white text-[10px] font-bold"
          style={{ background: 'linear-gradient(135deg, #C4607A, #8B6FC4)' }}>✦</div>
        <span className="text-sm font-medium text-text1">창작 스튜디오 공유</span>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-6 py-8">
        {renderContent()}
      </div>
    </div>
  );
}
