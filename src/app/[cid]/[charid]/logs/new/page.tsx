import NewLogPage from '@/components/NewLogPage';

export default function NewLog({ params }: { params: { cid: string; charid: string } }) {
  return <NewLogPage cid={params.cid} charid={params.charid} />;
}
