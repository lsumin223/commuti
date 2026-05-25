import FreeDocPage from '@/components/FreeDocPage';

export default function CluePage({ params }: { params: { cid: string; charid: string } }) {
  return <FreeDocPage charid={params.charid} kind="CLUE" />;
}
