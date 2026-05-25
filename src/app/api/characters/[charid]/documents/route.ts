import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request, { params }: { params: { charid: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const kind = searchParams.get('kind');

  const where = {
    characterId: params.charid,
    character: { category: { ownerId: session.user.id } },
    ...(kind ? { kind } : {}),
  };

  const docs = await prisma.document.findMany({
    where,
    include: { sections: { orderBy: { order: 'asc' } } },
    orderBy: { order: 'asc' },
  });

  return NextResponse.json(docs);
}
