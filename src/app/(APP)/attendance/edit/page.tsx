import { PageHeaderMeta } from "@/components/page-header/page-header-meta";
import { requireUser } from "@/lib/auth/requireUser";
import { db } from "@/db";
import { attendanceLogs, attendanceStatus } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { AttendanceEditList } from "./_components/attendance-edit-list";

export default async function AttendanceEditListPage() {
    const user = await requireUser();

    // 直近のログをいくつか取得して表示する（デバッグ・利便性のため）
    const recentLogs = await db
        .select({
            id: attendanceLogs.id,
            startedAt: attendanceLogs.startedAt,
            endedAt: attendanceLogs.endedAt,
            statusId: attendanceLogs.statusId,
            statusLabel: attendanceStatus.label,
            note: attendanceLogs.note,
        })
        .from(attendanceLogs)
        .innerJoin(
            attendanceStatus,
            eq(attendanceLogs.statusId, attendanceStatus.id)
        )
        .where(eq(attendanceLogs.userId, user.id))
        .orderBy(desc(attendanceLogs.startedAt))
        .limit(5);

    return (
        <div className="container mx-auto py-6 space-y-6 px-4 sm:px-6 lg:px-8">
            <PageHeaderMeta
                title="勤怠ログ修正"
                description="修正したい勤怠ログを選択してください。"
            />
            <AttendanceEditList logs={recentLogs} />
        </div>
    );
}
