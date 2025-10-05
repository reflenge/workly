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

        // 現在のユーザーのデータベース情報を取得
        const currentUserData = await db
            .select({ id: users.id, isAdmin: users.isAdmin })
            .from(users)
            .where(eq(users.authId, user.id))
            .limit(1);

        // 現在のユーザーが存在しない場合はエラー
        if (currentUserData.length === 0) {
            throw new Error("認証ユーザーが見つかりません");
        }

        // 一般ユーザーは自分の打刻のみ可能、管理者は任意のユーザーの打刻が可能
        if (
            !currentUserData[0].isAdmin &&
            userData[0].id !== currentUserData[0].id
        ) {
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

        // 現在時刻を取得（UTC基準）
        const now = new Date();

        // ===== 状態遷移チェック =====
        // 現在の状態に基づいて許可されるアクションをチェック
        if (activeLog.length > 0) {
            const currentStatus = activeLog[0].statusCode;
            const isValidTransition = validateStatusTransition(
                currentStatus,
                input.action
            );

            if (!isValidTransition) {
                return {
                    success: false,
                    message: getInvalidTransitionMessage(
                        currentStatus,
                        input.action
                    ),
                };
            }
        }

        // ===== 打刻処理（トランザクション使用） =====
        const result = await db.transaction(async (tx) => {
            if (activeLog.length > 0) {
                // 既存の打刻が進行中の場合：既存の打刻を終了してから新しい打刻を開始
                const startedAt = activeLog[0].startedAt;

                // 日付が異なる場合の処理
                if (isDifferentDate(startedAt, now)) {
                    // 1. 既存の打刻を開始日の23:59:59で終了
                    const endOfStartDay = getEndOfDay(startedAt);

                    await tx
                        .update(attendanceLogs)
                        .set({
                            endedAt: endOfStartDay, // 開始日の終了時刻を設定
                            endedSource: sourceId, // 終了時のソースを記録
                            updatedAt: now, // 更新時刻を設定
                        })
                        .where(eq(attendanceLogs.id, activeLog[0].id));

                    // 2. 中間日（開始日の翌日から終了日の前日まで）のレコードを作成
                    const datesBetween = getDatesBetween(startedAt, now);

                    // 中間日がある場合のみ処理を実行
                    if (datesBetween.length > 0) {
                        for (const date of datesBetween) {
                            const dayStart = getMidnightDate(date);
                            const dayEnd = getEndOfDay(date);

                            // 1日分のレコードを作成（0時から23:59:59まで）
                            await tx.insert(attendanceLogs).values({
                                userId: input.userId,
                                statusId: activeLog[0].statusId, // 同じステータスを継続
                                startedAt: dayStart, // その日の0時から開始
                                endedAt: dayEnd, // その日の23:59:59で終了
                                startedSource: sourceId,
                                endedSource: sourceId,
                                note: "自動生成", // 自動生成されたレコードであることを明記
                            });
                        }
                    }

                    // 3. 終了日の0時から新しいレコードを作成して即座に終了
                    const midnightToday = getMidnightDate(now);

                    // 終了日0時から開始のレコードを作成
                    const [midnightLog] = await tx
                        .insert(attendanceLogs)
                        .values({
                            userId: input.userId,
                            statusId: activeLog[0].statusId, // 同じステータスを継続
                            startedAt: midnightToday, // 終了日の0時から開始
                            startedSource: sourceId,
                            note: "自動生成", // 自動生成されたレコードであることを明記
                        })
                        .returning();

                    // 4. 作成したレコードを即座に終了
                    await tx
                        .update(attendanceLogs)
                        .set({
                            endedAt: now, // 現在時刻で終了
                            endedSource: sourceId,
                            updatedAt: now,
                        })
                        .where(eq(attendanceLogs.id, midnightLog.id));
                } else {
                    // 日付が同じ場合：通常の終了処理
                    await tx
                        .update(attendanceLogs)
                        .set({
                            endedAt: now, // 終了時刻を設定
                            endedSource: sourceId, // 終了時のソースを記録
                            updatedAt: now, // 更新時刻を設定
                        })
                        .where(eq(attendanceLogs.id, activeLog[0].id));
                }

                // 2. 新しい打刻を開始
                const [newLog] = await tx
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

                const [newLog] = await tx
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
        });

        return result;
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
 * 状態遷移が有効かどうかをチェック
 *
 * @param currentStatus 現在のステータス
 * @param newAction 新しいアクション
 * @returns 遷移が有効かどうか
 */
function validateStatusTransition(
    currentStatus: string,
    newAction: AttendanceAction
): boolean {
    switch (currentStatus) {
        case "WORKING":
            // 出勤時は休憩・退勤のみ可能
            return newAction === "BREAK" || newAction === "OFF";
        case "BREAK":
            // 休憩時は出勤・退勤のみ可能
            return newAction === "WORKING" || newAction === "OFF";
        case "OFF":
            // 退勤時は出勤のみ可能
            return newAction === "WORKING";
        default:
            // 不明な状態の場合は全て許可
            return true;
    }
}

/**
 * 無効な状態遷移のメッセージを取得
 *
 * @param currentStatus 現在のステータス
 * @param newAction 新しいアクション
 * @returns エラーメッセージ
 */
function getInvalidTransitionMessage(
    currentStatus: string,
    newAction: AttendanceAction
): string {
    const statusLabel = getStatusLabel(currentStatus as AttendanceAction);
    const actionLabel = getStatusLabel(newAction);

    switch (currentStatus) {
        case "WORKING":
            return `${statusLabel}中は${actionLabel}を選択できません。休憩または退勤を選択してください。`;
        case "BREAK":
            return `${statusLabel}中は${actionLabel}を選択できません。勤務再開または退勤を選択してください。`;
        case "OFF":
            return `${statusLabel}中は${actionLabel}を選択できません。勤務開始を選択してください。`;
        default:
            return "無効な状態遷移です。";
    }
}

/**
 * 開始日と終了日が異なるかチェック（JST基準）
 *
 * @param startDate 開始日時（UTC時刻）
 * @param endDate 終了日時（UTC時刻）
 * @returns JST基準で日付が異なるかどうか
 */
function isDifferentDate(startDate: Date, endDate: Date): boolean {
    // JST基準で日付を比較
    const startJst = new Date(startDate.getTime() + 9 * 60 * 60 * 1000);
    const endJst = new Date(endDate.getTime() + 9 * 60 * 60 * 1000);

    const startDateStr = `${startJst.getUTCFullYear()}-${String(
        startJst.getUTCMonth() + 1
    ).padStart(2, "0")}-${String(startJst.getUTCDate()).padStart(2, "0")}`;
    const endDateStr = `${endJst.getUTCFullYear()}-${String(
        endJst.getUTCMonth() + 1
    ).padStart(2, "0")}-${String(endJst.getUTCDate()).padStart(2, "0")}`;

    return startDateStr !== endDateStr;
}

/**
 * 指定した日付の0時（00:00:00）の日時を取得（JST基準）
 *
 * @param date 基準となる日付（UTC時刻）
 * @returns JST基準のその日の0時の日時（UTC時刻で返す）
 */
function getMidnightDate(date: Date): Date {
    // JSTに変換して日付部分を取得
    const jst = new Date(date.getTime() + 9 * 60 * 60 * 1000);
    const year = jst.getUTCFullYear();
    const month = jst.getUTCMonth();
    const day = jst.getUTCDate();

    // JST基準の0時をUTC時刻で作成
    return new Date(Date.UTC(year, month, day, -9, 0, 0, 0));
}

/**
 * 指定した日付の23:59:59の日時を取得（JST基準）
 *
 * @param date 基準となる日付（UTC時刻）
 * @returns JST基準のその日の23:59:59の日時（UTC時刻で返す）
 */
function getEndOfDay(date: Date): Date {
    // JSTに変換して日付部分を取得
    const jst = new Date(date.getTime() + 9 * 60 * 60 * 1000);
    const year = jst.getUTCFullYear();
    const month = jst.getUTCMonth();
    const day = jst.getUTCDate();

    // JST基準の23:59:59をUTC時刻で作成
    return new Date(Date.UTC(year, month, day, 14, 59, 59, 999));
}

/**
 * 2つの日付間の日付配列を取得（JST基準）
 *
 * @param startDate 開始日（UTC時刻）
 * @param endDate 終了日（UTC時刻）
 * @returns JST基準の日付の配列（開始日と終了日は含まない）
 */
function getDatesBetween(startDate: Date, endDate: Date): Date[] {
    const dates: Date[] = [];

    // JST基準で日付を取得
    const startJst = new Date(startDate.getTime() + 9 * 60 * 60 * 1000);
    const endJst = new Date(endDate.getTime() + 9 * 60 * 60 * 1000);

    const startDateStr = `${startJst.getUTCFullYear()}-${String(
        startJst.getUTCMonth() + 1
    ).padStart(2, "0")}-${String(startJst.getUTCDate()).padStart(2, "0")}`;
    const endDateStr = `${endJst.getUTCFullYear()}-${String(
        endJst.getUTCMonth() + 1
    ).padStart(2, "0")}-${String(endJst.getUTCDate()).padStart(2, "0")}`;

    // 開始日の翌日から終了日の前日まで（JST基準）
    // eslint-disable-next-line prefer-const
    let currentJst = new Date(startJst);
    currentJst.setUTCDate(currentJst.getUTCDate() + 1);

    while (
        `${currentJst.getUTCFullYear()}-${String(
            currentJst.getUTCMonth() + 1
        ).padStart(2, "0")}-${String(currentJst.getUTCDate()).padStart(
            2,
            "0"
        )}` < endDateStr
    ) {
        // JST基準の日付をUTC時刻に戻す
        const year = currentJst.getUTCFullYear();
        const month = currentJst.getUTCMonth();
        const day = currentJst.getUTCDate();
        const utcDate = new Date(Date.UTC(year, month, day, -9, 0, 0, 0));
        dates.push(utcDate);

        currentJst.setUTCDate(currentJst.getUTCDate() + 1);
    }

    return dates;
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
