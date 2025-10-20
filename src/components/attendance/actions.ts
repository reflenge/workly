"use server";

import { db } from "@/db";
import {
    attendanceLogs,
    attendanceStatus,
    attendanceLogSource,
    users,
} from "@/db/schema";

import { desc, eq, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { unstable_cache, revalidateTag } from "next/cache";

// 同一テーブルの別名を用意
const startSource = alias(attendanceLogSource, "start_source");
const endSource = alias(attendanceLogSource, "end_source");

export interface AttendanceRecordsResultType {
    log: {
        id: string;
        startedAt: Date;
        endedAt: Date | null;
        note: string | null;
    };
    user: {
        id: string;
        isAdmin: boolean;
        lastName: string;
        firstName: string;
        fullName: string;
    };
    status: {
        id: number;
        label: string;
    } | null;
    startedSource: {
        id: number;
        label: string;
    } | null;
    endedSource: {
        id: number;
        label: string;
    } | null;
}

// データ取得の実際の関数
const getAttendanceRecordsData = async (): Promise<
    AttendanceRecordsResultType[]
> => {
    try {
        const result: AttendanceRecordsResultType[] = await db
            .select({
                log: {
                    id: attendanceLogs.id,
                    startedAt: attendanceLogs.startedAt,
                    endedAt: attendanceLogs.endedAt,
                    note: attendanceLogs.note,
                },
                user: {
                    id: users.id,
                    isAdmin: users.isAdmin,
                    lastName: users.lastName,
                    firstName: users.firstName,
                    fullName: sql<string>`${users.lastName} || ' ' || ${users.firstName}`,
                },
                status: {
                    id: attendanceStatus.id,
                    label: attendanceStatus.label,
                },
                startedSource: {
                    id: startSource.id,
                    label: startSource.label,
                },
                endedSource: {
                    id: endSource.id,
                    label: endSource.label,
                },
            })
            .from(attendanceLogs)
            .innerJoin(users, eq(attendanceLogs.userId, users.id))
            .leftJoin(
                attendanceStatus,
                eq(attendanceLogs.statusId, attendanceStatus.id)
            )
            .leftJoin(
                startSource,
                eq(attendanceLogs.startedSource, startSource.id)
            )
            .leftJoin(endSource, eq(attendanceLogs.endedSource, endSource.id))
            .orderBy(desc(attendanceLogs.startedAt));

        return result;
    } catch (error) {
        throw new Error(
            process.env.NODE_ENV === "development"
                ? "Attendance Components, AttendanceRecordsResult関数でエラーが発生しました: " +
                  (error as Error).message
                : "Failed to fetch attendance records"
        );
    }
};

// Next.jsのキャッシュを使用（5分キャッシュ）
export const AttendanceRecordsResult = unstable_cache(
    getAttendanceRecordsData,
    ["attendance-records"],
    {
        revalidate: 300, // 300秒（5分）キャッシュ - データ更新の頻度に応じて調整
        tags: ["attendance-records"], // タグベースの再検証も使用可能
    }
);

// キャッシュを無効化する関数（出勤記録が更新された時に呼び出す）
export const revalidateAttendanceRecords = async () => {
    revalidateTag("attendance-records");
};
