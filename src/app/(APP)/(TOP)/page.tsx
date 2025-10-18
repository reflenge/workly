// React関連のインポート
import React from "react";
import { PageHeaderMeta } from "@/components/page-header/page-header-meta";
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
        <div className="container mx-auto py-6 space-y-6 px-4 sm:px-6 lg:px-8">
            <PageHeaderMeta
                title="打刻"
                description="勤務開始・休憩・退勤の打刻を行えます"
            />
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                {/* メインコンテンツエリア */}
                <div className="w-full flex justify-center space-y-4 flex-col max-w-md mx-auto">
                    {/* 勤務打刻コンポーネント - 勤務開始/休憩/退勤の打刻機能 */}
                    <AttendancePunch userId={userData[0].id} />

                    {/* 作業ログフォームコンポーネント - 作業内容の記録機能 */}
                    <WorkLogForm userId={userData[0].id} />
                </div>
            </div>
        </div>
    );
}
