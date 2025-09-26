"use server";

import { db } from "@/db";
import {
    workLogs,
    projects,
    attendanceLogs,
    attendanceStatus,
    users,
} from "@/db/schema";
import { eq, and, desc, isNull } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";

export interface WorkLogInput {
    userId: string;
    attendanceLogId: string;
    projectId: string;
    content: string;
}

export interface WorkLogResult {
    success: boolean;
    message: string;
    data?: {
        workLogId: string;
    };
}

/**
 * 作業ログを作成
 */
export async function createWorkLog(
    input: WorkLogInput
): Promise<WorkLogResult> {
    try {
        // 認証チェック
        const supabase = await createClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            throw new Error("認証が必要です");
        }

        // ユーザーIDの検証
        const userData = await db
            .select({ id: users.id, isAdmin: users.isAdmin })
            .from(users)
            .where(eq(users.id, input.userId))
            .limit(1);

        if (userData.length === 0) {
            throw new Error("ユーザーが見つかりません");
        }

        // 一般ユーザーは自分の作業ログのみ作成可能
        if (!userData[0].isAdmin && userData[0].id !== user.id) {
            throw new Error("権限がありません");
        }

        // 出勤記録の存在確認
        const attendanceLog = await db
            .select({ id: attendanceLogs.id })
            .from(attendanceLogs)
            .where(
                and(
                    eq(attendanceLogs.id, input.attendanceLogId),
                    eq(attendanceLogs.userId, input.userId)
                )
            )
            .limit(1);

        if (attendanceLog.length === 0) {
            throw new Error("指定された出勤記録が見つかりません");
        }

        // プロジェクトの存在確認
        const project = await db
            .select({ id: projects.id })
            .from(projects)
            .where(eq(projects.id, input.projectId))
            .limit(1);

        if (project.length === 0) {
            throw new Error("指定されたプロジェクトが見つかりません");
        }

        // 作業ログを作成
        const [newWorkLog] = await db
            .insert(workLogs)
            .values({
                userId: input.userId,
                attendanceLogId: input.attendanceLogId,
                projectId: input.projectId,
                content: input.content.trim(),
            })
            .returning();

        return {
            success: true,
            message: "作業ログを作成しました",
            data: {
                workLogId: newWorkLog.id,
            },
        };
    } catch (error) {
        return {
            success: false,
            message:
                error instanceof Error
                    ? error.message
                    : "作業ログの作成に失敗しました",
        };
    }
}

/**
 * ユーザーの直近5つの出勤記録を取得
 */
export async function getRecentAttendanceLogs(userId: string) {
    try {
        const logs = await db
            .select({
                id: attendanceLogs.id,
                statusCode: attendanceStatus.code,
                statusLabel: attendanceStatus.label,
                startedAt: attendanceLogs.startedAt,
                endedAt: attendanceLogs.endedAt,
            })
            .from(attendanceLogs)
            .innerJoin(
                attendanceStatus,
                eq(attendanceLogs.statusId, attendanceStatus.id)
            )
            .where(
                and(
                    eq(attendanceLogs.userId, userId),
                    eq(attendanceStatus.code, "WORKING") // 勤務中のみ
                )
            )
            .orderBy(desc(attendanceLogs.startedAt))
            .limit(5);

        console.log(
            `Found ${logs.length} WORKING attendance logs for user ${userId}:`,
            logs
        );
        return logs;
    } catch (error) {
        console.error("Error fetching attendance logs:", error);
        return [];
    }
}

/**
 * アクティブなプロジェクト一覧を取得
 */
export async function getActiveProjects() {
    try {
        const projectList = await db
            .select({
                id: projects.id,
                name: projects.name,
            })
            .from(projects)
            .where(eq(projects.isActive, true))
            .orderBy(projects.name);

        console.log(
            `Found ${projectList.length} active projects:`,
            projectList
        );
        return projectList;
    } catch (error) {
        console.error("Error fetching projects:", error);
        return [];
    }
}
