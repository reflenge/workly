"use client";

import { useEffect, useTransition, useState } from "react";
import { AttendanceRecordsResult } from "./actions";
import { Spinner } from "@/components/ui/spinner";
import { Skeleton } from "@/components/ui/skeleton";
import { AttendanceRecordsResultType } from "./actions";
import { useSearchParams } from "next/navigation";
import { parseYearMonthParams, filterRecordsByYearMonth } from "./util";
import { DataTable } from "./data-table";
import { columns } from "./columns";
import YearMonthPagination from "./year-month-pagination";
import DataDashboard from "./data-dashboard";

interface AttendanceViewProps {
    isAdmin: boolean;
    userId: string;
}

const AttendanceView = ({ isAdmin, userId }: AttendanceViewProps) => {
    const searchParams = useSearchParams();

    // 年月の検索パラメータをバリデーション
    const { year, month } = parseYearMonthParams(
        searchParams.get("y"),
        searchParams.get("m")
    );

    const [isPending, startTransition] = useTransition(); // データ取得中かどうかを管理する状態
    const [attendanceRecords, setAttendanceRecords] = useState<
        AttendanceRecordsResultType[]
    >([]); // 元データを格納する配列

    useEffect(() => {
        const fetchAttendanceRecords = async () => {
            startTransition(async () => {
                const result: AttendanceRecordsResultType[] =
                    await AttendanceRecordsResult();

                // 1. adminか?trueなら全ユーザーのレコードを表示、falseなら自分のレコードを表示
                const userFilteredData = isAdmin
                    ? result
                    : result.filter((record) => record.user.id === userId);

                // 2. 年月でフィルタリング（startedAtでJSTの年月と比較）
                const filteredData = filterRecordsByYearMonth(
                    userFilteredData,
                    year,
                    month
                );

                setAttendanceRecords(filteredData);
            });
        };
        fetchAttendanceRecords();
    }, [isAdmin, userId, year, month]);

    if (isPending) {
        return (
            <div className="container mx-auto space-y-6">
                {/* ローディングインジケータ - 上部に配置 */}
                <div className="flex items-center justify-center gap-2 py-4">
                    <Spinner className="size-5 text-primary" />
                    <span className="text-sm text-muted-foreground animate-pulse">
                        読み込み中...
                    </span>
                </div>

                {/* ページネーション想定のスケルトン */}
                <div className="flex justify-center gap-2">
                    <Skeleton className="h-9 w-24" />
                    <Skeleton className="h-9 w-9" />
                    <Skeleton className="h-9 w-9" />
                    <Skeleton className="h-9 w-24" />
                </div>

                {/* 上部: 年月ナビゲーション想定のスケルトン */}
                <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                        <Skeleton className="h-9 w-20 rounded-md" />
                        <Skeleton className="h-9 w-20 rounded-md" />
                    </div>
                    <Skeleton className="h-9 w-40" />
                </div>

                {/* ダッシュボードカード想定のスケルトン */}
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 rounded-lg border">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div
                            key={i}
                            className="p-6 rounded-lg bg-card space-y-3"
                        >
                            <Skeleton className="h-4 w-28" />
                            <Skeleton className="h-9 w-24" />
                            <Skeleton className="h-3 w-32" />
                        </div>
                    ))}
                </div>

                {/* テーブル想定のスケルトン */}
                <div className="rounded-lg border overflow-hidden bg-card">
                    {/* テーブルヘッダー */}
                    <div className="p-4 border-b bg-muted/50">
                        <div className="flex gap-4">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-4 w-20" />
                            <Skeleton className="h-4 w-28" />
                        </div>
                    </div>
                    {/* テーブル行 */}
                    <div className="divide-y">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <div key={i} className="p-4">
                                <div className="flex gap-4 items-center">
                                    <Skeleton className="h-5 w-24" />
                                    <Skeleton className="h-5 w-32" />
                                    <Skeleton className="h-5 w-20" />
                                    <Skeleton className="h-5 w-28" />
                                    <Skeleton className="h-5 w-16 ml-auto" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }
    return (
        <div className="container mx-auto">
            <YearMonthPagination />
            <DataDashboard isAdmin={isAdmin} data={attendanceRecords} year={year} month={month} />
            <DataTable
                isAdmin={isAdmin}
                columns={columns}
                data={attendanceRecords}
            />
        </div>
    );
};

export default AttendanceView;
