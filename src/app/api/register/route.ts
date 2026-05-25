import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  const { email, password, nickname } = await req.json();
  if (!email || !password || !nickname) {
    return NextResponse.json({ error: '모든 필드를 입력해 주세요.' }, { status: 400 });
  }
  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) {
    return NextResponse.json({ error: '이미 사용 중인 이메일입니다.' }, { status: 400 });
  }
  const hashed = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({ data: { email, password: hashed, nickname } });
  return NextResponse.json({ id: user.id });
}
