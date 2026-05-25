'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import Editor from '@/components/Editor';

interface Section {
  id: string;
  title: string;
  content: string | null;
  order: number;
}

interface Props {
  charid: string;
}

// ── SortableSection ───────────────────────────────────────────────────────────
interface SortableSectionProps {
  section: Section;
  isFirst: boolean;
  isLast: boolean;
  onRename: (id: string, title: string) => void;
  onDelete: (id: string) => void;
  onMove: (id: string, dir: 'up' | 'down') => void;
  onSaveContent: (id: string, content: string) => void;
  sectionRef: (el: HTMLElement | null) => void;
}

function SortableSection({
  section,
  isFirst,
  isLast,
  onRename,
  onDelete,
  onMove,
  onSaveContent,
  sectionRef,
}: SortableSectionProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: section.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const [menuOpen, setMenuOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(section.title);
  const menuRef = useRef<HTMLDivElement>(null);
  const renameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  useEffect(() => {
    if (renaming) renameRef.current?.focus();
  }, [renaming]);

  const submitRename = () => {
    const trimmed = renameValue.trim();
    if (trimmed && trimmed !== section.title) onRename(section.id, trimmed);
    setRenaming(false);
  };

  const combinedRef = (el: HTMLElement | null) => {
    setNodeRef(el);
    sectionRef(el);
  };

  return (
    <div
      ref={combinedRef}
      style={style}
      data-section-id={section.id}
      className="mb-8"
    >
      {/* Section header row */}
      <div className="flex items-center gap-2 mb-3 group">
        {/* Drag handle */}
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="opacity-0 group-hover:opacity-40 hover:!opacity-70 transition-opacity cursor-grab active:cursor-grabbing p-1 text-text2"
          title="드래그하여 순서 변경"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
            <rect x="2" y="2" width="4" height="4" rx="1"/>
            <rect x="8" y="2" width="4" height="4" rx="1"/>
            <rect x="2" y="8" width="4" height="4" rx="1"/>
            <rect x="8" y="8" width="4" height="4" rx="1"/>
          </svg>
        </button>

        <div className="flex items-center flex-1 gap-2">
          <span className="text-rose opacity-60 text-sm">◆</span>
          <div className="flex-1 h-px bg-bd" />
          {renaming ? (
            <input
              ref={renameRef}
              value={renameValue}
              onChange={e => setRenameValue(e.target.value)}
              onBlur={submitRename}
              onKeyDown={e => {
                if (e.key === 'Enter') submitRename();
                if (e.key === 'Escape') { setRenameValue(section.title); setRenaming(false); }
              }}
              className="text-sm font-semibold text-text0 bg-transparent border-b border-rose outline-none px-1 min-w-0"
              style={{ width: `${Math.max(renameValue.length, 4)}ch` }}
            />
          ) : (
            <span className="text-sm font-semibold text-text0 select-none whitespace-nowrap px-1">
              {section.title}
            </span>
          )}
          <div className="flex-1 h-px bg-bd" />

          {/* ··· menu */}
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen(o => !o)}
              className="opacity-0 group-hover:opacity-60 hover:!opacity-100 transition-opacity p-1 text-text2 hover:text-text0 rounded"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <circle cx="3" cy="8" r="1.5"/>
                <circle cx="8" cy="8" r="1.5"/>
                <circle cx="13" cy="8" r="1.5"/>
              </svg>
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-full mt-1 z-20 bg-bg border border-bd rounded-lg shadow-lg py-1 min-w-[130px]">
                <button
                  type="button"
                  onClick={() => { setMenuOpen(false); setRenaming(true); setRenameValue(section.title); }}
                  className="w-full text-left px-3 py-1.5 text-sm text-text1 hover:bg-bg1 transition-colors"
                >
                  이름 변경
                </button>
                <button
                  type="button"
                  disabled={isFirst}
                  onClick={() => { setMenuOpen(false); onMove(section.id, 'up'); }}
                  className="w-full text-left px-3 py-1.5 text-sm text-text1 hover:bg-bg1 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  위로 이동
                </button>
                <button
                  type="button"
                  disabled={isLast}
                  onClick={() => { setMenuOpen(false); onMove(section.id, 'down'); }}
                  className="w-full text-left px-3 py-1.5 text-sm text-text1 hover:bg-bg1 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  아래로 이동
                </button>
                <div className="my-1 border-t border-bd" />
                <button
                  type="button"
                  onClick={() => { setMenuOpen(false); onDelete(section.id); }}
                  className="w-full text-left px-3 py-1.5 text-sm text-rose hover:bg-rose/5 transition-colors"
                >
                  삭제
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Section editor */}
      <div className="border border-bd rounded-xl overflow-hidden">
        <Editor
          content={section.content ?? undefined}
          onSave={content => onSaveContent(section.id, content)}
          placeholder="섹션 내용을 입력하세요…"
        />
      </div>
    </div>
  );
}

// ── ProfileAnchorEditor ───────────────────────────────────────────────────────
export default function ProfileAnchorEditor({ charid }: Props) {
  const [docId, setDocId] = useState<string | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [addingSection, setAddingSection] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const newTitleRef = useRef<HTMLInputElement>(null);
  const sectionEls = useRef<Map<string, HTMLElement>>(new Map());

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  // Load document + sections
  useEffect(() => {
    fetch(`/api/characters/${charid}/documents?kind=PROFILE`)
      .then(r => r.json())
      .then(async (docs: Array<{ id: string }>) => {
        if (!docs[0]) { setLoading(false); return; }
        const id = docs[0].id;
        setDocId(id);
        const res = await fetch(`/api/documents/${id}/sections`);
        const data: Section[] = await res.json();
        setSections(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [charid]);

  // IntersectionObserver for jump bar active state
  useEffect(() => {
    if (!sections.length) return;
    const observer = new IntersectionObserver(
      entries => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const sid = (entry.target as HTMLElement).dataset.sectionId;
            if (sid) setActiveId(sid);
          }
        }
      },
      { threshold: 0.3 }
    );
    sectionEls.current.forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, [sections]);

  const scrollTo = (id: string) => {
    sectionEls.current.get(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleSaveContent = useCallback(async (sid: string, content: string) => {
    await fetch(`/api/sections/${sid}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    });
  }, []);

  const handleRename = useCallback(async (sid: string, title: string) => {
    setSections(s => s.map(x => x.id === sid ? { ...x, title } : x));
    await fetch(`/api/sections/${sid}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title }),
    });
  }, []);

  const handleDelete = useCallback(async (sid: string) => {
    if (!confirm('이 섹션을 삭제하시겠습니까?')) return;
    setSections(s => s.filter(x => x.id !== sid));
    sectionEls.current.delete(sid);
    await fetch(`/api/sections/${sid}`, { method: 'DELETE' });
  }, []);

  const handleMove = useCallback(async (sid: string, dir: 'up' | 'down') => {
    setSections(prev => {
      const idx = prev.findIndex(s => s.id === sid);
      if (idx === -1) return prev;
      const next = dir === 'up' ? idx - 1 : idx + 1;
      if (next < 0 || next >= prev.length) return prev;
      const reordered = arrayMove(prev, idx, next);
      // persist
      if (docId) {
        fetch(`/api/documents/${docId}/sections`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids: reordered.map(s => s.id) }),
        });
      }
      return reordered;
    });
  }, [docId]);

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setSections(prev => {
      const oldIdx = prev.findIndex(s => s.id === active.id);
      const newIdx = prev.findIndex(s => s.id === over.id);
      const reordered = arrayMove(prev, oldIdx, newIdx);
      if (docId) {
        fetch(`/api/documents/${docId}/sections`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids: reordered.map(s => s.id) }),
        });
      }
      return reordered;
    });
  }, [docId]);

  const handleAddSection = useCallback(async () => {
    if (!docId) return;
    const title = newTitle.trim() || '새 섹션';
    const res = await fetch(`/api/documents/${docId}/sections`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title }),
    });
    const section: Section = await res.json();
    setSections(s => [...s, section]);
    setNewTitle('');
    setAddingSection(false);
    setTimeout(() => {
      sectionEls.current.get(section.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  }, [docId, newTitle]);

  useEffect(() => {
    if (addingSection) newTitleRef.current?.focus();
  }, [addingSection]);

  if (loading) return <div className="p-6 text-text2 text-sm">불러오는 중…</div>;
  if (!docId)  return <div className="p-6 text-text2 text-sm">프로필 문서를 찾을 수 없습니다.</div>;

  return (
    <div>
      {/* Doc title bar */}
      <div
        className="flex items-center gap-2.5 px-6 py-4 border-b border-bd"
        style={{ borderLeft: '3px solid #C4607A' }}
      >
        <span className="text-lg">👤</span>
        <span className="font-semibold text-text0">프로필</span>
      </div>

      {/* Jump bar */}
      <div className="flex items-center gap-2 px-6 py-2.5 border-b border-bd bg-bg1 flex-wrap">
        {sections.map(s => (
          <button
            key={s.id}
            type="button"
            onClick={() => scrollTo(s.id)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${
              activeId === s.id
                ? 'bg-rose text-white'
                : 'bg-bg2 text-text1 hover:bg-rose/10 hover:text-rose'
            }`}
          >
            {s.title}
          </button>
        ))}
        {addingSection ? (
          <div className="flex items-center gap-1">
            <input
              ref={newTitleRef}
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') handleAddSection();
                if (e.key === 'Escape') { setNewTitle(''); setAddingSection(false); }
              }}
              placeholder="섹션 이름"
              className="px-2 py-1 text-xs border border-rose rounded-full outline-none bg-bg text-text0 w-24"
            />
            <button
              type="button"
              onClick={handleAddSection}
              className="px-2 py-1 text-xs bg-rose text-white rounded-full hover:bg-rose/80 transition-colors"
            >
              추가
            </button>
            <button
              type="button"
              onClick={() => { setNewTitle(''); setAddingSection(false); }}
              className="px-2 py-1 text-xs text-text2 hover:text-text1 transition-colors"
            >
              취소
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setAddingSection(true)}
            className="w-6 h-6 flex items-center justify-center rounded-full bg-bg2 text-text2 hover:bg-rose/10 hover:text-rose transition-colors text-sm font-medium"
            title="새 섹션 추가"
          >
            +
          </button>
        )}
      </div>

      {/* Sections */}
      <div className="px-6 pt-6">
        {sections.length === 0 && (
          <div className="text-center py-16 text-text2 text-sm">
            <p className="mb-3">아직 섹션이 없습니다.</p>
            <button
              type="button"
              onClick={() => setAddingSection(true)}
              className="px-4 py-2 bg-rose text-white rounded-lg text-sm hover:bg-rose/80 transition-colors"
            >
              + 첫 섹션 추가
            </button>
          </div>
        )}

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={sections.map(s => s.id)} strategy={verticalListSortingStrategy}>
            {sections.map((section, idx) => (
              <SortableSection
                key={section.id}
                section={section}
                isFirst={idx === 0}
                isLast={idx === sections.length - 1}
                onRename={handleRename}
                onDelete={handleDelete}
                onMove={handleMove}
                onSaveContent={handleSaveContent}
                sectionRef={el => {
                  if (el) sectionEls.current.set(section.id, el);
                  else sectionEls.current.delete(section.id);
                }}
              />
            ))}
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
}
