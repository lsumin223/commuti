import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

async function ownsCharacter(userId: string, charid: string) {
  const char = await prisma.character.findFirst({
    where: { id: charid, category: { ownerId: userId } },
    include: { category: true },
  });
  return char;
}

export async function GET(_: Request, { params }: { params: { charid: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const char = await ownsCharacter(session.user.id, params.charid);
  if (!char) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(char);
}

export async function PATCH(req: Request, { params }: { params: { charid: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!await ownsCharacter(session.user.id, params.charid))
    return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await req.json();
  const updated = await prisma.character.update({
    where: { id: params.charid },
    data: {
      ...(body.name       !== undefined && { name: body.name.trim() }),
      ...(body.emoji      !== undefined && { emoji: body.emoji }),
      ...(body.themeColor !== undefined && { themeColor: body.themeColor }),
      ...(body.headImage  !== undefined && { headImage: body.headImage }),
    },
  });
  return NextResponse.json(updated);
}

export async function DELETE(_: Request, { params }: { params: { charid: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!await ownsCharacter(session.user.id, params.charid))
    return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await prisma.character.delete({ where: { id: params.charid } });
  return NextResponse.json({ ok: true });
}
