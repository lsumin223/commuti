import FreeDocPage from '@/components/FreeDocPage';

export default function SecretPage({ params }: { params: { cid: string; charid: string } }) {
  return <FreeDocPage charid={params.charid} kind="SECRET" />;
}
