'use client';

import Image from 'next/image';
import { useRef, useState } from 'react';

interface Character {
  id: string;
  name: string;
  emoji: string | null;
  themeColor: string;
  headImage: string | null;
}

interface Props {
  character: Character;
  onUpdate?: (updated: Partial<Character>) => void;
  editable?: boolean;
}

const CameraIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
    <circle cx="12" cy="13" r="4" />
  </svg>
);

export default function CharacterHeader({ character, onUpdate, editable = true }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleHeadUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch('/api/upload', { method: 'POST', body: fd });
    const { url } = await res.json();
    await fetch(`/api/characters/${character.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ headImage: url }),
    });
    setUploading(false);
    onUpdate?.({ headImage: url });
  }

  return (
    <div className="relative overflow-hidden rounded-b-none"
      style={{ background: `linear-gradient(135deg, ${character.themeColor}18, ${character.themeColor}08)` }}>

      {/* Decorative gradient blob */}
      <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full pointer-events-none"
        style={{
          background: `radial-gradient(circle, ${character.themeColor}40 0%, transparent 70%)`,
          opacity: 0.45,
        }} />

      <div className="relative flex items-end gap-5 px-6 pb-5 pt-6">
        {/* Head image */}
        <div className="relative flex-shrink-0 group">
          <div className="w-20 h-24 rounded-[14px] overflow-hidden border-2 border-white shadow-sm bg-bg2 flex items-center justify-center">
            {character.headImage ? (
              <Image src={character.headImage} alt={character.name}
                width={80} height={96} className="object-cover w-full h-full" />
            ) : (
              <div className="flex flex-col items-center gap-1 text-text2">
                <CameraIcon />
                <span className="text-[10px] font-medium leading-tight text-center px-1">두상<br/>등록</span>
              </div>
            )}
          </div>

          {/* Upload overlay */}
          {editable && (
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="absolute inset-0 rounded-[14px] bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
              title="두상 이미지 변경">
              {uploading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <CameraIcon />
              )}
            </button>
          )}
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleHeadUpload} />
        </div>

        {/* Name + emoji */}
        <div className="pb-1">
          <div className="flex items-center gap-2 mb-0.5">
            {character.emoji && <span className="text-xl leading-none">{character.emoji}</span>}
            <h1 className="text-xl font-bold text-text0">{character.name}</h1>
          </div>
          <div className="text-xs text-text2">캐릭터</div>
        </div>
      </div>
    </div>
  );
}
