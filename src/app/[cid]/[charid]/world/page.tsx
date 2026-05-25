import FreeDocPage from '@/components/FreeDocPage';

export default function WorldPage({ params }: { params: { cid: string; charid: string } }) {
  return <FreeDocPage charid={params.charid} kind="WORLD" />;
}
