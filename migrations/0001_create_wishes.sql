-- 七夕の短冊（お願い事）を保存するテーブル
CREATE TABLE IF NOT EXISTS wishes (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  wish       TEXT NOT NULL,             -- お願い事の内容
  name       TEXT NOT NULL,             -- 書いた人の名前
  color      TEXT NOT NULL,             -- 短冊のカラーコード（#rrggbb）
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_wishes_created ON wishes(created_at);
