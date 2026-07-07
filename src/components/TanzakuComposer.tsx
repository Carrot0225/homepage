import { useEffect, useMemo, useRef, useState } from 'react';

/* ===== 色変換ユーティリティ ===== */
interface Rgb { r: number; g: number; b: number; }
interface Hsv { h: number; s: number; v: number; }

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

function hsvToRgb({ h, s, v }: Hsv): Rgb {
  const S = s / 100;
  const V = v / 100;
  const c = V * S;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = V - c;
  let r = 0, g = 0, b = 0;
  if (h < 60) { r = c; g = x; }
  else if (h < 120) { r = x; g = c; }
  else if (h < 180) { g = c; b = x; }
  else if (h < 240) { g = x; b = c; }
  else if (h < 300) { r = x; b = c; }
  else { r = c; b = x; }
  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255),
  };
}

function rgbToHex({ r, g, b }: Rgb): string {
  const h = (n: number) => n.toString(16).padStart(2, '0');
  return `#${h(r)}${h(g)}${h(b)}`;
}

function hexToRgb(hex: string): Rgb | null {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const int = parseInt(m[1], 16);
  return { r: (int >> 16) & 255, g: (int >> 8) & 255, b: int & 255 };
}

function rgbToHsv({ r, g, b }: Rgb): Hsv {
  const R = r / 255, G = g / 255, B = b / 255;
  const max = Math.max(R, G, B), min = Math.min(R, G, B);
  const d = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === R) h = ((G - B) / d) % 6;
    else if (max === G) h = (B - R) / d + 2;
    else h = (R - G) / d + 4;
    h = Math.round(h * 60);
    if (h < 0) h += 360;
  }
  const s = max === 0 ? 0 : Math.round((d / max) * 100);
  const v = Math.round(max * 100);
  return { h, s, v };
}

// 背景色に応じて読みやすい墨色（濃い or 淡い）を返す
function readableInk(hex: string): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return '#1f1a14';
  const lum = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
  return lum > 0.62 ? '#241d14' : '#fbf4e6';
}

/* ===== 短冊プレビュー ===== */
function TanzakuCard({ color, wish, name }: { color: string; wish: string; name: string }) {
  const ink = readableInk(color);
  return (
    <div className="tz-card" style={{ background: color, color: ink }}>
      <span className="tz-card-hole" />
      <div className="tz-card-wish" lang="ja">
        {wish || 'ここに願い事が\n表示されます'}
      </div>
      <div className="tz-card-name" style={{ borderTopColor: ink === '#241d14' ? 'rgba(36,29,20,0.25)' : 'rgba(251,244,230,0.35)' }}>
        {name || '名前'}
      </div>
    </div>
  );
}

const MAX_WISH = 100;
const MAX_NAME = 24;

type Phase = 'intro' | 'form' | 'done';
type Status = 'idle' | 'sending' | 'error';

export default function TanzakuComposer() {
  const [phase, setPhase] = useState<Phase>('intro');
  const [hsv, setHsv] = useState<Hsv>({ h: 205, s: 42, v: 98 }); // やさしい水色から開始
  const [hexDraft, setHexDraft] = useState('#a0d0f5');
  const [wish, setWish] = useState('');
  const [name, setName] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState('');

  const hex = useMemo(() => rgbToHex(hsvToRgb(hsv)), [hsv]);

  // ピッカー操作で hsv が変わったら HEX 入力欄も同期
  useEffect(() => { setHexDraft(hex); }, [hex]);

  const svRef = useRef<HTMLDivElement>(null);
  const hueRef = useRef<HTMLDivElement>(null);

  const startDrag = (
    e: React.PointerEvent,
    el: HTMLElement | null,
    onMove: (x: number, y: number) => void
  ) => {
    if (!el) return;
    e.preventDefault();
    const rect = el.getBoundingClientRect();
    const apply = (clientX: number, clientY: number) => {
      onMove(
        clamp((clientX - rect.left) / rect.width, 0, 1),
        clamp((clientY - rect.top) / rect.height, 0, 1)
      );
    };
    apply(e.clientX, e.clientY);
    const move = (ev: PointerEvent) => apply(ev.clientX, ev.clientY);
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  const onHexChange = (value: string) => {
    setHexDraft(value);
    const rgb = hexToRgb(value);
    if (rgb) setHsv(rgbToHsv(rgb));
  };

  const wishInvalid = wish.trim().length === 0 || wish.length > MAX_WISH;

  const submit = async () => {
    if (wishInvalid) return;
    setStatus('sending');
    setError('');
    try {
      const res = await fetch('/api/wishes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wish: wish.trim(), name: name.trim(), color: hex }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setError(data.error ?? '保存に失敗しました。時間をおいて試してください。');
        setStatus('error');
        return;
      }
      setPhase('done');
    } catch {
      setError('通信に失敗しました。ネット接続を確認してください。');
      setStatus('error');
    }
  };

  /* ---------- 完了画面 ---------- */
  if (phase === 'done') {
    return (
      <div className="tz-done">
        <p className="tz-done-mark">🎋</p>
        <h2 className="tz-done-title">願いを笹にかけました</h2>
        <p className="tz-done-lead">あなたの短冊がみんなの笹に飾られました。<br />叶いますように。</p>
        <div className="tz-preview tz-preview--done">
          <TanzakuCard color={hex} wish={wish} name={name} />
        </div>
        <div className="tz-done-actions">
          <a className="tz-btn tz-btn--primary" href="/wishes">みんなの願い事を見る</a>
          <button
            className="tz-btn tz-btn--ghost"
            onClick={() => { setWish(''); setName(''); setStatus('idle'); setPhase('form'); }}
          >
            もう一枚書く
          </button>
        </div>
      </div>
    );
  }

  /* ---------- 導入（大きなボタン） ---------- */
  if (phase === 'intro') {
    return (
      <div className="tz-intro">
        <div className="tz-preview tz-preview--intro" aria-hidden="true">
          <TanzakuCard color="#a0d0f5" wish={'星に願いを\n込めて'} name="きゃる" />
        </div>
        <button className="tz-cta" onClick={() => setPhase('form')}>
          短冊にお願い事を書く
        </button>
        <p className="tz-intro-note">お願い事・お名前・好きな色を選んで、笹に飾ろう。</p>
      </div>
    );
  }

  /* ---------- 記入フォーム ---------- */
  return (
    <div className="tz-form">
      <div className="tz-form-grid">
        {/* 左：入力 */}
        <div className="tz-fields">
          {/* カラーピッカー */}
          <div className="tz-field">
            <label className="tz-label">短冊の色</label>
            <div className="tz-picker">
              <div
                ref={svRef}
                className="tz-sv"
                style={{ background: `linear-gradient(to top, #000, rgba(0,0,0,0)), linear-gradient(to right, #fff, hsl(${hsv.h} 100% 50%))` }}
                onPointerDown={(e) => startDrag(e, svRef.current, (x, y) =>
                  setHsv((p) => ({ ...p, s: Math.round(x * 100), v: Math.round((1 - y) * 100) })))}
                role="slider"
                aria-label="彩度と明るさ"
                aria-valuetext={`彩度${hsv.s}% 明るさ${hsv.v}%`}
              >
                <span className="tz-sv-thumb" style={{ left: `${hsv.s}%`, top: `${100 - hsv.v}%`, background: hex }} />
              </div>
              <div
                ref={hueRef}
                className="tz-hue"
                onPointerDown={(e) => startDrag(e, hueRef.current, (x) =>
                  setHsv((p) => ({ ...p, h: Math.round(x * 360) })))}
                role="slider"
                aria-label="色相"
                aria-valuenow={hsv.h}
                aria-valuemin={0}
                aria-valuemax={360}
              >
                <span className="tz-hue-thumb" style={{ left: `${(hsv.h / 360) * 100}%` }} />
              </div>
              <div className="tz-hex">
                <span className="tz-hex-swatch" style={{ background: hex }} />
                <input
                  className="tz-hex-input"
                  type="text"
                  value={hexDraft}
                  spellCheck={false}
                  maxLength={7}
                  onChange={(e) => onHexChange(e.target.value)}
                  aria-label="カラーコード"
                />
              </div>
            </div>
          </div>

          {/* 願い事 */}
          <div className="tz-field">
            <label className="tz-label" htmlFor="tz-wish">お願い事</label>
            <textarea
              id="tz-wish"
              className="tz-textarea"
              value={wish}
              maxLength={MAX_WISH}
              rows={3}
              placeholder="例）家族がずっと健康でいられますように"
              onChange={(e) => setWish(e.target.value)}
            />
            <span className={`tz-count ${wish.length > MAX_WISH ? 'is-over' : ''}`}>{wish.length} / {MAX_WISH}</span>
          </div>

          {/* 名前 */}
          <div className="tz-field">
            <label className="tz-label" htmlFor="tz-name">お名前（左下に入ります）</label>
            <input
              id="tz-name"
              className="tz-input"
              type="text"
              value={name}
              maxLength={MAX_NAME}
              placeholder="例）きゃる"
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {status === 'error' && <p className="tz-error" role="alert">{error}</p>}

          <div className="tz-actions">
            <button className="tz-btn tz-btn--primary" onClick={submit} disabled={wishInvalid || status === 'sending'}>
              {status === 'sending' ? '飾っています…' : '笹に飾る'}
            </button>
            <button className="tz-btn tz-btn--ghost" onClick={() => setPhase('intro')} disabled={status === 'sending'}>
              戻る
            </button>
          </div>
        </div>

        {/* 右：プレビュー */}
        <div className="tz-preview-wrap">
          <span className="tz-preview-label">プレビュー</span>
          <div className="tz-preview">
            <TanzakuCard color={hex} wish={wish} name={name} />
          </div>
        </div>
      </div>
    </div>
  );
}
