import Link from 'next/link';
import { cn } from '@/lib/utils';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export default function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav className="flex items-center gap-1.5 text-sm text-text2">
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1.5">
          {i > 0 && <span className="text-bd2">›</span>}
          {item.href ? (
            <Link href={item.href}
              className="hover:text-text0 transition-colors">
              {item.label}
            </Link>
          ) : (
            <span className={cn(i === items.length - 1 && 'text-text0 font-medium')}>
              {item.label}
            </span>
          )}
        </span>
      ))}
    </nav>
  );
}
