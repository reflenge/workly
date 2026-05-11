# 本番DBマイグレーション手順書

本番環境（Supabase本番プロジェクト）に対して Drizzle マイグレーションを適用するときに使うチェックリスト。
落ち着いて上から順にチェックしながら進める想定。

> **対象環境**: Production Supabase（Vercel Production 環境が接続している DB）
> **使用ツール**: `pnpm migrate`（= `drizzle-kit migrate`）
> **影響範囲**: 本番DB スキーマ。失敗すると勤怠記録・給与計算・ログインに影響しうる

---

## 0. 事前確認（実行する前に必ず）

- [ ] 本番アプリ（workly.reflenge.com）の利用が少ない時間帯か確認した
- [ ] 適用したいマイグレーションファイルを目で読んで、内容を理解している
- [ ] 練習用DBで同じマイグレーションを当てて、アプリが動くことを確認した
- [ ] ロールバック手順（後述）を読んだ
- [ ] 作業中に連絡が取れる状態にある（Slack / 電話など）

---

## 1. 本番DBのバックアップ

> **⚠️ 重要な制約**: 本番Supabaseは現在 **Free プラン** のため、Supabase ダッシュボードからのスナップショット／Point-in-Time Recovery は使えない。
> 当面は **手動 pg_dump** を一回限りの安全網として運用する。
> 並行して Pro プラン化を上司に提案すること（後述「自分への約束」参照）。

### 手動 pg_dump でバックアップを取る

```bash
# 1. libpq の PATH を通す（このシェルでのみ有効）
export PATH="/opt/homebrew/opt/libpq/bin:$PATH"

# 2. 本番DATABASE_URLを使ってバックアップ取得
PROD_URL=$(grep '^DATABASE_URL' .env.local.production-backup | cut -d= -f2-)
pg_dump "$PROD_URL" > backup-prod-$(date +%Y%m%d-%H%M%S).sql

# 3. ファイルサイズと先頭を確認
ls -lh backup-prod-*.sql
head -30 backup-prod-*.sql
```

- [ ] バックアップファイルが生成された（サイズが0でない、数MB以上ある）
- [ ] 先頭に `PostgreSQL database dump` のヘッダがある
- [ ] `CREATE TABLE` などのSQL文が含まれている（grepで確認: `grep -c 'CREATE TABLE' backup-prod-*.sql`）
- [ ] バックアップファイルを安全な場所に保存した（クラウドストレージ等にもコピー推奨）

### バックアップファイルの記録

- 取得時刻: `____________________`
- ファイル名: `____________________`
- ファイルサイズ: `____________________`
- 保存先（追加保管）: `____________________`

---

## 2. 適用するマイグレーションを最終確認

- [ ] 適用するマイグレーションファイル: `____________________`
- [ ] 内容を `cat drizzle/XXXX_*.sql` で読み直した
- [ ] DROP / ALTER TABLE の中で **既存データを破壊する操作**（DROP COLUMN, DROP TABLE, NOT NULL 制約の追加など）が無いか確認した
  - もし破壊的操作があるなら、データ移行戦略を別途検討してから戻ってくる

---

## 3. 環境変数を本番DB向けに切り替える（一時的に）

`pnpm migrate` は `drizzle.config.ts` 経由で `.env` の `DATABASE_URL` を読む。

### 推奨: ワンライナーで本番URLを上書き

`.env` ファイルを書き換えず、コマンド実行時だけ本番DBを指す:

```bash
DATABASE_URL="$(grep '^DATABASE_URL' .env.local.production-backup | cut -d= -f2-)" pnpm migrate
```

- メリット: `.env` ファイルを触らないので、コマンド実行後に「戻し忘れ」のリスクがない
- 注意: シェルの履歴に本番URLが残る可能性あり

### 代替: `.env` を一時的に差し替える

```bash
# 1. 現在の .env をバックアップ
cp .env .env.backup-$(date +%Y%m%d-%H%M%S)

# 2. .env を本番向けに置き換え
cp .env.local.production-backup .env

# 3. マイグレーション実行
pnpm migrate

# 4. ★必ず元に戻す★
cp .env.backup-* .env
rm .env.backup-*
```

- 注意: 戻し忘れると、次回ローカル開発時に本番DBに接続される事故が起きる

---

## 4. マイグレーション実行

```bash
pnpm migrate
```

期待する出力（既に適用済み以外のマイグレーションがあれば、それが順番に流れる）:

```
[✓] migrations applied successfully!
```

エラーが出た場合は **絶対にやり直しを連打しない**。エラー内容をスクリーンショットして相談する。

---

## 5. 適用結果の検証

### Supabase SQL Editor で検証クエリを実行

1. Supabase ダッシュボード → 本番プロジェクト → **「SQL Editor」**
2. 以下のクエリを実行して結果を確認

#### 新テーブル・カラムの存在確認

```sql
-- 0006 で作った user_role テーブルの初期データ
SELECT id, code, label FROM user_role ORDER BY id;
-- 期待: id=1 REPRESENTATIVE 代表, id=2 EMPLOYEE その他従業員

-- user.role_id カラムの存在と既存ユーザーの値
SELECT id, last_name, first_name, role_id FROM "user" LIMIT 10;
-- 期待: 全員 role_id=2 (EMPLOYEE) になっている

-- project に追加された単価カラム
SELECT id, name, representative_hourly_rate, employee_hourly_rate
FROM project LIMIT 5;
-- 期待: 既存プロジェクトは両カラムとも NULL（後から admin が設定する）
```

#### マイグレーション履歴

```sql
SELECT * FROM drizzle.__drizzle_migrations ORDER BY id;
-- 期待: 0006, 0007 のエントリが追加されている
```

- [ ] `user_role` テーブルに2行あることを確認
- [ ] 既存ユーザーが全員 `role_id=2` になっていることを確認
- [ ] `project` に新カラム2つが追加されていることを確認

---

## 6. コードを本番にデプロイ

DBの準備ができたので、ようやくコードを本番に出す。

1. GitHub で `preview → main` の PR を作成（または既存PRをマージ可能状態に）
2. PR の内容を最終確認
3. **Merge pull request** で main にマージ
4. Vercel が自動的に main の最新コードをビルド・デプロイ開始
5. Vercel ダッシュボードでデプロイ完了を確認（通常 1〜3 分）

---

## 7. 本番動作確認

- [ ] https://workly.reflenge.com にアクセスして画面が表示される
- [ ] 管理者アカウントでログインできる
- [ ] 一般従業員アカウントでログインできる（既存ユーザーへの影響なし確認）
- [ ] 既存機能の確認:
  - [ ] 出退勤の打刻ができる
  - [ ] 通常の作業ログ CSV ダウンロードができる
- [ ] 新機能の確認:
  - [ ] 管理者として `/projects/work-logs` でプロジェクト選択
  - [ ] 「請求書付きダウンロード」ボタンが表示される
  - [ ] CSV ダウンロードが成功する
  - [ ] CSV 内容が正しい（金額計算など）

---

## ロールバック手順（万一の場合）

### ケースA: マイグレーション実行中にエラーが出た

PostgreSQL のトランザクション境界次第で、部分適用されている可能性がある。

1. Supabase SQL Editor で `SELECT * FROM drizzle.__drizzle_migrations ORDER BY id DESC LIMIT 5;` を実行
2. どこまで適用されているか確認
3. **状況が分からなくなったら、迷わずバックアップから復元する**

### ケースB: マイグレーションは成功したが、デプロイ後に不具合発生

- 軽微なバグなら: hotfix ブランチで修正 → main にマージ
- 重大な不具合（ログインできない等）なら:
  1. Vercel で **「Promote to Production」** から1つ前のデプロイに戻す（即座にコード revert）
  2. DB はそのまま（新カラム・新テーブルは既存コードでは無視される設計なので互換性あり）

### ケースC: 全てを巻き戻したい（最終手段）

1. Supabase ダッシュボードで取ったバックアップから復元
2. Vercel で前のデプロイに戻す
3. 復元には数分〜数十分かかる場合あり、その間アプリは利用不可

---

## 補足: マイグレーション後の `.env` 戻し忘れチェック

作業終了後、必ず以下を確認:

```bash
# .env の DATABASE_URL がローカルDBを指しているか
grep '^DATABASE_URL' .env
# 期待: 127.0.0.1:54322 を含むURL（本番のホスト名でないこと）
```

- [ ] `.env` がローカルDBを指している
- [ ] 一時バックアップファイル（`.env.backup-*`）を削除した

---

## 自分への約束（Pro プラン未導入の間、必ず守る）

Free プランの下では、Supabaseの自動バックアップ・Point-in-Time Recoveryが使えない。
本来は本番運用するべきでない状態。それを承知の上で当面 pg_dump で凌ぐ場合、以下を **自分への約束** として守ること。

1. **マイグレーション成功後、翌営業日中に上司に Pro 化を提案する**
   - 「バックアップ運用が未整備な現状を、運用継続のために整える必要がある」と説明
   - 緊急性のある提案であって、機能の付随的な話ではない

2. **pg_dump で取ったバックアップは、取得後すぐにファイル内容を目視確認する**
   - サイズ、先頭の行、`CREATE TABLE` の出現数など
   - 「取った」と「使える状態である」は別物

3. **Pro 化が決まるまでの間は、極力 DB 変更を避ける**
   - 緊急対応以外は止める
   - どうしても必要なら、毎回 pg_dump を取り直すこと

---

## バックアップファイルの管理

- `.gitignore` に `backup-prod-*.sql` を追加して、誤って commit しないようにする
- バックアップファイルには **本番データそのもの**（個人情報、給与情報）が含まれるため、扱いは慎重に
- 数週間〜数ヶ月経って不要になったら、適切な手段で破棄する
