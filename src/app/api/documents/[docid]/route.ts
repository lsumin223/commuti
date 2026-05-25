import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

async function ownsDocument(userId: string, docid: string) {
  return prisma.document.findFirst({
    where: { id: docid, character: { category: { ownerId: userId } } },
    include: { character: { include: { category: true } }, sections: { orderBy: { order: 'asc' } } },
  });
}

export async function GET(_: Request, { params }: { params: { docid: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const doc = await ownsDocument(session.user.id, params.docid);
  if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(doc);
}

export async function PATCH(req: Request, { params }: { params: { docid: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const doc = await ownsDocument(session.user.id, params.docid);
  if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { content } = await req.json();
  const updated = await prisma.document.update({
    where: { id: params.docid },
    data: { content },
  });
  return NextResponse.json(updated);
}
