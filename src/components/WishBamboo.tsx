import { useEffect, useState } from 'react';

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

  const { wishes } = state;

  if (wishes.length === 0) {
    return (
      <div className="wb-empty">
        <p className="wb-empty-mark">🎋</p>
        <p className="wb-empty-lead">まだ願い事がありません。</p>
        <p className="wb-empty-sub">最初のひとつを書いてみよう。</p>
        <a className="wb-write-link" href="/tanabata">短冊にお願い事を書く</a>
      </div>
    );
  }

  return (
    <>
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
            const style = {
              '--i': i,
              '--dur': `${3.4 + (i % 5) * 0.4}s`,
              '--delay': `${-((i * 7) % 30) * 0.1}s`,
              '--sway': `${2 + (i % 4)}deg`,
              '--thread': `${18 + (i % 3) * 14}px`,
            } as React.CSSProperties;
            return (
              <li className="wb-item" style={style} role="listitem" key={w.id}>
                <span className="wb-thread" aria-hidden="true" />
                <div
                  className="wb-tanzaku"
                  style={{ background: w.color, color: ink }}
                >
                  <span className="wb-hole" aria-hidden="true" />
                  <div className="wb-wish" lang="ja">{w.wish}</div>
                  <div
                    className="wb-name"
                    style={{ borderTopColor: ink === '#241d14' ? 'rgba(36,29,20,0.22)' : 'rgba(251,244,230,0.32)' }}
                  >
                    {w.name}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="wb-footer">
        <span className="wb-total">願い事 {wishes.length} 件</span>
        <a className="wb-write-link" href="/tanabata">自分も短冊を書く</a>
      </div>
    </>
  );
}
