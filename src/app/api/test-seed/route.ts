import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userId = session.user.id;

  // 기존 테스트 카테고리 확인
  const existing = await prisma.category.findFirst({
    where: { ownerId: userId, name: '[테스트] 창작 캐릭터' },
    include: {
      characters: {
        include: { documents: { include: { sections: true } }, logs: true },
      },
    },
  });
  if (existing) return NextResponse.json({ existing: true, category: existing });

  // 카테고리 생성
  const category = await prisma.category.create({
    data: { name: '[테스트] 창작 캐릭터', color: '#C4607A', ownerId: userId },
  });

  // 캐릭터 1: 은하
  const char1 = await prisma.character.create({
    data: { name: '이은하', emoji: '🌙', themeColor: '#8B6FC4', categoryId: category.id },
  });

  const DOC_KINDS = ['PROFILE', 'WORLD', 'SECRET', 'CLUE', 'TIMELINE'];
  const docs1 = await Promise.all(
    DOC_KINDS.map((kind, i) =>
      prisma.document.create({ data: { kind, order: i, characterId: char1.id } })
    )
  );
  const profileDoc1 = docs1.find(d => d.kind === 'PROFILE')!;

  const profileContent = JSON.stringify({
    type: 'doc',
    content: [
      { type: 'paragraph', content: [{ type: 'text', marks: [{ type: 'bold' }], text: '이은하' }, { type: 'text', text: '는 달빛 아래서만 능력이 깨어나는 신비로운 소녀입니다.' }] },
      { type: 'paragraph', content: [{ type: 'text', text: '외모는 평범해 보이지만 눈동자가 달의 위상에 따라 색이 변합니다.' }] },
    ],
  });

  await prisma.section.createMany({
    data: [
      { title: '기본정보', content: profileContent, order: 0, documentId: profileDoc1.id },
      { title: '외모', content: JSON.stringify({ type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: '신장 162cm, 은빛 머리카락, 보랏빛 눈동자.' }] }] }), order: 1, documentId: profileDoc1.id },
      { title: '성격', content: JSON.stringify({ type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: '조용하고 관찰력이 뛰어남. 낯선 사람에게는 차갑게 보이지만 가까운 사람에게는 따뜻함.' }] }] }), order: 2, documentId: profileDoc1.id },
      { title: '능력', content: JSON.stringify({ type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', marks: [{ type: 'bold' }], text: '달빛 조작' }, { type: 'text', text: ': 달빛을 물질화하여 방어막이나 공격 수단으로 사용.' }] }] }), order: 3, documentId: profileDoc1.id },
    ],
  });

  // 세계관 문서 내용
  const worldDoc1 = docs1.find(d => d.kind === 'WORLD')!;
  await prisma.document.update({
    where: { id: worldDoc1.id },
    data: { content: JSON.stringify({ type: 'doc', content: [{ type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '달의 균열' }] }, { type: 'paragraph', content: [{ type: 'text', text: '이 세계에는 달이 두 개 존재합니다. 하나는 현실의 달, 하나는 그림자의 달. 그림자의 달이 현실과 겹치는 날, 선택받은 자들에게 능력이 깃들게 됩니다.' }] }] }) },
  });

  // 글로그
  const textLog = await prisma.log.create({
    data: {
      title: '달빛 아래서',
      kind: 'TEXT',
      content: JSON.stringify({
        type: 'doc',
        content: [
          { type: 'paragraph', content: [{ type: 'text', text: '그날 밤, 달은 유난히 밝았다.' }] },
          { type: 'paragraph', content: [{ type: 'text', text: '은하는 창문 너머로 손을 뻗었다. 손끝에서 은빛 빛이 피어올랐다.' }] },
          { type: 'blockquote', content: [{ type: 'paragraph', content: [{ type: 'text', text: '"이게... 내 힘인가요?"' }] }] },
        ],
      }),
      visibility: 'private',
      characterId: char1.id,
    },
  });

  // 캐릭터 2: 해준
  const char2 = await prisma.character.create({
    data: { name: '최해준', emoji: '☀️', themeColor: '#C4607A', categoryId: category.id, order: 1 },
  });

  const docs2 = await Promise.all(
    DOC_KINDS.map((kind, i) =>
      prisma.document.create({ data: { kind, order: i, characterId: char2.id } })
    )
  );
  const profileDoc2 = docs2.find(d => d.kind === 'PROFILE')!;

  await prisma.section.createMany({
    data: [
      { title: '기본정보', content: JSON.stringify({ type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: '최해준은 태양의 기사단 소속, 강인한 의지와 따뜻한 마음을 가진 청년입니다.' }] }] }), order: 0, documentId: profileDoc2.id },
      { title: '외모', content: JSON.stringify({ type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: '신장 179cm, 짧은 갈색 머리, 황금빛 눈동자.' }] }] }), order: 1, documentId: profileDoc2.id },
      { title: '성격', content: JSON.stringify({ type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: '밝고 적극적. 위기 상황에서도 웃음을 잃지 않는다.' }] }] }), order: 2, documentId: profileDoc2.id },
    ],
  });

  // 시리즈 + 로그 (캐릭터 2)
  const series = await prisma.logSeries.create({
    data: { name: '태양의 기사단 연대기', characterId: char2.id },
  });

  await prisma.log.createMany({
    data: [
      {
        title: '기사단 입단 첫 날',
        kind: 'TEXT',
        content: JSON.stringify({ type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: '해준이 기사단에 발을 들인 건 열여섯 살 때였다. 훈련장에서 처음 만난 교관은 무서웠지만, 동료들은 따뜻했다.' }] }] }),
        visibility: 'link',
        characterId: char2.id,
        seriesId: series.id,
      },
      {
        title: '첫 번째 임무',
        kind: 'TEXT',
        content: JSON.stringify({ type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: '마을 외곽에서 이상한 기운이 감지됐다는 보고가 들어왔다. 해준이 첫 임무로 배정받은 현장이었다.' }] }] }),
        visibility: 'private',
        characterId: char2.id,
        seriesId: series.id,
      },
    ],
  });

  const finalCategory = await prisma.category.findUnique({
    where: { id: category.id },
    include: {
      characters: {
        include: { documents: { include: { sections: true } }, logs: true },
      },
    },
  });

  return NextResponse.json({ existing: false, category: finalCategory });
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const categories = await prisma.category.findMany({
    where: { ownerId: session.user.id },
    include: {
      characters: {
        include: { documents: true, logs: true },
        orderBy: { order: 'asc' },
      },
    },
    orderBy: { order: 'asc' },
  });

  return NextResponse.json(categories);
}
