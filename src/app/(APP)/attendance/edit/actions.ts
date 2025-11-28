"use server";

import { db } from "@/db";
import { attendanceLogs, attendanceStatus } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { isPeriodClosed } from "@/lib/payroll/service";

export interface UpdateAttendanceLogInput {
    id: string;
    startedAt: Date;
    endedAt: Date | null;
    note: string | null;
    reason: string; // 必須
    adjustAdjacent: boolean;
}

export interface UpdateAttendanceLogResult {
    success: boolean;
    message: string;
}

export async function updateAttendanceLog(
    input: UpdateAttendanceLogInput
): Promise<UpdateAttendanceLogResult> {
    try {
        const supabase = await createClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            throw new Error("認証が必要です");
        }

        // トランザクションで実行
        await db.transaction(async (tx) => {
            // 対象ログを取得
            const currentLog = await tx.query.attendanceLogs.findFirst({
                where: eq(attendanceLogs.id, input.id),
            });

            if (!currentLog) {
                throw new Error("ログが見つかりません");
            }

            // 変更前の値
            const oldStartedAt = currentLog.startedAt;
            const oldEndedAt = currentLog.endedAt;

            // 給与計算期間の締め切りチェック
            // 1. 変更前の日時がクローズ済み期間に含まれているか
            if (await isPeriodClosed(oldStartedAt)) {
                throw new Error("この期間の給与計算は既に締め切られているため、変更できません");
            }
            if (oldEndedAt && await isPeriodClosed(oldEndedAt)) {
                throw new Error("この期間の給与計算は既に締め切られているため、変更できません");
            }

            // 2. 変更後の日時がクローズ済み期間に含まれているか
            if (await isPeriodClosed(input.startedAt)) {
                throw new Error("変更後の日時が締め切り済みの期間に含まれています");
            }
            if (input.endedAt && await isPeriodClosed(input.endedAt)) {
                throw new Error("変更後の日時が締め切り済みの期間に含まれています");
            }

            // 1. 開始時刻の変更処理
            if (input.startedAt.getTime() !== oldStartedAt.getTime()) {
                if (input.adjustAdjacent) {
                    // 前のレコードを探す（終了時刻が変更前の開始時刻と一致するもの）
                    const prevLog = await tx.query.attendanceLogs.findFirst({
                        where: and(
                            eq(attendanceLogs.userId, currentLog.userId),
                            eq(attendanceLogs.endedAt, oldStartedAt)
                        ),
                    });

                    if (prevLog) {
                        // 時間が縮む方を先に更新
                        if (input.startedAt > oldStartedAt) {
                            // 開始時刻が遅くなる = 現在のログが縮む、前のログが伸びる
                            // 先に現在のログの開始時刻を更新（縮む）
                            await tx
                                .update(attendanceLogs)
                                .set({ startedAt: input.startedAt, updatedAt: new Date() })
                                .where(eq(attendanceLogs.id, input.id));

                            // 次に前のログの終了時刻を更新（伸びる）
                            await tx
                                .update(attendanceLogs)
                                .set({ endedAt: input.startedAt, updatedAt: new Date() })
                                .where(eq(attendanceLogs.id, prevLog.id));
                        } else {
                            // 開始時刻が早くなる = 現在のログが伸びる、前のログが縮む
                            // 先に前のログの終了時刻を更新（縮む）
                            await tx
                                .update(attendanceLogs)
                                .set({ endedAt: input.startedAt, updatedAt: new Date() })
                                .where(eq(attendanceLogs.id, prevLog.id));

                            // 次に現在のログの開始時刻を更新（伸びる）
                            await tx
                                .update(attendanceLogs)
                                .set({ startedAt: input.startedAt, updatedAt: new Date() })
                                .where(eq(attendanceLogs.id, input.id));
                        }
                    } else {
                        // 前のログがない場合は単純更新
                        await tx
                            .update(attendanceLogs)
                            .set({ startedAt: input.startedAt, updatedAt: new Date() })
                            .where(eq(attendanceLogs.id, input.id));
                    }
                } else {
                    // 自動調整しない場合
                    await tx
                        .update(attendanceLogs)
                        .set({ startedAt: input.startedAt, updatedAt: new Date() })
                        .where(eq(attendanceLogs.id, input.id));
                }
            }

            // 2. 終了時刻の変更処理
            // 注意: 開始時刻の更新で currentLog の値はDB上変わっている可能性があるが、
            // ここでは input.endedAt と oldEndedAt の比較で判定する。
            // ただし、同じレコードに対する update が複数回走る可能性があるので注意。
            // 上記の開始時刻処理ですでに currentLog (input.id) が更新されている場合がある。

            if (
                (input.endedAt === null && oldEndedAt !== null) ||
                (input.endedAt !== null && oldEndedAt === null) ||
                (input.endedAt && oldEndedAt && input.endedAt.getTime() !== oldEndedAt.getTime())
            ) {
                if (input.adjustAdjacent && oldEndedAt) {
                    // 次のレコードを探す（開始時刻が変更前の終了時刻と一致するもの）
                    const nextLog = await tx.query.attendanceLogs.findFirst({
                        where: and(
                            eq(attendanceLogs.userId, currentLog.userId),
                            eq(attendanceLogs.startedAt, oldEndedAt)
                        ),
                    });

                    if (nextLog && input.endedAt) {
                        // 次のログが現在進行中（endedAtがnull）の場合は、開始時刻を変更させない
                        if (nextLog.endedAt === null) {
                            // 重複チェック
                            if (input.endedAt > nextLog.startedAt) {
                                throw new Error(
                                    "現在の勤務中のレコードと重複するため、終了時刻をこれ以上遅くできません"
                                );
                            }
                            // 自動調整せず、現在のログのみ更新（ギャップは許容）
                            await tx
                                .update(attendanceLogs)
                                .set({ endedAt: input.endedAt, updatedAt: new Date() })
                                .where(eq(attendanceLogs.id, input.id));
                        } else {
                            // 時間が縮む方を先に更新
                            if (input.endedAt < oldEndedAt) {
                                // 終了時刻が早くなる = 現在のログが縮む、次のログが伸びる
                                // 先に現在のログの終了時刻を更新（縮む）
                                await tx
                                    .update(attendanceLogs)
                                    .set({ endedAt: input.endedAt, updatedAt: new Date() })
                                    .where(eq(attendanceLogs.id, input.id));

                                // 次に次のログの開始時刻を更新（伸びる）
                                await tx
                                    .update(attendanceLogs)
                                    .set({ startedAt: input.endedAt, updatedAt: new Date() })
                                    .where(eq(attendanceLogs.id, nextLog.id));
                            } else {
                                // 終了時刻が遅くなる = 現在のログが伸びる、次のログが縮む
                                // 先に次のログの開始時刻を更新（縮む）
                                await tx
                                    .update(attendanceLogs)
                                    .set({ startedAt: input.endedAt, updatedAt: new Date() })
                                    .where(eq(attendanceLogs.id, nextLog.id));

                                // 次に現在のログの終了時刻を更新（伸びる）
                                await tx
                                    .update(attendanceLogs)
                                    .set({ endedAt: input.endedAt, updatedAt: new Date() })
                                    .where(eq(attendanceLogs.id, input.id));
                            }
                        }
                    } else {
                        // 次のログがない、または終了時刻がnullになる場合は単純更新
                        // すでに開始時刻の更新で update されている可能性を考慮し、set をマージする形が理想だが、
                        // ここでは個別に update を発行してもトランザクション内なので最終結果は同じ。
                        await tx
                            .update(attendanceLogs)
                            .set({ endedAt: input.endedAt, updatedAt: new Date() })
                            .where(eq(attendanceLogs.id, input.id));
                    }
                } else {
                    // 自動調整しない場合
                    await tx
                        .update(attendanceLogs)
                        .set({ endedAt: input.endedAt, updatedAt: new Date() })
                        .where(eq(attendanceLogs.id, input.id));
                }
            }

            // 3. メモの更新（変更がある場合のみ、または理由を追記）
            // 変更履歴を作成
            const historyNote = `
[修正履歴] ${new Date().toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })}
理由: ${input.reason}
変更前: ${oldStartedAt.toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })} - ${oldEndedAt
                    ? oldEndedAt.toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })
                    : "未設定"
                }
`;

            // 既存のメモに追記、または新規作成
            const newNote = (input.note || "") + historyNote;

            // メモは常に更新（履歴が追加されるため）
            await tx
                .update(attendanceLogs)
                .set({ note: newNote, updatedAt: new Date() })
                .where(eq(attendanceLogs.id, input.id));
        });

        revalidatePath("/attendance/edit");
        revalidatePath("/attendance");

        return { success: true, message: "勤怠ログを更新しました" };
    } catch (error) {
        console.error("Update failed:", error);
        return {
            success: false,
            message:
                error instanceof Error ? error.message : "更新に失敗しました",
        };
    }
}
