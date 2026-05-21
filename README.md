# 人生リスト

仕事・日常・イベント・夢を一箇所に集めて、今の自分の「やること」「やりたいこと」を見渡す Web アプリです。

## 機能（MVP）

- Google アカウントでログイン
- アイテムの追加・編集・削除
- カテゴリ（仕事 / 日常 / イベント / 夢）
- タグ付けとフィルタ
- ステータス（未着手 / 進行中 / 完了）
- スマホ・PC 対応 UI

---

## セットアップ手順

### 1. Supabase アカウントを作成

1. [https://supabase.com](https://supabase.com) にアクセス
2. **Start your project** → GitHub または Google でサインアップ
3. **New project** をクリック
4. プロジェクト名（例: `jinsei-list`）、データベースパスワード、リージョン（`Northeast Asia (Tokyo)` 推奨）を設定
5. プロジェクトが作成されるまで 1〜2 分待つ

### 2. データベースを作成

1. Supabase ダッシュボード左メニュー → **SQL Editor**
2. **New query** をクリック
3. このリポジトリの `supabase/schema.sql` の内容をコピー＆ペースト
4. **Run** をクリック

### 3. Google ログインを設定

#### 3-1. Google Cloud Console で OAuth クライアントを作成

1. [Google Cloud Console](https://console.cloud.google.com/) にアクセス
2. 新しいプロジェクトを作成（例: `jinsei-list-auth`）
3. **APIs & Services** → **OAuth consent screen**
   - User Type: **External** → Create
   - アプリ名を入力（例: `人生リスト`）
   - ユーザーサポートメールを設定
   - テストユーザーに自分の Gmail アドレスを追加
4. **APIs & Services** → **Credentials** → **Create Credentials** → **OAuth client ID**
   - Application type: **Web application**
   - Authorized redirect URIs に以下を追加:
     ```
     https://<YOUR-PROJECT-REF>.supabase.co/auth/v1/callback
     ```
     ※ `<YOUR-PROJECT-REF>` は Supabase ダッシュボード → Settings → General の **Reference ID**
5. 表示された **Client ID** と **Client Secret** をメモ

#### 3-2. Supabase に Google プロバイダを有効化

1. Supabase ダッシュボード → **Authentication** → **Providers**
2. **Google** を有効化（Enable）
3. Client ID と Client Secret を入力 → **Save**

#### 3-3. リダイレクト URL を設定

1. **Authentication** → **URL Configuration**
2. **Site URL** に `http://localhost:5173` を設定（開発時）
3. **Redirect URLs** に以下を追加:
   - `http://localhost:5173`
   - 本番デプロイ後の URL（例: `https://your-app.vercel.app`）

### 4. 環境変数を設定

1. Supabase ダッシュボード → **Settings** → **API**
2. **Project URL** と **anon public** キーをコピー
3. プロジェクト直下に `.env` ファイルを作成:

```bash
cp .env.example .env
```

4. `.env` を編集:

```
VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 5. ローカルで起動

```bash
npm install
npm run dev
```

ブラウザで [http://localhost:5173](http://localhost:5173) を開き、Google ログインを試してください。

---

## 本番デプロイ（Vercel）

1. [Vercel](https://vercel.com) にサインアップ
2. このリポジトリを GitHub に push して Vercel にインポート
3. 環境変数 `VITE_SUPABASE_URL` と `VITE_SUPABASE_ANON_KEY` を設定
4. デプロイ後、Supabase の **Redirect URLs** に Vercel の URL を追加

---

## 技術スタック

- React + TypeScript + Vite
- Tailwind CSS
- Supabase（PostgreSQL + Auth）
