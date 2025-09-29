"use client";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { AttendanceLogItem } from "./attendance-actions";

interface AttendanceDataTableProps {
    data: AttendanceLogItem[];
}

export function AttendanceDataTable({ data }: AttendanceDataTableProps) {
    const getStatusBadgeVariant = (statusId: number) => {
        switch (statusId) {
            case 1:
                return "destructive"; // 退勤
            case 2:
                return "default"; // 出勤中
            case 3:
                return "secondary"; // 休憩中
            default:
                return "outline"; // その他
        }
    };

    const formatDateTime = (dateString: string) => {
        return new Date(dateString).toLocaleString("ja-JP", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="font-bold">ステータス</TableHead>
                        <TableHead className="font-bold">開始時刻</TableHead>
                        <TableHead className="font-bold">終了時刻</TableHead>
                        <TableHead>開始ソース</TableHead>
                        <TableHead>終了ソース</TableHead>
                        <TableHead>メモ</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.length === 0 ? (
                        <TableRow>
                            <TableCell
                                colSpan={6}
                                className="text-center py-8 text-muted-foreground"
                            >
                                出勤記録がありません
                            </TableCell>
                        </TableRow>
                    ) : (
                        data.map((log) => (
                            <TableRow key={log.id}>
                                <TableCell>
                                    <Badge
                                        variant={getStatusBadgeVariant(
                                            log.statusId
                                        )}
                                    >
                                        {log.statusLabel}
                                    </Badge>
                                </TableCell>
                                <TableCell className="font-semibold text-foreground">
                                    {formatDateTime(log.startedAt)}
                                </TableCell>
                                <TableCell className="font-semibold text-foreground">
                                    {log.endedAt ? (
                                        formatDateTime(log.endedAt)
                                    ) : (
                                        <span className="text-muted-foreground">
                                            未終了
                                        </span>
                                    )}
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground">
                                    {log.startedSourceLabel}
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground">
                                    {log.endedSourceLabel || "-"}
                                </TableCell>
                                <TableCell className="text-sm">
                                    {log.note || "-"}
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
