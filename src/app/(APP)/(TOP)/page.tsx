// React関連のインポート
import React from "react";
// Supabaseクライアント（サーバーサイド用）
import { createClient } from "@/lib/supabase/server";
// Next.jsのリダイレクト機能
import { redirect } from "next/navigation";
// データベース接続とスキーマ
import { db } from "@/db";
import { users } from "@/db/schema";
// Drizzle ORMのクエリ条件
import { eq } from "drizzle-orm";
// カスタムコンポーネント
import AttendancePunch from "./_components/attendance-punch";
import WorkLogForm from "./_components/worklog-form";
import { ClockIcon } from "lucide-react";

/**
 * トップページコンポーネント
 * 勤務打刻と作業ログ入力のメインページ
 * サーバーコンポーネントとして実装
 */
export default async function TopPage() {
    // Supabaseクライアントを作成して認証状態を取得
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    // ユーザーが認証されていない場合はログインページにリダイレクト
    if (!user) {
        redirect("/auth/login");
    }

    // データベースからユーザー情報を取得
    // authId（Supabaseの認証ID）でユーザーを検索
    const userData = await db
        .select()
        .from(users)
        .where(eq(users.authId, user.id))
        .limit(1);

    // ユーザーがデータベースに存在しない場合もログインページにリダイレクト
    if (userData.length === 0) {
        redirect("/auth/login");
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 sm:px-6 lg:px-8">
            {/* ページタイトル */}
            <h1 className="text-4xl font-bold mb-10 text-center">打刻</h1>

            {/* メインコンテンツエリア */}
            <div className="w-full flex justify-center space-y-4 flex-col max-w-md mx-auto">
                {/* 勤務打刻コンポーネント - 勤務開始/休憩/退勤の打刻機能 */}
                <AttendancePunch userId={userData[0].id} />

                {/* 作業ログフォームコンポーネント - 作業内容の記録機能 */}
                <WorkLogForm userId={userData[0].id} />
            </div>

            {/* 注意事項セクション */}
            <section className="mt-8 w-full max-w-md mx-auto px-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center gap-3 shadow-sm">
                    {/* 時計アイコン（SVG） */}
                    <ClockIcon className="w-5 h-5" />

                    {/* 注意メッセージ */}
                    <span className="text-blue-900 text-base">
                        休憩から勤務に戻るときも
                        <span className="font-semibold underline decoration-blue-300 decoration-2 underline-offset-2 mx-1">
                            勤務開始
                        </span>
                        ボタンを押してください。
                    </span>
                </div>
            </section>
        </div>
    );
}
