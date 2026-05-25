import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

async function ownsLog(userId: string, logid: string) {
  return prisma.log.findFirst({
    where: { id: logid, character: { category: { ownerId: userId } } },
    include: { series: { select: { id: true, name: true } } },
  });
}

export async function GET(_: Request, { params }: { params: { logid: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const log = await ownsLog(session.user.id, params.logid);
  if (!log) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(log);
}

export async function PATCH(req: Request, { params }: { params: { logid: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!await ownsLog(session.user.id, params.logid))
    return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await req.json();
  const updated = await prisma.log.update({
    where: { id: params.logid },
    data: {
      ...(body.title      !== undefined && { title: body.title }),
      ...(body.content    !== undefined && { content: body.content }),
      ...(body.images     !== undefined && { images: body.images }),
      ...(body.visibility !== undefined && { visibility: body.visibility }),
      ...(body.seriesId   !== undefined && { seriesId: body.seriesId }),
    },
    include: { series: { select: { id: true, name: true } } },
  });
  return NextResponse.json(updated);
}

export async function DELETE(_: Request, { params }: { params: { logid: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!await ownsLog(session.user.id, params.logid))
    return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await prisma.log.delete({ where: { id: params.logid } });
  return NextResponse.json({ ok: true });
}
