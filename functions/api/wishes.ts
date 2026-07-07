/// <reference types="@cloudflare/workers-types" />

// 七夕の短冊 API（Cloudflare Pages Functions + D1）
//   GET  /api/wishes  … 最新の短冊一覧を返す
//   POST /api/wishes  … 短冊を1件保存する

interface Env {
  DB: D1Database;
}

interface WishRow {
  id: number;
  wish: string;
  name: string;
  color: string;
  created_at: string;
}

const MAX_WISH = 100;
const MAX_NAME = 24;
const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

const json = (data: unknown, status = 200): Response =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });

// 一覧取得（新しい順・最大200件）
export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  try {
    const { results } = await env.DB.prepare(
      'SELECT id, wish, name, color, created_at FROM wishes ORDER BY id DESC LIMIT 200'
    ).all<WishRow>();
    return json({ wishes: results ?? [] });
  } catch (err) {
    return json({ error: 'データの取得に失敗しました' }, 500);
  }
};

// 短冊を保存
export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  let body: { wish?: unknown; name?: unknown; color?: unknown };
  try {
    body = await request.json();
  } catch {
    return json({ error: 'リクエストの形式が正しくありません' }, 400);
  }

  // --- 軽めのバリデーション ---
  const wish = typeof body.wish === 'string' ? body.wish.trim() : '';
  if (wish.length < 1 || wish.length > MAX_WISH) {
    return json({ error: `お願い事は1〜${MAX_WISH}文字で入力してください` }, 400);
  }

  let name = typeof body.name === 'string' ? body.name.trim() : '';
  if (name.length === 0) name = '名無し';
  if (name.length > MAX_NAME) {
    return json({ error: `お名前は${MAX_NAME}文字以内で入力してください` }, 400);
  }

  const color = typeof body.color === 'string' ? body.color.trim().toLowerCase() : '';
  if (!HEX_COLOR.test(color)) {
    return json({ error: 'カラーコードの形式が正しくありません（例: #a3c1ff）' }, 400);
  }

  try {
    const inserted = await env.DB.prepare(
      'INSERT INTO wishes (wish, name, color) VALUES (?, ?, ?) RETURNING id, wish, name, color, created_at'
    )
      .bind(wish, name, color)
      .first<WishRow>();
    return json({ wish: inserted }, 201);
  } catch (err) {
    return json({ error: '保存に失敗しました' }, 500);
  }
};
