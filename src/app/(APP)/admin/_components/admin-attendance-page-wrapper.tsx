"use client";

import { useState, useEffect } from "react";
import { AdminAttendanceDataTable } from "./admin-attendance-data-table";
import { AdminAttendanceSummary } from "./admin-attendance-summary";
import {
    fetchAllAttendanceLogs,
    fetchAllUsers,
    fetchAllAttendanceStatuses,
    fetchUserAttendanceSummary,
    type AdminAttendanceFilters,
    type UserAttendanceSummary,
} from "./admin-attendance-actions";

export function AdminAttendancePageWrapper() {
    const [data, setData] = useState<any[]>([]);
    const [summary, setSummary] = useState<UserAttendanceSummary[]>([]);
    const [users, setUsers] = useState<
        Array<{ id: string; name: string; isActive: boolean }>
    >([]);
    const [statuses, setStatuses] = useState<
        Array<{ id: number; code: string; label: string }>
    >([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState<AdminAttendanceFilters>({
        year: new Date().getFullYear(),
        month: new Date().getMonth() + 1,
    });

    const loadData = async (
        newFilters: AdminAttendanceFilters,
        updateSummary = true
    ) => {
        setLoading(true);
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
            setLoading(false);
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
        loadData(newFilters, isMonthChanged);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-8">
                <div className="text-muted-foreground">読み込み中...</div>
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
            />
        </div>
    );
}
