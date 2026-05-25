import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

async function ownsCharacter(userId: string, charid: string) {
  return prisma.character.findFirst({
    where: { id: charid, category: { ownerId: userId } },
  });
}

export async function GET(req: Request, { params }: { params: { charid: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!await ownsCharacter(session.user.id, params.charid))
    return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const kind = searchParams.get('kind');

  const logs = await prisma.log.findMany({
    where: { characterId: params.charid, ...(kind ? { kind } : {}) },
    include: { series: { select: { id: true, name: true } } },
    orderBy: { updatedAt: 'desc' },
  });
  return NextResponse.json(logs);
}

export async function POST(req: Request, { params }: { params: { charid: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!await ownsCharacter(session.user.id, params.charid))
    return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { title, kind, visibility, seriesId } = await req.json();
  const log = await prisma.log.create({
    data: {
      title: title?.trim() || '새 로그',
      kind: kind || 'TEXT',
      visibility: visibility || 'private',
      characterId: params.charid,
      ...(seriesId ? { seriesId } : {}),
    },
    include: { series: { select: { id: true, name: true } } },
  });
  return NextResponse.json(log);
}
