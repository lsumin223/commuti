import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q')?.trim();
  if (!q || q.length < 1) return NextResponse.json({ characters: [], logs: [], sections: [] });

  const userId = session.user.id;

  const [characters, logs, sections] = await Promise.all([
    prisma.character.findMany({
      where: {
        category: { ownerId: userId },
        OR: [{ name: { contains: q } }, { emoji: { contains: q } }],
      },
      include: { category: { select: { id: true, name: true, color: true } } },
      take: 10,
    }),

    prisma.log.findMany({
      where: {
        character: { category: { ownerId: userId } },
        title: { contains: q },
      },
      include: {
        character: { include: { category: { select: { id: true } } } },
      },
      take: 10,
    }),

    prisma.section.findMany({
      where: {
        document: { character: { category: { ownerId: userId } } },
        OR: [
          { title: { contains: q } },
          { content: { contains: q } },
        ],
      },
      include: {
        document: {
          include: {
            character: { include: { category: { select: { id: true } } } },
          },
        },
      },
      take: 10,
    }),
  ]);

  return NextResponse.json({ characters, logs, sections });
}
