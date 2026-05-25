import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

async function ownsDoc(userId: string, docid: string) {
  return prisma.document.findFirst({
    where: { id: docid, character: { category: { ownerId: userId } } },
  });
}

export async function GET(_: Request, { params }: { params: { docid: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!await ownsDoc(session.user.id, params.docid))
    return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const sections = await prisma.section.findMany({
    where: { documentId: params.docid },
    orderBy: { order: 'asc' },
  });
  return NextResponse.json(sections);
}

export async function POST(req: Request, { params }: { params: { docid: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!await ownsDoc(session.user.id, params.docid))
    return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { title } = await req.json();
  const count = await prisma.section.count({ where: { documentId: params.docid } });
  const section = await prisma.section.create({
    data: { title: title || '새 섹션', order: count, documentId: params.docid },
  });
  return NextResponse.json(section);
}

// Reorder: PATCH with { ids: string[] }
export async function PATCH(req: Request, { params }: { params: { docid: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!await ownsDoc(session.user.id, params.docid))
    return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { ids } = await req.json() as { ids: string[] };
  await Promise.all(
    ids.map((id, i) => prisma.section.update({ where: { id }, data: { order: i } }))
  );
  return NextResponse.json({ ok: true });
}
