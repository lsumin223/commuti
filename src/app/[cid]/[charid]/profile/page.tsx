import ProfileAnchorEditor from '@/components/ProfileAnchorEditor';

export default function ProfilePage({ params }: { params: { cid: string; charid: string } }) {
  return <ProfileAnchorEditor charid={params.charid} />;
}
