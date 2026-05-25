import AppShell from '@/components/AppShell';
import CharacterLayoutClient from './CharacterLayoutClient';

export default function CharacterLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { cid: string; charid: string };
}) {
  return (
    <AppShell>
      <CharacterLayoutClient cid={params.cid} charid={params.charid}>
        {children}
      </CharacterLayoutClient>
    </AppShell>
  );
}
