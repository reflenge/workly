"use server";

import { db } from "@/db";
import { payrollPeriod, payrollItem } from "@/db/schema";
import { desc, eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/requireUser";
import { getAttendanceRecordsInPeriod } from "@/lib/attendance/service";
import Decimal from "decimal.js";

export interface PayrollPeriodRecord {
    id: string;
    startDate: Date;
    endDate: Date;
    isClosed: boolean;
    closedAt: Date | null;
    closedByUserId: string | null;
}

export interface MonthlyPeriodStatus {
    year: number;
    month: number;
    startDate: Date;
    endDate: Date;
    period: PayrollPeriodRecord | null;
}

/**
 * JSTの指定された年月の開始日時と終了日時を取得
 * 開始: 月初 00:00:00.000
 * 終了: 月末 23:59:59.999
 */
function getJstMonthRange(year: number, month: number) {
    // JSTはUTC+9
    // DateオブジェクトはUTCで保持されるため、JSTの0時はUTCの前日15時

    // 開始日時: JST 1日 00:00:00 -> UTC 前月末日 15:00:00
    const startDate = new Date(Date.UTC(year, month - 1, 1, -9, 0, 0, 0));

    // 終了日時: JST 月末 23:59:59.999 -> UTC 当月末日 14:59:59.999
    // 翌月1日 00:00:00 JST の1ミリ秒前
    const endDate = new Date(Date.UTC(year, month, 1, -9, 0, 0, -1));

    return { startDate, endDate };
}

export async function getMonthlyPeriods(count: number = 12): Promise<MonthlyPeriodStatus[]> {
    await requireUser();

    const periods: MonthlyPeriodStatus[] = [];
    const now = new Date();
    // JSTの現在時刻を取得
    const jstNow = new Date(now.getTime() + 9 * 60 * 60 * 1000);
    let currentYear = jstNow.getUTCFullYear();
    let currentMonth = jstNow.getUTCMonth() + 1; // 1-12

    // DBから既存の期間を取得
    const dbPeriods = await db.query.payrollPeriod.findMany({
        orderBy: [desc(payrollPeriod.startDate)],
    });

    for (let i = 0; i < count; i++) {
        const { startDate, endDate } = getJstMonthRange(currentYear, currentMonth);

        // DBレコードとのマッチング
        const matchedPeriod = dbPeriods.find(p =>
            Math.abs(p.startDate.getTime() - startDate.getTime()) < 1000 &&
            Math.abs(p.endDate.getTime() - endDate.getTime()) < 1000
        );

        periods.push({
            year: currentYear,
            month: currentMonth,
            startDate,
            endDate,
            period: matchedPeriod ? {
                id: matchedPeriod.id,
                startDate: matchedPeriod.startDate,
                endDate: matchedPeriod.endDate,
                isClosed: matchedPeriod.isClosed,
                closedAt: matchedPeriod.closedAt,
                closedByUserId: matchedPeriod.closedByUserId,
            } : null,
        });

        // 前月へ
        currentMonth--;
        if (currentMonth === 0) {
            currentMonth = 12;
            currentYear--;
        }
    }

    return periods;
}

export async function togglePayrollPeriodStatus(
    year: number,
    month: number,
    shouldClose: boolean
) {
    const user = await requireUser();

    // 管理者権限チェック (bypassユーザーもisAdmin=trueなのでOK)
    if (!user.isAdmin) {
        throw new Error("権限がありません");
    }

    const { startDate, endDate } = getJstMonthRange(year, month);

    // 既存レコード検索
    let periodId: string;
    const existingPeriod = await db.query.payrollPeriod.findFirst({
        where: and(
            eq(payrollPeriod.startDate, startDate),
            eq(payrollPeriod.endDate, endDate)
        )
    });

    if (existingPeriod) {
        periodId = existingPeriod.id;
    } else {
        // 新規作成
        const [newPeriod] = await db.insert(payrollPeriod).values({
            startDate,
            endDate,
            isClosed: false, // 一旦falseで作成
        }).returning();
        periodId = newPeriod.id;
    }

    if (shouldClose) {
        if (existingPeriod?.isClosed) return; // 既にクローズ済み

        // 1. 勤怠データの取得と計算
        const records = await getAttendanceRecordsInPeriod(startDate, endDate);

        // 2. ユーザーごとの集計
        const userAggregates = new Map<string, {
            workingTimeMs: number;
            hourlyRate: string | null;
        }>();

        for (const record of records) {
            const userId = record.user.id;
            if (!userAggregates.has(userId)) {
                userAggregates.set(userId, {
                    workingTimeMs: 0,
                    hourlyRate: null,
                });
            }

            const agg = userAggregates.get(userId)!;

            if (record.calculatedPay) {
                agg.workingTimeMs += record.calculatedPay.workingTimeMs;
            }

            // 時給レートは最新のもの（または最初に見つかったもの）を保持
            if (record.compensation?.hourlyRate && !agg.hourlyRate) {
                agg.hourlyRate = record.compensation.hourlyRate;
            }
        }

        // 3. トランザクションで保存とクローズ
        await db.transaction(async (tx) => {
            // 既存のpayrollItemを削除（再計算のため）
            await tx.delete(payrollItem).where(eq(payrollItem.periodId, periodId));

            // 集計結果を保存
            for (const [userId, agg] of userAggregates.entries()) {
                // 分単位に変換（切り捨て）
                const workedMinutes = Math.floor(agg.workingTimeMs / 60000);

                // 総支給額（grossPay）の計算
                // ダッシュボードと同じロジック:
                // floor(hourlyRate * floor(totalMs / 60000) / 60)
                let grossPay = 0;
                if (agg.hourlyRate) {
                    const hourlyRateDecimal = new Decimal(agg.hourlyRate);

                    // 1. ミリ秒を分に変換 (div(60000))
                    // 2. 小数点以下を切り捨て (floor())
                    // 3. 分をミリ秒に再変換 (mul(60000))
                    const workingTimeMsFlooredToMinutes = new Decimal(agg.workingTimeMs)
                        .div(60000)
                        .floor()
                        .mul(60000);

                    // ミリ秒を時間に変換（Decimalで計算）
                    const hoursDecimal = workingTimeMsFlooredToMinutes.div(3_600_000);

                    grossPay = hourlyRateDecimal
                        .mul(hoursDecimal)
                        .floor()
                        .toNumber();
                }

                const netPay = grossPay; // 税金等は考慮せず

                await tx.insert(payrollItem).values({
                    periodId,
                    userId,
                    hourlyRate: agg.hourlyRate,
                    workedMinutes,
                    hourlyPay: grossPay.toString(), // hourlyPayカラムには総支給額を入れる（スキーマ定義上の意味合いによるが、現状は総額）
                    grossPay: grossPay.toString(),
                    netPay: netPay.toString(),
                    currency: "JPY",
                    isLocked: true, // 確定
                });
            }

            // 期間をクローズ
            await tx.update(payrollPeriod)
                .set({
                    isClosed: true,
                    closedAt: new Date(),
                    closedByUserId: user.id === "bypass-user" ? null : user.id,
                    updatedAt: new Date(),
                })
                .where(eq(payrollPeriod.id, periodId));
        });

    } else {
        // オープン処理（再開）
        // payrollItemは削除すべきか？ -> 履歴として残すか、整合性のために削除するか。
        // 「修正可能にする」ということは、再クローズ時に再計算されるはず。
        // なので、ここでは削除せず、isLockedをfalseにするか、あるいは何もしないか。
        // ユーザーの要望は「修正可能にする」だけなので、payrollItemはそのまま残しておき、
        // 再クローズ時に上書き（delete & insert）されるので問題ない。
        // ただし、オープン中はpayrollItemは見せない方がいいかもしれないが、
        // ユーザー版ページの実装次第。

        await db.update(payrollPeriod)
            .set({
                isClosed: false,
                closedAt: null,
                closedByUserId: null,
                updatedAt: new Date(),
            })
            .where(eq(payrollPeriod.id, periodId));
    }

    revalidatePath("/admin/payroll");
}
