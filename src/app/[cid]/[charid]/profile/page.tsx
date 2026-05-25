import FreeDocPage from '@/components/FreeDocPage';

// Week 4에서 앵커 에디터로 교체 예정
export default function ProfilePage({ params }: { params: { cid: string; charid: string } }) {
  return <FreeDocPage charid={params.charid} kind="PROFILE" />;
}
