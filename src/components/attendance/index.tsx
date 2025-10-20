"use client";

import { useEffect, useTransition, useState } from "react";
import { AttendanceRecordsResult } from "./actions";
import { Spinner } from "@/components/ui/spinner";
import { Skeleton } from "@/components/ui/skeleton";
import { AttendanceRecordsResultType } from "./actions";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { parseNumberArrayParam, parseUuidV4ArrayParam } from "./util";
import { format, toZonedTime } from "date-fns-tz";
import { DataTable } from "./data-table";
import { columns } from "./columns";

interface AttendanceViewProps {
    isAdmin: boolean;
    userId: string;
}

interface AttendanceFilter {
    userIdFilter: string[] | null;
    statusIdFilter: number[] | null;
    startedSourceIdFilter: number[] | null;
    endedSourceIdFilter: number[] | null;
}

const AttendanceView = ({ isAdmin, userId }: AttendanceViewProps) => {
    const searchParams = useSearchParams();

    const filters: AttendanceFilter = {
        userIdFilter: parseUuidV4ArrayParam(searchParams.get("u")),
        statusIdFilter: parseNumberArrayParam(searchParams.get("s"), {
            min: 1,
            max: 4,
        }),
        startedSourceIdFilter: parseNumberArrayParam(searchParams.get("ss"), {
            min: 1,
            max: 3,
        }),
        endedSourceIdFilter: parseNumberArrayParam(searchParams.get("es"), {
            min: 1,
            max: 3,
        }),
    };

    const [isPending, startTransition] = useTransition(); // データ取得中かどうかを管理する状態
    const [attendanceRecords, setAttendanceRecords] = useState<
        AttendanceRecordsResultType[]
    >([]); // 元データを格納する配列
    const [monthList, setMonthList] = useState(null);

    useEffect(() => {
        const fetchAttendanceRecords = async () => {
            startTransition(async () => {
                const result: AttendanceRecordsResultType[] =
                    await AttendanceRecordsResult();

                // TODO: 実装手順
                // 1. adminか?trueなら全ユーザーのレコードを表示、falseなら自分のレコードを表示
                // 2. レコードを月で分ける
                // 3. 月ごとにレコードを表示

                const yesAdmin = () => {
                    const data = result;
                    return data;
                };
                const noAdmin = () => {
                    const data = result.filter(
                        (record) => record.user.id === userId
                    );
                    return data;
                };
                const view = isAdmin ? yesAdmin() : noAdmin();
                setAttendanceRecords(view);
            });
        };
        fetchAttendanceRecords();
    }, []);

    if (isPending) {
        return <Skeleton className="w-full h-10" />;
    }
    return (
        <div className="container mx-auto">
            <DataTable columns={columns} data={attendanceRecords} />
        </div>
    );
};

export default AttendanceView;
