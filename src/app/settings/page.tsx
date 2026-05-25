import AppShell from '@/components/AppShell';
import PageHeader from '@/components/PageHeader';

export default function SettingsPage() {
  return (
    <AppShell>
      <PageHeader breadcrumb={[{ label: '설정' }]} />
      <div className="p-6 text-text2 text-sm">설정 페이지 — 준비 중</div>
    </AppShell>
  );
}
