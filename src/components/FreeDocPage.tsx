'use client';

import { useEffect, useState, useCallback } from 'react';
import Editor from '@/components/Editor';
import SharePopover from '@/components/SharePopover';

interface DocMeta {
  icon: string;
  color: string;
  label: string;
}

const DOC_META: Record<string, DocMeta> = {
  WORLD:    { icon: '🌍', color: '#7A9E8A', label: '세계관' },
  CLUE:     { icon: '🧩', color: '#C4607A', label: '단서'   },
  TIMELINE: { icon: '📅', color: '#4A90D9', label: '타임라인' },
  SECRET:   { icon: '🔒', color: '#8B6FC4', label: '비밀정보' },
};

interface Props { charid: string; kind: string; }

interface DocData { id: string; content: string | null; }

export default function FreeDocPage({ charid, kind }: Props) {
  const meta = DOC_META[kind] ?? { icon: '📄', color: '#6B6058', label: kind };
  const [doc, setDoc] = useState<DocData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/characters/${charid}/documents?kind=${kind}`)
      .then(r => r.json())
      .then((docs: DocData[]) => { setDoc(docs[0] ?? null); setLoading(false); })
      .catch(() => setLoading(false));
  }, [charid, kind]);

  const handleSave = useCallback(async (content: string) => {
    if (!doc) return;
    await fetch(`/api/documents/${doc.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    });
  }, [doc]);

  if (loading) return <div className="p-6 text-text2 text-sm">불러오는 중…</div>;
  if (!doc)    return <div className="p-6 text-text2 text-sm">문서를 찾을 수 없습니다.</div>;

  return (
    <div>
      {/* Doc title bar */}
      <div className="flex items-center gap-2.5 px-6 py-4 border-b border-bd"
        style={{ borderLeft: `3px solid ${meta.color}` }}>
        <span className="text-lg">{meta.icon}</span>
        <span className="font-semibold text-text0 flex-1">{meta.label}</span>
        <SharePopover targetType="document" documentId={doc.id} />
      </div>

      <Editor
        content={doc.content ?? undefined}
        onSave={handleSave}
        placeholder={`${meta.label}을 자유롭게 작성하세요…`}
      />
    </div>
  );
}
