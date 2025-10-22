import { requireUser } from "@/lib/auth/requireUser";
import { redirect } from "next/navigation";
import { PageHeaderMeta } from "@/components/page-header/page-header-meta";
import AttendanceView from "@/components/attendance";

export default async function page() {
    const user = await requireUser();

    // admin 権限のユーザーのみアクセス可能
    if (!user.isAdmin) {
        redirect("/");
    }

    return (
        <div className="container mx-auto py-6 space-y-6 px-4 sm:px-6 lg:px-8">
            <PageHeaderMeta
                title="管理画面"
                description="全従業員の勤怠記録を統合管理できる管理者専用ダッシュボードです。月別の勤務データ、統計情報、勤務時間の集計を確認し、CSVエクスポートによるデータ分析が可能です。"
            />

            <AttendanceView isAdmin={true} userId={user.id} />
        </div>
    );
}
