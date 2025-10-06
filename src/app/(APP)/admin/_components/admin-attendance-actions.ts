"use server";

import { db } from "@/db";
import {
    users,
    attendanceLogs,
    attendanceStatus,
    attendanceLogSource,
} from "@/db/schema";
import { eq, and, gte, lt, desc, isNull, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

export interface AdminAttendanceLogItem {
    id: string;
    userId: string;
    userLastName: string;
    userFirstName: string;
    statusId: number;
    statusLabel: string;
    startedAt: string;
    endedAt: string | null;
    startedSourceLabel: string;
    endedSourceLabel: string | null;
    note: string | null;
}

export interface AdminAttendanceFilters {
    year: number;
    month: number;
    userId?: string;
    statusId?: number;
}

export interface UserAttendanceSummary {
    userId: string;
    userLastName: string;
    userFirstName: string;
    workedDays: number;
    totalWorkedMinutes: number;
    totalWorkedHours: number;
}

export async function fetchAllAttendanceLogs({
    year,
    month,
    userId,
    statusId,
}: AdminAttendanceFilters) {
    // 指定された月の開始日と終了日を計算
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    // 条件を構築
    const conditions = [
        gte(attendanceLogs.startedAt, startDate),
        lt(attendanceLogs.startedAt, endDate),
    ];

    if (userId) {
        conditions.push(eq(attendanceLogs.userId, userId));
    }

    if (statusId) {
        conditions.push(eq(attendanceLogs.statusId, statusId));
    }

    // エイリアスを作成してテーブル名の衝突を回避
    const endedSource = alias(attendanceLogSource, "ended_source");

    const rows = await db
        .select({
            id: attendanceLogs.id,
            userId: attendanceLogs.userId,
            userLastName: users.lastName,
            userFirstName: users.firstName,
            statusId: attendanceLogs.statusId,
            statusLabel: attendanceStatus.label,
            startedAt: attendanceLogs.startedAt,
            endedAt: attendanceLogs.endedAt,
            startedSourceLabel: attendanceLogSource.label,
            endedSourceLabel: endedSource.label,
            note: attendanceLogs.note,
        })
        .from(attendanceLogs)
        .innerJoin(users, eq(attendanceLogs.userId, users.id))
        .innerJoin(
            attendanceStatus,
            eq(attendanceLogs.statusId, attendanceStatus.id)
        )
        .innerJoin(
            attendanceLogSource,
            eq(attendanceLogs.startedSource, attendanceLogSource.id)
        )
        .leftJoin(endedSource, eq(attendanceLogs.endedSource, endedSource.id))
        .where(and(...conditions))
        .orderBy(desc(attendanceLogs.startedAt));

    return {
        items: rows.map((row) => ({
            id: row.id,
            userId: row.userId,
            userLastName: row.userLastName,
            userFirstName: row.userFirstName,
            statusId: row.statusId,
            statusLabel: row.statusLabel,
            startedAt: row.startedAt.toISOString(),
            endedAt: row.endedAt?.toISOString() || null,
            startedSourceLabel: row.startedSourceLabel,
            endedSourceLabel: row.endedSourceLabel,
            note: row.note,
        })),
        totalCount: rows.length,
    };
}

export async function fetchAllUsers() {
    const rows = await db
        .select({
            id: users.id,
            lastName: users.lastName,
            firstName: users.firstName,
            isActive: users.isActive,
        })
        .from(users)
        .where(eq(users.isActive, true))
        .orderBy(users.lastName, users.firstName);

    return rows.map((row) => ({
        id: row.id,
        name: `${row.lastName} ${row.firstName}`,
        isActive: row.isActive,
    }));
}

export async function fetchAllAttendanceStatuses() {
    const rows = await db
        .select({
            id: attendanceStatus.id,
            code: attendanceStatus.code,
            label: attendanceStatus.label,
        })
        .from(attendanceStatus)
        .where(eq(attendanceStatus.isActive, true))
        .orderBy(attendanceStatus.sortNo);

    return rows.map((row) => ({
        id: row.id,
        code: row.code,
        label: row.label,
    }));
}

export async function fetchUserAttendanceSummary({
    year,
    month,
    userId,
}: {
    year: number;
    month: number;
    userId?: string;
}) {
    // 指定された月の開始日と終了日を計算（JST基準）
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    // 条件を構築
    const conditions = [
        gte(attendanceLogs.startedAt, startDate),
        lt(attendanceLogs.startedAt, endDate),
        // 勤務時間を計算するため、終了時刻があるレコードのみ
        sql`${attendanceLogs.endedAt} IS NOT NULL`,
        // 勤務中（statusId = 2）のレコードのみ
        eq(attendanceLogs.statusId, 2),
    ];

    if (userId) {
        conditions.push(eq(attendanceLogs.userId, userId));
    }

    // まず、各ユーザーの勤務ログを取得
    const logs = await db
        .select({
            userId: attendanceLogs.userId,
            userLastName: users.lastName,
            userFirstName: users.firstName,
            startedAt: attendanceLogs.startedAt,
            endedAt: attendanceLogs.endedAt,
        })
        .from(attendanceLogs)
        .innerJoin(users, eq(attendanceLogs.userId, users.id))
        .where(and(...conditions))
        .orderBy(attendanceLogs.userId, attendanceLogs.startedAt);

    // ユーザーごとに勤務日数と総勤務時間を計算
    const userSummary = new Map<
        string,
        {
            userId: string;
            userLastName: string;
            userFirstName: string;
            workedDays: Set<string>;
            totalWorkedMinutes: number;
        }
    >();

    for (const log of logs) {
        const key = log.userId;
        if (!userSummary.has(key)) {
            userSummary.set(key, {
                userId: log.userId,
                userLastName: log.userLastName,
                userFirstName: log.userFirstName,
                workedDays: new Set<string>(),
                totalWorkedMinutes: 0,
            });
        }

        const summary = userSummary.get(key)!;

        // 勤務時間を計算（ミリ秒単位で正確に計算）
        const workedMilliseconds =
            log.endedAt!.getTime() - log.startedAt.getTime();
        summary.totalWorkedMinutes += workedMilliseconds / (1000 * 60);

        // 日をまたいだレコードを考慮して勤務日数を計算
        const startDateJst = new Date(
            log.startedAt.getTime() + 9 * 60 * 60 * 1000
        );
        const endDateJst = new Date(
            log.endedAt!.getTime() + 9 * 60 * 60 * 1000
        );

        // 開始日から終了日までの各日を勤務日として追加
        const currentDate = new Date(startDateJst);
        currentDate.setUTCHours(0, 0, 0, 0);

        const endDateOnly = new Date(endDateJst);
        endDateOnly.setUTCHours(0, 0, 0, 0);

        while (currentDate <= endDateOnly) {
            const currentYear = currentDate.getUTCFullYear();
            const currentMonth = String(currentDate.getUTCMonth() + 1).padStart(
                2,
                "0"
            );
            const day = String(currentDate.getUTCDate()).padStart(2, "0");
            const dateKey = `${currentYear}-${currentMonth}-${day}`;

            // 指定された月の範囲内の日のみをカウント
            if (
                currentYear === year &&
                currentDate.getUTCMonth() + 1 === month
            ) {
                summary.workedDays.add(dateKey);
            }

            currentDate.setUTCDate(currentDate.getUTCDate() + 1);
        }
    }

    // 結果を配列に変換
    return Array.from(userSummary.values()).map((summary) => ({
        userId: summary.userId,
        userLastName: summary.userLastName,
        userFirstName: summary.userFirstName,
        workedDays: summary.workedDays.size,
        totalWorkedMinutes: Math.round(summary.totalWorkedMinutes), // 分単位で丸める
        totalWorkedHours: summary.totalWorkedMinutes / 60, // ミリ秒まで正確に計算
    }));
}
