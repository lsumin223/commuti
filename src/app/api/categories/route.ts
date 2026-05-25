import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { name, color } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: '이름을 입력해 주세요.' }, { status: 400 });

  const count = await prisma.category.count({ where: { ownerId: session.user.id } });
  const category = await prisma.category.create({
    data: { name: name.trim(), color: color || '#C4607A', ownerId: session.user.id, order: count },
  });

  return NextResponse.json(category);
}
