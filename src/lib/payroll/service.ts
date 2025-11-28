import { db } from "@/db";
import { payrollPeriod, payrollItem } from "@/db/schema";
import { and, lte, gte, eq, desc } from "drizzle-orm";

/**
 * 指定された日付がクローズされた給与計算期間に含まれているか確認する
 * @param date チェックする日付
 * @returns クローズされている場合はtrue
 */
export async function isPeriodClosed(date: Date): Promise<boolean> {
    // JSTでの日付に対応する期間を検索
    // payrollPeriodはJST基準でstartDate/endDateが保存されている
    // dateがその範囲内にあるかチェック

    // dateがUTCで渡されるので、そのまま比較してOK（DBもtimestamp with timezone または timestamp）
    // ただし、payrollPeriodのstartDate/endDateは「JSTの0時」をUTCに変換したもの。
    // 比較は単純な大小比較で良い。

    const period = await db.query.payrollPeriod.findFirst({
        where: and(
            lte(payrollPeriod.startDate, date),
            gte(payrollPeriod.endDate, date),
            eq(payrollPeriod.isClosed, true)
        )
    });

    return !!period;
}

export async function getPayrollItems(periodId: string, userId?: string) {
    return await db.query.payrollItem.findMany({
        where: and(
            eq(payrollItem.periodId, periodId),
            userId ? eq(payrollItem.userId, userId) : undefined
        ),
        with: {
            user: true,
            period: true,
        },
        orderBy: [desc(payrollItem.grossPay)],
    });
}

export async function getUserPayrollHistory(userId: string) {
    return await db
        .select({
            payrollItem: payrollItem,
            period: payrollPeriod,
        })
        .from(payrollItem)
        .innerJoin(payrollPeriod, eq(payrollItem.periodId, payrollPeriod.id))
        .where(eq(payrollItem.userId, userId))
        .orderBy(desc(payrollPeriod.startDate));
}
