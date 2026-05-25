import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const categories = await prisma.category.findMany({
    where: { ownerId: session.user.id },
    orderBy: { order: 'asc' },
    include: {
      characters: {
        orderBy: { order: 'asc' },
        include: {
          logs: {
            orderBy: { order: 'asc' },
            select: { id: true, title: true, kind: true },
          },
        },
      },
    },
  });

  return NextResponse.json(categories);
}
