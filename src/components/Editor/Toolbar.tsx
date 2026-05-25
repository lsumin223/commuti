'use client';

import { Editor } from '@tiptap/react';
import { useState, useRef } from 'react';
import ColorPicker from './ColorPicker';

// ── Tiny icon helpers ─────────────────────────────────────
const Ic = ({ d, w = 14, h = 14, viewBox = '0 0 24 24', fill = false, children }: any) => (
  <svg width={w} height={h} viewBox={viewBox} fill={fill ? 'currentColor' : 'none'}
    stroke={fill ? 'none' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {d ? <path d={d} /> : children}
  </svg>
);

const FONT_FAMILIES = [
  { label: 'Pretendard',  value: 'Pretendard, sans-serif' },
  { label: '나눔명조',    value: "'Nanum Myeongjo', serif" },
  { label: '나눔손글씨',  value: "'Nanum Pen Script', cursive" },
];
const FONT_SIZES  = ['12px','14px','16px','18px','20px','24px','28px','32px','36px'];
const LETTER_SPACINGS = [
  { label: '좁게 -5%', value: '-0.05em' },
  { label: '기본',     value: '0em' },
  { label: '보통 5%', value: '0.05em' },
  { label: '넓게 10%', value: '0.1em' },
  { label: '더 넓게 15%', value: '0.15em' },
  { label: '최대 20%', value: '0.2em' },
];
const LINE_HEIGHTS = ['1.2','1.5','1.75','2.0','2.5'];

interface Props { editor: Editor; onFocusMode: () => void; focusMode: boolean; }

export default function Toolbar({ editor, onFocusMode, focusMode }: Props) {
  const [colorTarget, setColorTarget] = useState<'text' | 'highlight' | null>(null);
  const colorRef = useRef<HTMLDivElement>(null);

  const btn = (active: boolean, onClick: () => void, title: string, children: React.ReactNode) => (
    <button type="button" title={title} onClick={onClick}
      className={`w-7 h-7 rounded-[6px] flex items-center justify-center transition-colors text-sm
        ${active ? 'bg-rose-xl text-rose' : 'text-text1 hover:bg-bg2'}`}>
      {children}
    </button>
  );

  const sep = () => <div className="w-px h-4 bg-bd mx-0.5 self-center" />;

  const curFontSize = editor.getAttributes('textStyle').fontSize as string | undefined;
  const curLetterSpacing = editor.getAttributes('textStyle').letterSpacing as string | undefined;
  const curLineHeight = editor.getAttributes('paragraph').lineHeight as string | undefined;
  const curFontFamily = editor.getAttributes('textStyle').fontFamily as string | undefined;
  const curColor = editor.getAttributes('textStyle').color as string || '#2C2520';
  const curHighlight = editor.getAttributes('highlight').color as string || '#FAF0F2';

  return (
    <div className="border-b border-bd bg-bg sticky top-[49px] z-10">
      {/* Row 1 — basic formatting */}
      <div className="flex items-center gap-0.5 px-3 py-1.5 flex-wrap">
        {btn(editor.isActive('bold'), () => editor.chain().focus().toggleBold().run(), '굵게 (Ctrl+B)',
          <strong className="text-xs font-black">B</strong>)}
        {btn(editor.isActive('italic'), () => editor.chain().focus().toggleItalic().run(), '기울기',
          <em className="text-xs font-semibold">I</em>)}
        {btn(editor.isActive('underline'), () => editor.chain().focus().toggleUnderline().run(), '밑줄',
          <span className="text-xs font-semibold underline">U</span>)}
        {btn(editor.isActive('strike'), () => editor.chain().focus().toggleStrike().run(), '취소선',
          <span className="text-xs font-semibold line-through">S</span>)}

        {sep()}

        {(['1','2','3'] as const).map(n =>
          btn(
            editor.isActive('heading', { level: +n }),
            () => editor.chain().focus().toggleHeading({ level: +n as 1|2|3 }).run(),
            `제목 ${n}`,
            <span className="text-xs font-bold">H{n}</span>
          )
        )}

        {sep()}

        {btn(editor.isActive('blockquote'), () => editor.chain().focus().toggleBlockquote().run(), '인용문',
          <Ic><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"/><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z"/></Ic>)}
        {btn(false, () => editor.chain().focus().setHorizontalRule().run(), '구분선',
          <Ic><line x1="5" y1="12" x2="19" y2="12" /></Ic>)}

        {sep()}

        {btn(editor.isActive('bulletList'), () => editor.chain().focus().toggleBulletList().run(), '기호 목록',
          <Ic><line x1="9" y1="6" x2="20" y2="6"/><line x1="9" y1="12" x2="20" y2="12"/><line x1="9" y1="18" x2="20" y2="18"/><circle cx="4" cy="6" r="1" fill="currentColor"/><circle cx="4" cy="12" r="1" fill="currentColor"/><circle cx="4" cy="18" r="1" fill="currentColor"/></Ic>)}
        {btn(editor.isActive('orderedList'), () => editor.chain().focus().toggleOrderedList().run(), '번호 목록',
          <Ic><line x1="10" y1="6" x2="21" y2="6"/><line x1="10" y1="12" x2="21" y2="12"/><line x1="10" y1="18" x2="21" y2="18"/><path d="M4 6h1v4"/><path d="M4 10H6"/><path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"/></Ic>)}

        {sep()}

        {/* Image */}
        {btn(false, async () => {
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = 'image/*';
          input.onchange = async () => {
            const file = input.files?.[0];
            if (!file) return;
            const fd = new FormData();
            fd.append('file', file);
            const res = await fetch('/api/upload', { method: 'POST', body: fd });
            const { url } = await res.json();
            editor.chain().focus().setImage({ src: url }).run();
          };
          input.click();
        }, '이미지 삽입',
          <Ic><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" stroke="none"/><polyline points="21 15 16 10 5 21"/></Ic>
        )}

        {/* Table */}
        {btn(editor.isActive('table'), () =>
          editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(), '표 삽입',
          <Ic><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="12" y1="3" x2="12" y2="21"/></Ic>
        )}

        {/* Link */}
        {btn(editor.isActive('link'), () => {
          const url = window.prompt('링크 URL', editor.getAttributes('link').href || '');
          if (url === null) return;
          if (!url) { editor.chain().focus().unsetLink().run(); return; }
          editor.chain().focus().setLink({ href: url, target: '_blank' }).run();
        }, '링크',
          <Ic><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></Ic>
        )}

        {/* Spoiler */}
        {btn(editor.isActive('spoiler'), () => (editor.chain().focus() as any).toggleSpoiler().run(), '접은글',
          <Ic><polyline points="9 18 15 12 9 6"/></Ic>
        )}

        <div className="ml-auto flex items-center gap-1">
          {btn(focusMode, onFocusMode, '집중 모드',
            <Ic><path d="M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3"/></Ic>
          )}
        </div>
      </div>

      {/* Row 2 — typography */}
      <div className="flex items-center gap-1 px-3 py-1 border-t border-bd bg-bg1 flex-wrap">
        {/* Font family */}
        <select value={curFontFamily || ''}
          onChange={e => {
            if (e.target.value) editor.chain().focus().setFontFamily(e.target.value).run();
            else editor.chain().focus().unsetFontFamily().run();
          }}
          className="h-7 px-2 rounded-[6px] border border-bd text-xs bg-white text-text1 focus:outline-none focus:border-rose">
          <option value="">기본 폰트</option>
          {FONT_FAMILIES.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
        </select>

        {sep()}

        {/* Font size */}
        <select value={curFontSize || ''}
          onChange={e => {
            if (e.target.value) editor.chain().focus().setFontSize(e.target.value).run();
            else editor.chain().focus().unsetFontSize().run();
          }}
          className="h-7 px-2 rounded-[6px] border border-bd text-xs bg-white text-text1 focus:outline-none focus:border-rose w-20">
          <option value="">크기</option>
          {FONT_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>

        {sep()}

        {/* Letter spacing */}
        <select value={curLetterSpacing || ''}
          onChange={e => {
            if (e.target.value && e.target.value !== '0em') editor.chain().focus().setLetterSpacing(e.target.value).run();
            else editor.chain().focus().unsetLetterSpacing().run();
          }}
          className="h-7 px-2 rounded-[6px] border border-bd text-xs bg-white text-text1 focus:outline-none focus:border-rose w-24">
          <option value="">자간</option>
          {LETTER_SPACINGS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>

        {/* Line height */}
        <select value={curLineHeight || ''}
          onChange={e => {
            if (e.target.value) editor.chain().focus().setLineHeight(e.target.value).run();
          }}
          className="h-7 px-2 rounded-[6px] border border-bd text-xs bg-white text-text1 focus:outline-none focus:border-rose w-24">
          <option value="">줄간격</option>
          {LINE_HEIGHTS.map(l => <option key={l} value={l}>{l}</option>)}
        </select>

        {sep()}

        {/* Text color */}
        <div className="relative" ref={colorTarget === 'text' ? colorRef : undefined}>
          <button type="button" title="글자 색"
            onClick={() => setColorTarget(c => c === 'text' ? null : 'text')}
            className="h-7 w-7 rounded-[6px] border border-bd flex flex-col items-center justify-center gap-0.5 hover:bg-bg2 transition-colors">
            <span className="text-xs font-bold leading-none text-text1">A</span>
            <span className="w-4 h-1 rounded-full" style={{ background: curColor }} />
          </button>
          {colorTarget === 'text' && (
            <ColorPicker value={curColor}
              onChange={c => editor.chain().focus().setColor(c).run()}
              onClose={() => setColorTarget(null)} />
          )}
        </div>

        {/* Highlight color */}
        <div className="relative" ref={colorTarget === 'highlight' ? colorRef : undefined}>
          <button type="button" title="배경 하이라이트 색"
            onClick={() => setColorTarget(c => c === 'highlight' ? null : 'highlight')}
            className="h-7 w-7 rounded-[6px] border border-bd flex flex-col items-center justify-center gap-0.5 hover:bg-bg2 transition-colors">
            <span className="text-xs font-bold leading-none text-text1"
              style={{ background: curHighlight, padding: '0 2px', borderRadius: 2 }}>A</span>
            <span className="w-4 h-1 rounded-full" style={{ background: curHighlight, border: '1px solid #E4DDD0' }} />
          </button>
          {colorTarget === 'highlight' && (
            <ColorPicker value={curHighlight}
              onChange={c => editor.chain().focus().toggleHighlight({ color: c }).run()}
              onClose={() => setColorTarget(null)} />
          )}
        </div>
      </div>
    </div>
  );
}
