import { useLayoutEffect, useRef } from 'react';

interface AutoFitTextProps {
  text: string;
  /** 最大フォントサイズ(px) */
  max: number;
  /** 最小フォントサイズ(px) */
  min?: number;
  boxClassName?: string;
  textClassName?: string;
  boxStyle?: React.CSSProperties;
  textStyle?: React.CSSProperties;
  lang?: string;
}

/**
 * 枠(box)の中にテキスト全文が収まるよう、フォントサイズを自動で縮小するコンポーネント。
 * 枠は CSS 側で幅・高さを確定させておくこと（この中に必ず全文が入る）。
 */
export default function AutoFitText({
  text, max, min = 6, boxClassName, textClassName, boxStyle, textStyle, lang,
}: AutoFitTextProps) {
  const boxRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const box = boxRef.current;
    const el = textRef.current;
    if (!box || !el) return;

    const fit = () => {
      el.style.fontSize = `${max}px`;
      const bw = box.clientWidth;
      const bh = box.clientHeight;
      if (bw === 0 || bh === 0) return;
      const sw = el.scrollWidth;
      const sh = el.scrollHeight;
      if (sw === 0 || sh === 0) return;
      // 幅・高さ両方が収まる比率でざっくり合わせる
      let size = Math.min(max, max * Math.min(bw / sw, bh / sh));
      size = Math.max(min, size);
      el.style.fontSize = `${size}px`;
      // 改行位置の変化などで誤差が出た場合の微調整
      let guard = 0;
      while (guard++ < 24 && size > min && (el.scrollWidth > bw || el.scrollHeight > bh)) {
        size -= 0.5;
        el.style.fontSize = `${size}px`;
      }
    };

    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(box);
    // Webフォント読み込み後にもう一度合わせる
    if (typeof document !== 'undefined' && document.fonts?.ready) {
      document.fonts.ready.then(fit).catch(() => {});
    }
    return () => ro.disconnect();
  }, [text, max, min]);

  return (
    <div ref={boxRef} className={boxClassName} style={boxStyle}>
      <span ref={textRef} className={textClassName} style={textStyle} lang={lang}>{text}</span>
    </div>
  );
}
