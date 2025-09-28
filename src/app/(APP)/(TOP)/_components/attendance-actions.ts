// サーバーアクションとして実行することを明示
"use server";

// データベース接続とスキーマのインポート
import { db } from "@/db";
import {
    attendanceLogs, // 勤務打刻ログテーブル
    attendanceStatus, // 勤務ステータステーブル（勤務中、休憩中、退勤）
    attendanceLogSource, // 打刻ソーステーブル（WEB、DISCORD、NFC、ADMIN）
    users, // ユーザーテーブル
} from "@/db/schema";
// Drizzle ORMのクエリ条件
import { eq, and, isNull } from "drizzle-orm";
// Supabaseクライアント（サーバーサイド用）
import { createClient } from "@/lib/supabase/server";

/**
 * 勤務打刻のアクション種別
 * WORKING: 勤務開始/再開
 * BREAK: 休憩開始
 * OFF: 退勤
 */
export type AttendanceAction = "WORKING" | "BREAK" | "OFF";

/**
 * 勤務打刻記録の入力パラメータ
 */
export interface AttendanceRecordInput {
    userId: string; // ユーザーID
    action: AttendanceAction; // 打刻アクション
    source: "WEB" | "DISCORD" | "NFC" | "ADMIN"; // 打刻ソース（どこから打刻されたか）
    note?: string; // メモ（オプション）
}

/**
 * 勤務打刻記録の結果
 */
export interface AttendanceRecordResult {
    success: boolean; // 成功フラグ
    message: string; // 結果メッセージ
    data?: {
        // 成功時のデータ（オプション）
        logId: string; // 作成されたログのID
        status: string; // ステータス
        startedAt: Date; // 開始時刻
        endedAt?: Date; // 終了時刻（オプション）
    };
}

/**
 * 勤務打刻の核となる関数
 * 別環境（Discord、NFC、管理画面など）からも呼び出し可能
 *
 * @param input 打刻記録の入力パラメータ
 * @returns 打刻結果（成功/失敗とメッセージ）
 */
export async function recordAttendance(
    input: AttendanceRecordInput
): Promise<AttendanceRecordResult> {
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

        // 一般ユーザーは自分の打刻のみ可能、管理者は任意のユーザーの打刻が可能
        if (!userData[0].isAdmin && userData[0].id !== user.id) {
            throw new Error("権限がありません");
        }

        // ===== ステータスとソースのID取得 =====
        // 並列でステータスとソースのIDを取得（パフォーマンス向上）
        const [statusData, sourceData] = await Promise.all([
            // 勤務ステータスのIDを取得（WORKING、BREAK、OFF）
            db
                .select({ id: attendanceStatus.id })
                .from(attendanceStatus)
                .where(eq(attendanceStatus.code, input.action))
                .limit(1),
            // 打刻ソースのIDを取得（WEB、DISCORD、NFC、ADMIN）
            db
                .select({ id: attendanceLogSource.id })
                .from(attendanceLogSource)
                .where(eq(attendanceLogSource.code, input.source))
                .limit(1),
        ]);

        // ステータスが存在しない場合はエラー
        if (statusData.length === 0) {
            throw new Error(`無効なステータス: ${input.action}`);
        }
        // ソースが存在しない場合はエラー
        if (sourceData.length === 0) {
            throw new Error(`無効なソース: ${input.source}`);
        }

        // 取得したIDを変数に格納
        const statusId = statusData[0].id;
        const sourceId = sourceData[0].id;

        // ===== 現在のアクティブな打刻を取得 =====
        // ユーザーの現在進行中の打刻ログを取得（終了時刻がnullのもの）
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
                    eq(attendanceLogs.userId, input.userId), // 指定されたユーザー
                    isNull(attendanceLogs.endedAt) // 終了していない（進行中）
                )
            )
            .limit(1);

        // 現在時刻を取得
        const now = new Date();

        // ===== 連打チェック =====
        // 同じステータスを連続で選択できないようにチェック
        if (activeLog.length > 0 && activeLog[0].statusCode === input.action) {
            return {
                success: false,
                message: "同じステータスを連続で選択することはできません",
            };
        }

        // ===== 打刻処理 =====
        if (activeLog.length > 0) {
            // 既存の打刻が進行中の場合：既存の打刻を終了してから新しい打刻を開始

            // 1. 既存の打刻を終了
            await db
                .update(attendanceLogs)
                .set({
                    endedAt: now, // 終了時刻を設定
                    endedSource: sourceId, // 終了時のソースを記録
                    updatedAt: now, // 更新時刻を設定
                })
                .where(eq(attendanceLogs.id, activeLog[0].id));

            // 2. 新しい打刻を開始
            const [newLog] = await db
                .insert(attendanceLogs)
                .values({
                    userId: input.userId, // ユーザーID
                    statusId: statusId, // ステータスID
                    startedAt: now, // 開始時刻
                    startedSource: sourceId, // 開始時のソース
                    note: input.note, // メモ（オプション）
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
            // 既存の打刻がない場合：新しい打刻を開始

            const [newLog] = await db
                .insert(attendanceLogs)
                .values({
                    userId: input.userId, // ユーザーID
                    statusId: statusId, // ステータスID
                    startedAt: now, // 開始時刻
                    startedSource: sourceId, // 開始時のソース
                    note: input.note, // メモ（オプション）
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
        // エラーが発生した場合は失敗レスポンスを返す
        return {
            success: false,
            message:
                error instanceof Error ? error.message : "打刻に失敗しました",
        };
    }
}

/**
 * 勤務ステータスの日本語ラベルを取得
 *
 * @param action 勤務アクション
 * @returns 日本語ラベル
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
 * ユーザーの現在の打刻状況を取得
 * 進行中の打刻ログ（終了時刻がnull）を返す
 *
 * @param userId ユーザーID
 * @returns 現在の打刻状況（進行中がない場合はnull）
 */
export async function getCurrentAttendance(userId: string) {
    // ユーザーの現在進行中の打刻ログを取得
    const activeLog = await db
        .select({
            id: attendanceLogs.id, // ログID
            statusCode: attendanceStatus.code, // ステータスコード（WORKING、BREAK、OFF）
            statusLabel: attendanceStatus.label, // ステータスラベル（勤務、休憩、退勤）
            startedAt: attendanceLogs.startedAt, // 開始時刻
            note: attendanceLogs.note, // メモ
        })
        .from(attendanceLogs)
        .innerJoin(
            attendanceStatus,
            eq(attendanceLogs.statusId, attendanceStatus.id)
        )
        .where(
            and(
                eq(attendanceLogs.userId, userId), // 指定されたユーザー
                isNull(attendanceLogs.endedAt) // 終了していない（進行中）
            )
        )
        .limit(1);

    // 進行中の打刻がある場合はその情報を返し、ない場合はnullを返す
    return activeLog.length > 0 ? activeLog[0] : null;
}
