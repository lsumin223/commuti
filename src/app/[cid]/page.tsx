import AppShell from '@/components/AppShell';
import CategoryHome from './CategoryHome';

export default function CategoryPage({ params }: { params: { cid: string } }) {
  return (
    <AppShell>
      <CategoryHome cid={params.cid} />
    </AppShell>
  );
}
