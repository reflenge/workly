import { db } from "@/db";
import { users, attendanceLogs, attendanceStatus } from "@/db/schema";
import { eq, isNull } from "drizzle-orm";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatToJstDateTime } from "@/lib/utils";
import { PageHeaderMeta } from "@/components/page-header/page-header-meta";

export default async function UsersCurrentStatusPage() {
    // 全ユーザーと、進行中(ended_at IS NULL)の打刻を LEFT JOIN
    const rows = await db
        .select({
            userId: users.id,
            lastName: users.lastName,
            firstName: users.firstName,
            isActive: users.isActive,
            statusId: attendanceLogs.statusId,
            statusCode: attendanceStatus.code,
            statusLabel: attendanceStatus.label,
            startedAt: attendanceLogs.startedAt,
        })
        .from(users)
        .leftJoin(attendanceLogs, eq(attendanceLogs.userId, users.id))
        .leftJoin(
            attendanceStatus,
            eq(attendanceStatus.id, attendanceLogs.statusId)
        )
        .where(isNull(attendanceLogs.endedAt));

    const getBadgeVariant = (code?: string | null) => {
        switch (code) {
            case "WORKING":
                return "default" as const;
            case "BREAK":
                return "secondary" as const;
            case "OFF":
                return "destructive" as const;
            default:
                return "outline" as const;
        }
    };

    const formatDateTime = (date?: Date | null) => {
        if (!date) return "-";
        return formatToJstDateTime(date);
    };

    return (
        <div className="container mx-auto py-6 space-y-6 px-4 sm:px-6 lg:px-8">
            <PageHeaderMeta
                title="ステータス一覧"
                description="全従業員の現在の勤務状態（勤務中・休憩中・退勤済み）をリアルタイムで一覧表示します。各ユーザーの最新ステータスと開始時刻、アクティブ状態を確認できます。"
            />

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="font-bold">
                                ユーザー
                            </TableHead>
                            <TableHead className="font-bold">状態</TableHead>
                            <TableHead className="font-bold">
                                開始時刻
                            </TableHead>
                            <TableHead>アクティブ</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {rows.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={4}
                                    className="text-center py-8 text-muted-foreground"
                                >
                                    表示できるユーザーがいません
                                </TableCell>
                            </TableRow>
                        ) : (
                            rows.map((r) => (
                                <TableRow key={r.userId}>
                                    <TableCell className="font-semibold text-foreground">
                                        {r.lastName} {r.firstName}
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant={getBadgeVariant(
                                                r.statusCode
                                            )}
                                        >
                                            {r.statusLabel ?? "未取得"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-sm text-foreground">
                                        {formatDateTime(
                                            r.startedAt as unknown as Date
                                        )}
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {r.isActive ? "Yes" : "No"}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
