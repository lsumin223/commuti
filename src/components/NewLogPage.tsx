'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Series { id: string; name: string; }

const KIND_OPTIONS = [
  { value: 'TEXT',  label: '글로그',   desc: '텍스트 에디터로 작성하는 로그',   icon: '✏️' },
  { value: 'IMAGE', label: '그림로그', desc: '이미지를 업로드하는 그림 로그',    icon: '🖼️' },
  { value: 'COMIC', label: '만화로그', desc: '페이지 단위로 구성하는 만화 로그', icon: '📖' },
];

const VIS_OPTIONS = [
  { value: 'private', label: '비공개',    desc: '나만 볼 수 있습니다' },
  { value: 'link',    label: '링크 공개', desc: '링크를 아는 사람만 볼 수 있습니다' },
  { value: 'secret',  label: '비밀번호',  desc: '비밀번호를 아는 사람만 볼 수 있습니다' },
];

interface Props { cid: string; charid: string; }

export default function NewLogPage({ cid, charid }: Props) {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [kind, setKind] = useState('TEXT');
  const [visibility, setVisibility] = useState('private');
  const [seriesId, setSeriesId] = useState('');
  const [seriesList, setSeriesList] = useState<Series[]>([]);
  const [newSeriesName, setNewSeriesName] = useState('');
  const [creatingSereis, setCreatingSeries] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch(`/api/characters/${charid}/series`)
      .then(r => r.ok ? r.json() : [])
      .then(setSeriesList);
  }, [charid]);

  const handleCreateSeries = async () => {
    if (!newSeriesName.trim()) return;
    const res = await fetch(`/api/characters/${charid}/series`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newSeriesName.trim() }),
    });
    if (res.ok) {
      const s: Series = await res.json();
      setSeriesList(prev => [...prev, s]);
      setSeriesId(s.id);
      setNewSeriesName('');
      setCreatingSeries(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSubmitting(true);
    const res = await fetch(`/api/characters/${charid}/logs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: title.trim(), kind, visibility, seriesId: seriesId || null }),
    });
    if (res.ok) {
      const log = await res.json();
      router.push(`/${cid}/${charid}/logs/${log.id}`);
    } else {
      setSubmitting(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-2.5 px-6 py-4 border-b border-bd"
        style={{ borderLeft: '3px solid #6B6058' }}>
        <span className="text-lg">✏️</span>
        <span className="font-semibold text-text0">새 로그 작성</span>
      </div>

      <form onSubmit={handleSubmit} className="p-6 max-w-xl space-y-6">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-text1 mb-1.5">제목</label>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="로그 제목을 입력하세요"
            required
            className="w-full px-3 py-2 border border-bd rounded-lg text-text0 bg-bg placeholder:text-text2 focus:outline-none focus:border-rose"
          />
        </div>

        {/* Kind */}
        <div>
          <label className="block text-sm font-medium text-text1 mb-2">로그 종류</label>
          <div className="grid grid-cols-3 gap-2">
            {KIND_OPTIONS.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setKind(opt.value)}
                className={`p-3 rounded-xl border text-left transition-all ${
                  kind === opt.value
                    ? 'border-rose bg-rose/5 shadow-sm'
                    : 'border-bd hover:border-bd2 hover:bg-bg1'
                }`}
              >
                <div className="text-xl mb-1">{opt.icon}</div>
                <div className={`text-sm font-medium ${kind === opt.value ? 'text-rose' : 'text-text0'}`}>
                  {opt.label}
                </div>
                <div className="text-[11px] text-text2 mt-0.5 leading-tight">{opt.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Visibility */}
        <div>
          <label className="block text-sm font-medium text-text1 mb-2">공개 설정</label>
          <div className="flex gap-2">
            {VIS_OPTIONS.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setVisibility(opt.value)}
                title={opt.desc}
                className={`flex-1 py-2 px-3 rounded-lg border text-xs font-medium transition-all ${
                  visibility === opt.value
                    ? 'border-rose bg-rose/5 text-rose'
                    : 'border-bd text-text2 hover:border-bd2 hover:text-text1'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <p className="text-[11px] text-text2 mt-1.5">
            {VIS_OPTIONS.find(o => o.value === visibility)?.desc}
          </p>
        </div>

        {/* Series */}
        <div>
          <label className="block text-sm font-medium text-text1 mb-2">시리즈 (선택)</label>
          <div className="flex gap-2">
            <select
              value={seriesId}
              onChange={e => setSeriesId(e.target.value)}
              className="flex-1 px-3 py-2 border border-bd rounded-lg text-sm text-text0 bg-bg focus:outline-none focus:border-rose"
            >
              <option value="">없음</option>
              {seriesList.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setCreatingSeries(c => !c)}
              className="px-3 py-2 border border-bd rounded-lg text-sm text-text2 hover:text-text1 hover:border-bd2 transition-colors"
            >
              + 새 시리즈
            </button>
          </div>
          {creatingSereis && (
            <div className="flex gap-2 mt-2">
              <input
                value={newSeriesName}
                onChange={e => setNewSeriesName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleCreateSeries(); } }}
                placeholder="시리즈 이름"
                className="flex-1 px-3 py-1.5 border border-rose rounded-lg text-sm text-text0 bg-bg focus:outline-none"
                autoFocus
              />
              <button
                type="button"
                onClick={handleCreateSeries}
                className="px-3 py-1.5 bg-rose text-white text-sm rounded-lg hover:bg-rose/80 transition-colors"
              >
                만들기
              </button>
            </div>
          )}
        </div>

        {/* Submit */}
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={submitting || !title.trim()}
            className="px-5 py-2 bg-rose text-white text-sm font-medium rounded-lg hover:bg-rose/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? '생성 중…' : '로그 생성'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-5 py-2 border border-bd text-text1 text-sm rounded-lg hover:bg-bg1 transition-colors"
          >
            취소
          </button>
        </div>
      </form>
    </div>
  );
}
