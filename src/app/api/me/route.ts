import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json() as {
    nickname?: string;
    currentPassword?: string;
    newPassword?: string;
  };

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const data: { nickname?: string; password?: string } = {};

  if (body.nickname?.trim()) {
    data.nickname = body.nickname.trim();
  }

  if (body.newPassword) {
    if (!body.currentPassword) return NextResponse.json({ error: '현재 비밀번호를 입력하세요.' }, { status: 400 });
    const ok = await bcrypt.compare(body.currentPassword, user.password);
    if (!ok) return NextResponse.json({ error: '현재 비밀번호가 올바르지 않습니다.' }, { status: 400 });
    data.password = await bcrypt.hash(body.newPassword, 10);
  }

  if (Object.keys(data).length === 0)
    return NextResponse.json({ error: '변경할 내용이 없습니다.' }, { status: 400 });

  await prisma.user.update({ where: { id: session.user.id }, data });
  return NextResponse.json({ ok: true });
}
