"use server";

import { db } from "@/db";
import { attendanceLogs } from "@/db/schema";
import { requireUser } from "@/lib/auth/requireUser";
import { eq, and } from "drizzle-orm";
import { addHours, endOfMonth, startOfMonth, addMonths, differenceInMinutes } from "date-fns";

// Types
export type TestDataRecord = {
    userId: string;
    statusId: number;
    startedAt: Date;
    endedAt: Date | null;
    startedSource: number;
    endedSource: number;
    note: string;
};

// Helper functions for JST/UTC
const JST_OFFSET = 9;

function getJstMonth(utcDate: Date): number {
    const jstDate = addHours(utcDate, JST_OFFSET);
    return jstDate.getMonth() + 1; // 1-12
}

function getMonthEndUtc(utcDate: Date): Date {
    const jstDate = addHours(utcDate, JST_OFFSET);
    const jstMonthEnd = endOfMonth(jstDate);
    // JST 23:59:59.999 -> UTC
    jstMonthEnd.setHours(23, 59, 59, 999);
    return addHours(jstMonthEnd, -JST_OFFSET);
}

function getMonthStartUtc(year: number, month: number): Date {
    // JST 00:00:00 -> UTC
    const jstDate = new Date(year, month - 1, 1, 0, 0, 0);
    return addHours(jstDate, -JST_OFFSET);
}

export async function generateTestData(
    userId: string,
    startDate: Date,
    endDate: Date
): Promise<{ success: boolean; data?: TestDataRecord[]; message?: string }> {
    try {
        const user = await requireUser();
        if (!user.isAdmin) {
            throw new Error("Unauthorized");
        }

        const records: TestDataRecord[] = [];
        let currentStatusId: number | null = null;
        let currentTime = new Date(startDate);
        let previousEndedMicroseconds = 0;
        let previousWasMonthCrossing = false;
        let i = 0;

        // 指定された期間（startDate ～ endDate）でループ
        while (currentTime < endDate) {
            let statusId: number;

            // ステータス遷移のロジック
            // 1: 退勤中, 2: 出勤中, 3: 休憩中 (仮定)
            if (i > 0 && previousWasMonthCrossing && currentStatusId !== null) {
                // 月跨ぎの直後は、前のステータスを継続
                statusId = currentStatusId;
            } else if (currentStatusId === null) {
                // 最初は必ずステータス1から開始
                statusId = 1;
            } else if (currentStatusId === 1) {
                // 1 (退勤) の次は必ず 2 (出勤)
                statusId = 2;
            } else if (currentStatusId === 2) {
                // 2 (出勤) の次は 1 (退勤: 80%) または 3 (休憩: 20%)
                statusId = Math.random() < 0.8 ? 1 : 3;
            } else { // currentStatusId === 3
                // 3 (休憩) の次は 2 (出勤: 80%) または 1 (退勤: 20%)
                statusId = Math.random() < 0.8 ? 2 : 1;
            }

            // ステータスごとの作業時間（分）をランダム決定
            let workMinutes: number;
            if (statusId === 1) {
                // 退勤: 4時間(240分) ～ 48時間(2880分)
                workMinutes = Math.floor(Math.random() * (2880 - 240 + 1)) + 240;
            } else if (statusId === 2) {
                // 出勤: 30分 ～ 8時間(480分)
                workMinutes = Math.floor(Math.random() * (480 - 30 + 1)) + 30;
            } else {
                // 休憩: 10分 ～ 1.5時間(90分)
                workMinutes = Math.floor(Math.random() * (90 - 10 + 1)) + 10;
            }

            const workSeconds = Math.floor(Math.random() * 60);
            const workDurationMs = (workMinutes * 60 + workSeconds) * 1000;

            const startedAt = new Date(currentTime);
            let endedAt = new Date(startedAt.getTime() + workDurationMs);

            // 終了時刻が指定期間を超えた場合、そこで打ち切り
            if (endedAt > endDate) {
                endedAt = new Date(endDate);
            }

            // 月跨ぎの判定（JST基準）
            const startedMonth = getJstMonth(startedAt);
            const endedMonth = getJstMonth(endedAt);

            if (startedMonth !== endedMonth) {
                // 月を跨ぐ場合は、その月の末日で一度区切る
                endedAt = getMonthEndUtc(startedAt);
            }

            // Source: 2 (70%), 1/3/4 (10% each)
            // 打刻ソース（Web, App, NFC等）のランダム決定
            // 2: 70%, 1/3/4: 各10%
            const getSource = () => {
                const r = Math.random();
                if (r < 0.1) return 1;
                if (r < 0.8) return 2;
                if (r < 0.9) return 3;
                return 4;
            };
            const startedSource = getSource();
            const endedSource = getSource();

            // 実際に月跨ぎで分割されたかどうか
            const isMonthCrossing = endedAt.getTime() === getMonthEndUtc(startedAt).getTime();

            // マイクロ秒のシミュレーション（DB上はミリ秒精度だが、ロジックとして保持）
            let startedMicroseconds: number;
            if (i === 0) {
                startedMicroseconds = Math.floor(Math.random() * 1000);
            } else {
                startedMicroseconds = previousEndedMicroseconds;
            }

            // JS Date doesn't support microseconds, so we simulate it by just keeping track
            // For DB insertion, we might need to adjust if we really want microsecond precision,
            // but standard Date is millisecond precision.
            // The Python script logic relies on microseconds for continuity.
            // Here we will just use milliseconds for simplicity as JS Date is ms precision.

            // Adjust milliseconds to match "microsecond" logic roughly if needed,
            // but for now let's stick to standard Date behavior.

            let note = "";
            if (i > 0 && previousWasMonthCrossing) {
                note = "自動生成"; // 月跨ぎによる自動分割レコード
            }

            records.push({
                userId,
                statusId,
                startedAt,
                endedAt: endedAt, // Will be handled later for "ongoing"
                startedSource,
                endedSource,
                note,
            });

            currentStatusId = statusId;
            previousWasMonthCrossing = isMonthCrossing;

            // 次のループの開始時刻を設定
            if (isMonthCrossing) {
                // 月跨ぎの場合、次のレコードは翌月の月初から開始
                // Start of next month JST
                const jstDate = addHours(endedAt, JST_OFFSET);
                let nextYear = jstDate.getFullYear();
                let nextMonth = jstDate.getMonth() + 1 + 1; // +1(0-indexed) +1(next month)
                if (nextMonth > 12) {
                    nextMonth = 1;
                    nextYear++;
                }
                currentTime = getMonthStartUtc(nextYear, nextMonth);
                previousEndedMicroseconds = 0;
            } else {
                // 通常は終了時刻が次の開始時刻
                currentTime = endedAt;
                previousEndedMicroseconds = Math.floor(Math.random() * 1000); // Random for next
            }

            i++;
        }

        // Handle last record
        if (records.length > 0) {
            // Python script sets last ended_at to empty string (ongoing).
            // We'll set it to null.
            records[records.length - 1].endedAt = null;
        }

        return { success: true, data: records };

    } catch (error) {
        console.error("Generate error:", error);
        return { success: false, message: "Failed to generate data" };
    }
}

export async function registerTestData(data: TestDataRecord[]) {
    try {
        // 開発環境でのみ実行可能
        if (process.env.NODE_ENV !== 'development') {
            throw new Error("This operation is only available in development environment");
        }

        const user = await requireUser();
        if (!user.isAdmin) {
            throw new Error("Unauthorized");
        }

        // Batch insert
        // Note: Drizzle might have limits on batch size, but for test data it should be fine.
        // If too large, we can chunk it.

        const formattedData = data.map(r => ({
            userId: r.userId,
            statusId: r.statusId,
            startedAt: r.startedAt,
            endedAt: r.endedAt,
            startedSource: r.startedSource,
            endedSource: r.endedSource,
            note: r.note,
        }));

        await db.insert(attendanceLogs).values(formattedData);

        return { success: true, message: `${data.length} records registered` };
    } catch (error) {
        console.error("Register error:", error);
        return { success: false, message: "Failed to register data" };
    }
}

export async function clearTestData(userId: string) {
    try {
        // 開発環境でのみ実行可能（本番環境でのデータ削除を防止）
        if (process.env.NODE_ENV !== 'development') {
            throw new Error("This operation is only available in development environment");
        }

        const user = await requireUser();
        if (!user.isAdmin) {
            throw new Error("Unauthorized");
        }

        await db.delete(attendanceLogs).where(eq(attendanceLogs.userId, userId));

        return { success: true, message: "Data cleared" };
    } catch (error) {
        console.error("Clear error:", error);
        return { success: false, message: "Failed to clear data" };
    }
}
