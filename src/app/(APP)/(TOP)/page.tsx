import React from "react";
import { PageHeaderMeta } from "@/components/page-header/page-header-meta";
import { requireUser } from "@/lib/auth/requireUser";
import AttendancePunch from "./_components/attendance-punch";
import WorkLogForm from "./_components/worklog-form";

/**
 * トップページコンポーネント
 * 勤務打刻と作業ログ入力のメインページ
 * サーバーコンポーネントとして実装
 */
export default async function TopPage() {
    const user = await requireUser();

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
                    <AttendancePunch userId={user.id} />

                    {/* 作業ログフォームコンポーネント - 作業内容の記録機能 */}
                    <WorkLogForm userId={user.id} />
                </div>
            </div>
        </div>
    );
}
