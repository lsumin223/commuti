import { redirect } from 'next/navigation';

export default function CharacterPage({ params }: { params: { cid: string; charid: string } }) {
  redirect(`/${params.cid}/${params.charid}/profile`);
}
