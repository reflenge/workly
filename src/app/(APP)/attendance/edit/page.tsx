import { PageHeaderMeta } from "@/components/page-header/page-header-meta";
import { Card, CardContent } from "@/components/ui/card";
import { requireUser } from "@/lib/auth/requireUser";
import Link from "next/link";
import { db } from "@/db";
import { attendanceLogs, attendanceStatus } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { formatToJstDateTime } from "@/lib/utils";

export default async function AttendanceEditListPage() {
    const user = await requireUser();

    // 直近のログをいくつか取得して表示する（デバッグ・利便性のため）
    const recentLogs = await db
        .select({
            id: attendanceLogs.id,
            startedAt: attendanceLogs.startedAt,
            endedAt: attendanceLogs.endedAt,
            statusLabel: attendanceStatus.label,
        })
        .from(attendanceLogs)
        .innerJoin(
            attendanceStatus,
            eq(attendanceLogs.statusId, attendanceStatus.id)
        )
        .where(eq(attendanceLogs.userId, user.id))
        .orderBy(desc(attendanceLogs.startedAt))
        .limit(10);

    return (
        <div className="container mx-auto py-6 space-y-6 px-4 sm:px-6 lg:px-8">
            <PageHeaderMeta
                title="勤怠ログ修正"
                description="修正したい勤怠ログを選択してください。"
            />
            <Card>
                <CardContent className="p-6">
                    <h3 className="text-lg font-semibold mb-4">直近の履歴</h3>
                    {recentLogs.length > 0 ? (
                        <ul className="space-y-2">
                            {recentLogs.map((log) => (
                                <li key={log.id} className="border p-3 rounded hover:bg-gray-50">
                                    <Link href={`/attendance/edit/${log.id}`} className="flex justify-between items-center w-full">
                                        <div>
                                            <span className="font-medium mr-2">{log.statusLabel}</span>
                                            <span className="text-sm text-gray-500">
                                                {formatToJstDateTime(log.startedAt)}
                                                {log.endedAt && ` - ${formatToJstDateTime(log.endedAt)}`}
                                            </span>
                                        </div>
                                        <span className="text-blue-600 text-sm">修正 &rarr;</span>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-gray-500">履歴がありません。</p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
