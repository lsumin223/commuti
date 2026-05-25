import FreeDocPage from '@/components/FreeDocPage';

export default function TimelinePage({ params }: { params: { cid: string; charid: string } }) {
  return <FreeDocPage charid={params.charid} kind="TIMELINE" />;
}
