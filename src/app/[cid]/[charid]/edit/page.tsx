import AppShell from '@/components/AppShell';
import EditCharacterForm from './EditCharacterForm';

export default function EditCharacterPage({ params }: { params: { cid: string; charid: string } }) {
  return (
    <AppShell>
      <EditCharacterForm cid={params.cid} charid={params.charid} />
    </AppShell>
  );
}
