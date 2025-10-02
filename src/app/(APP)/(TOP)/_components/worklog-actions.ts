// サーバーアクションとして実行することを明示
"use server";

// データベース接続とスキーマのインポート
import { db } from "@/db";
import {
    workLogs, // 作業ログテーブル
    projects, // プロジェクトテーブル
    attendanceLogs, // 勤務打刻ログテーブル
    attendanceStatus, // 勤務ステータステーブル
    users, // ユーザーテーブル
} from "@/db/schema";
// Drizzle ORMのクエリ条件
import { eq, and, desc } from "drizzle-orm";
// Supabaseクライアント（サーバーサイド用）
import { createClient } from "@/lib/supabase/server";

/**
 * 作業ログ作成の入力パラメータ
 */
export interface WorkLogInput {
    userId: string; // ユーザーID
    attendanceLogId: string; // 勤務打刻ログID（どの勤務時間に紐づくか）
    projectId: string; // プロジェクトID（どのプロジェクトの作業か）
    content: string; // 作業内容
}

/**
 * 作業ログ作成の結果
 */
export interface WorkLogResult {
    success: boolean; // 成功フラグ
    message: string; // 結果メッセージ
    data?: {
        // 成功時のデータ（オプション）
        workLogId: string; // 作成された作業ログのID
    };
}

/**
 * 作業ログを作成する関数
 * 勤務時間とプロジェクトに紐づけて作業内容を記録
 *
 * @param input 作業ログ作成の入力パラメータ
 * @returns 作成結果（成功/失敗とメッセージ）
 */
export async function createWorkLog(
    input: WorkLogInput
): Promise<WorkLogResult> {
    try {
        // ===== 認証チェック =====
        // Supabaseクライアントを作成して現在のユーザーを取得
        const supabase = await createClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();

        // ユーザーが認証されていない場合はエラー
        if (!user) {
            throw new Error("認証が必要です");
        }

        // ===== ユーザー権限チェック =====
        // データベースからユーザー情報を取得（管理者権限も含む）
        const userData = await db
            .select({ id: users.id, isAdmin: users.isAdmin })
            .from(users)
            .where(eq(users.id, input.userId))
            .limit(1);

        // ユーザーが存在しない場合はエラー
        if (userData.length === 0) {
            throw new Error("ユーザーが見つかりません");
        }

        // 一般ユーザーは自分の作業ログのみ作成可能、管理者は任意のユーザーの作業ログが作成可能
        if (!userData[0].isAdmin && userData[0].id !== user.id) {
            throw new Error("権限がありません");
        }

        // ===== 勤務打刻ログの存在確認 =====
        // 指定された勤務打刻ログが存在し、かつ指定されたユーザーのものかチェック
        const attendanceLog = await db
            .select({ id: attendanceLogs.id })
            .from(attendanceLogs)
            .where(
                and(
                    eq(attendanceLogs.id, input.attendanceLogId), // 指定された勤務ログID
                    eq(attendanceLogs.userId, input.userId) // 指定されたユーザーのもの
                )
            )
            .limit(1);

        // 勤務打刻ログが存在しない場合はエラー
        if (attendanceLog.length === 0) {
            throw new Error("指定された出勤記録が見つかりません");
        }

        // ===== プロジェクトの存在確認 =====
        // 指定されたプロジェクトが存在するかチェック
        const project = await db
            .select({ id: projects.id })
            .from(projects)
            .where(eq(projects.id, input.projectId))
            .limit(1);

        // プロジェクトが存在しない場合はエラー
        if (project.length === 0) {
            throw new Error("指定されたプロジェクトが見つかりません");
        }

        // ===== 作業ログの作成 =====
        // すべての検証が完了したら作業ログを作成
        const [newWorkLog] = await db
            .insert(workLogs)
            .values({
                userId: input.userId, // ユーザーID
                attendanceLogId: input.attendanceLogId, // 勤務打刻ログID
                projectId: input.projectId, // プロジェクトID
                content: input.content.trim(), // 作業内容（前後の空白を除去）
            })
            .returning();

        // 成功レスポンスを返す
        return {
            success: true,
            message: "作業ログを作成しました",
            data: {
                workLogId: newWorkLog.id,
            },
        };
    } catch (error) {
        // エラーが発生した場合は失敗レスポンスを返す
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
 * ユーザーの直近5つの勤務記録を取得
 * 作業ログフォームで勤務時間を選択するために使用
 *
 * @param userId ユーザーID
 * @returns 勤務記録の配列（最大5件）
 */
export async function getRecentAttendanceLogs(userId: string) {
    try {
        // 勤務ステータス（WORKING）の勤務記録のみを取得
        const logs = await db
            .select({
                id: attendanceLogs.id, // 勤務ログID
                statusCode: attendanceStatus.code, // ステータスコード
                statusLabel: attendanceStatus.label, // ステータスラベル
                startedAt: attendanceLogs.startedAt, // 開始時刻
                endedAt: attendanceLogs.endedAt, // 終了時刻
            })
            .from(attendanceLogs)
            .innerJoin(
                attendanceStatus,
                eq(attendanceLogs.statusId, attendanceStatus.id)
            )
            .where(
                and(
                    eq(attendanceLogs.userId, userId), // 指定されたユーザー
                    eq(attendanceStatus.code, "WORKING") // 勤務中のみ（休憩や退勤は除外）
                )
            )
            .orderBy(desc(attendanceLogs.startedAt)) // 開始時刻の降順（新しい順）
            .limit(10); // 最大5件

        // デバッグ用ログ出力
        // console.log(
        //     `Found ${logs.length} WORKING attendance logs for user ${userId}:`,
        //     logs
        // );
        return logs;
    } catch (error) {
        console.error("Error fetching attendance logs:", error);
        return []; // エラー時は空配列を返す
    }
}

/**
 * アクティブなプロジェクト一覧を取得
 * 作業ログフォームでプロジェクトを選択するために使用
 *
 * @returns アクティブなプロジェクトの配列
 */
export async function getActiveProjects() {
    try {
        // アクティブなプロジェクトのみを取得
        const projectList = await db
            .select({
                id: projects.id, // プロジェクトID
                name: projects.name, // プロジェクト名
            })
            .from(projects)
            .where(eq(projects.isActive, true)) // アクティブなプロジェクトのみ
            .orderBy(projects.name); // プロジェクト名の昇順

        // デバッグ用ログ出力
        // console.log(
        //     `Found ${projectList.length} active projects:`,
        //     projectList
        // );
        return projectList;
    } catch (error) {
        console.error("Error fetching projects:", error);
        return []; // エラー時は空配列を返す
    }
}
