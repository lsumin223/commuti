'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { key: 'profile',  label: '프로필',   color: '#C4607A' },
  { key: 'world',    label: '세계관',   color: '#7A9E8A' },
  { key: 'secret',   label: '비밀정보', color: '#8B6FC4' },
  { key: 'clue',     label: '단서',     color: '#D4874A' },
  { key: 'timeline', label: '타임라인', color: '#4A90D9' },
  { key: 'logs',     label: '로그',     color: '#6B6058' },
];

export default function CharacterNav({ cid, charid }: { cid: string; charid: string }) {
  const pathname = usePathname();

  return (
    <div className="flex items-center gap-1 px-6 border-b border-bd bg-bg overflow-x-auto">
      {NAV_ITEMS.map(item => {
        const href = `/${cid}/${charid}/${item.key}`;
        const active = pathname.startsWith(href);
        return (
          <Link key={item.key} href={href}
            className={cn(
              'px-3 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors -mb-px',
              active
                ? 'border-current text-text0'
                : 'border-transparent text-text2 hover:text-text1',
            )}
            style={active ? { borderColor: item.color, color: item.color } : {}}>
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}
