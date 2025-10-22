import { PageHeaderMeta } from "@/components/page-header/page-header-meta";
import AttendanceView from "@/components/attendance";
import { requireUser } from "@/lib/auth/requireUser";

export default async function AttendancePage() {
    const user = await requireUser();

    return (
        <div className="container mx-auto py-6 space-y-6 px-4 sm:px-6 lg:px-8">
            <PageHeaderMeta
                title="勤怠記録"
                description="あなたの出勤・退勤・休憩の履歴を月別に確認できます。勤務時間・残業時間・総労働時間などの詳細な統計情報を表示し、CSVエクスポートも可能です。"
            />
            <AttendanceView isAdmin={false} userId={user.id} />
        </div>
    );
}
