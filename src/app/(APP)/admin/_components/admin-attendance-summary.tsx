"use client";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { UserAttendanceSummary } from "./admin-attendance-actions";

interface AdminAttendanceSummaryProps {
    summary: UserAttendanceSummary[];
    year: number;
    month: number;
}

export function AdminAttendanceSummary({
    summary,
    year,
    month,
}: AdminAttendanceSummaryProps) {
    const formatHours = (hours: number) => {
        const wholeHours = Math.floor(hours);
        const minutesFloat = (hours - wholeHours) * 60;
        const minutes = Math.floor(minutesFloat);
        const seconds = Math.round((minutesFloat - minutes) * 60);
        return `${wholeHours}時間${minutes}分${seconds}秒`;
    };

    const totalWorkedDays = summary.reduce(
        (sum, user) => sum + user.workedDays,
        0
    );
    const totalWorkedHours = summary.reduce(
        (sum, user) => sum + user.totalWorkedHours,
        0
    );

    return (
        <div className="space-y-4">
            {/* 全体統計 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            対象月
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {year}年{month}月
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            勤務ユーザー数
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {summary.length} 人
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            総勤務時間
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {formatHours(totalWorkedHours)}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* ユーザー別統計テーブル */}
            <Card>
                <CardHeader>
                    <CardTitle>ユーザー別勤務統計</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="font-bold">
                                        ユーザー
                                    </TableHead>
                                    <TableHead className="font-bold text-center">
                                        勤務日数
                                    </TableHead>
                                    <TableHead className="font-bold text-center">
                                        勤務時間
                                    </TableHead>
                                    <TableHead className="font-bold text-center">
                                        平均勤務時間/日
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {summary.length === 0 ? (
                                    <TableRow>
                                        <TableCell
                                            colSpan={4}
                                            className="text-center py-8 text-muted-foreground"
                                        >
                                            勤務記録がありません
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    summary.map((user) => {
                                        const avgHoursPerDay =
                                            user.workedDays > 0
                                                ? user.totalWorkedHours /
                                                  user.workedDays
                                                : 0;

                                        return (
                                            <TableRow key={user.userId}>
                                                <TableCell className="font-semibold text-foreground">
                                                    {user.userLastName}{" "}
                                                    {user.userFirstName}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <Badge variant="secondary">
                                                        {user.workedDays} 日
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-center font-semibold text-foreground">
                                                    {formatHours(
                                                        user.totalWorkedHours
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-center text-muted-foreground">
                                                    {user.workedDays > 0
                                                        ? formatHours(
                                                              avgHoursPerDay
                                                          )
                                                        : "-"}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
