import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// POST: create a ShareLink
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json() as {
    targetType: string;
    categoryId?: string;
    characterId?: string;
    documentId?: string;
    logId?: string;
    password?: string;
    expiresAt?: string;
  };

  // Verify ownership based on targetType
  const userId = session.user.id;
  const { targetType, categoryId, characterId, documentId, logId, password, expiresAt } = body;

  if (targetType === 'category' && categoryId) {
    const owns = await prisma.category.findFirst({ where: { id: categoryId, ownerId: userId } });
    if (!owns) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  } else if ((targetType === 'character' || targetType === 'log-list') && characterId) {
    const owns = await prisma.character.findFirst({ where: { id: characterId, category: { ownerId: userId } } });
    if (!owns) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  } else if (targetType === 'document' && documentId) {
    const owns = await prisma.document.findFirst({ where: { id: documentId, character: { category: { ownerId: userId } } } });
    if (!owns) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  } else if (targetType === 'log' && logId) {
    const owns = await prisma.log.findFirst({ where: { id: logId, character: { category: { ownerId: userId } } } });
    if (!owns) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  } else {
    return NextResponse.json({ error: 'Invalid target' }, { status: 400 });
  }

  const link = await prisma.shareLink.create({
    data: {
      targetType,
      ...(categoryId  && { categoryId }),
      ...(characterId && { characterId }),
      ...(documentId  && { documentId }),
      ...(logId       && { logId }),
      ...(password    && { password }),
      ...(expiresAt   && { expiresAt: new Date(expiresAt) }),
    },
  });

  return NextResponse.json({
    token: link.token,
    url: `/share/${link.token}`,
  });
}
