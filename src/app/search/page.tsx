import AppShell from '@/components/AppShell';
import PageHeader from '@/components/PageHeader';

export default function SearchPage() {
  return (
    <AppShell>
      <PageHeader breadcrumb={[{ label: '검색' }]} />
      <div className="p-6 text-text2 text-sm">검색 페이지 — 준비 중</div>
    </AppShell>
  );
}
