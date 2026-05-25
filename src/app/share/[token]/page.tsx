import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import SharePageClient from './SharePageClient';

export default async function SharePage({ params }: { params: { token: string } }) {
  const link = await prisma.shareLink.findUnique({
    where: { token: params.token },
    include: {
      category: {
        include: {
          characters: {
            include: {
              documents: { include: { sections: { orderBy: { order: 'asc' } } } },
              logs: { orderBy: { updatedAt: 'desc' } },
            },
            orderBy: { order: 'asc' },
          },
        },
      },
      character: {
        include: {
          documents: { include: { sections: { orderBy: { order: 'asc' } } } },
          logs: { orderBy: { updatedAt: 'desc' } },
        },
      },
      document: {
        include: { sections: { orderBy: { order: 'asc' } } },
      },
      log: true,
    },
  });

  if (!link) notFound();

  if (link.expiresAt && link.expiresAt < new Date()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <div className="text-center text-text2">
          <p className="text-2xl mb-2">⏰</p>
          <p className="font-medium text-text1">링크가 만료되었습니다.</p>
        </div>
      </div>
    );
  }

  // Serialize (Dates → strings)
  const serialized = JSON.parse(JSON.stringify({
    token: link.token,
    targetType: link.targetType,
    password: link.password,
    category: link.category,
    character: link.character,
    document: link.document,
    log: link.log,
  }));

  return (
    <SharePageClient
      link={serialized}
      needsPassword={!!link.password}
    />
  );
}
