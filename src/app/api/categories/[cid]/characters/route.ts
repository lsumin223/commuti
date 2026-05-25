import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const DOC_KINDS = ['PROFILE', 'WORLD', 'SECRET', 'CLUE', 'TIMELINE'] as const;
const DEFAULT_SECTIONS = ['기본정보', '외모', '성격'];

export async function POST(req: Request, { params }: { params: { cid: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const cat = await prisma.category.findFirst({
    where: { id: params.cid, ownerId: session.user.id },
  });
  if (!cat) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { name, emoji, themeColor } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: '이름을 입력해 주세요.' }, { status: 400 });

  const count = await prisma.character.count({ where: { categoryId: params.cid } });

  const character = await prisma.character.create({
    data: {
      name: name.trim(),
      emoji: emoji || null,
      themeColor: themeColor || '#C4607A',
      order: count,
      categoryId: params.cid,
      // Auto-create 5 documents
      documents: {
        create: DOC_KINDS.map((kind, i) => ({
          kind,
          order: i,
          // Create default sections for PROFILE
          ...(kind === 'PROFILE' ? {
            sections: {
              create: DEFAULT_SECTIONS.map((title, j) => ({ title, order: j })),
            },
          } : {}),
        })),
      },
    },
    include: { documents: true },
  });

  return NextResponse.json(character);
}
