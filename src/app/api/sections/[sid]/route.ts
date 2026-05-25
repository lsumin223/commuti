import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

async function ownsSection(userId: string, sid: string) {
  return prisma.section.findFirst({
    where: { id: sid, document: { character: { category: { ownerId: userId } } } },
  });
}

export async function PATCH(req: Request, { params }: { params: { sid: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!await ownsSection(session.user.id, params.sid))
    return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await req.json();
  const updated = await prisma.section.update({
    where: { id: params.sid },
    data: {
      ...(body.title   !== undefined && { title: body.title }),
      ...(body.content !== undefined && { content: body.content }),
      ...(body.order   !== undefined && { order: body.order }),
    },
  });
  return NextResponse.json(updated);
}

export async function DELETE(_: Request, { params }: { params: { sid: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!await ownsSection(session.user.id, params.sid))
    return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await prisma.section.delete({ where: { id: params.sid } });
  return NextResponse.json({ ok: true });
}
