"use client";

import { useState, useEffect, useTransition } from "react";
import { AdminAttendanceDataTable } from "./admin-attendance-data-table";
import { AdminAttendanceSummary } from "./admin-attendance-summary";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
    fetchAllAttendanceLogs,
    fetchAllUsers,
    fetchAllAttendanceStatuses,
    fetchUserAttendanceSummary,
    type AdminAttendanceFilters,
    type UserAttendanceSummary,
} from "./admin-attendance-actions";

export function AdminAttendancePageWrapper() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [data, setData] = useState<any[]>([]);
    const [summary, setSummary] = useState<UserAttendanceSummary[]>([]);
    const [users, setUsers] = useState<
        Array<{ id: string; name: string; isActive: boolean }>
    >([]);
    const [statuses, setStatuses] = useState<
        Array<{ id: number; code: string; label: string }>
    >([]);
    const [loading, setLoading] = useState(true);
    const [isPending, startTransition] = useTransition();
    const [filters, setFilters] = useState<AdminAttendanceFilters>({
        year: new Date().getFullYear(),
        month: new Date().getMonth() + 1,
    });

    const loadData = async (
        newFilters: AdminAttendanceFilters,
        updateSummary = true
    ) => {
        if (updateSummary) {
            setLoading(true);
        }

        try {
            if (updateSummary) {
                // 月変更時：統計データも含めて全て取得
                const [attendanceData, summaryData, usersData, statusesData] =
                    await Promise.all([
                        fetchAllAttendanceLogs(newFilters),
                        fetchUserAttendanceSummary({
                            year: newFilters.year,
                            month: newFilters.month,
                            // userIdフィルターは適用しない
                        }),
                        fetchAllUsers(),
                        fetchAllAttendanceStatuses(),
                    ]);

                setData(attendanceData.items);
                setSummary(summaryData);
                setUsers(usersData);
                setStatuses(statusesData);
            } else {
                // フィルター変更時：詳細データのみ取得
                const [attendanceData, usersData, statusesData] =
                    await Promise.all([
                        fetchAllAttendanceLogs(newFilters),
                        fetchAllUsers(),
                        fetchAllAttendanceStatuses(),
                    ]);

                setData(attendanceData.items);
                setUsers(usersData);
                setStatuses(statusesData);
            }

            setFilters(newFilters);
        } catch (error) {
            console.error("データの読み込みに失敗しました:", error);
        } finally {
            if (updateSummary) {
                setLoading(false);
            }
        }
    };

    useEffect(() => {
        loadData(filters);
    }, []);

    const handleFilterChange = (newFilters: AdminAttendanceFilters) => {
        // 月が変更された場合のみ統計を更新
        const isMonthChanged =
            newFilters.year !== filters.year ||
            newFilters.month !== filters.month;

        if (isMonthChanged) {
            loadData(newFilters, true);
        } else {
            // フィルター変更時はuseTransitionを使用
            startTransition(async () => {
                await loadData(newFilters, false);
            });
        }
    };

    if (loading) {
        return (
            <div className="space-y-6">
                {/* サマリーのSkeleton */}
                <div className="space-y-4">
                    {/* 全体統計のSkeleton */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card>
                            <CardHeader className="pb-2">
                                <Skeleton className="h-4 w-16" />
                            </CardHeader>
                            <CardContent>
                                <Skeleton className="h-8 w-24" />
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <Skeleton className="h-4 w-20" />
                            </CardHeader>
                            <CardContent>
                                <Skeleton className="h-8 w-16" />
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <Skeleton className="h-4 w-20" />
                            </CardHeader>
                            <CardContent>
                                <Skeleton className="h-8 w-32" />
                            </CardContent>
                        </Card>
                    </div>

                    {/* ユーザー別統計テーブルのSkeleton */}
                    <Card>
                        <CardHeader>
                            <Skeleton className="h-6 w-32" />
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-md border">
                                <div className="p-4 space-y-4">
                                    {/* テーブルヘッダーのSkeleton */}
                                    <div className="grid grid-cols-4 gap-4">
                                        <Skeleton className="h-4 w-16" />
                                        <Skeleton className="h-4 w-16" />
                                        <Skeleton className="h-4 w-16" />
                                        <Skeleton className="h-4 w-24" />
                                    </div>
                                    {/* テーブル行のSkeleton */}
                                    {Array.from({ length: 3 }).map((_, i) => (
                                        <div
                                            key={i}
                                            className="grid grid-cols-4 gap-4"
                                        >
                                            <Skeleton className="h-4 w-20" />
                                            <Skeleton className="h-4 w-12" />
                                            <Skeleton className="h-4 w-20" />
                                            <Skeleton className="h-4 w-16" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* データテーブルのSkeleton */}
                <div className="space-y-4">
                    {/* フィルターのSkeleton */}
                    <div className="flex flex-col sm:flex-row gap-4 p-4 border rounded-lg">
                        <div className="flex flex-col sm:flex-row gap-4 flex-1">
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-12" />
                                <Skeleton className="h-10 w-32" />
                            </div>
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-16" />
                                <Skeleton className="h-10 w-32" />
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Skeleton className="h-10 w-20" />
                            <Skeleton className="h-10 w-16" />
                        </div>
                    </div>

                    {/* テーブルのSkeleton */}
                    <div className="rounded-md border">
                        <div className="p-4 space-y-4">
                            {/* テーブルヘッダーのSkeleton */}
                            <div className="grid grid-cols-7 gap-4">
                                <Skeleton className="h-4 w-16" />
                                <Skeleton className="h-4 w-16" />
                                <Skeleton className="h-4 w-20" />
                                <Skeleton className="h-4 w-20" />
                                <Skeleton className="h-4 w-16" />
                                <Skeleton className="h-4 w-16" />
                                <Skeleton className="h-4 w-12" />
                            </div>
                            {/* テーブル行のSkeleton */}
                            {Array.from({ length: 5 }).map((_, i) => (
                                <div key={i} className="grid grid-cols-7 gap-4">
                                    <Skeleton className="h-4 w-20" />
                                    <Skeleton className="h-4 w-12" />
                                    <Skeleton className="h-4 w-32" />
                                    <Skeleton className="h-4 w-32" />
                                    <Skeleton className="h-4 w-12" />
                                    <Skeleton className="h-4 w-12" />
                                    <Skeleton className="h-4 w-16" />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 件数表示のSkeleton */}
                    <div className="text-center">
                        <Skeleton className="h-4 w-32 mx-auto" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* 勤務統計サマリー */}
            <AdminAttendanceSummary
                summary={summary}
                year={filters.year}
                month={filters.month}
            />

            {/* 詳細データテーブル */}
            <AdminAttendanceDataTable
                data={data}
                users={users}
                statuses={statuses}
                year={filters.year}
                month={filters.month}
                selectedUserId={filters.userId}
                selectedStatusId={filters.statusId}
                onFilterChange={handleFilterChange}
                loading={isPending}
            />
        </div>
    );
}
