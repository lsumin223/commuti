'use client';

import { useRef, useEffect } from 'react';

const PRESETS = [
  '#2C2520','#6B6058','#A89E94',
  '#C4607A','#D4874A','#D4B44A',
  '#7A9E8A','#4A90D9','#8B6FC4',
  '#ffffff','#FAF0F2','#D8EAE0',
];

interface Props {
  value: string;
  onChange: (color: string) => void;
  onClose: () => void;
}

export default function ColorPicker({ value, onChange, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  return (
    <div ref={ref}
      className="absolute top-full left-0 mt-1 z-50 bg-white border border-bd rounded-card shadow-lg p-3 w-44">
      <div className="grid grid-cols-6 gap-1.5 mb-2">
        {PRESETS.map(c => (
          <button key={c} type="button"
            onClick={() => { onChange(c); onClose(); }}
            className="w-6 h-6 rounded-md border transition-transform hover:scale-110"
            style={{
              background: c,
              borderColor: value === c ? '#C4607A' : '#E4DDD0',
              borderWidth: value === c ? 2 : 1,
            }} />
        ))}
      </div>
      <input type="color" value={value || '#000000'}
        onChange={e => onChange(e.target.value)}
        className="w-full h-7 rounded cursor-pointer border border-bd" />
    </div>
  );
}
