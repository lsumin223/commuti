import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

async function ownsCharacter(userId: string, charid: string) {
  return prisma.character.findFirst({
    where: { id: charid, category: { ownerId: userId } },
  });
}

export async function GET(_: Request, { params }: { params: { charid: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!await ownsCharacter(session.user.id, params.charid))
    return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const series = await prisma.logSeries.findMany({
    where: { characterId: params.charid },
    orderBy: { createdAt: 'asc' },
    include: { _count: { select: { logs: true } } },
  });
  return NextResponse.json(series);
}

export async function POST(req: Request, { params }: { params: { charid: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!await ownsCharacter(session.user.id, params.charid))
    return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { name } = await req.json();
  const series = await prisma.logSeries.create({
    data: { name: name?.trim() || '새 시리즈', characterId: params.charid },
  });
  return NextResponse.json(series);
}
