import AppShell from '@/components/AppShell';
import NewCharacterForm from './NewCharacterForm';

export default function NewCharacterPage({ params }: { params: { cid: string } }) {
  return (
    <AppShell>
      <NewCharacterForm cid={params.cid} />
    </AppShell>
  );
}
