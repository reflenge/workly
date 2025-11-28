import { db } from "@/db";
import {
    attendanceLogs,
    attendanceStatus,
    attendanceLogSource,
    users,
    userCompensation,
} from "@/db/schema";
import { desc, eq, sql, and, or, lte, gte, isNull, lt, gt } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import Decimal from "decimal.js";

// 同一テーブルの別名を用意
const startSource = alias(attendanceLogSource, "start_source");
const endSource = alias(attendanceLogSource, "end_source");

export interface AttendanceRecordWithPay {
    log: {
        id: string;
        startedAt: Date;
        endedAt: Date | null;
        note: string | null;
    };
    user: {
        id: string;
        isAdmin: boolean;
        lastName: string;
        firstName: string;
        fullName: string;
    };
    status: {
        id: number;
        label: string;
    } | null;
    compensation: {
        id: string;
        isHourly: boolean;
        hourlyRate: string | null;
        effectiveFrom: Date;
        effectiveTo: Date | null;
    } | null;
    calculatedPay?: {
        workingTimeMs: number;
        hourlyPay: number; // 時給計算結果
    };
}

/**
 * 指定された期間内の勤怠記録を取得し、給与計算を行う
 * @param startDate 期間開始 (JST 00:00:00 -> UTC)
 * @param endDate 期間終了 (JST 23:59:59 -> UTC)
 */
export async function getAttendanceRecordsInPeriod(
    startDate: Date,
    endDate: Date
): Promise<AttendanceRecordWithPay[]> {
    const records = await db
        .select({
            log: {
                id: attendanceLogs.id,
                startedAt: attendanceLogs.startedAt,
                endedAt: attendanceLogs.endedAt,
                note: attendanceLogs.note,
            },
            user: {
                id: users.id,
                isAdmin: users.isAdmin,
                lastName: users.lastName,
                firstName: users.firstName,
                fullName: sql<string>`${users.lastName} || ' ' || ${users.firstName}`,
            },
            status: {
                id: attendanceStatus.id,
                label: attendanceStatus.label,
            },
            compensation: {
                id: userCompensation.id,
                isHourly: userCompensation.isHourly,
                hourlyRate: userCompensation.hourlyRate,
                effectiveFrom: userCompensation.effectiveFrom,
                effectiveTo: userCompensation.effectiveTo,
            },
        })
        .from(attendanceLogs)
        .innerJoin(users, eq(attendanceLogs.userId, users.id))
        .leftJoin(
            attendanceStatus,
            eq(attendanceLogs.statusId, attendanceStatus.id)
        )
        .leftJoin(
            userCompensation,
            and(
                eq(attendanceLogs.userId, userCompensation.userId),
                eq(userCompensation.isActive, true),
                // 期間重複チェック
                lt(
                    userCompensation.effectiveFrom,
                    sql`COALESCE(${attendanceLogs.endedAt}, NOW())`
                ),
                or(
                    isNull(userCompensation.effectiveTo),
                    gt(
                        userCompensation.effectiveTo,
                        attendanceLogs.startedAt
                    )
                )
            )
        )
        .where(
            and(
                // 期間フィルタ: startedAt が期間内にあるもの
                // または、期間をまたぐものも含めるべきか？
                // 通常、給与計算は「勤務開始日」基準で行うことが多い。
                // ここでは「startedAt >= startDate AND startedAt <= endDate」とする。
                gte(attendanceLogs.startedAt, startDate),
                lte(attendanceLogs.startedAt, endDate)
            )
        )
        .orderBy(desc(attendanceLogs.startedAt));

    // 時給計算処理
    return records.map((record) => {
        let calculatedPay = undefined;

        // 時給計算の条件チェック
        if (
            record.compensation &&
            record.compensation.isHourly &&
            record.compensation.hourlyRate &&
            record.log.endedAt && // 出勤終了時刻がある場合のみ
            record.status?.id === 2 // 勤務中のときのみ
        ) {
            try {
                const hourlyRateDecimal = new Decimal(record.compensation.hourlyRate);
                if (hourlyRateDecimal.gt(0)) {
                    const startedTime = new Date(record.log.startedAt).getTime();
                    const endedTime = new Date(record.log.endedAt).getTime();
                    const workingTimeMs = endedTime - startedTime;

                    if (workingTimeMs > 0) {
                        const millisecondsInHour = new Decimal(1000 * 60 * 60);
                        const workingTimeMsDecimal = new Decimal(workingTimeMs);
                        const workingHoursExact = workingTimeMsDecimal.div(millisecondsInHour);
                        const hourlyPayExact = workingHoursExact.mul(hourlyRateDecimal);

                        // 小数点1位で切り捨て
                        const hourlyPay = hourlyPayExact
                            .mul(10)
                            .floor()
                            .div(10)
                            .toNumber();

                        calculatedPay = {
                            workingTimeMs,
                            hourlyPay,
                        };
                    }
                }
            } catch (error) {
                console.error("時給計算エラー:", error);
            }
        }

        return {
            ...record,
            calculatedPay,
        };
    });
}
