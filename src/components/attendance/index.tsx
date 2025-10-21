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
        return <Skeleton className="w-full h-10" />;
    }
    return (
        <div className="container mx-auto">
            <YearMonthPagination />
            <DataDashboard isAdmin={isAdmin} data={attendanceRecords} />
            <DataTable
                isAdmin={isAdmin}
                columns={columns}
                data={attendanceRecords}
            />
        </div>
    );
};

export default AttendanceView;
