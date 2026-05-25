'use client';

import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

const EMOJI_GROUPS = [
  { label: '사람', emojis: ['🌙','⭐','✦','🌸','🌺','🌹','🌻','🍀','🌿','🍃','🌊','🔥','❄️','⚡','🌈'] },
  { label: '동물', emojis: ['🐺','🦊','🐱','🐰','🐻','🦁','🐯','🐼','🦋','🐦','🦅','🐉','🦄','🐠','🐺'] },
  { label: '물건', emojis: ['⚔️','🗡️','🛡️','🏹','🔮','📖','📜','🪄','💎','👑','🗝️','⚗️','🧪','🎭','🎨'] },
  { label: '기호', emojis: ['♠','♥','♦','♣','✿','❀','✽','✺','❋','✻','✼','❁','✾','❃','✠'] },
];

interface Props {
  value: string;
  onChange: (emoji: string) => void;
}

export default function EmojiPicker({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button type="button" onClick={() => setOpen(o => !o)}
        className="w-14 h-14 rounded-xl border-2 border-bd hover:border-rose transition-colors text-3xl flex items-center justify-center bg-bg1">
        {value || <span className="text-lg text-text2">✦</span>}
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 w-72 bg-white border border-bd rounded-card shadow-lg p-3 z-50">
          <div className="space-y-3">
            {EMOJI_GROUPS.map(g => (
              <div key={g.label}>
                <div className="text-xs text-text2 mb-1.5 font-medium">{g.label}</div>
                <div className="grid grid-cols-8 gap-0.5">
                  {g.emojis.map(em => (
                    <button key={em} type="button"
                      onClick={() => { onChange(em); setOpen(false); }}
                      className={cn(
                        'w-8 h-8 rounded-lg text-lg flex items-center justify-center hover:bg-bg2 transition-colors',
                        value === em && 'bg-rose-xl',
                      )}>
                      {em}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <button type="button" onClick={() => { onChange(''); setOpen(false); }}
            className="mt-2 w-full text-xs text-text2 hover:text-rose py-1">
            이모지 제거
          </button>
        </div>
      )}
    </div>
  );
}
