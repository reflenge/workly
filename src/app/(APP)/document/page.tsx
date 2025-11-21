import { PageHeaderMeta } from "@/components/page-header/page-header-meta";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

export default function DocumentPage() {
    return (
        <div className="p-4 space-y-8 max-w-5xl mx-auto">
            <PageHeaderMeta
                title="ドキュメント"
                description="システム全体のドキュメント"
            />

            <section className="space-y-4">
                <h2 className="text-3xl font-bold tracking-tight">
                    1. アプリケーションの概要
                </h2>
                <Card>
                    <CardHeader>
                        <CardTitle>Workly (Work + Friendly)</CardTitle>
                        <CardDescription>Reflenge 勤怠管理+</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <h3 className="font-semibold mb-2">コンセプト</h3>
                            <p className="text-muted-foreground">
                                自由な働き方を採用するベンチャー企業向けの、シンプルで本質的な勤怠・業務管理ツール。
                            </p>
                        </div>
                        <div>
                            <h3 className="font-semibold mb-2">目的</h3>
                            <p className="text-muted-foreground">
                                「いつ、誰が、どれくらい働き、何をしたか」を正確に記録し、透明性を確保することで、公正な評価とスムーズな給与計算を実現する。
                            </p>
                        </div>
                        <div>
                            <h3 className="font-semibold mb-2">
                                ターゲットユーザー
                            </h3>
                            <ul className="list-disc list-inside text-muted-foreground ml-4">
                                <li>
                                    <strong>一般従業員</strong>
                                    : 好きな時間に働く時給・月給制のメンバー。
                                </li>
                                <li>
                                    <strong>管理者</strong>
                                    :
                                    メンバーの稼働状況と業務内容を把握し、給与計算を行う担当者。
                                </li>
                            </ul>
                        </div>
                    </CardContent>
                </Card>
            </section>

            <Separator />

            <section className="space-y-4">
                <h2 className="text-3xl font-bold tracking-tight">
                    2. 要件定義
                </h2>

                <div className="space-y-6">
                    <div>
                        <h3 className="text-xl font-semibold mb-4">
                            勤怠 (Attendance Logs)
                        </h3>
                        <Card>
                            <CardContent className="p-0">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>アクション</TableHead>
                                            <TableHead>説明</TableHead>
                                            <TableHead>User:自分</TableHead>
                                            <TableHead>User:他人</TableHead>
                                            <TableHead>Admin</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        <TableRow>
                                            <TableCell>report</TableCell>
                                            <TableCell>
                                                集計・出力（CSV/PDF等で勤務時間をまとめる）
                                            </TableCell>
                                            <TableCell>✅</TableCell>
                                            <TableCell>❌</TableCell>
                                            <TableCell>✅</TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell>read</TableCell>
                                            <TableCell>
                                                閲覧（自分の全ログ、他人は状態のみ）
                                            </TableCell>
                                            <TableCell>✅</TableCell>
                                            <TableCell>✅ ※状態のみ</TableCell>
                                            <TableCell>✅</TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell>create</TableCell>
                                            <TableCell>
                                                新規作成（出勤・退勤・休憩打刻）
                                            </TableCell>
                                            <TableCell>✅</TableCell>
                                            <TableCell>❌</TableCell>
                                            <TableCell>✅</TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell>update</TableCell>
                                            <TableCell>
                                                修正（打刻時刻や内容の変更）
                                            </TableCell>
                                            <TableCell>
                                                ✅ ※作成から72h以内
                                            </TableCell>
                                            <TableCell>❌</TableCell>
                                            <TableCell>✅ ※期限なし</TableCell>
                                        </TableRow>
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </div>

                    <div>
                        <h3 className="text-xl font-semibold mb-4">
                            プロジェクト (Projects)
                        </h3>
                        <Card>
                            <CardContent className="p-0">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>アクション</TableHead>
                                            <TableHead>説明</TableHead>
                                            <TableHead>User:自分</TableHead>
                                            <TableHead>User:他人</TableHead>
                                            <TableHead>Admin</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        <TableRow>
                                            <TableCell>report</TableCell>
                                            <TableCell>
                                                集計・出力（プロジェクト単位の時間/工数）
                                            </TableCell>
                                            <TableCell>✅</TableCell>
                                            <TableCell>✅</TableCell>
                                            <TableCell>✅</TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell>read</TableCell>
                                            <TableCell>
                                                閲覧（プロジェクト情報を見る）
                                            </TableCell>
                                            <TableCell>✅</TableCell>
                                            <TableCell>✅</TableCell>
                                            <TableCell>✅</TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell>create</TableCell>
                                            <TableCell>
                                                新規作成（新しいプロジェクトを立てる）
                                            </TableCell>
                                            <TableCell>✅</TableCell>
                                            <TableCell>✅</TableCell>
                                            <TableCell>✅</TableCell>
                                        </TableRow>
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </section>

            <Separator />

            <section className="space-y-4">
                <h2 className="text-3xl font-bold tracking-tight">
                    3. システムフロー
                </h2>
                <Card>
                    <CardHeader>
                        <CardTitle>勤怠記録フロー</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="bg-muted p-4 rounded-md overflow-x-auto">
                            <pre className="text-sm">
                                {`勤務外 (Off)
  ↓ [出勤]
勤務中 (Working)
  ↓ [休憩開始]      ↑ [休憩終了]
休憩中 (Break)      勤務中 (Working)
  ↓ [退勤]          ↓ [退勤]
勤務外 (Off)        勤務外 (Off)`}
                            </pre>
                        </div>
                    </CardContent>
                </Card>
            </section>

            <Separator />

            <section className="space-y-4">
                <h2 className="text-3xl font-bold tracking-tight">
                    4. データベース設計
                </h2>
                <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>User</CardTitle>
                            <CardDescription>ユーザー情報</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ul className="list-disc list-inside text-sm text-muted-foreground">
                                <li>id (PK)</li>
                                <li>auth_id (Supabase Auth ID)</li>
                                <li>is_admin (管理者フラグ)</li>
                                <li>last_name / first_name</li>
                            </ul>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>AttendanceLog</CardTitle>
                            <CardDescription>勤怠ログ</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ul className="list-disc list-inside text-sm text-muted-foreground">
                                <li>id (PK)</li>
                                <li>user_id (FK)</li>
                                <li>status_id (FK: OFF/WORKING/BREAK)</li>
                                <li>started_at / ended_at</li>
                            </ul>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>Project</CardTitle>
                            <CardDescription>プロジェクト</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ul className="list-disc list-inside text-sm text-muted-foreground">
                                <li>id (PK)</li>
                                <li>name</li>
                                <li>description</li>
                                <li>is_active</li>
                            </ul>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>WorkLog</CardTitle>
                            <CardDescription>作業ログ</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ul className="list-disc list-inside text-sm text-muted-foreground">
                                <li>id (PK)</li>
                                <li>user_id (FK)</li>
                                <li>project_id (FK)</li>
                                <li>content</li>
                            </ul>
                        </CardContent>
                    </Card>
                </div>
            </section>

            <Separator />

            <section className="space-y-4">
                <h2 className="text-3xl font-bold tracking-tight">
                    5. ロジック・仕様メモ
                </h2>
                <Card>
                    <CardContent className="pt-6 space-y-4">
                        <div>
                            <h3 className="font-semibold mb-1">出勤・退勤</h3>
                            <p className="text-sm text-muted-foreground">
                                出勤時は「勤務中」ステータスで開始時刻を記録します。退勤時は、直近の未終了ログの終了時刻を更新します。
                            </p>
                        </div>
                        <div>
                            <h3 className="font-semibold mb-1">休憩</h3>
                            <p className="text-sm text-muted-foreground">
                                休憩開始時に「勤務中」を終了し、「休憩中」を開始します。休憩終了時に「休憩中」を終了し、再度「勤務中」を開始します。
                            </p>
                        </div>
                        <div>
                            <h3 className="font-semibold mb-1">給与締め</h3>
                            <p className="text-sm text-muted-foreground">
                                給与期間を作成し、勤怠を集計して給与明細（PayrollItem）を更新します。期間を「締め済」にすると、以後の編集はロックされます。
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </section>
            <Separator />

            <section className="space-y-4">
                <h2 className="text-3xl font-bold tracking-tight">
                    6. ファイル構成とコード詳細
                </h2>
                <div className="space-y-8">
                    {/* 1. App Router Structure */}
                    <div>
                        <h3 className="text-xl font-semibold mb-4">
                            1. アプリケーション構造 (src/app)
                        </h3>
                        <div className="grid gap-4 md:grid-cols-2">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base font-mono">
                                        src/app/(APP)/layout.tsx
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground">
                                        アプリケーション全体のレイアウトを定義。サイドバー（AppSidebar）を含み、認証済みユーザー向けの共通UIを提供します。
                                    </p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base font-mono">
                                        src/app/(APP)/(TOP)/page.tsx
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground">
                                        トップページ（打刻画面）。`AttendancePunch`コンポーネントを表示し、出退勤の操作を行います。
                                    </p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base font-mono">
                                        src/app/(APP)/attendance/page.tsx
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground">
                                        勤怠履歴ページ。`AttendanceView`を使用して、自身の月別勤怠ログと統計情報を表示します。
                                    </p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base font-mono">
                                        src/app/(APP)/list/page.tsx
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground">
                                        ステータス一覧ページ。全ユーザーの現在の状態（勤務中、休憩中、退勤）をリアルタイムリストで表示します。
                                    </p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base font-mono">
                                        src/app/(APP)/projects/page.tsx
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground">
                                        プロジェクト管理ページ（管理者のみ）。作業ログに紐づけるプロジェクトのCRUD操作を行います。
                                    </p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base font-mono">
                                        src/app/(APP)/settings/page.tsx
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground">
                                        設定ページ。ユーザープロフィールの編集や、割り当てられているNFCカード情報の確認ができます。
                                    </p>
                                </CardContent>
                            </Card>
                        </div>
                    </div>

                    {/* 2. Admin Features */}
                    <div>
                        <h3 className="text-xl font-semibold mb-4">
                            2. 管理機能 (src/app/(APP)/admin)
                        </h3>
                        <div className="grid gap-4 md:grid-cols-2">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base font-mono">
                                        src/app/(APP)/admin/(TOP)/page.tsx
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground">
                                        管理者ダッシュボード。`AttendanceView`を管理者モード（`isAdmin=true`）で呼び出し、全ユーザーの勤怠を閲覧・管理します。
                                    </p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base font-mono">
                                        src/app/(APP)/admin/users/page.tsx
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground">
                                        ユーザー管理ページ。従業員アカウントの作成、編集、権限設定などを行います。
                                    </p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base font-mono">
                                        src/app/(APP)/admin/cards/page.tsx
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground">
                                        カード管理ページ。NFCカードの登録、編集、無効化を行い、物理カードとシステムIDを管理します。
                                    </p>
                                </CardContent>
                            </Card>
                        </div>
                    </div>

                    {/* 3. Core Logic & Components */}
                    <div>
                        <h3 className="text-xl font-semibold mb-4">
                            3. コアロジック・コンポーネント
                        </h3>
                        <div className="space-y-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base font-mono">
                                        src/lib/auth/requireUser.ts
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground mb-2">
                                        <strong>認証ガード:</strong>{" "}
                                        ページアクセス時に実行され、Supabase
                                        AuthとDBユーザーを検証します。
                                    </p>
                                    <div className="bg-muted p-4 rounded-md overflow-x-auto">
                                        <pre className="text-xs font-mono">
                                            {`export const requireUser = cache(async (): Promise<PublicUser> => {
    // Cookieによるバイパス認証チェック
    // ...
    // Supabase Authによる通常認証
    const { data, error } = await supabase.auth.getUser();
    // ...
    // DBユーザー情報の取得
    const appUser = await db.query.users.findFirst({...});
    return toPublicUser(appUser);
});`}
                                        </pre>
                                    </div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base font-mono">
                                        src/app/(APP)/(TOP)/_components/attendance-actions.ts
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground mb-2">
                                        <strong>打刻ロジック:</strong>{" "}
                                        状態遷移のバリデーションと、日跨ぎ・月跨ぎの自動分割処理を含む打刻記録処理。
                                    </p>
                                    <div className="bg-muted p-4 rounded-md overflow-x-auto">
                                        <pre className="text-xs font-mono">
                                            {`export async function recordAttendance(input: AttendanceRecordInput) {
    // 権限チェック
    // ステータス遷移チェック (例: 勤務中 -> 勤務開始 は不可)
    // トランザクション開始
    //   既存ログがあれば終了処理 (月跨ぎなら分割)
    //   新規ログを作成 (started_at = now)
}`}
                                        </pre>
                                    </div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base font-mono">
                                        src/db/schema.ts
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground">
                                        <strong>データベース定義:</strong>{" "}
                                        Drizzle
                                        ORMを使用したスキーマ定義。`users`,
                                        `attendanceLogs`,
                                        `projects`などのテーブル構造とリレーションを定義しています。
                                    </p>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </section>

            <Separator />

            <section className="space-y-4">
                <h2 className="text-3xl font-bold tracking-tight">
                    7. 自動生成ドキュメント
                </h2>
                <div className="grid gap-4 md:grid-cols-2">
                    <a
                        href="/docs/dependency-report.html"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block"
                    >
                        <Card className="h-full hover:bg-muted/50 transition-colors">
                            <CardHeader>
                                <div className="flex items-center gap-2">
                                    <CardTitle className="text-lg">
                                        依存関係グラフ
                                    </CardTitle>
                                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                                        dependency-cruiser
                                    </span>
                                </div>
                                <CardDescription>
                                    プロジェクト内のファイル間の依存関係を可視化したインタラクティブなグラフです。
                                    モジュール間の結合度や循環参照を確認できます。
                                </CardDescription>
                            </CardHeader>
                        </Card>
                    </a>

                    <a
                        href="/docs/api/index.html"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block"
                    >
                        <Card className="h-full hover:bg-muted/50 transition-colors">
                            <CardHeader>
                                <div className="flex items-center gap-2">
                                    <CardTitle className="text-lg">
                                        API リファレンス
                                    </CardTitle>
                                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                                        TypeDoc
                                    </span>
                                </div>
                                <CardDescription>
                                    TypeScriptの型定義とJSDocコメントから生成された詳細なAPIドキュメントです。
                                    各関数のシグネチャやインターフェースの定義を確認できます。
                                </CardDescription>
                            </CardHeader>
                        </Card>
                    </a>

                    <a
                        href="/docs/components.html"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block"
                    >
                        <Card className="h-full hover:bg-muted/50 transition-colors">
                            <CardHeader>
                                <div className="flex items-center gap-2">
                                    <CardTitle className="text-lg">
                                        コンポーネント仕様書
                                    </CardTitle>
                                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                                        React Docgen
                                    </span>
                                </div>
                                <CardDescription>
                                    主要なReactコンポーネントのProps定義と説明をまとめたドキュメントです。
                                    各コンポーネントの使い方やパラメータを確認できます。
                                </CardDescription>
                            </CardHeader>
                        </Card>
                    </a>
                </div>
            </section>
        </div >
    );
}
