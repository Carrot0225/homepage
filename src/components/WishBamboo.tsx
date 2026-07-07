import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { toBlob } from 'html-to-image';
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
  const sceneRef = useRef<HTMLDivElement>(null);
  const t = useRef({ scale: 1, x: 0, y: 0 });

  const [sharing, setSharing] = useState(false);
  const [shareMsg, setShareMsg] = useState('');

  const MIN = 0.15;
  const MAX = 6;
  const clamp = (s: number) => Math.min(MAX, Math.max(MIN, s));

  const apply = () => {
    const c = canvasRef.current;
    if (c) c.style.transform = `translate(${t.current.x}px, ${t.current.y}px) scale(${t.current.scale})`;
  };

  // ビューポート座標 (av,ay) を固定したまま倍率を newScale に
  const zoomTo = (av: number, ay: number, newScale: number) => {
    const ns = clamp(newScale);
    const px = (av - t.current.x) / t.current.scale;
    const py = (ay - t.current.y) / t.current.scale;
    t.current.x = av - px * ns;
    t.current.y = ay - py * ns;
    t.current.scale = ns;
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

  // 指1本=移動 / 指2本=ピンチ拡大＋移動 を統一処理（window一括でポインタ取りこぼしに強い）
  useEffect(() => {
    const vp = viewportRef.current;
    if (!vp) return;
    const pts = new Map<number, { x: number; y: number }>();
    let base: { x: number; y: number; dist: number } | null = null;

    const anchor = () => {
      const a = [...pts.values()];
      if (a.length === 0) return null;
      if (a.length === 1) return { x: a[0].x, y: a[0].y, dist: 0 };
      return {
        x: (a[0].x + a[1].x) / 2,
        y: (a[0].y + a[1].y) / 2,
        dist: Math.hypot(a[0].x - a[1].x, a[0].y - a[1].y),
      };
    };

    const onMove = (e: PointerEvent) => {
      if (!pts.has(e.pointerId)) return;
      e.preventDefault();
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
      const cur = anchor();
      if (!cur) return;
      if (!base) { base = cur; return; }
      // 指（またはその中点）の移動ぶんだけ平行移動
      t.current.x += cur.x - base.x;
      t.current.y += cur.y - base.y;
      // 2本指なら距離変化ぶんだけ中点中心に拡大縮小
      if (cur.dist > 0 && base.dist > 0) {
        const rect = vp.getBoundingClientRect();
        zoomTo(cur.x - rect.left, cur.y - rect.top, t.current.scale * (cur.dist / base.dist));
      } else {
        apply();
      }
      base = cur;
    };

    const onUp = (e: PointerEvent) => {
      pts.delete(e.pointerId);
      base = anchor(); // 指の本数が変わったら基準を取り直す（モード切替の同期ズレ防止）
      if (pts.size === 0) {
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
        window.removeEventListener('pointercancel', onUp);
      }
    };

    const onDown = (e: PointerEvent) => {
      e.preventDefault();
      if (pts.size === 0) {
        window.addEventListener('pointermove', onMove, { passive: false });
        window.addEventListener('pointerup', onUp);
        window.addEventListener('pointercancel', onUp);
      }
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
      base = anchor();
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = vp.getBoundingClientRect();
      zoomTo(e.clientX - rect.left, e.clientY - rect.top, t.current.scale * Math.exp(-e.deltaY * 0.0016));
    };

    vp.addEventListener('pointerdown', onDown, { passive: false });
    vp.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      vp.removeEventListener('pointerdown', onDown);
      vp.removeEventListener('wheel', onWheel);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const btnZoom = (factor: number) => {
    const vp = viewportRef.current;
    if (!vp) return;
    const rect = vp.getBoundingClientRect();
    zoomTo(rect.width / 2, rect.height / 2, t.current.scale * factor);
  };

  // スクショを作ってXへシェア（スマホは画像付きネイティブ共有、非対応は保存＋投稿画面）
  const share = async () => {
    const node = sceneRef.current;
    if (!node || sharing) return;
    setSharing(true);
    setShareMsg('画像を作成中…');
    try {
      const blob = await Promise.race([
        toBlob(node, { pixelRatio: 2, skipFonts: true, backgroundColor: '#eef2e7' }),
        new Promise<null>((_, reject) => setTimeout(() => reject(new Error('timeout')), 15000)),
      ]);
      if (!blob) throw new Error('no blob');
      const file = new File([blob], 'tanabata-wishes.png', { type: 'image/png' });
      const text = 'みんなの七夕の願い事🎋✨ #七夕';
      const url = 'https://homepage-bno.pages.dev/wishes';
      const nav = navigator as Navigator & {
        canShare?: (d?: unknown) => boolean;
        share?: (d: unknown) => Promise<void>;
      };

      if (nav.canShare && nav.share && nav.canShare({ files: [file] })) {
        await nav.share({ files: [file], text: `${text}\n${url}` });
        setShareMsg('');
      } else {
        // フォールバック：画像を保存し、Xの投稿画面を開く
        const dl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = dl;
        a.download = 'tanabata-wishes.png';
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(dl);
        const intent = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
        window.open(intent, '_blank', 'noopener');
        setShareMsg('画像を保存しました。開いたXの投稿画面で画像を添付してください。');
      }
    } catch (err) {
      if ((err as Error)?.name === 'AbortError') setShareMsg('');
      else setShareMsg('画像の作成に失敗しました。もう一度お試しください。');
    } finally {
      setSharing(false);
    }
  };

  return (
    <div className="wb-stage">
      <div className="wb-viewport" ref={viewportRef}>
        <div className="wb-canvas" ref={canvasRef}>
          <div className="wb-scene" ref={sceneRef} role="list" aria-label="みんなの願い事">
            <ul className="wb-hang">
              {wishes.map((w, i) => {
                const ink = readableInk(w.color);
                const border = ink === '#241d14' ? 'rgba(36,29,20,0.22)' : 'rgba(251,244,230,0.32)';
                const style = {
                  '--dur': `${3.4 + (i % 5) * 0.4}s`,
                  '--delay': `${-((i * 7) % 30) * 0.1}s`,
                  '--sway': `${2 + (i % 4)}deg`,
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
        <button className="wb-share" onClick={share} disabled={sharing}>
          <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
            <path d="M18.9 1.6h3.5l-7.6 8.7L23.7 22h-7l-5.5-7.2L4.9 22H1.4l8.1-9.3L.9 1.6h7.2l5 6.6 5.8-6.6Zm-1.2 18.3h1.9L6.4 3.6H4.3l13.4 16.3Z" />
          </svg>
          {sharing ? '作成中…' : 'スクショをXにシェア'}
        </button>
        <a className="wb-write-link" href="/tanabata">自分も短冊を書く</a>
      </div>
      {shareMsg && <p className="wb-share-msg" role="status">{shareMsg}</p>}
    </div>
  );
}
