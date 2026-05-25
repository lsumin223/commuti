import LogListPage from '@/components/LogListPage';

export default function LogsPage({ params }: { params: { cid: string; charid: string } }) {
  return <LogListPage cid={params.cid} charid={params.charid} />;
}
