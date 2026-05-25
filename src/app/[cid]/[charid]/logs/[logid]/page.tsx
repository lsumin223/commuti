import LogViewerPage from '@/components/LogViewerPage';

export default function LogPage({ params }: { params: { cid: string; charid: string; logid: string } }) {
  return <LogViewerPage cid={params.cid} charid={params.charid} logid={params.logid} />;
}
