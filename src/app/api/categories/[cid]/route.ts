import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

async function ownsCategory(userId: string, cid: string) {
  const cat = await prisma.category.findFirst({ where: { id: cid, ownerId: userId } });
  return !!cat;
}

export async function PATCH(req: Request, { params }: { params: { cid: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!await ownsCategory(session.user.id, params.cid))
    return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await req.json();
  const updated = await prisma.category.update({
    where: { id: params.cid },
    data: {
      ...(body.name  && { name: body.name.trim() }),
      ...(body.color && { color: body.color }),
    },
  });
  return NextResponse.json(updated);
}

export async function DELETE(_: Request, { params }: { params: { cid: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!await ownsCategory(session.user.id, params.cid))
    return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await prisma.category.delete({ where: { id: params.cid } });
  return NextResponse.json({ ok: true });
}
