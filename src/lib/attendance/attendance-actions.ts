"use server";

import { db } from "@/db";
import {
    attendanceLogs,
    attendanceStatus,
    attendanceLogSource,
    users,
} from "@/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";

export type AttendanceAction = "WORKING" | "BREAK" | "OFF";

export interface AttendanceRecordInput {
    userId: string;
    action: AttendanceAction;
    source: "WEB" | "DISCORD" | "NFC" | "ADMIN";
    note?: string;
}

export interface AttendanceRecordResult {
    success: boolean;
    message: string;
    data?: {
        logId: string;
        status: string;
        startedAt: Date;
        endedAt?: Date;
    };
}

/**
 * 打刻の核となる関数
 * 別環境からも呼び出し可能
 */
export async function recordAttendance(
    input: AttendanceRecordInput
): Promise<AttendanceRecordResult> {
    try {
        // 認証チェック（必要に応じて）
        const supabase = await createClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            throw new Error("認証が必要です");
        }

        // ユーザーIDの検証（管理者の場合は任意のユーザー、一般ユーザーの場合は自分のみ）
        const userData = await db
            .select({ id: users.id, isAdmin: users.isAdmin })
            .from(users)
            .where(eq(users.id, input.userId))
            .limit(1);

        if (userData.length === 0) {
            throw new Error("ユーザーが見つかりません");
        }

        // 一般ユーザーは自分の打刻のみ可能
        if (!userData[0].isAdmin && userData[0].id !== user.id) {
            throw new Error("権限がありません");
        }

        // ステータスとソースのIDを取得
        const [statusData, sourceData] = await Promise.all([
            db
                .select({ id: attendanceStatus.id })
                .from(attendanceStatus)
                .where(eq(attendanceStatus.code, input.action))
                .limit(1),
            db
                .select({ id: attendanceLogSource.id })
                .from(attendanceLogSource)
                .where(eq(attendanceLogSource.code, input.source))
                .limit(1),
        ]);

        if (statusData.length === 0) {
            throw new Error(`無効なステータス: ${input.action}`);
        }
        if (sourceData.length === 0) {
            throw new Error(`無効なソース: ${input.source}`);
        }

        const statusId = statusData[0].id;
        const sourceId = sourceData[0].id;

        // 現在のアクティブな打刻を取得（ステータス情報も含む）
        const activeLog = await db
            .select({
                id: attendanceLogs.id,
                statusId: attendanceLogs.statusId,
                statusCode: attendanceStatus.code,
                startedAt: attendanceLogs.startedAt,
            })
            .from(attendanceLogs)
            .innerJoin(
                attendanceStatus,
                eq(attendanceLogs.statusId, attendanceStatus.id)
            )
            .where(
                and(
                    eq(attendanceLogs.userId, input.userId),
                    isNull(attendanceLogs.endedAt)
                )
            )
            .limit(1);

        const now = new Date();

        // 連打チェック：同じステータスを連続で選択できない
        if (activeLog.length > 0 && activeLog[0].statusCode === input.action) {
            return {
                success: false,
                message: "同じステータスを連続で選択することはできません",
            };
        }

        if (activeLog.length > 0) {
            // 既存の打刻を終了
            await db
                .update(attendanceLogs)
                .set({
                    endedAt: now,
                    endedSource: sourceId,
                    updatedAt: now,
                })
                .where(eq(attendanceLogs.id, activeLog[0].id));

            // 新しい打刻を開始
            const [newLog] = await db
                .insert(attendanceLogs)
                .values({
                    userId: input.userId,
                    statusId: statusId,
                    startedAt: now,
                    startedSource: sourceId,
                    note: input.note,
                })
                .returning();

            return {
                success: true,
                message: `${getStatusLabel(input.action)}を開始しました`,
                data: {
                    logId: newLog.id,
                    status: input.action,
                    startedAt: newLog.startedAt,
                },
            };
        } else {
            // 新しい打刻を開始
            const [newLog] = await db
                .insert(attendanceLogs)
                .values({
                    userId: input.userId,
                    statusId: statusId,
                    startedAt: now,
                    startedSource: sourceId,
                    note: input.note,
                })
                .returning();

            return {
                success: true,
                message: `${getStatusLabel(input.action)}を開始しました`,
                data: {
                    logId: newLog.id,
                    status: input.action,
                    startedAt: newLog.startedAt,
                },
            };
        }
    } catch (error) {
        return {
            success: false,
            message:
                error instanceof Error ? error.message : "打刻に失敗しました",
        };
    }
}

/**
 * ステータスラベルを取得
 */
function getStatusLabel(action: AttendanceAction): string {
    switch (action) {
        case "WORKING":
            return "勤務";
        case "BREAK":
            return "休憩";
        case "OFF":
            return "退勤";
        default:
            return "不明";
    }
}

/**
 * 現在の打刻状況を取得
 */
export async function getCurrentAttendance(userId: string) {
    const activeLog = await db
        .select({
            id: attendanceLogs.id,
            statusCode: attendanceStatus.code,
            statusLabel: attendanceStatus.label,
            startedAt: attendanceLogs.startedAt,
            note: attendanceLogs.note,
        })
        .from(attendanceLogs)
        .innerJoin(
            attendanceStatus,
            eq(attendanceLogs.statusId, attendanceStatus.id)
        )
        .where(
            and(
                eq(attendanceLogs.userId, userId),
                isNull(attendanceLogs.endedAt)
            )
        )
        .limit(1);

    return activeLog.length > 0 ? activeLog[0] : null;
}
