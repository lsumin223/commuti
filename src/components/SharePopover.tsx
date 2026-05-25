'use client';

import { useState, useRef, useEffect } from 'react';

interface Props {
  targetType: string;
  categoryId?: string;
  characterId?: string;
  documentId?: string;
  logId?: string;
}

export default function SharePopover({ targetType, categoryId, characterId, documentId, logId }: Props) {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [usePassword, setUsePassword] = useState(false);
  const [expiresIn, setExpiresIn] = useState('');
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<{ url: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);

  const handleOpen = () => {
    setOpen(o => !o);
    setResult(null);
    setPassword('');
    setUsePassword(false);
    setExpiresIn('');
    setCopied(false);
  };

  const handleGenerate = async () => {
    setGenerating(true);
    const expiresAt = expiresIn
      ? new Date(Date.now() + parseInt(expiresIn) * 24 * 60 * 60 * 1000).toISOString()
      : undefined;

    const res = await fetch('/api/share', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        targetType,
        ...(categoryId  && { categoryId }),
        ...(characterId && { characterId }),
        ...(documentId  && { documentId }),
        ...(logId       && { logId }),
        ...(usePassword && password && { password }),
        ...(expiresAt   && { expiresAt }),
      }),
    });
    if (res.ok) {
      const data = await res.json();
      setResult({ url: `${window.location.origin}${data.url}` });
    }
    setGenerating(false);
  };

  const handleCopy = () => {
    if (!result) return;
    navigator.clipboard.writeText(result.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={handleOpen}
        className="flex items-center gap-1.5 px-3 py-1.5 border border-bd text-text1 text-sm rounded-lg hover:bg-bg1 hover:border-bd2 transition-colors"
        title="공유 링크 생성"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
        </svg>
        공유
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 z-30 w-72 bg-bg border border-bd rounded-xl shadow-lg p-4">
          <h3 className="text-sm font-semibold text-text0 mb-3">공유 링크 생성</h3>

          {!result ? (
            <div className="space-y-3">
              {/* Password toggle */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={usePassword}
                  onChange={e => setUsePassword(e.target.checked)}
                  className="accent-rose"
                />
                <span className="text-sm text-text1">비밀번호 설정</span>
              </label>
              {usePassword && (
                <input
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="비밀번호 입력"
                  type="password"
                  className="w-full px-3 py-1.5 border border-bd rounded-lg text-sm text-text0 focus:outline-none focus:border-rose bg-bg"
                />
              )}

              {/* Expiry */}
              <div>
                <label className="block text-xs text-text2 mb-1">만료 기간</label>
                <select
                  value={expiresIn}
                  onChange={e => setExpiresIn(e.target.value)}
                  className="w-full px-3 py-1.5 border border-bd rounded-lg text-sm text-text0 focus:outline-none focus:border-rose bg-bg"
                >
                  <option value="">만료 없음</option>
                  <option value="1">1일</option>
                  <option value="7">7일</option>
                  <option value="30">30일</option>
                </select>
              </div>

              <button
                type="button"
                onClick={handleGenerate}
                disabled={generating || (usePassword && !password)}
                className="w-full py-2 bg-rose text-white text-sm font-medium rounded-lg hover:bg-rose/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {generating ? '생성 중…' : '링크 생성'}
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-text2">링크가 생성되었습니다!</p>
              <div className="flex gap-2">
                <input
                  readOnly
                  value={result.url}
                  className="flex-1 px-2 py-1.5 border border-bd rounded-lg text-xs text-text1 bg-bg1 focus:outline-none min-w-0"
                />
                <button
                  type="button"
                  onClick={handleCopy}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    copied ? 'bg-sage text-white' : 'bg-rose text-white hover:bg-rose/80'
                  }`}
                >
                  {copied ? '복사됨!' : '복사'}
                </button>
              </div>
              <button
                type="button"
                onClick={() => setResult(null)}
                className="text-xs text-text2 hover:text-text1 transition-colors"
              >
                새 링크 생성
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
