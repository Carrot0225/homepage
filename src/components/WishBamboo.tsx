import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import AutoFitText from './AutoFitText';

interface Wish {
  id: number;
  wish: string;
  name: string;
  color: string;
  created_at: string;
}

type State =
  | { kind: 'loading' }
  | { kind: 'error' }
  | { kind: 'ready'; wishes: Wish[] };

// 背景色に応じて読みやすい墨色を返す
function readableInk(hex: string): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return '#241d14';
  const int = parseInt(m[1], 16);
  const r = (int >> 16) & 255, g = (int >> 8) & 255, b = int & 255;
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.62 ? '#241d14' : '#fbf4e6';
}

export default function WishBamboo() {
  const [state, setState] = useState<State>({ kind: 'loading' });

  useEffect(() => {
    let active = true;
    fetch('/api/wishes')
      .then((res) => {
        if (!res.ok) throw new Error('fetch failed');
        return res.json() as Promise<{ wishes: Wish[] }>;
      })
      .then((data) => { if (active) setState({ kind: 'ready', wishes: data.wishes ?? [] }); })
      .catch(() => { if (active) setState({ kind: 'error' }); });
    return () => { active = false; };
  }, []);

  if (state.kind === 'loading') {
    return (
      <div className="wb-status">
        <span className="wb-spinner" aria-hidden="true" />
        <p>短冊を集めています…</p>
      </div>
    );
  }

  if (state.kind === 'error') {
    return (
      <div className="wb-status">
        <p>短冊を読み込めませんでした。</p>
        <button className="wb-retry" onClick={() => { setState({ kind: 'loading' }); location.reload(); }}>
          再読み込み
        </button>
      </div>
    );
  }

  if (state.wishes.length === 0) {
    return (
      <div className="wb-empty">
        <p className="wb-empty-mark">🎋</p>
        <p className="wb-empty-lead">まだ願い事がありません。</p>
        <p className="wb-empty-sub">最初のひとつを書いてみよう。</p>
        <a className="wb-write-link" href="/tanabata">短冊にお願い事を書く</a>
      </div>
    );
  }

  return <WishStage wishes={state.wishes} />;
}

/* ============================================================
   ピンチ拡大・ドラッグ移動できる竹のキャンバス
   ============================================================ */
function WishStage({ wishes }: { wishes: Wish[] }) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const t = useRef({ scale: 1, x: 0, y: 0 });
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinch = useRef<{ dist: number; scale: number } | null>(null);
  const pan = useRef<{ x: number; y: number } | null>(null);

  const MIN = 0.15;
  const MAX = 5;
  const clamp = (s: number) => Math.min(MAX, Math.max(MIN, s));

  const apply = () => {
    const c = canvasRef.current;
    if (c) c.style.transform = `translate(${t.current.x}px, ${t.current.y}px) scale(${t.current.scale})`;
  };

  // ビューポート座標 (vx,vy) を中心に拡大縮小
  const zoomAt = (vx: number, vy: number, next: number) => {
    const cur = t.current;
    const ns = clamp(next);
    const px = (vx - cur.x) / cur.scale;
    const py = (vy - cur.y) / cur.scale;
    cur.x = vx - px * ns;
    cur.y = vy - py * ns;
    cur.scale = ns;
    apply();
  };

  // 全短冊がビューポートに収まるようにフィット（＝全体表示）
  const fitAll = () => {
    const vp = viewportRef.current;
    const cv = canvasRef.current;
    if (!vp || !cv) return;
    const cw = cv.scrollWidth;
    const ch = cv.scrollHeight;
    if (!cw || !ch) return;
    const rect = vp.getBoundingClientRect();
    const s = clamp(Math.min(rect.width / cw, rect.height / ch) * 0.92);
    t.current.scale = s;
    t.current.x = (rect.width - cw * s) / 2;
    t.current.y = (rect.height - ch * s) / 2;
    apply();
  };

  // マウント時・件数変化・リサイズ・フォント読込後にフィット
  useLayoutEffect(() => {
    fitAll();
    const onResize = () => fitAll();
    window.addEventListener('resize', onResize);
    if (typeof document !== 'undefined' && document.fonts?.ready) {
      document.fonts.ready.then(fitAll).catch(() => {});
    }
    return () => window.removeEventListener('resize', onResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wishes.length]);

  // ホイール／トラックパッドでズーム（passive:false で preventDefault）
  useEffect(() => {
    const vp = viewportRef.current;
    if (!vp) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = vp.getBoundingClientRect();
      const factor = Math.exp(-e.deltaY * 0.0016);
      zoomAt(e.clientX - rect.left, e.clientY - rect.top, t.current.scale * factor);
    };
    vp.addEventListener('wheel', onWheel, { passive: false });
    return () => vp.removeEventListener('wheel', onWheel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onPointerDown = (e: React.PointerEvent) => {
    viewportRef.current?.setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 1) {
      pan.current = { x: e.clientX, y: e.clientY };
    } else if (pointers.current.size === 2) {
      pan.current = null;
      const p = [...pointers.current.values()];
      pinch.current = { dist: Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y), scale: t.current.scale };
    }
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const vp = viewportRef.current;
    if (!vp) return;
    const rect = vp.getBoundingClientRect();
    if (pointers.current.size >= 2 && pinch.current) {
      const p = [...pointers.current.values()];
      const dist = Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y);
      const midX = (p[0].x + p[1].x) / 2 - rect.left;
      const midY = (p[0].y + p[1].y) / 2 - rect.top;
      zoomAt(midX, midY, pinch.current.scale * (dist / pinch.current.dist));
    } else if (pan.current) {
      t.current.x += e.clientX - pan.current.x;
      t.current.y += e.clientY - pan.current.y;
      pan.current = { x: e.clientX, y: e.clientY };
      apply();
    }
  };

  const onPointerUp = (e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId);
    viewportRef.current?.releasePointerCapture?.(e.pointerId);
    if (pointers.current.size < 2) pinch.current = null;
    if (pointers.current.size === 1) {
      const p = [...pointers.current.values()][0];
      pan.current = { x: p.x, y: p.y };
    } else if (pointers.current.size === 0) {
      pan.current = null;
    }
  };

  const btnZoom = (factor: number) => {
    const vp = viewportRef.current;
    if (!vp) return;
    const rect = vp.getBoundingClientRect();
    zoomAt(rect.width / 2, rect.height / 2, t.current.scale * factor);
  };

  return (
    <div className="wb-stage">
      <div
        className="wb-viewport"
        ref={viewportRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <div className="wb-canvas" ref={canvasRef}>
          <div className="wb-scene" role="list" aria-label="みんなの願い事">
            <div className="wb-bamboo wb-bamboo--left" aria-hidden="true">
              <span className="wb-leaf" /><span className="wb-leaf" /><span className="wb-leaf" />
            </div>
            <div className="wb-bamboo wb-bamboo--right" aria-hidden="true">
              <span className="wb-leaf" /><span className="wb-leaf" /><span className="wb-leaf" />
            </div>
            <div className="wb-cord" aria-hidden="true" />

            <ul className="wb-hang">
              {wishes.map((w, i) => {
                const ink = readableInk(w.color);
                const border = ink === '#241d14' ? 'rgba(36,29,20,0.22)' : 'rgba(251,244,230,0.32)';
                const style = {
                  '--dur': `${3.4 + (i % 5) * 0.4}s`,
                  '--delay': `${-((i * 7) % 30) * 0.1}s`,
                  '--sway': `${2 + (i % 4)}deg`,
                  '--thread': `${18 + (i % 3) * 14}px`,
                } as React.CSSProperties;
                return (
                  <li className="wb-item" style={style} role="listitem" key={w.id}>
                    <span className="wb-thread" aria-hidden="true" />
                    <div className="wb-tanzaku" style={{ background: w.color, color: ink }}>
                      <span className="wb-hole" aria-hidden="true" />
                      <AutoFitText text={w.wish} max={15} boxClassName="wb-wishbox" textClassName="wb-wish" lang="ja" />
                      <AutoFitText text={w.name} max={11} boxClassName="wb-namebox" textClassName="wb-name" boxStyle={{ borderTopColor: border }} />
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        <p className="wb-hint" aria-hidden="true">ピンチ / ホイールで拡大・縮小、ドラッグで移動</p>

        <div className="wb-zoom">
          <button className="wb-zoom-btn" onClick={() => btnZoom(1.25)} aria-label="拡大">＋</button>
          <button className="wb-zoom-btn" onClick={() => btnZoom(0.8)} aria-label="縮小">−</button>
          <button className="wb-zoom-btn wb-zoom-fit" onClick={fitAll} aria-label="全体表示">全</button>
        </div>
      </div>

      <div className="wb-footer">
        <span className="wb-total">願い事 {wishes.length} 件</span>
        <a className="wb-write-link" href="/tanabata">自分も短冊を書く</a>
      </div>
    </div>
  );
}
