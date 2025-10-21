"use server";

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
import { unstable_cache, revalidateTag } from "next/cache";
import Decimal from "decimal.js";

// 同一テーブルの別名を用意
const startSource = alias(attendanceLogSource, "start_source");
const endSource = alias(attendanceLogSource, "end_source");

export interface AttendanceRecordsResultType {
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
    startedSource: {
        id: number;
        label: string;
    } | null;
    endedSource: {
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

// データ取得の実際の関数
const getAttendanceRecordsData = async (): Promise<
    AttendanceRecordsResultType[]
> => {
    try {
        const result: AttendanceRecordsResultType[] = await db
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
                startedSource: {
                    id: startSource.id,
                    label: startSource.label,
                },
                endedSource: {
                    id: endSource.id,
                    label: endSource.label,
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
                startSource,
                eq(attendanceLogs.startedSource, startSource.id)
            )
            .leftJoin(endSource, eq(attendanceLogs.endedSource, endSource.id))
            .leftJoin(
                userCompensation,
                and(
                    // attendanceLogsとuserCompensationのuserIdが一致していること
                    eq(attendanceLogs.userId, userCompensation.userId),
                    // userCompensationが有効(Active)であること
                    eq(userCompensation.isActive, true),
                    // 期間重複チェック: effectiveFrom~effectiveTo と startedAt~endedAt が少しでも重複する場合
                    // 条件1: effectiveFrom < endedAt (補償開始 < 出勤終了)
                    lt(
                        userCompensation.effectiveFrom,
                        sql`COALESCE(${attendanceLogs.endedAt}, NOW())`
                    ),
                    // 条件2: effectiveTo > startedAt または effectiveTo IS NULL (無期限)
                    or(
                        isNull(userCompensation.effectiveTo),
                        gt(
                            userCompensation.effectiveTo,
                            attendanceLogs.startedAt
                        )
                    )
                )
            )
            .orderBy(desc(attendanceLogs.startedAt));
        // .limit(1500);

        // 時給計算処理
        const resultWithCalculatedPay = result.map((record) => {
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
                    // 時給をDecimalで取得
                    const hourlyRateDecimal = new Decimal(
                        record.compensation.hourlyRate
                    );
                    if (hourlyRateDecimal.gt(0)) {
                        // 勤務時間をミリ秒で計算
                        const startedTime = new Date(
                            record.log.startedAt
                        ).getTime();
                        const endedTime = new Date(
                            record.log.endedAt
                        ).getTime();
                        const workingTimeMs = endedTime - startedTime;

                        if (workingTimeMs > 0) {
                            // ミリ秒を時間に変換（Decimalで高精度計算）
                            // 1時間 = 3,600,000ミリ秒
                            const millisecondsInHour = new Decimal(
                                1000 * 60 * 60
                            );
                            const workingTimeMsDecimal = new Decimal(
                                workingTimeMs
                            );

                            // 勤務時間をミリ秒精度で計算
                            const workingHoursExact =
                                workingTimeMsDecimal.div(millisecondsInHour);

                            // 時給計算（ミリ秒精度で金額まで計算）
                            const hourlyPayExact =
                                workingHoursExact.mul(hourlyRateDecimal);

                            // 最後に小数点1位で切り捨て
                            const hourlyPay = hourlyPayExact
                                .mul(10)
                                .floor()
                                .div(10)
                                .toNumber();
                            // const workingHours = workingHoursExact
                            //     .mul(10)
                            //     .floor()
                            //     .div(10)
                            //     .toNumber();

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

        console.log(resultWithCalculatedPay);
        return resultWithCalculatedPay;
    } catch (error) {
        throw new Error(
            process.env.NODE_ENV === "development"
                ? "Attendance Components, AttendanceRecordsResult関数でエラーが発生しました: " +
                  (error as Error).message
                : "Failed to fetch attendance records"
        );
    }
};

// Next.jsのキャッシュを使用（5分キャッシュ）
export const AttendanceRecordsResult = unstable_cache(
    getAttendanceRecordsData,
    ["attendance-records"],
    {
        revalidate: 30, // 300秒（5分）キャッシュ - データ更新の頻度に応じて調整
        tags: ["attendance-records"], // タグベースの再検証も使用可能
    }
);

// キャッシュを無効化する関数（出勤記録が更新された時に呼び出す）
export const revalidateAttendanceRecords = async () => {
    revalidateTag("attendance-records");
};
