"use server";

import { db } from "@/db";
import { userCompensation } from "@/db/schema";
import { and, eq, isNull, gte, lte, sql } from "drizzle-orm";

export async function createCompensation(input: {
    userId: string;
    isHourly: boolean;
    isMonthly: boolean;
    hourlyRate: string | null;
    monthlySalary: string | null;
    currency: string;
    effectiveFrom: Date;
    effectiveTo: Date | null;
}) {
    try {
        // Step 1: effective_to が NULL ではない既存レコードと期間が重複しているかチェック
        if (input.effectiveTo !== null) {
            const overlapping = await db
                .select({ id: userCompensation.id })
                .from(userCompensation)
                .where(
                    and(
                        eq(userCompensation.userId, input.userId),
                        eq(userCompensation.isActive, true),
                        lte(userCompensation.effectiveFrom, input.effectiveTo),
                        gte(userCompensation.effectiveTo, input.effectiveFrom),
                        // 無期限設定（effectiveTo が null）は除外
                        sql`${userCompensation.effectiveTo} IS NOT NULL`
                    )
                )
                .limit(1);

            if (overlapping.length > 0) {
                throw new Error("指定期間に重複する給与設定が既に存在します");
            }
        }

        // Step 2: 入力の開始日が、無期限レコード（effective_to = NULL）の effective_from より後かチェック
        const unlimitedRecords = await db
            .select({
                id: userCompensation.id,
                effectiveFrom: userCompensation.effectiveFrom,
            })
            .from(userCompensation)
            .where(
                and(
                    eq(userCompensation.userId, input.userId),
                    eq(userCompensation.isActive, true),
                    isNull(userCompensation.effectiveTo)
                )
            );

        // Step 3: トランザクションを使用して既存レコードの更新と新しいレコードの作成を安全に処理
        await db.transaction(async (tx) => {
            // 無期限レコードがある場合の処理
            if (unlimitedRecords.length > 0) {
                const unlimitedRecord = unlimitedRecords[0]; // 無期限レコードは1つのはず

                if (input.effectiveFrom > unlimitedRecord.effectiveFrom) {
                    // 入力の開始日が無期限レコードの開始日より後の場合
                    // 無期限レコードを終了させる
                    await tx
                        .update(userCompensation)
                        .set({
                            effectiveTo: input.effectiveFrom,
                            updatedAt: new Date(),
                        })
                        .where(eq(userCompensation.id, unlimitedRecord.id));
                } else {
                    // 入力の開始日が無期限レコードの開始日以前の場合
                    if (input.effectiveTo === null) {
                        // 入力の終了日がNULL（無期限）の場合はエラー
                        throw new Error("現行のオープン期間と競合します");
                    }
                    // 入力の終了日がNULLでない場合はそのまま登録（期間が空いている場合）
                }
            }

            // 新しい給与設定を作成
            await tx.insert(userCompensation).values({
                userId: input.userId,
                isHourly: input.isHourly,
                isMonthly: input.isMonthly,
                hourlyRate: input.hourlyRate,
                monthlySalary: input.monthlySalary,
                currency: input.currency,
                effectiveFrom: input.effectiveFrom,
                effectiveTo: input.effectiveTo,
            });
        });
    } catch (error) {
        throw error;
    }
}
